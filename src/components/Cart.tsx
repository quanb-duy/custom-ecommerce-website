
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet';
import { ShoppingCart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface CartProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const cartItems = [
  {
    id: 1,
    name: 'Ergonomic Chair',
    price: 299.99,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
  },
  {
    id: 2,
    name: 'Modern Desk Lamp',
    price: 89.99,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
  }
];

const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState(cartItems);
  
  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };
  
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 0 : 0; // Free shipping in this example
  const total = subtotal + shipping;
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {items.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-xl font-medium">Shopping Cart ({items.length})</SheetTitle>
        </SheetHeader>
        
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-grow py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Button asChild>
              <a href="/products">Continue Shopping</a>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-grow overflow-auto py-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-4 py-4 border-b"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{item.name}</h4>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-gray-600"
                          aria-label="Remove item"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="text-gray-600 mt-1">${item.price.toFixed(2)}</div>
                      
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center border rounded-md">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 hover:bg-gray-100"
                            aria-label="Decrease quantity"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="px-2 py-1 min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 hover:bg-gray-100"
                            aria-label="Increase quantity"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{shipping > 0 ? `$${shipping.toFixed(2)}` : 'Free'}</span>
                </div>
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              
              <SheetFooter className="flex flex-col gap-2">
                <Button asChild size="lg">
                  <a href="/checkout">Proceed to Checkout</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="/products">Continue Shopping</a>
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default Cart;
