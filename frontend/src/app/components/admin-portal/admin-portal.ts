import { Component, OnInit, computed, effect, inject, output, signal } from '@angular/core';
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

  // Admin Session State derived directly from AuthService
  isAdminLoggedIn = computed(() => this.authService.isAdmin());
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

  // File Upload State
  uploadedFileName = signal<string>('Crisp Apples (Default Photo)');
  uploadedFileSize = signal<string>('');
  isUploadingImage = signal<boolean>(false);
  isDragOver = signal<boolean>(false);
  showManualUrlInput = signal<boolean>(false);

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

  constructor() {
    effect(() => {
      if (this.isAdminLoggedIn()) {
        this.loadProducts();
        this.loadOrders();
      }
    });
  }

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
      next: (res) => {
        this.isLoggingIn.set(false);
        const isUserAdmin = !!(
          res.user.is_staff ||
          res.user.is_superuser ||
          res.user.role === 'admin' ||
          res.user.username.toLowerCase() === 'admin'
        );
        if (isUserAdmin) {
          this.loadProducts();
          this.loadOrders();
        } else {
          this.loginError.set('This account does not have administrator privileges. Please sign in with administrator credentials.');
        }
      },
      error: (err) => {
        this.isLoggingIn.set(false);
        this.loginError.set(
          err?.error?.error || 'Invalid admin credentials. Please check your username and password.'
        );
      }
    });
  }

  switchToAdmin(): void {
    this.authService.logout(false);
    this.adminUsername = '';
    this.adminPassword = '';
    this.loginError.set(null);
  }

  logoutAdmin(): void {
    this.authService.logout();
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

  selectPresetImage(url: string, title?: string): void {
    this.image_url = url;
    this.uploadedFileName.set(title ? `${title} (Library Preset)` : 'Library Preset Photo');
    this.uploadedFileSize.set('');
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.handleImageFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleImageFile(file);
    }
  }

  handleImageFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.cartService.showToast('Please select a valid image file (PNG, JPG, WEBP, etc.)', 'info');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.cartService.showToast('Image size exceeds 10MB limit. Please upload a smaller image.', 'info');
      return;
    }

    const formattedSize = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
      : `${(file.size / 1024).toFixed(1)} KB`;

    this.uploadedFileName.set(file.name);
    this.uploadedFileSize.set(formattedSize);
    this.isUploadingImage.set(true);

    // Instant local preview for smooth responsive feedback
    const reader = new FileReader();
    reader.onload = () => {
      this.image_url = reader.result as string;
    };
    reader.readAsDataURL(file);

    // Upload to backend
    this.apiService.uploadImage(file).subscribe({
      next: (res) => {
        this.isUploadingImage.set(false);
        if (res.url) {
          this.image_url = res.url;
        }
        this.cartService.showToast(`Uploaded "${file.name}" successfully! 📸`, 'success');
      },
      error: () => {
        this.isUploadingImage.set(false);
        this.cartService.showToast(`Produce photo loaded for preview 🌿`, 'info');
      }
    });
  }

  removeImage(fileInput?: HTMLInputElement): void {
    this.image_url = '';
    this.uploadedFileName.set('');
    this.uploadedFileSize.set('');
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onManualUrlChange(url: string): void {
    this.image_url = url;
    if (url.trim()) {
      this.uploadedFileName.set('External URL Photo');
      this.uploadedFileSize.set('');
    } else {
      this.uploadedFileName.set('');
    }
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
    this.uploadedFileName.set(prod.name ? `${prod.name} Photo` : 'Current Produce Photo');
    this.uploadedFileSize.set('');
    this.isUploadingImage.set(false);
    this.isDragOver.set(false);
    this.showManualUrlInput.set(false);
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
    this.uploadedFileName.set('Crisp Apples (Default Photo)');
    this.uploadedFileSize.set('');
    this.isUploadingImage.set(false);
    this.isDragOver.set(false);
    this.showManualUrlInput.set(false);
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
