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

  // View state driven by AuthService: 'store' for customer storefront, 'admin' for farm manager portal
  currentView = this.authService.currentView;

  ngOnInit(): void {
    const checkHash = () => {
      if (typeof window !== 'undefined') {
        if (window.location.hash === '#admin') {
          this.authService.openAdminView();
        } else if (window.location.hash === '#store') {
          this.authService.openStoreView();
        }
      }
    };

    checkHash();
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', checkHash);

      // When a user visits our site for the 1st time, prompt them to sign up to view all products
      if (!this.authService.isLoggedIn()) {
        const hasPrompted = sessionStorage.getItem('freshcart_welcome_prompted');
        if (!hasPrompted && this.currentView() === 'store') {
          sessionStorage.setItem('freshcart_welcome_prompted', 'true');
          setTimeout(() => {
            if (!this.authService.isLoggedIn() && this.currentView() === 'store') {
              this.authService.openAuthModal('register');
            }
          }, 800);
        }
      }
    }
  }

  openAdminView(): void {
    this.authService.openAdminView();
  }

  openStoreView(): void {
    this.authService.openStoreView();
  }
}
