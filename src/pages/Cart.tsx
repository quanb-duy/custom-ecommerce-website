import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Trash2, Minus, Plus, AlertCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Cart = () => {
  const { cartItems, isLoading, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();
  const { user } = useAuth();
  const [editingQuantity, setEditingQuantity] = useState<{[key: number]: boolean}>({});
  const [tempQuantity, setTempQuantity] = useState<{[key: number]: string}>({});
  const { toast } = useToast();
  const [imgErrors, setImgErrors] = useState<{[key: number]: boolean}>({});
  
  const startEditingQuantity = (itemId: number, currentQuantity: number) => {
    setEditingQuantity({...editingQuantity, [itemId]: true});
    setTempQuantity({...tempQuantity, [itemId]: currentQuantity.toString()});
  };
  
  const handleQuantityInputChange = (itemId: number, value: string) => {
    // Only allow numeric input
    if (/^\d*$/.test(value)) {
      setTempQuantity({...tempQuantity, [itemId]: value});
    }
  };
  
  const handleQuantityInputBlur = (itemId: number, maxStock: number) => {
    const newQuantity = parseInt(tempQuantity[itemId]) || 1;
    const validQuantity = Math.min(Math.max(1, newQuantity), maxStock);
    
    updateQuantity(itemId, validQuantity);
    setEditingQuantity({...editingQuantity, [itemId]: false});
  };
  
  const handleQuantityInputKeyDown = (e: React.KeyboardEvent, itemId: number, maxStock: number) => {
    if (e.key === 'Enter') {
      const newQuantity = parseInt(tempQuantity[itemId]) || 1;
      const validQuantity = Math.min(Math.max(1, newQuantity), maxStock);
      
      updateQuantity(itemId, validQuantity);
      setEditingQuantity({...editingQuantity, [itemId]: false});
    }
  };
  
  const handleImageError = (itemId: number) => {
    setImgErrors({...imgErrors, [itemId]: true});
    toast({
      title: "Image failed to load",
      description: "We couldn't load one of your product images. We're showing a placeholder instead.",
      variant: "destructive"
    });
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <div className="flex justify-center mb-4">
              <ShoppingBag className="h-16 w-16 text-gray-300" />
            </div>
            <h2 className="text-2xl font-medium mb-4">Please sign in to view your cart</h2>
            <p className="text-gray-600 mb-8">
              You need to be signed in to add items to your cart and proceed to checkout.
            </p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
          
          <div className="text-center py-16 bg-gray-50 rounded-lg">
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
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-3xl font-bold mb-8">Your Cart ({totalItems} items)</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="divide-y">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <Link to={`/products/${item.product_id}`}>
                        <img 
                          src={imgErrors[item.id] ? '/placeholder.svg' : item.product.image} 
                          alt={item.product.name} 
                          className="w-20 h-20 object-cover rounded-md"
                          onError={() => handleImageError(item.id)}
                        />
                      </Link>
                    </div>
                    
                    <div className="flex-grow">
                      <Link to={`/products/${item.product_id}`}>
                        <h3 className="font-medium text-lg hover:underline">{item.product.name}</h3>
                      </Link>
                      <p className="text-gray-500 text-sm mb-2">{item.product.category}</p>
                      
                      {item.product.stock <= 5 && (
                        <p className="text-amber-600 text-xs mb-2 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Only {item.product.stock} left in stock
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center mt-2">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          
                          {editingQuantity[item.id] ? (
                            <Input
                              value={tempQuantity[item.id]}
                              onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                              onBlur={() => handleQuantityInputBlur(item.id, item.product.stock)}
                              onKeyDown={(e) => handleQuantityInputKeyDown(e, item.id, item.product.stock)}
                              className="mx-1 w-14 text-center h-8 px-2"
                              autoFocus
                            />
                          ) : (
                            <span 
                              className="mx-2 w-8 text-center cursor-pointer hover:underline"
                              onClick={() => startEditingQuantity(item.id, item.quantity)}
                            >
                              {item.quantity}
                            </span>
                          )}
                          
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                            disabled={item.quantity >= item.product.stock}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-4">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-500"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-medium mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>${(subtotal * 0.07).toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>${(subtotal + subtotal * 0.07).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <Button className="w-full mb-4" asChild>
                <Link to="/checkout">
                  Proceed to Checkout
                </Link>
              </Button>
              
              <p className="text-sm text-gray-500 text-center mb-4">
                Secure checkout powered by Stripe
              </p>
              
              <div className="flex justify-center space-x-2">
                <img src="https://cdn-icons-png.flaticon.com/128/6124/6124998.png" alt="Visa" className="h-6" />
                <img src="https://cdn-icons-png.flaticon.com/128/349/349228.png" alt="Mastercard" className="h-6" />
                <img src="https://cdn-icons-png.flaticon.com/128/196/196539.png" alt="PayPal" className="h-6" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-10 pt-10 border-t">
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
