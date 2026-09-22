import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../models/product.model';
import { ProductCardComponent } from '../product-card/product-card';
import { CategoryFilterComponent } from '../category-filter/category-filter';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, CategoryFilterComponent],
  templateUrl: './product-grid.html',
  styleUrl: './product-grid.scss',
})
export class ProductGridComponent {
  apiService = inject(ApiService);
  cartService = inject(CartService);
  authService = inject(AuthService);

  allProducts = signal<Product[]>([]);
  isLoading = signal(true);
  sortOption = signal<string>('featured');

  // Real-time reactive Signal filtering by product name, category, and tags
  products = computed<Product[]>(() => {
    const rawSearch = this.cartService.searchQuery();
    const query = rawSearch.toLowerCase().trim();
    const category = this.cartService.activeCategory();
    let items = this.allProducts();

    if (query) {
      items = items.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(query);
        const catNameMatch = p.category_name?.toLowerCase().includes(query);
        const catSlugMatch = p.category_slug?.toLowerCase().includes(query);
        const taglineMatch = p.tagline?.toLowerCase().includes(query);
        const freshnessMatch = p.freshness_tag?.toLowerCase().includes(query);
        return nameMatch || catNameMatch || catSlugMatch || taglineMatch || freshnessMatch;
      });

      // If user has also selected a specific category tab other than 'all'
      if (category && category !== 'all') {
        items = items.filter(p => p.category_slug === category);
      }
    } else {
      if (category && category !== 'all') {
        items = items.filter(p => p.category_slug === category);
      }
    }

    return this.applySorting(items, this.sortOption());
  });

  constructor() {
    // Re-fetch products when user auth state changes
    effect(() => {
      const isAuthed = this.authService.isLoggedIn();
      untracked(() => {
        if (isAuthed) {
          this.loadProducts();
        } else {
          this.allProducts.set([]);
          this.isLoading.set(false);
        }
      });
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.apiService.getProducts('all').subscribe({
      next: (data) => {
        this.allProducts.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sortOption.set(select.value);
  }

  private applySorting(items: Product[], opt: string): Product[] {
    const copy = [...items];
    if (opt === 'price-asc') {
      copy.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (opt === 'price-desc') {
      copy.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (opt === 'rating') {
      copy.sort((a, b) => Number(b.rating) - Number(a.rating));
    } else {
      // featured
      copy.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }
    return copy;
  }

  getSectionTitle(): string {
    const cat = this.cartService.activeCategory();
    const search = this.cartService.searchQuery();
    if (search.trim()) {
      return `Search Results for "${search}"`;
    }
    switch (cat) {
      case 'fruits': return 'Orchard-Fresh Seasonal Fruits 🍎';
      case 'greens': return 'Hydroponic & Organically Grown Greens 🥬';
      case 'veggies': return 'Daily Kitchen Essentials & Fresh Veggies 🥕';
      default: return 'Today’s Harvest Selection';
    }
  }
}
