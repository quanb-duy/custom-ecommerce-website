
import React from 'react';
import { OrderDetails } from '@/types/supabase-custom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Truck } from 'lucide-react';

interface OrderSummaryProps {
  orderDetails: OrderDetails;
  isTrackingLoading: boolean;
  onRequestTracking: () => void;
}

export const OrderSummary = ({ 
  orderDetails, 
  isTrackingLoading, 
  onRequestTracking 
}: OrderSummaryProps) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Order Summary</h2>
      
      <div className="space-y-4 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Order Number</span>
          <span className="font-medium">#{orderDetails.id}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Date</span>
          <span>{new Date(orderDetails.created_at).toLocaleDateString()}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Payment Status</span>
          <span className={`font-medium ${orderDetails.status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
            {orderDetails.status === 'paid' ? 'Paid' : 
             orderDetails.status === 'processing' ? 'Processing' : 'Pending'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Payment Method</span>
          <span>{orderDetails.payment_intent_id ? 'Card' : 'Cash on Delivery'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping Method</span>
          <span className="capitalize">{orderDetails.shipping_method}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Total</span>
          <span className="font-medium">${orderDetails.total.toFixed(2)}</span>
        </div>
        
        {orderDetails.tracking_number && (
          <div className="flex justify-between">
            <span className="text-gray-600">Tracking Number</span>
            <span className="font-medium">{orderDetails.tracking_number}</span>
          </div>
        )}
      </div>
      
      {!orderDetails.tracking_number && orderDetails.status !== 'pending' && (
        <Button 
          onClick={onRequestTracking}
          disabled={isTrackingLoading}
          className="w-full"
        >
          {isTrackingLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center">
              <Truck className="mr-2 h-4 w-4" />
              Get Tracking Information
            </span>
          )}
        </Button>
      )}
    </div>
  );
};
