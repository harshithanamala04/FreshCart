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

  // Form Models (Always start empty so clean placeholders show)
  username = '';
  email = '';
  password = '';

  // Google SSO Model
  googleEmail = '';
  googleName = '';

  constructor() {
    // Whenever the modal opens, reset form to pristine state with empty inputs
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
    this.showAddGoogleForm.set(false);
    this.authView.set('google_chooser');
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
        this.errorMessage.set(
          err?.error?.error || 'Unable to authenticate with Google. Please try again.'
        );
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
        this.errorMessage.set(
          err?.error?.error || 'Unable to connect with Google. Please try again.'
        );
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
      if (!this.username.trim() || !this.password.trim()) {
        this.errorMessage.set('Please enter your username/email and password.');
        return;
      }

      this.isSubmitting.set(true);
      this.authService.login({
        username: this.username.trim(),
        password: this.password.trim()
      }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.username = '';
          this.password = '';
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err?.error?.error || 'Invalid credentials. Please check your username and password.'
          );
        }
      });

    } else {
      if (!this.username.trim() || !this.password.trim()) {
        this.errorMessage.set('Please provide a username and password.');
        return;
      }

      if (this.password.length < 6) {
        this.errorMessage.set('Password should be at least 6 characters long.');
        return;
      }

      this.isSubmitting.set(true);
      this.authService.register({
        username: this.username.trim(),
        email: this.email.trim() || undefined,
        password: this.password.trim()
      }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.username = '';
          this.email = '';
          this.password = '';
        },
        error: (err) => {
          const errMsg = err?.error?.error || '';
          
          // If the account already exists, automatically attempt login with the entered credentials!
          if (errMsg.toLowerCase().includes('already exists') || err.status === 400) {
            this.authService.login({
              username: this.username.trim(),
              password: this.password.trim()
            }).subscribe({
              next: () => {
                this.isSubmitting.set(false);
                this.username = '';
                this.email = '';
                this.password = '';
              },
              error: (loginErr) => {
                this.isSubmitting.set(false);
                this.activeTab.set('signin');
                const signinMsg = loginErr?.error?.error || 'An account with this username already exists. Please verify your password to sign in.';
                this.errorMessage.set(signinMsg);
              }
            });
            return;
          }

          this.isSubmitting.set(false);
          this.errorMessage.set(
            errMsg || 'Registration failed. Please check your details.'
          );
        }
      });
    }
  }
}
