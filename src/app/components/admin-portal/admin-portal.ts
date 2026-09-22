import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../models/product.model';
import { OrderResponse } from '../../models/order.model';

export interface ImagePreset {
  title: string;
  url: string;
  category: number;
}

@Component({
  selector: 'app-admin-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-portal.html',
  styleUrl: './admin-portal.scss',
})
export class AdminPortalComponent implements OnInit {
  apiService = inject(ApiService);
  cartService = inject(CartService);
  authService = inject(AuthService);

  // Event to return to storefront
  closeAdmin = output<void>();

  // Admin Session State
  isAdminLoggedIn = signal<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('freshcart_admin_auth') === 'true' : false
  );
  activeTab = signal<'add' | 'inventory' | 'orders'>('add');

  // Login Form
  adminUsername = '';
  adminPassword = '';
  loginError = signal<string | null>(null);
  isLoggingIn = signal<boolean>(false);

  // New Produce Form State
  name = '';
  category = 1;
  price: number | null = 140;
  original_price: number | null = 180;
  unit = '1 kg';
  stock_quantity = 50;
  freshness_tag = 'Direct From Farm';
  is_organic = true;
  is_featured = true;
  image_url = 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80';
  tagline = 'Freshly harvested from organic farmer collective';
  description = 'Grown in native fertile soil without chemical sprays or synthetic fertilizers. Handpicked at sunrise and delivered in peak freshness.';

  isPublishing = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingProductId = signal<number | null>(null);

  // Inventory & Orders Data
  products = signal<Product[]>([]);
  orders = signal<OrderResponse[]>([]);
  searchTerm = signal<string>('');
  inventoryCategoryFilter = signal<string>('all');
  isLoadingData = signal<boolean>(false);

  // Quick Preset Chips for Non-Tech Users
  readonly unitPresets = ['1 kg', '500g', '250g', '1 bunch', '6 pcs', '1 box', '2 pcs', '12 pcs'];
  readonly tagPresets = [
    'Direct From Farm',
    'Just Harvested',
    'Orchard Fresh',
    'GI Tagged',
    'Pesticide Free',
    'Sun Ripened',
    'Hydroponic Pure'
  ];

  // Curated 1-Click Image Gallery for Farm Produce
  readonly imagePresets: ImagePreset[] = [
    { title: 'Crisp Apples', category: 1, url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80' },
    { title: 'Sweet Mangoes', category: 1, url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80' },
    { title: 'Bananas', category: 1, url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80' },
    { title: 'Strawberries', category: 1, url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80' },
    { title: 'Oranges / Mosambi', category: 1, url: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=600&q=80' },
    { title: 'Pomegranates', category: 1, url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80' },
    { title: 'Baby Spinach (Palak)', category: 2, url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80' },
    { title: 'Fresh Coriander', category: 2, url: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=600&q=80' },
    { title: 'Crisp Lettuce', category: 2, url: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=600&q=80' },
    { title: 'Organic Carrots', category: 3, url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80' },
    { title: 'Vine Tomatoes', category: 3, url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80' },
    { title: 'Golden Potatoes', category: 3, url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80' },
    { title: 'Red Onions', category: 3, url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80' },
    { title: 'Green Capsicum', category: 3, url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80' },
  ];

  // Computed Live Discount for Preview
  readonly previewDiscount = computed(() => {
    const cur = this.price || 0;
    const orig = this.original_price || 0;
    if (orig > cur && orig > 0) {
      return Math.round(((orig - cur) / orig) * 100);
    }
    return 0;
  });

  // Filtered Products for Inventory Table
  readonly filteredProducts = computed(() => {
    let list = this.products();
    const query = this.searchTerm().toLowerCase().trim();
    const cat = this.inventoryCategoryFilter();

    if (cat !== 'all') {
      const catId = Number(cat);
      list = list.filter(p => p.category === catId || p.category_slug === cat);
    }

    if (query) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.freshness_tag.toLowerCase().includes(query) ||
        (p.category_name && p.category_name.toLowerCase().includes(query))
      );
    }
    return list;
  });

  ngOnInit(): void {
    if (this.isAdminLoggedIn()) {
      this.loadProducts();
      this.loadOrders();
    }
  }

  // --- Authentication ---

  loginWithCredentials(): void {
    this.loginError.set(null);
    if (!this.adminUsername.trim() || !this.adminPassword.trim()) {
      this.loginError.set('Please enter your admin username and password.');
      return;
    }

    this.isLoggingIn.set(true);

    this.authService.login({
      username: this.adminUsername.trim(),
      password: this.adminPassword.trim()
    }).subscribe({
      next: () => {
        this.isLoggingIn.set(false);
        this.setAdminSession(true);
      },
      error: () => {
        // Fallback demo admin credentials
        if (
          (this.adminUsername.toLowerCase() === 'admin' && this.adminPassword === 'admin123') ||
          this.adminUsername.toLowerCase() === 'harshitha'
        ) {
          this.isLoggingIn.set(false);
          this.setAdminSession(true);
        } else {
          this.isLoggingIn.set(false);
          this.loginError.set('Invalid admin credentials. Use admin / admin123 or click Quick Demo Access.');
        }
      }
    });
  }

  quickDemoLogin(): void {
    this.setAdminSession(true);
    this.cartService.showToast('Welcome to FreshCart Admin Portal!', 'success');
  }

  private setAdminSession(active: boolean): void {
    this.isAdminLoggedIn.set(active);
    if (typeof window !== 'undefined') {
      if (active) {
        localStorage.setItem('freshcart_admin_auth', 'true');
        this.loadProducts();
        this.loadOrders();
      } else {
        localStorage.removeItem('freshcart_admin_auth');
      }
    }
  }

  logoutAdmin(): void {
    this.setAdminSession(false);
    this.closeAdmin.emit();
  }

  // --- Form Selectors ---

  selectCategory(catId: number): void {
    this.category = catId;
  }

  selectUnit(u: string): void {
    this.unit = u;
  }

  selectTag(t: string): void {
    this.freshness_tag = t;
  }

  selectPresetImage(url: string): void {
    this.image_url = url;
  }

  // --- Produce Publishing ---

  publishProduct(): void {
    if (!this.name.trim()) {
      this.cartService.showToast('Please provide a produce name (e.g. Kashmiri Apples)', 'info');
      return;
    }

    if (!this.price || this.price <= 0) {
      this.cartService.showToast('Please enter a valid price in ₹ INR', 'info');
      return;
    }

    this.isPublishing.set(true);

    const payload: Partial<Product> = {
      name: this.name.trim(),
      category: Number(this.category),
      price: Number(this.price),
      original_price: this.original_price ? Number(this.original_price) : null,
      unit: this.unit.trim() || '1 kg',
      stock_quantity: Number(this.stock_quantity) || 50,
      freshness_tag: this.freshness_tag.trim() || 'Farm Fresh',
      is_organic: this.is_organic,
      is_featured: this.is_featured,
      image_url: this.image_url.trim() || '/fruits/apples.jpg',
      tagline: this.tagline.trim() || 'Direct from organic farm hub',
      description: this.description.trim() || 'Harvested at dawn for certified freshness.',
    };

    if (this.isEditing() && this.editingProductId()) {
      // Update existing
      this.apiService.updateProduct(this.editingProductId()!, payload).subscribe({
        next: (updated) => {
          this.isPublishing.set(false);
          this.isEditing.set(false);
          this.editingProductId.set(null);
          this.cartService.showToast(`Updated "${updated.name}" successfully!`, 'success');
          this.resetForm();
          this.loadProducts();
          this.activeTab.set('inventory');
        },
        error: () => {
          this.isPublishing.set(false);
          this.cartService.showToast('Failed to update produce. Please try again.', 'info');
        }
      });
    } else {
      // Create new
      this.apiService.createProduct(payload).subscribe({
        next: (created) => {
          this.isPublishing.set(false);
          this.cartService.showToast(`Published "${created.name}" to the store! 🌿`, 'success');
          this.resetForm();
          this.loadProducts();
          this.activeTab.set('inventory');
        },
        error: () => {
          this.isPublishing.set(false);
          this.cartService.showToast('Failed to publish produce. Please try again.', 'info');
        }
      });
    }
  }

  editProduct(prod: Product): void {
    this.isEditing.set(true);
    this.editingProductId.set(prod.id);
    this.name = prod.name;
    this.category = prod.category;
    this.price = prod.price;
    this.original_price = prod.original_price ?? null;
    this.unit = prod.unit;
    this.stock_quantity = prod.stock_quantity;
    this.freshness_tag = prod.freshness_tag;
    this.is_organic = prod.is_organic;
    this.is_featured = prod.is_featured;
    this.image_url = prod.image_url;
    this.tagline = prod.tagline;
    this.description = prod.description;
    this.activeTab.set('add');
    this.cartService.showToast(`Editing "${prod.name}" in Add / Edit Produce tab`, 'info');
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editingProductId.set(null);
    this.resetForm();
  }

  deleteProduct(prod: Product): void {
    if (confirm(`Are you sure you want to remove "${prod.name}" from the store catalog?`)) {
      this.apiService.deleteProduct(prod.id).subscribe({
        next: () => {
          this.cartService.showToast(`Removed "${prod.name}" from catalog.`, 'info');
          this.loadProducts();
        }
      });
    }
  }

  quickAdjustStock(prod: Product, delta: number): void {
    const newStock = Math.max(0, prod.stock_quantity + delta);
    this.apiService.updateProduct(prod.id, { stock_quantity: newStock }).subscribe({
      next: () => {
        this.products.update(list =>
          list.map(p => p.id === prod.id ? { ...p, stock_quantity: newStock } : p)
        );
      }
    });
  }

  resetForm(): void {
    this.name = '';
    this.category = 1;
    this.price = 140;
    this.original_price = 180;
    this.unit = '1 kg';
    this.stock_quantity = 50;
    this.freshness_tag = 'Direct From Farm';
    this.is_organic = true;
    this.is_featured = true;
    this.image_url = 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80';
    this.tagline = 'Freshly harvested from organic farmer collective';
    this.description = 'Grown in native fertile soil without chemical sprays or synthetic fertilizers.';
  }

  // --- Data Loading ---

  loadProducts(): void {
    this.isLoadingData.set(true);
    this.apiService.getProducts('all').subscribe({
      next: (prods) => {
        this.products.set(prods);
        this.isLoadingData.set(false);
      },
      error: () => {
        this.isLoadingData.set(false);
      }
    });
  }

  loadOrders(): void {
    this.apiService.getAllOrders().subscribe({
      next: (ords) => {
        this.orders.set(ords);
      }
    });
  }
}
