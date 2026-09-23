export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  display_order: number;
  products_count?: number;
}
