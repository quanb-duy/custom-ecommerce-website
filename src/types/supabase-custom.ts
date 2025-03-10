// This file contains custom TypeScript interfaces for working with Supabase
// Use these until the supabase/types.ts is automatically updated

export interface Address {
  id: string;
  user_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
}

export interface PickupPoint {
  name: string;
  address: string;
  zip: string;
  city: string;
}

export interface ShippingAddress {
  type?: 'packeta' | 'standard';
  fullName: string;
  phone?: string;
  // Fields for standard shipping
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  // Fields for packeta pickup
  pickupPoint?: PickupPoint;
}

export interface Order {
  id: number;
  user_id: string;
  created_at: string;
  status: string;
  total: number;
  shipping_method: string;
  shipping_address: ShippingAddress;
  payment_intent_id?: string;
  tracking_number?: string;
  items?: OrderItem[];
}

// Add a type alias for OrderDetails pointing to Order
export type OrderDetails = Order;
