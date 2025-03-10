
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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

interface LocalCartItem {
  product_id: number;
  quantity: number;
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
  clearCart: () => Promise<void>;
  isLoading: boolean;
  cartTotal: number;
  subtotal: number;
  totalItems: number;
  syncLocalCartWithUser: () => Promise<void>;
}

const LOCAL_CART_KEY = 'ecommerce-local-cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [localCart, setLocalCart] = useState<LocalCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const cartTotal = cartItems.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);

  const subtotal = cartTotal;

  const totalItems = cartItems.reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  // Load local cart on initial render
  useEffect(() => {
    const loadLocalCart = () => {
      try {
        const localCartData = localStorage.getItem(LOCAL_CART_KEY);
        if (localCartData) {
          const parsedCart = JSON.parse(localCartData);
          setLocalCart(parsedCart);
        }
      } catch (error) {
        console.error('Error loading local cart:', error);
        // Reset local cart if there's an error
        localStorage.removeItem(LOCAL_CART_KEY);
      }
    };
    
    loadLocalCart();
  }, []);

  // Effect to handle cart based on user authentication status
  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      // If user logs out, convert DB cart items to local format
      const convertedLocalItems = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.product
      }));
      
      if (convertedLocalItems.length > 0) {
        setLocalCart(convertedLocalItems);
        localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(convertedLocalItems));
      }
      
      setCartItems([]);
    }
  }, [user]);

  // Save local cart when it changes
  useEffect(() => {
    if (!user && localCart.length > 0) {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(localCart));
    }
  }, [localCart, user]);

  // Convert local cart items to the CartItem format for consistent handling
  useEffect(() => {
    if (!user && localCart.length > 0) {
      const convertedItems: CartItem[] = localCart.map((item, index) => ({
        id: -1 - index, // Use negative IDs for local items
        product_id: item.product_id,
        quantity: item.quantity,
        user_id: 'local',
        product: item.product
      }));
      
      setCartItems(convertedItems);
    }
  }, [localCart, user]);

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

  const syncLocalCartWithUser = async () => {
    if (!user || localCart.length === 0) return;
    
    try {
      setIsLoading(true);
      
      // First, get existing cart items for user
      const { data: existingItems, error: fetchError } = await supabase
        .from('cart_items')
        .select('product_id, quantity')
        .eq('user_id', user.id);
      
      if (fetchError) throw fetchError;
      
      // Combine local cart with existing items
      const itemsToAdd = [];
      const itemsToUpdate = [];
      
      for (const localItem of localCart) {
        const existingItem = existingItems?.find(item => item.product_id === localItem.product_id);
        
        if (!existingItem) {
          // Add new item
          itemsToAdd.push({
            user_id: user.id,
            product_id: localItem.product_id,
            quantity: localItem.quantity
          });
        } else {
          // Update existing item with merged quantity
          const mergedQuantity = existingItem.quantity + localItem.quantity;
          const productStock = localItem.product.stock;
          const finalQuantity = Math.min(mergedQuantity, productStock);
          
          if (finalQuantity > existingItem.quantity) {
            itemsToUpdate.push({
              product_id: localItem.product_id,
              quantity: finalQuantity
            });
          }
        }
      }
      
      // Insert new items
      if (itemsToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert(itemsToAdd);
        
        if (insertError) throw insertError;
      }
      
      // Update existing items
      for (const item of itemsToUpdate) {
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: item.quantity })
          .eq('user_id', user.id)
          .eq('product_id', item.product_id);
        
        if (updateError) throw updateError;
      }
      
      // Clear local cart
      setLocalCart([]);
      localStorage.removeItem(LOCAL_CART_KEY);
      
      // Fetch updated cart
      await fetchCartItems();
      
      toast({
        title: "Cart synchronized",
        description: "Your cart has been updated with your previous selections.",
      });
    } catch (error: any) {
      console.error('Error synchronizing cart:', error.message);
      toast({
        title: "Failed to sync cart",
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

  const getProductDetails = async (productId: number): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw error;
    }
  };

  const addToCart = async (productId: number, quantity: number = 1) => {
    try {
      setIsLoading(true);
      
      const currentStock = await getProductStock(productId);
      if (quantity > currentStock) {
        toast({
          title: "Stock limit reached",
          description: `Sorry, only ${currentStock} items available in stock`,
          variant: "destructive",
        });
        return;
      }
      
      if (user) {
        // Handle logged-in user - add to database
        const existingItem = cartItems.find(item => item.product_id === productId);
        
        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          
          if (newQuantity > currentStock) {
            toast({
              title: "Stock limit reached",
              description: `Sorry, only ${currentStock} items available in stock`,
              variant: "destructive",
            });
            return;
          }
          
          await updateQuantity(existingItem.id, newQuantity);
        } else {
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
          
          await fetchCartItems();
        }
      } else {
        // Handle guest user - add to local storage
        const productDetails = await getProductDetails(productId);
        
        const existingItemIndex = localCart.findIndex(item => item.product_id === productId);
        
        if (existingItemIndex >= 0) {
          // Update existing item
          const updatedLocalCart = [...localCart];
          const newQuantity = updatedLocalCart[existingItemIndex].quantity + quantity;
          
          if (newQuantity > currentStock) {
            toast({
              title: "Stock limit reached",
              description: `Sorry, only ${currentStock} items available in stock`,
              variant: "destructive",
            });
            return;
          }
          
          updatedLocalCart[existingItemIndex] = {
            ...updatedLocalCart[existingItemIndex],
            quantity: newQuantity
          };
          
          setLocalCart(updatedLocalCart);
        } else {
          // Add new item
          setLocalCart([
            ...localCart, 
            {
              product_id: productId,
              quantity,
              product: productDetails
            }
          ]);
        }
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
      
      if (user) {
        // Remove from database for logged-in users
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', cartItemId);
        
        if (error) throw error;
        
        setCartItems(cartItems.filter(item => item.id !== cartItemId));
      } else {
        // For local cart items (negative IDs)
        if (cartItemId < 0) {
          const localIndex = Math.abs(cartItemId) - 1;
          if (localIndex >= 0 && localIndex < localCart.length) {
            const updatedLocalCart = [...localCart];
            updatedLocalCart.splice(localIndex, 1);
            setLocalCart(updatedLocalCart);
          }
        }
      }
      
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
        await removeFromCart(cartItemId);
        return;
      }
      
      const itemToUpdate = cartItems.find(item => item.id === cartItemId);
      if (!itemToUpdate) {
        throw new Error('Cart item not found');
      }
      
      const currentStock = await getProductStock(itemToUpdate.product_id);
      
      if (quantity > currentStock) {
        toast({
          title: "Stock limit reached",
          description: `Sorry, only ${currentStock} items available in stock`,
          variant: "destructive",
        });
        quantity = currentStock;
      }
      
      if (user) {
        // Update in database for logged-in users
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', cartItemId);
        
        if (error) throw error;
      } else {
        // For local cart items (negative IDs)
        if (cartItemId < 0) {
          const localIndex = Math.abs(cartItemId) - 1;
          if (localIndex >= 0 && localIndex < localCart.length) {
            const updatedLocalCart = [...localCart];
            updatedLocalCart[localIndex] = {
              ...updatedLocalCart[localIndex],
              quantity
            };
            setLocalCart(updatedLocalCart);
          }
        }
      }
      
      setCartItems(cartItems.map(item => 
        item.id === cartItemId ? { ...item, quantity } : item
      ));
      
      if (quantity === currentStock) {
        toast({
          title: "Maximum stock reached",
          description: `Quantity updated to maximum available (${currentStock})`,
          variant: "destructive",
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

  const clearCart = async () => {
    try {
      setIsLoading(true);
      
      if (user) {
        // Clear database cart for logged-in users
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
        
        if (error) throw error;
      }
      
      // Always clear local state
      setCartItems([]);
      setLocalCart([]);
      localStorage.removeItem(LOCAL_CART_KEY);
      
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    } catch (error: any) {
      console.error('Error clearing cart:', error.message);
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
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isLoading,
    cartTotal,
    subtotal,
    totalItems,
    syncLocalCartWithUser
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
