
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Filter, X } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';

// Sample product data
const productData = [
  {
    id: 1,
    name: "Modern Minimalist Sofa",
    description: "A sleek, comfortable sofa with clean lines and premium upholstery. Perfect for contemporary living spaces.",
    price: 899.99,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    category: "Furniture"
  },
  {
    id: 2,
    name: "Elegant Table Lamp",
    description: "Stylish table lamp with adjustable brightness. Creates a warm, inviting atmosphere in any room.",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    category: "Lighting"
  },
  {
    id: 3,
    name: "Artisan Ceramic Vase",
    description: "Handcrafted ceramic vase with unique glazing. Each piece has subtle variations making it one-of-a-kind.",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1612295592824-d9d02eea7828?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    category: "Decor"
  },
  {
    id: 4,
    name: "Scandinavian Dining Chair",
    description: "Beautifully crafted wooden dining chair with ergonomic design. Combines style and comfort.",
    price: 249.99,
    image: "https://images.unsplash.com/photo-1503602642458-232111445657?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    category: "Furniture"
  },
  {
    id: 5,
    name: "Pendant Ceiling Light",
    description: "Modern pendant light with adjustable height. Creates focused lighting for dining tables or kitchen islands.",
    price: 189.99,
    image: "https://images.unsplash.com/photo-1530603907829-662ab52230b4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1773&q=80",
    category: "Lighting"
  },
  {
    id: 6,
    name: "Abstract Wall Art",
    description: "Contemporary abstract canvas print. Adds a splash of color and artistic flair to any room.",
    price: 159.99,
    image: "https://images.unsplash.com/photo-1549887534-1541e9326642?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1765&q=80",
    category: "Decor"
  }
];

const categories = ["All", "Furniture", "Lighting", "Decor"];

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Filter products based on selected category
  const filteredProducts = selectedCategory === "All" 
    ? productData 
    : productData.filter(product => product.category === selectedCategory);

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
                          ? productData.length 
                          : productData.filter(p => p.category === selectedCategory).length})
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
