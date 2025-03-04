
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Define product type
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

// Fetch featured products from Supabase
const fetchFeaturedProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(4);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data || [];
};

// Fallback products if database is not available
const fallbackProducts = [
  {
    id: 1,
    name: 'Ergonomic Chair',
    description: 'Premium office chair with adjustable features',
    price: 299.99,
    image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    category: 'Furniture'
  },
  {
    id: 2,
    name: 'Modern Desk Lamp',
    description: 'Sleek desk lamp with adjustable brightness',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    category: 'Lighting'
  },
  {
    id: 3,
    name: 'Minimalist Clock',
    description: 'Simple and elegant wall clock',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    category: 'Decor'
  },
  {
    id: 4,
    name: 'Ceramic Vase',
    description: 'Handcrafted ceramic vase',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1612196808214-b7e7e3986c0c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    category: 'Decor'
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const FeaturedProducts: React.FC = () => {
  // Fetch featured products
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: fetchFeaturedProducts,
    // Use fallback data if error occurs
    onError: (err) => {
      console.error('Error fetching featured products:', err);
    }
  });

  // Use fetched products or fallback to sample data if there's an error or no data
  const displayProducts = products.length > 0 ? products : fallbackProducts;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
          <div>
            <span className="inline-block text-sm font-medium bg-black/5 px-3 py-1 rounded-full mb-4">
              Featured Collection
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Crafted with excellence
            </h2>
            <p className="mt-3 text-gray-600 max-w-md">
              Discover our selection of premium products designed to elevate your space.
            </p>
          </div>
          
          <Link 
            to="/products" 
            className="group mt-6 md:mt-0 inline-flex items-center text-sm font-medium"
          >
            View all products
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
