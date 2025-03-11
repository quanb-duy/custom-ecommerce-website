
import React from 'react';
import { ShippingAddress } from '@/types/supabase-custom';

interface ShippingDetailsProps {
  shippingAddress: ShippingAddress;
}

export const ShippingDetails = ({ shippingAddress }: ShippingDetailsProps) => {
  if (!shippingAddress) return null;

  return (
    <div className="pt-4 border-t border-gray-200">
      <h3 className="font-medium mb-2">Shipping Address</h3>
      {shippingAddress.type === 'packeta' ? (
        <>
          <div className="text-sm">
            {shippingAddress.pickupPoint && (
              <>
                <p className="font-medium">{shippingAddress.pickupPoint.name}</p>
                <p>{shippingAddress.pickupPoint.address}</p>
                <p>{shippingAddress.pickupPoint.zip} {shippingAddress.pickupPoint.city}</p>
              </>
            )}
          </div>
          <p className="text-sm mt-2">
            <span className="font-medium">Recipient:</span> {shippingAddress.fullName || 'N/A'}
          </p>
          {shippingAddress.phone && (
            <p className="text-sm">
              <span className="font-medium">Phone:</span> {shippingAddress.phone}
            </p>
          )}
        </>
      ) : (
        <div className="text-sm">
          <p>{shippingAddress.fullName || 'N/A'}</p>
          <p>{shippingAddress.addressLine1 || 'N/A'}</p>
          {shippingAddress.addressLine2 && (
            <p>{shippingAddress.addressLine2}</p>
          )}
          <p>
            {shippingAddress.city || 'N/A'}, {shippingAddress.state || 'N/A'} {shippingAddress.zipCode || 'N/A'}
          </p>
          <p>{shippingAddress.country || 'N/A'}</p>
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
