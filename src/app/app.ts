import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar';
import { HeroBannerComponent } from './components/hero-banner/hero-banner';
import { ProductGridComponent } from './components/product-grid/product-grid';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer';
import { CheckoutModalComponent } from './components/checkout-modal/checkout-modal';
import { OrderSuccessModalComponent } from './components/order-success-modal/order-success-modal';
import { AuthModalComponent } from './components/auth-modal/auth-modal';
import { AdminPortalComponent } from './components/admin-portal/admin-portal';
import { CartService } from './services/cart.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    HeroBannerComponent,
    ProductGridComponent,
    CartDrawerComponent,
    CheckoutModalComponent,
    OrderSuccessModalComponent,
    AuthModalComponent,
    AdminPortalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  cartService = inject(CartService);
  authService = inject(AuthService);

  // View state: 'store' for customer storefront, 'admin' for farm manager portal
  currentView = signal<'store' | 'admin'>('store');

  ngOnInit(): void {
    const checkHash = () => {
      if (typeof window !== 'undefined') {
        if (window.location.hash === '#admin') {
          this.currentView.set('admin');
        } else {
          this.currentView.set('store');
        }
      }
    };

    checkHash();
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', checkHash);
    }

    // If visitor is unauthenticated on storefront, gently prompt the auth modal
    if (!this.authService.isLoggedIn() && this.currentView() === 'store') {
      setTimeout(() => {
        if (!this.authService.isLoggedIn() && this.currentView() === 'store') {
          this.authService.openAuthModal();
        }
      }, 700);
    }
  }

  openAdminView(): void {
    this.currentView.set('admin');
    if (typeof window !== 'undefined') {
      window.location.hash = 'admin';
    }
  }

  openStoreView(): void {
    this.currentView.set('store');
    if (typeof window !== 'undefined' && window.location.hash === '#admin') {
      window.location.hash = '';
    }
  }
}
