
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    description: string;
    category: string;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  isLoading: boolean;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Calculate derived values
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  // Fetch cart items whenever user changes
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
        .select(`
          id,
          product_id,
          quantity,
          product:products(id, name, price, image, description, category)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error: any) {
      console.error('Error fetching cart items:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: number, quantity: number) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to your cart.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Check if the item is already in the cart
      const existingItem = cartItems.find(item => item.product_id === productId);
      
      if (existingItem) {
        // Update quantity if item exists
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
          });

        if (error) throw error;
        
        toast({
          title: "Added to cart",
          description: `Item added to your cart`,
        });
        
        // Refresh cart items
        await fetchCartItems();
      }
    } catch (error: any) {
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
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Item removed",
        description: "Item removed from your cart",
      });
      
      // Update local state
      setCartItems(cartItems.filter(item => item.id !== cartItemId));
    } catch (error: any) {
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
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      if (quantity <= 0) {
        await removeFromCart(cartItemId);
        return;
      }
      
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Update local state
      setCartItems(cartItems.map(item => 
        item.id === cartItemId ? { ...item, quantity } : item
      ));
    } catch (error: any) {
      toast({
        title: "Failed to update quantity",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCartItems([]);
      
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    } catch (error: any) {
      toast({
        title: "Failed to clear cart",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    cartItems,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
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
