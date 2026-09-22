import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';
import { OrderResponse } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Free delivery threshold in ₹ INR
  readonly freeDeliveryThreshold = 299;
  readonly standardDeliveryFee = 40;

  // Primary Signals
  readonly cartItems = signal<CartItem[]>([]);
  readonly isCartOpen = signal<boolean>(false);
  readonly isCheckoutOpen = signal<boolean>(false);
  readonly isSuccessModalOpen = signal<boolean>(false);
  readonly lastPlacedOrder = signal<OrderResponse | null>(null);

  // Filter & Search Signals
  readonly activeCategory = signal<string>('all');
  readonly searchQuery = signal<string>('');
  readonly selectedLocation = signal<string>('Bandra West, Mumbai (400050)');

  // Toast notification signal
  readonly toast = signal<{ message: string; type: 'success' | 'info' } | null>(null);

  // Computed: Total number of items in cart
  readonly totalItemCount = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + item.quantity, 0);
  });

  // Computed: Subtotal in ₹ INR
  readonly subtotal = computed(() => {
    return this.cartItems().reduce((acc, item) => {
      const price = Number(item?.product?.price) || 0;
      const qty = Number(item?.quantity) || 1;
      return acc + (price * qty);
    }, 0);
  });

  // Computed: Delivery Fee (Free if subtotal >= 299, ₹40 if > 0 and < 299, 0 if cart is empty)
  readonly deliveryFee = computed(() => {
    const sub = this.subtotal();
    if (sub === 0) return 0;
    return sub >= this.freeDeliveryThreshold ? 0 : this.standardDeliveryFee;
  });

  // Computed: Grand Total in ₹ INR
  readonly grandTotal = computed(() => {
    return this.subtotal() + this.deliveryFee();
  });

  // Computed: Free delivery meter progress
  readonly deliveryProgress = computed(() => {
    const sub = this.subtotal();
    if (sub === 0) {
      return {
        percent: 0,
        amountRemaining: this.freeDeliveryThreshold,
        unlocked: false,
      };
    }
    if (sub >= this.freeDeliveryThreshold) {
      return {
        percent: 100,
        amountRemaining: 0,
        unlocked: true,
      };
    }
    const percent = Math.min(100, Math.round((sub / this.freeDeliveryThreshold) * 100));
    const amountRemaining = this.freeDeliveryThreshold - sub;
    return {
      percent,
      amountRemaining,
      unlocked: false,
    };
  });

  // Computed: Quantity lookup helper function
  getItemQuantity(productId: number): number {
    if (!productId) return 0;
    const item = this.cartItems().find(i => i.product?.id === productId);
    return item ? item.quantity : 0;
  }

  /**
   * Add a product to the cart (or increment quantity if already present)
   */
  addToCart(product: Product): void {
    const current = [...this.cartItems()];
    const index = current.findIndex(i => i.product.id === product.id);

    if (index > -1) {
      current[index] = {
        ...current[index],
        quantity: current[index].quantity + 1
      };
      this.cartItems.set(current);
      this.showToast(`Added another ${product.name} to cart`);
    } else {
      current.push({ product, quantity: 1 });
      this.cartItems.set(current);
      this.showToast(`Added ${product.name} (${product.unit}) to basket`);
    }
  }

  /**
   * Update quantity by delta (+1 or -1). If quantity becomes 0, remove item.
   */
  updateQuantity(productId: number, delta: number): void {
    const current = [...this.cartItems()];
    const index = current.findIndex(i => i.product.id === productId);

    if (index === -1) return;

    const newQty = current[index].quantity + delta;
    if (newQty <= 0) {
      this.removeFromCart(productId);
    } else {
      current[index] = {
        ...current[index],
        quantity: newQty
      };
      this.cartItems.set(current);
    }
  }

  /**
   * Remove a product completely from the cart
   */
  removeFromCart(productId: number): void {
    const item = this.cartItems().find(i => i.product.id === productId);
    this.cartItems.set(this.cartItems().filter(i => i.product.id !== productId));
    if (item) {
      this.showToast(`Removed ${item.product.name} from basket`, 'info');
    }
  }

  /**
   * Clear all items from the cart
   */
  clearCart(): void {
    this.cartItems.set([]);
  }

  // Cart Drawer controls
  openCart(): void {
    this.isCartOpen.set(true);
  }

  closeCart(): void {
    this.isCartOpen.set(false);
  }

  toggleCart(): void {
    this.isCartOpen.update(v => !v);
  }

  // Checkout modal controls
  openCheckout(): void {
    this.closeCart();
    this.isCheckoutOpen.set(true);
  }

  closeCheckout(): void {
    this.isCheckoutOpen.set(false);
  }

  // Order Success modal controls
  openSuccessModal(order: OrderResponse): void {
    this.lastPlacedOrder.set(order);
    this.isCheckoutOpen.set(false);
    this.isSuccessModalOpen.set(true);
  }

  closeSuccessModal(): void {
    this.isSuccessModalOpen.set(false);
  }

  // Toast notification
  showToast(message: string, type: 'success' | 'info' = 'success'): void {
    this.toast.set({ message, type });
    setTimeout(() => {
      if (this.toast()?.message === message) {
        this.toast.set(null);
      }
    }, 2800);
  }
}
