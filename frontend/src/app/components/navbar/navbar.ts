import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  cartService = inject(CartService);
  authService = inject(AuthService);

  openAdmin = output<void>();

  goToAdmin(): void {
    this.authService.openAdminView();
    this.openAdmin.emit();
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const query = input.value;
    this.cartService.searchQuery.set(query);

    if (query.trim()) {
      // If user is near the hero or above produce-section, smoothly reveal results
      const produceEl = document.getElementById('produce-section');
      if (produceEl) {
        const rect = produceEl.getBoundingClientRect();
        if (rect.top > 100 || (window.scrollY || document.documentElement.scrollTop) < 250) {
          produceEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }

  clearSearch(): void {
    this.cartService.searchQuery.set('');
  }

  handleLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.includes('data:image/svg+xml')) {
      img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 50' fill='none'%3E%3Crect width='160' height='50' rx='8' fill='%23EEF5F0'/%3E%3Ctext x='15' y='32' font-family='serif' font-size='22' font-weight='bold' fill='%23417050'%3EFreshCart%3C/text%3E%3C/svg%3E";
    }
  }
}
