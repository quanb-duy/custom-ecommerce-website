
import React from 'react';
import { OrderItem } from '@/types/supabase-custom';

interface OrderItemsProps {
  items: OrderItem[];
}

export const OrderItems = ({ items }: OrderItemsProps) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="pt-4 mt-4 border-t border-gray-200">
      <h3 className="font-medium mb-2">Order Items</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>
              {item.product_name} <span className="text-gray-500">× {item.quantity}</span>
            </span>
            <span className="font-medium">${(item.product_price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
