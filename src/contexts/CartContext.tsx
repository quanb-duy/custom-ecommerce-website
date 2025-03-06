
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Use interface that works with the existing types
export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  user_id: string;
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    description: string;
    category: string;
    stock: number;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  removeFromCart: (cartItemId: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  isLoading: boolean;
  cartTotal: number;
  subtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);

  // Calculate subtotal (same as cartTotal for now, but could be different if we add discounts)
  const subtotal = cartTotal;

  // Calculate total items
  const totalItems = cartItems.reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  // Fetch cart items when user changes
  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setCartItems([]);
    }
  }, [user]);

  const fetchCartItems = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setCartItems(data || []);
    } catch (error: any) {
      console.error('Error fetching cart items:', error.message);
      toast({
        title: "Failed to load cart",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProductStock = async (productId: number): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      
      return data.stock || 0;
    } catch (error) {
      console.error('Error fetching product stock:', error);
      return 0;
    }
  };

  const addToCart = async (productId: number, quantity: number = 1) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add items to your cart",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get current stock level
      const currentStock = await getProductStock(productId);
      
      // Check if item already exists in cart
      const existingItem = cartItems.find(item => item.product_id === productId);
      
      if (existingItem) {
        // Calculate new quantity
        const newQuantity = existingItem.quantity + quantity;
        
        // Check if new quantity exceeds available stock
        if (newQuantity > currentStock) {
          toast({
            title: "Stock limit reached",
            description: `Sorry, only ${currentStock} items available in stock`,
            variant: "destructive",
          });
          return;
        }
        
        // Update quantity of existing item
        await updateQuantity(existingItem.id, newQuantity);
      } else {
        // Check if requested quantity exceeds available stock
        if (quantity > currentStock) {
          toast({
            title: "Stock limit reached",
            description: `Sorry, only ${currentStock} items available in stock`,
            variant: "destructive",
          });
          return;
        }
        
        // Add new item to cart
        const { error } = await supabase
          .from('cart_items')
          .insert([
            { 
              user_id: user.id, 
              product_id: productId, 
              quantity 
            }
          ]);
        
        if (error) throw error;
        
        await fetchCartItems(); // Refresh cart after adding item
      }
      
      toast({
        title: "Item added to cart",
        description: `${quantity} item(s) added to your cart`,
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error.message);
      toast({
        title: "Failed to add item",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (cartItemId: number) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);
      
      if (error) throw error;
      
      // Update local state
      setCartItems(cartItems.filter(item => item.id !== cartItemId));
      
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    } catch (error: any) {
      console.error('Error removing from cart:', error.message);
      toast({
        title: "Failed to remove item",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: number, quantity: number) => {
    try {
      setIsLoading(true);
      
      if (quantity <= 0) {
        // If quantity is zero or negative, remove the item
        await removeFromCart(cartItemId);
        return;
      }
      
      // Find the item to be updated
      const itemToUpdate = cartItems.find(item => item.id === cartItemId);
      if (!itemToUpdate) {
        throw new Error('Cart item not found');
      }
      
      // Check current stock level
      const currentStock = await getProductStock(itemToUpdate.product_id);
      
      // Validate against stock level
      if (quantity > currentStock) {
        toast({
          title: "Stock limit reached",
          description: `Sorry, only ${currentStock} items available in stock`,
          variant: "destructive",
        });
        // Set to maximum available stock instead of failing
        quantity = currentStock;
      }
      
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);
      
      if (error) throw error;
      
      // Update local state
      setCartItems(cartItems.map(item => 
        item.id === cartItemId ? { ...item, quantity } : item
      ));
      
      if (quantity === currentStock) {
        toast({
          title: "Maximum stock reached",
          description: `Quantity updated to maximum available (${currentStock})`,
          variant: "warning",
        });
      }
    } catch (error: any) {
      console.error('Error updating quantity:', error.message);
      toast({
        title: "Failed to update quantity",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    isLoading,
    cartTotal,
    subtotal,
    totalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
