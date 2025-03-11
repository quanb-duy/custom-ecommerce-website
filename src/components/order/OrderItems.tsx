
import React from 'react';
import { OrderItem } from '@/types/supabase-custom';

interface OrderItemsProps {
  items: OrderItem[];
}

export const OrderItems = ({ items }: OrderItemsProps) => {
  if (!items || items.length === 0) {
    return (
      <div className="py-3 text-sm text-gray-500">
        No items found in this order.
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);

  return (
    <div className="pt-4 mt-4 border-t border-gray-200">
      <h3 className="font-medium mb-2">Order Items</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <div className="flex-1">
              <span className="font-medium">{item.product_name}</span>
              <span className="text-gray-500 ml-2">× {item.quantity}</span>
            </div>
            <span className="font-medium">${(item.product_price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="pt-3 border-t border-gray-200 flex justify-between font-medium">
          <span>Total Items: {items.reduce((sum, item) => sum + item.quantity, 0)}</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
