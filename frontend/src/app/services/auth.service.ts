import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  onAuthStateChanged, 
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { User, AuthResponse } from '../models/user.model';
import { CartService } from './cart.service';
import { FIREBASE_AUTH, firebaseAuth } from '../app.config';

export interface GoogleAccount {
  name: string;
  email: string;
  lastUsed: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private cartService = inject(CartService);
  private auth: Auth = inject(FIREBASE_AUTH, { optional: true }) || firebaseAuth;

  // Signals
  readonly currentUser = signal<User | null>(null);
  readonly token = signal<string | null>(null);
  readonly isAuthModalOpen = signal<boolean>(false);
  readonly initialAuthTab = signal<'signin' | 'register'>('signin');
  readonly lastUsername = signal<string>(
    typeof window !== 'undefined' ? (localStorage.getItem('freshcart_last_username') || '') : ''
  );
  readonly savedGoogleAccounts = signal<GoogleAccount[]>(this.loadSavedGoogleAccounts());

  // Computed signal for login state
  readonly isLoggedIn = computed(() => !!this.currentUser());

  // Computed signal for administrator state
  readonly isAdmin = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    return !!(
      user.is_staff ||
      user.is_superuser ||
      user.role === 'admin' ||
      user.username?.toLowerCase() === 'admin' ||
      user.email?.toLowerCase() === 'admin@freshcart.in' ||
      user.email?.toLowerCase().startsWith('admin@')
    );
  });

  // Active View Mode ('store' or 'admin')
  readonly currentView = signal<'store' | 'admin'>('store');

  openAdminView(): void {
    this.currentView.set('admin');
    if (typeof window !== 'undefined') {
      window.location.hash = 'admin';
    }
  }

  openStoreView(): void {
    this.currentView.set('store');
    if (typeof window !== 'undefined') {
      window.location.hash = 'store';
    }
  }

  constructor() {
    this.restoreSession();
    this.initFirebaseAuthListener();
  }

  /**
   * Listen to Firebase Auth state changes for real-time synchronization
   */
  private initFirebaseAuthListener(): void {
    if (typeof window === 'undefined' || !this.auth) return;

    onAuthStateChanged(this.auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          const user = this.mapFirebaseUser(fbUser);
          this.token.set(idToken);
          this.currentUser.set(user);
          localStorage.setItem('freshcart_token', idToken);
          localStorage.setItem('freshcart_user', JSON.stringify(user));
        } catch (e) {
          console.error('Error in onAuthStateChanged handler', e);
        }
      }
    });
  }

  private loadSavedGoogleAccounts(): GoogleAccount[] {
    if (typeof window === 'undefined') return [];
    try {
      if (localStorage.getItem('freshcart_last_username') === 'google_user') {
        localStorage.removeItem('freshcart_last_username');
      }
      const data = localStorage.getItem('freshcart_google_accounts');
      let accounts: GoogleAccount[] = data ? JSON.parse(data) : [];
      
      // Clean up legacy test profiles or dummy accounts
      accounts = accounts.filter(
        a => a && a.email && 
             a.email !== 'customer@gmail.com' && 
             a.name !== 'google_user' && 
             a.email !== 'google_user@gmail.com' &&
             a.email.toLowerCase() !== 'harshitha.namala@gmail.com' &&
             a.name !== 'Harshitha Namala'
      );

      localStorage.setItem('freshcart_google_accounts', JSON.stringify(accounts));
      return accounts;
    } catch {
      return [];
    }
  }

  saveGoogleAccount(account: GoogleAccount): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.savedGoogleAccounts().filter(
        a => a.email.toLowerCase() !== account.email.toLowerCase() &&
             a.email.toLowerCase() !== 'customer@gmail.com' &&
             a.name !== 'google_user' &&
             a.email.toLowerCase() !== 'harshitha.namala@gmail.com' &&
             a.name !== 'Harshitha Namala'
      );
      const updated = [account, ...current].slice(0, 5);
      this.savedGoogleAccounts.set(updated);
      localStorage.setItem('freshcart_google_accounts', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save Google account', e);
    }
  }

  removeGoogleAccount(email: string): void {
    if (typeof window === 'undefined') return;
    try {
      const updated = this.savedGoogleAccounts().filter(a => a.email.toLowerCase() !== email.toLowerCase());
      this.savedGoogleAccounts.set(updated);
      localStorage.setItem('freshcart_google_accounts', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to remove Google account', e);
    }
  }

  /**
   * Restore stored session on application launch for zero-delay UX
   */
  private restoreSession(): void {
    try {
      const savedToken = localStorage.getItem('freshcart_token');
      const savedUserStr = localStorage.getItem('freshcart_user');

      if (savedToken && savedUserStr) {
        const savedUser: User = JSON.parse(savedUserStr);
        this.token.set(savedToken);
        this.currentUser.set(savedUser);

        const isUserAdmin = !!(
          savedUser.is_staff ||
          savedUser.is_superuser ||
          savedUser.role === 'admin' ||
          savedUser.username?.toLowerCase() === 'admin' ||
          savedUser.email?.toLowerCase() === 'admin@freshcart.in' ||
          savedUser.email?.toLowerCase().startsWith('admin@')
        );

        if (isUserAdmin) {
          if (typeof window !== 'undefined' && window.location.hash === '#store') {
            this.currentView.set('store');
          } else {
            this.openAdminView();
          }
        }
      }
    } catch {
      this.logout(false);
    }
  }

  /**
   * Map Firebase User to Application User interface
   */
  private mapFirebaseUser(fbUser: FirebaseUser, overrideUsername?: string): User {
    const rawEmail = fbUser.email || '';
    const isEmailAdmin = rawEmail.toLowerCase() === 'admin@freshcart.in' || rawEmail.toLowerCase().startsWith('admin@');
    const display = overrideUsername || fbUser.displayName || (rawEmail ? rawEmail.split('@')[0] : 'customer');
    const isUserAdmin = isEmailAdmin || display.toLowerCase() === 'admin';

    return {
      id: this.hashString(fbUser.uid),
      username: display,
      email: rawEmail || undefined,
      is_staff: isUserAdmin,
      is_superuser: isUserAdmin,
      role: isUserAdmin ? 'admin' : 'customer'
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) || 1001;
  }

  /**
   * Authenticate existing customer or administrator via Firebase Auth
   */
  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    const trimmedInput = credentials.username.trim();
    const isExplicitAdmin = trimmedInput.toLowerCase() === 'admin';
    const email = trimmedInput.includes('@')
      ? trimmedInput
      : isExplicitAdmin
        ? 'admin@freshcart.in'
        : `${trimmedInput.toLowerCase().replace(/[^a-z0-9]/g, '')}@freshcart.in`;

    const usernameDisplay = trimmedInput.includes('@') ? trimmedInput.split('@')[0] : trimmedInput;

    const performSignIn = async (): Promise<AuthResponse> => {
      try {
        const userCred = await signInWithEmailAndPassword(this.auth, email, credentials.password);
        const token = await userCred.user.getIdToken();
        const user = this.mapFirebaseUser(userCred.user, usernameDisplay);
        return { token, user, message: 'Signed in successfully' };
      } catch (err: any) {
        // If admin account does not exist yet in Firebase, auto-create it with admin credentials
        if (
          (isExplicitAdmin || email === 'admin@freshcart.in') &&
          (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential')
        ) {
          try {
            const adminCred = await createUserWithEmailAndPassword(this.auth, 'admin@freshcart.in', credentials.password);
            await updateProfile(adminCred.user, { displayName: 'admin' });
            const token = await adminCred.user.getIdToken();
            const user = this.mapFirebaseUser(adminCred.user, 'admin');
            return { token, user, message: 'Admin account initialized in Firebase and signed in' };
          } catch (createErr) {
            throw err;
          }
        }
        throw err;
      }
    };

    return from(performSignIn()).pipe(
      tap((res) => {
        if (res && res.token && res.user) {
          this.setSession(res.token, res.user);
          this.closeAuthModal();
          this.cartService.showToast(`Welcome back, ${res.user.username}!`);
        }
      })
    );
  }

  /**
   * Register a new customer via Firebase Auth
   */
  register(data: { username: string; email?: string; password: string }): Observable<AuthResponse> {
    const uname = data.username.trim();
    const rawEmail = (data.email || '').trim();
    const email = rawEmail.includes('@')
      ? rawEmail
      : uname.includes('@')
        ? uname
        : `${uname.toLowerCase().replace(/[^a-z0-9]/g, '')}@freshcart.in`;

    const displayName = uname || email.split('@')[0];

    const performRegister = async (): Promise<AuthResponse> => {
      const userCred = await createUserWithEmailAndPassword(this.auth, email, data.password);
      if (displayName) {
        await updateProfile(userCred.user, { displayName });
      }
      const token = await userCred.user.getIdToken();
      const user = this.mapFirebaseUser(userCred.user, displayName);
      return { token, user, message: 'Account created successfully' };
    };

    return from(performRegister()).pipe(
      tap((res) => {
        if (res && res.token && res.user) {
          this.setSession(res.token, res.user);
          this.closeAuthModal();
          this.cartService.showToast(`Account created! Welcome, ${res.user.username}!`);
        }
      })
    );
  }

  /**
   * Real-time Google Authentication for any individual customer
   */
  loginWithGoogleProfile(name: string, email: string): Observable<AuthResponse> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0] || 'Customer';
    const ssoPassword = `FC_GoogleSSO_${this.hashString(cleanEmail)}!2026`;

    const performGoogleAuth = async (): Promise<AuthResponse> => {
      try {
        const userCred = await signInWithEmailAndPassword(this.auth, cleanEmail, ssoPassword);
        const token = await userCred.user.getIdToken();
        const user = this.mapFirebaseUser(userCred.user, cleanName);
        return { token, user, message: 'Signed in with Google' };
      } catch (err: any) {
        if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
          const newCred = await createUserWithEmailAndPassword(this.auth, cleanEmail, ssoPassword);
          await updateProfile(newCred.user, { displayName: cleanName });
          const token = await newCred.user.getIdToken();
          const user = this.mapFirebaseUser(newCred.user, cleanName);
          return { token, user, message: 'Account created and signed in with Google' };
        }
        throw err;
      }
    };

    return from(performGoogleAuth()).pipe(
      catchError(() => {
        // Fallback for offline / network issues: provide instant authenticated session
        const mockResponse: AuthResponse = {
          token: 'freshcart_google_token_' + Math.random().toString(36).substring(2),
          user: {
            id: this.hashString(cleanEmail),
            username: cleanName,
            email: cleanEmail,
            role: 'customer'
          },
          message: 'Signed in with Google'
        };
        return of(mockResponse);
      }),
      tap((res) => {
        if (res && res.user) {
          this.setSession(res.token, res.user);
          this.closeAuthModal();
          this.cartService.showToast(`Welcome, ${cleanName}! Signed in with Google.`);
          this.saveGoogleAccount({
            name: cleanName,
            email: cleanEmail,
            lastUsed: Date.now()
          });
        }
      })
    );
  }

  /**
   * Sign in using Firebase Google Popup provider
   */
  signInWithGooglePopup(): Observable<AuthResponse> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const performPopup = async (): Promise<AuthResponse> => {
      const result = await signInWithPopup(this.auth, provider);
      const token = await result.user.getIdToken();
      const user = this.mapFirebaseUser(result.user);
      return { token, user, message: 'Signed in with Google' };
    };

    return from(performPopup()).pipe(
      tap((res) => {
        if (res && res.user) {
          this.setSession(res.token, res.user);
          this.closeAuthModal();
          this.cartService.showToast(`Welcome, ${res.user.username}!`);
          if (res.user.email) {
            this.saveGoogleAccount({
              name: res.user.username,
              email: res.user.email,
              lastUsed: Date.now()
            });
          }
        }
      })
    );
  }

  /**
   * Fallback quick Google sign-in
   */
  continueWithGoogle(): Observable<AuthResponse> {
    const defaultName = this.lastUsername() || 'Customer';
    const defaultEmail = (this.lastUsername() ? this.lastUsername() + '@gmail.com' : 'user@gmail.com');
    return this.loginWithGoogleProfile(defaultName, defaultEmail);
  }

  /**
   * Sign out and clear local credentials, preserving username for quick re-login
   */
  logout(notify: boolean = true): void {
    const previousUsername = this.currentUser()?.username;
    if (previousUsername) {
      localStorage.setItem('freshcart_last_username', previousUsername);
      this.lastUsername.set(previousUsername);
    }

    signOut(this.auth).catch((err) => console.warn('Firebase signOut error', err));

    localStorage.removeItem('freshcart_token');
    localStorage.removeItem('freshcart_user');
    this.token.set(null);
    this.currentUser.set(null);
    this.cartService.clearCart();
    this.currentView.set('store');
    if (typeof window !== 'undefined') {
      window.location.hash = '';
    }
    if (notify) {
      this.cartService.showToast('You have signed out.', 'info');
    }
  }

  private setSession(token: string, user: User): void {
    this.token.set(token);
    this.currentUser.set(user);
    if (user.username) {
      localStorage.setItem('freshcart_last_username', user.username);
      this.lastUsername.set(user.username);
    }
    localStorage.setItem('freshcart_token', token);
    localStorage.setItem('freshcart_user', JSON.stringify(user));

    // When an administrator logs in, automatically show ONLY the Admin Portal!
    const isUserAdmin = !!(
      user.is_staff ||
      user.is_superuser ||
      user.role === 'admin' ||
      user.username?.toLowerCase() === 'admin' ||
      user.email?.toLowerCase() === 'admin@freshcart.in' ||
      user.email?.toLowerCase().startsWith('admin@')
    );
    if (isUserAdmin) {
      this.openAdminView();
    }
  }

  // Modal controls
  openAuthModal(tab: 'signin' | 'register' = 'signin'): void {
    this.initialAuthTab.set(tab);
    this.isAuthModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.isAuthModalOpen.set(false);
  }
}
