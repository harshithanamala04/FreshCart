import { Component, HostListener, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { OrderRequest } from '../../models/order.model';

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout-modal.html',
  styleUrl: './checkout-modal.scss',
})
export class CheckoutModalComponent {
  cartService = inject(CartService);
  apiService = inject(ApiService);
  authService = inject(AuthService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  // Form Model
  customerName = '';
  customerPhone = '';
  customerEmail = '';

  constructor() {
    effect(() => {
      if (this.cartService.isCheckoutOpen()) {
        const user = this.authService.currentUser();
        if (user) {
          if (!this.customerName) {
            this.customerName = user.username || '';
          }
          if (!this.customerEmail && user.email) {
            this.customerEmail = user.email;
          }
        }
      }
    });
  }
  flatNumber = '';
  streetAddress = '';
  pincode = '';
  notes = '';

  selectedSlot = 'Express Delivery: Within 2 Hours';
  selectedPayment: 'UPI' | 'CARD' | 'COD' = 'UPI';

  upiId = '';

  slots = [
    { id: 'express', label: '⚡ Express Delivery (Within 2 Hours)', sub: 'Earliest Available' },
    { id: 'morning', label: '🌅 Morning Slot (6:00 AM - 9:00 AM)', sub: 'Tomorrow Morning' },
    { id: 'evening', label: '🌆 Evening Slot (5:00 PM - 8:00 PM)', sub: 'Today Evening' },
  ];

  paymentMethods = [
    { id: 'UPI' as const, name: 'UPI (Instant / Zero Fee)', icon: '📱', desc: 'Google Pay, PhonePe, Paytm, BHIM' },
    { id: 'CARD' as const, name: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, RuPay' },
    { id: 'COD' as const, name: 'Cash on Delivery (COD)', icon: '💵', desc: 'Pay with cash or UPI at delivery' },
  ];

  getItemTotal(item: any): number {
    return Number(item.product.price) * item.quantity;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.cartService.isCheckoutOpen()) {
      this.cartService.closeCheckout();
    }
  }

  onSubmitOrder(): void {
    if (!this.customerName.trim() || !this.customerPhone.trim() || !this.flatNumber.trim()) {
      this.errorMessage.set('Please fill in your name, phone number, and delivery address.');
      return;
    }

    if (this.cartService.cartItems().length === 0) {
      this.errorMessage.set('Your basket is empty.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const fullAddress = `${this.flatNumber}, ${this.streetAddress}, Pincode: ${this.pincode}`;

    const orderPayload: OrderRequest = {
      customer_name: this.customerName.trim(),
      customer_phone: this.customerPhone.trim(),
      customer_email: this.customerEmail.trim(),
      delivery_address: fullAddress,
      delivery_slot: this.selectedSlot,
      payment_method: this.selectedPayment,
      notes: this.notes,
      order_items: this.cartService.cartItems().map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }))
    };

    this.apiService.createOrder(orderPayload).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.cartService.clearCart();
        this.cartService.openSuccessModal(response);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message || 'Unable to place order. Please try again.');
      }
    });
  }
}
