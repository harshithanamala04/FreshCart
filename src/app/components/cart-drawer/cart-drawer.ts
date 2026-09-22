import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cart.model';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.scss',
})
export class CartDrawerComponent {
  cartService = inject(CartService);

  selectedSlot = signal<string>('Express Delivery: Within 2 Hours');

  deliverySlots = [
    { id: 'express', name: '⚡ Express Delivery', time: 'Within 2 Hours', note: 'Fastest' },
    { id: 'morning', name: '🌅 Dawn Harvest Slot', time: '6:00 AM - 9:00 AM', note: 'Freshly Plucked' },
    { id: 'evening', name: '🌆 Evening Convenience', time: '5:00 PM - 8:00 PM', note: 'Post-Work' },
  ];

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.cartService.isCartOpen()) {
      this.cartService.closeCart();
    }
  }

  selectSlot(slotName: string): void {
    this.selectedSlot.set(slotName);
  }

  getItemTotal(item: CartItem): number {
    return Number(item.product.price) * item.quantity;
  }

  onProceedToCheckout(): void {
    this.cartService.openCheckout();
  }
}
