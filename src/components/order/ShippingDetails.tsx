
import React from 'react';
import { OrderDetails } from '@/types/supabase-custom';

interface ShippingDetailsProps {
  shippingAddress: OrderDetails['shipping_address'];
}

export const ShippingDetails = ({ shippingAddress }: ShippingDetailsProps) => {
  if (!shippingAddress) return null;

  return (
    <div className="pt-4 border-t border-gray-200">
      <h3 className="font-medium mb-2">Shipping Address</h3>
      {shippingAddress.type === 'packeta' ? (
        <>
          <div className="text-sm">
            <p className="font-medium">{shippingAddress.pickupPoint?.name}</p>
            <p>{shippingAddress.pickupPoint?.address}</p>
            <p>{shippingAddress.pickupPoint?.zip} {shippingAddress.pickupPoint?.city}</p>
          </div>
          <p className="text-sm mt-2">
            <span className="font-medium">Recipient:</span> {shippingAddress.fullName}
          </p>
          {shippingAddress.phone && (
            <p className="text-sm">
              <span className="font-medium">Phone:</span> {shippingAddress.phone}
            </p>
          )}
        </>
      ) : (
        <div className="text-sm">
          <p>{shippingAddress.fullName}</p>
          <p>{shippingAddress.addressLine1}</p>
          {shippingAddress.addressLine2 && (
            <p>{shippingAddress.addressLine2}</p>
          )}
          <p>
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
          </p>
          <p>{shippingAddress.country}</p>
          {shippingAddress.phone && (
            <p className="mt-1">
              <span className="font-medium">Phone:</span> {shippingAddress.phone}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
