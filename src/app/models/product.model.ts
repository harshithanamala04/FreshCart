export interface Product {
  id: number;
  category: number;
  category_name?: string;
  category_slug?: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  original_price?: number | null;
  discount_percentage?: number;
  unit: string;
  stock_quantity: number;
  freshness_tag: string;
  is_organic: boolean;
  image_url: string;
  rating: number;
  review_count: number;
  is_featured: boolean;
  created_at?: string;
}
