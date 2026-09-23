import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  cartService = inject(CartService);

  // Reactive quantity of this product in cart (safe for lifecycle initialization)
  quantity = computed(() => {
    if (!this.product?.id) return 0;
    return this.cartService.getItemQuantity(this.product.id);
  });

  onAdd(event: Event): void {
    event.stopPropagation();
    if (this.product) {
      this.cartService.addToCart(this.product);
    }
  }

  onIncrement(event: Event): void {
    event.stopPropagation();
    if (this.product?.id) {
      this.cartService.updateQuantity(this.product.id, 1);
    }
  }

  onDecrement(event: Event): void {
    event.stopPropagation();
    if (this.product?.id) {
      this.cartService.updateQuantity(this.product.id, -1);
    }
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.includes('data:image/svg+xml')) {
      const title = this.product?.name ? encodeURIComponent(this.product.name) : 'Organic Produce';
      const icon = this.product?.category_slug === 'fruits' ? '🍎' : (this.product?.category_slug === 'greens' ? '🥬' : (this.product?.category_slug === 'veggies' ? '🥕' : '🥑'));
      img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 320' fill='none'%3E%3Crect width='320' height='320' fill='%23EEF5F0' rx='16'/%3E%3Ccircle cx='160' cy='140' r='55' fill='%23D8EADB'/%3E%3Ctext x='160' y='155' font-size='48' text-anchor='middle'%3E${icon}%3C/text%3E%3Ctext x='160' y='225' font-family='sans-serif' font-size='14' font-weight='700' fill='%232E5C3E' text-anchor='middle'%3E${title}%3C/text%3E%3Ctext x='160' y='248' font-family='sans-serif' font-size='11' font-weight='500' fill='%237A847E' text-anchor='middle'%3E100%25 Organic Certified%3C/text%3E%3C/svg%3E`;
    }
  }
}
