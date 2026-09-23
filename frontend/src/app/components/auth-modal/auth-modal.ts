import { Component, HostListener, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.scss',
})
export class AuthModalComponent {
  authService = inject(AuthService);

  activeTab = signal<'signin' | 'register'>('signin');
  authView = signal<'credentials' | 'google_chooser'>('credentials');
  showAddGoogleForm = signal(false);
  isSubmitting = signal(false);
  isGoogleSubmitting = signal(false);
  selectedAccountEmail = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Form Models
  username = '';
  email = '';
  password = '';

  // Google SSO Model
  googleEmail = '';
  googleName = '';

  constructor() {
    effect(() => {
      if (this.authService.isAuthModalOpen()) {
        this.activeTab.set(this.authService.initialAuthTab());
        this.authView.set('credentials');
        this.showAddGoogleForm.set(false);
        this.errorMessage.set(null);
        this.selectedAccountEmail.set(null);
        this.username = '';
        this.email = '';
        this.password = '';
        this.googleEmail = '';
        this.googleName = '';
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.authService.isAuthModalOpen()) {
      this.close();
    }
  }

  setTab(tab: 'signin' | 'register'): void {
    this.activeTab.set(tab);
    this.authView.set('credentials');
    this.errorMessage.set(null);
    this.username = '';
    this.email = '';
    this.password = '';
  }

  close(): void {
    this.authService.closeAuthModal();
    this.authView.set('credentials');
    this.errorMessage.set(null);
    this.selectedAccountEmail.set(null);
  }

  openGoogleFlow(): void {
    this.errorMessage.set(null);
    this.googleEmail = '';
    this.googleName = '';
    this.showAddGoogleForm.set(this.authService.savedGoogleAccounts().length === 0);
    this.authView.set('google_chooser');
  }

  signInWithGooglePopup(): void {
    this.errorMessage.set(null);
    this.isGoogleSubmitting.set(true);

    this.authService.signInWithGooglePopup().subscribe({
      next: () => {
        this.isGoogleSubmitting.set(false);
        this.authView.set('credentials');
      },
      error: (err) => {
        this.isGoogleSubmitting.set(false);
        if (err?.code === 'auth/popup-blocked') {
          this.errorMessage.set('Google popup was blocked by your browser. You can enter your email directly below.');
          this.openGoogleFlow();
          this.showAddGoogleForm.set(true);
        } else if (err?.code === 'auth/popup-closed-by-user') {
          this.errorMessage.set('Google sign-in was closed before completing.');
        } else {
          this.errorMessage.set(this.formatErrorMessage(err));
        }
      }
    });
  }

  selectSavedGoogleAccount(account: { name: string; email: string }): void {
    this.errorMessage.set(null);
    this.selectedAccountEmail.set(account.email);
    this.isGoogleSubmitting.set(true);

    this.authService.loginWithGoogleProfile(account.name, account.email).subscribe({
      next: () => {
        this.isGoogleSubmitting.set(false);
        this.selectedAccountEmail.set(null);
        this.authView.set('credentials');
      },
      error: (err) => {
        this.isGoogleSubmitting.set(false);
        this.selectedAccountEmail.set(null);
        this.errorMessage.set(this.formatErrorMessage(err));
      }
    });
  }

  submitNewGoogleAccount(): void {
    this.errorMessage.set(null);
    const email = this.googleEmail.trim();
    if (!email || !email.includes('@')) {
      this.errorMessage.set('Please enter a valid Google email address (e.g. name@gmail.com).');
      return;
    }

    const name = this.googleName.trim() || email.split('@')[0];
    this.isGoogleSubmitting.set(true);

    this.authService.loginWithGoogleProfile(name, email).subscribe({
      next: () => {
        this.isGoogleSubmitting.set(false);
        this.googleEmail = '';
        this.googleName = '';
        this.authView.set('credentials');
      },
      error: (err) => {
        this.isGoogleSubmitting.set(false);
        this.errorMessage.set(this.formatErrorMessage(err));
      }
    });
  }

  removeGoogleAccount(email: string, event: Event): void {
    event.stopPropagation();
    this.authService.removeGoogleAccount(email);
    if (this.authService.savedGoogleAccounts().length === 0) {
      this.showAddGoogleForm.set(true);
    }
  }

  backToCredentials(): void {
    this.authView.set('credentials');
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (this.activeTab() === 'signin') {
      const identifier = (this.email || this.username).trim();
      if (!identifier || !this.password.trim()) {
        this.errorMessage.set('Please enter your email/username and password.');
        return;
      }

      this.isSubmitting.set(true);
      this.authService.login({
        username: identifier,
        password: this.password.trim()
      }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.username = '';
          this.email = '';
          this.password = '';
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(this.formatErrorMessage(err));
        }
      });

    } else {
      // Registration flow
      const uname = this.username.trim();
      const rawEmail = this.email.trim();

      if (!uname) {
        this.errorMessage.set('Please provide a username.');
        return;
      }

      if (!rawEmail) {
        this.errorMessage.set('Please provide an email address.');
        return;
      }

      // Enforce valid email format for registration
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawEmail)) {
        this.errorMessage.set('Please enter a valid email address (e.g. yourname@domain.com).');
        return;
      }

      if (!this.password.trim() || this.password.length < 6) {
        this.errorMessage.set('Password should be at least 6 characters long.');
        return;
      }

      this.isSubmitting.set(true);
      this.authService.register({
        username: uname,
        email: rawEmail,
        password: this.password.trim()
      }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.username = '';
          this.email = '';
          this.password = '';
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const errorText = this.formatErrorMessage(err);

          // If user already exists in Firebase, redirect them to Sign In
          if (errorText.toLowerCase().includes('already in use') || errorText.toLowerCase().includes('email-already')) {
            this.activeTab.set('signin');
            this.errorMessage.set('This email is already registered. Please enter your password to sign in.');
            return;
          }

          this.errorMessage.set(errorText);
        }
      });
    }
  }

  private formatErrorMessage(err: any): string {
    const raw: string = err?.code || err?.message || err?.error?.error || '';
    if (raw.includes('auth/email-already-in-use')) {
      return 'This email is already in use. Please sign in instead.';
    }
    if (raw.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (raw.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    if (raw.includes('auth/invalid-credential') || raw.includes('auth/user-not-found') || raw.includes('auth/wrong-password')) {
      return 'Invalid email or password. Please verify your credentials.';
    }
    if (raw.includes('auth/too-many-requests')) {
      return 'Access temporarily disabled due to many failed login attempts. Please try again later.';
    }
    if (raw.includes('auth/network-request-failed')) {
      return 'Network connection error. Please check your internet connection.';
    }
    if (raw.includes('auth/popup-closed-by-user')) {
      return 'Google sign-in was closed before completing.';
    }
    if (raw.includes('auth/operation-not-allowed')) {
      return 'Email/Password sign-in is not enabled in the Firebase console.';
    }
    return raw || 'Authentication failed. Please try again.';
  }
}