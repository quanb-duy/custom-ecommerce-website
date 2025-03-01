
import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

const Cart = () => {
  // This would normally come from a cart context/state
  const cartItems = [];
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <ShoppingBag className="h-16 w-16 text-gray-300" />
            </div>
            <h2 className="text-2xl font-medium mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Button asChild>
              <Link to="/products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div>
            {/* Cart items would be listed here */}
          </div>
        )}
        
        <div className="mt-8 pt-8 border-t">
          <Button asChild variant="outline" size="sm">
            <Link to="/products" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
