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

  categories = signal<Category[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.apiService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  selectCategory(slug: string): void {
    this.cartService.activeCategory.set(slug);
  }
}
