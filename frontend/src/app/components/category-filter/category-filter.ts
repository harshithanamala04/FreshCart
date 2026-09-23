import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-filter.html',
  styleUrl: './category-filter.scss',
})
export class CategoryFilterComponent implements OnInit {
  apiService = inject(ApiService);
  cartService = inject(CartService);

  // Pre-seed with initial categories so mobile layout immediately displays sections without blank delay
  categories = signal<Category[]>(this.apiService.getInitialCategories());
  isLoading = signal(false);

  ngOnInit(): void {
    this.apiService.getCategories().subscribe({
      next: (cats) => {
        if (cats && cats.length > 0) {
          this.categories.set(cats);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getCategoryIcon(cat: Category): string {
    if (cat.icon && !cat.icon.includes('?')) return cat.icon;
    switch (cat.slug) {
      case 'fruits': return '🍎';
      case 'greens': return '🥬';
      case 'veggies': return '🥕';
      default: return '🌿';
    }
  }

  selectCategory(slug: string): void {
    this.cartService.activeCategory.set(slug);
  }
}
