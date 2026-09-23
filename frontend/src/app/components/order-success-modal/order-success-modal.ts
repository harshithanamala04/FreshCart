import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-order-success-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-success-modal.html',
  styleUrl: './order-success-modal.scss',
})
export class OrderSuccessModalComponent {
  cartService = inject(CartService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.cartService.isSuccessModalOpen()) {
      this.cartService.closeSuccessModal();
    }
  }

  onContinueShopping(): void {
    this.cartService.closeSuccessModal();
    const produceEl = document.getElementById('produce-section');
    if (produceEl) {
      produceEl.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
