
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, isLoading, cartItems } = useCart();
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);
  
  const isInCart = cartItems.some(item => item.product_id === product.id);
  const isOutOfStock = product.stock === 0;
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isOutOfStock) {
      toast({
        title: "Out of Stock",
        description: "This product is currently unavailable.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await addToCart(product.id, 1);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not add item to cart. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Link to={`/products/${product.id}`} className="group">
      <div className="overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md">
        <div className="relative pb-[100%]">
          <img
            src={imageError ? '/placeholder.svg' : product.image}
            alt={product.name}
            onError={handleImageError}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-black">
                Out of Stock
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <h3 className="text-lg font-medium line-clamp-1">{product.name}</h3>
            <Badge variant="outline" className="ml-2 shrink-0">
              {product.category}
            </Badge>
          </div>
          
          <p className="mb-4 text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">${product.price.toFixed(2)}</span>
            <Button
              size="sm"
              variant={isInCart ? "secondary" : "default"}
              className="ml-2"
              onClick={handleAddToCart}
              disabled={isLoading || isOutOfStock}
            >
              <ShoppingCart className="mr-1 h-4 w-4" />
              {isInCart ? "In Cart" : "Add"}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
