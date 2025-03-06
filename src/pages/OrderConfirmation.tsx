
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Check, Package, ShoppingBag, Truck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  // Generate random order number if not provided
  const orderNumber = orderId || Math.floor(Math.random() * 10000);
  
  // Estimate delivery dates
  const now = new Date();
  const estimatedDeliveryStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const estimatedDeliveryEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  
  // Redirect to home if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-full bg-green-100 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Order Successfully Placed!</h1>
          
          <p className="text-gray-600 mb-8">
            Thank you for your order. We'll send you a confirmation email with your order details.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 text-left mb-8">
            <h2 className="text-lg font-medium mb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number</span>
                <span className="font-medium">#{orderNumber}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span>{now.toLocaleDateString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className="text-green-600 font-medium">Paid</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium mb-2">Estimated Delivery</h3>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-green-600" />
                <span>
                  {estimatedDeliveryStart.toLocaleDateString()} - {estimatedDeliveryEnd.toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                You will receive shipping updates via email.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <Button asChild size="lg">
              <Link to="/account">View Order History</Link>
            </Button>
            
            <div>
              <Button variant="outline" asChild>
                <Link to="/products">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
