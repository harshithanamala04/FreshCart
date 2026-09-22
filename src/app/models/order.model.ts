export interface OrderItemInput {
  product_id: number;
  quantity: number;
}

export interface OrderRequest {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  delivery_slot: string;
  payment_method: 'UPI' | 'CARD' | 'COD';
  notes?: string;
  order_items: OrderItemInput[];
}

export interface OrderItemSummary {
  id: number;
  product: number;
  product_name: string;
  product_unit: string;
  price: string | number;
  quantity: number;
  item_total: string | number;
}

export interface OrderResponse {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  delivery_slot: string;
  subtotal: string | number;
  delivery_fee: string | number;
  total_amount: string | number;
  payment_method: string;
  status: string;
  notes?: string;
  created_at: string;
  items: OrderItemSummary[];
}
