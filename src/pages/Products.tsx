
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Filter, X } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Fetch products from Supabase
const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*');
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data || [];
};

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Fetch products using React Query
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });
  
  // Extract unique categories
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = ['All', ...new Set(products.map(product => product.category))];
      setCategories(uniqueCategories);
    }
  }, [products]);
  
  // Filter products based on selected category
  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <div className="text-center py-12">
            <h2 className="text-2xl font-medium mb-4">Error loading products</h2>
            <p className="text-gray-500">{(error as Error).message}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Products</h1>
          
          {/* Mobile filter toggle */}
          <Button 
            variant="outline" 
            size="sm" 
            className="md:hidden flex items-center gap-2"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          >
            {isMobileFilterOpen ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            {isMobileFilterOpen ? "Close" : "Filter"}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Category filter sidebar - desktop */}
          <div className="hidden md:block">
            <div className="sticky top-24">
              <h2 className="text-lg font-medium mb-4">Categories</h2>
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedCategory === category
                        ? "bg-gray-100 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                    {selectedCategory === category && (
                      <span className="float-right text-gray-400">
                        ({selectedCategory === "All" 
                          ? products.length 
                          : products.filter(p => p.category === selectedCategory).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Mobile filter dropdown */}
          {isMobileFilterOpen && (
            <div className="md:hidden mb-6 bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium mb-3">Categories</h2>
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedCategory === category
                        ? "bg-gray-200 font-medium"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsMobileFilterOpen(false);
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Product grid */}
          <div className="md:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
