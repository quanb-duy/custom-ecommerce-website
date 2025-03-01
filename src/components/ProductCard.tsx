
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

interface ProductCardProps {
  product: Product;
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  return (
    <motion.div 
      variants={item}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Category tag */}
      <div className="absolute top-4 left-4 z-10">
        <span className="inline-block bg-white/80 backdrop-blur-sm px-3 py-1 text-xs font-medium rounded-full">
          {product.category}
        </span>
      </div>
      
      {/* Wishlist button */}
      <button 
        className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        aria-label="Add to wishlist"
      >
        <Heart className="h-4 w-4" />
      </button>
      
      {/* Image container */}
      <Link to={`/products/${product.id}`} className="block relative aspect-square overflow-hidden rounded-xl mb-4 bg-gray-100">
        <div className={`absolute inset-0 flex items-center justify-center ${!isImageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
          <div className="w-8 h-8 border-2 border-black/10 border-t-black/40 rounded-full animate-spin"></div>
        </div>
        <img 
          src={product.image} 
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${isHovered ? 'scale-105' : 'scale-100'} ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsImageLoaded(true)}
        />
        
        {/* Quick add overlay */}
        <div className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
          <Button variant="secondary" size="sm" className="w-full gap-2 hover:bg-white">
            <ShoppingCart className="h-4 w-4" />
            Quick Add
          </Button>
        </div>
      </Link>
      
      {/* Product info */}
      <div className="space-y-2">
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="font-medium text-lg tracking-tight hover:underline">
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-600 text-sm line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <p className="font-medium">
            ${product.price.toFixed(2)}
          </p>
          <div className="text-xs text-gray-500">Free shipping</div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
