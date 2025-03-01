
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Sample product data
const allProducts = [
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
  },
  {
    id: 5,
    name: 'Wooden Coffee Table',
    description: 'Solid oak coffee table with minimalist design',
    price: 249.99,
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80',
    category: 'Furniture'
  },
  {
    id: 6,
    name: 'Pendant Light',
    description: 'Modern pendant light fixture',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    category: 'Lighting'
  },
  {
    id: 7,
    name: 'Wall Shelf',
    description: 'Floating wall shelf with metal brackets',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    category: 'Furniture'
  },
  {
    id: 8,
    name: 'Decorative Cushion',
    description: 'Premium linen cushion cover',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    category: 'Decor'
  }
];

// Available categories and price range
const categories = ['Furniture', 'Lighting', 'Decor'];
const priceRange = { min: 0, max: 500 };

const Products: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const category = searchParams.get('category');
    return category ? [category] : [];
  });
  const [priceFilter, setPriceFilter] = useState<[number, number]>([0, priceRange.max]);
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'default');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategories.length === 1) params.set('category', selectedCategories[0]);
    if (sortBy !== 'default') params.set('sort', sortBy);
    
    navigate({ search: params.toString() }, { replace: true });
  }, [searchQuery, selectedCategories, sortBy, navigate]);
  
  // Apply filters to products
  const filteredProducts = allProducts.filter(product => {
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
      return false;
    }
    
    // Price filter
    if (product.price < priceFilter[0] || product.price > priceFilter[1]) {
      return false;
    }
    
    // Search query
    if (
      searchQuery &&
      !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !product.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    
    return true;
  });
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });
  
  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setPriceFilter([0, priceRange.max]);
    setSortBy('default');
    navigate('/products', { replace: true });
  };
  
  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  return (
    <Layout>
      <div className="pt-24 pb-16"> {/* Add padding for the fixed navbar */}
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold mb-2">Our Products</h1>
            <p className="text-gray-600">
              Discover our collection of premium, thoughtfully designed products.
            </p>
          </div>
          
          {/* Search and filter bar */}
          <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
                onClick={() => setIsFilterVisible(!isFilterVisible)}
              >
                <Filter className="h-4 w-4" />
                Filters
                {(selectedCategories.length > 0 || priceFilter[0] > 0 || priceFilter[1] < priceRange.max) && (
                  <span className="w-2 h-2 rounded-full bg-black" />
                )}
              </Button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded-md px-3 py-1.5 bg-white text-sm"
              >
                <option value="default">Sort by: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>
          
          {/* Active filters */}
          {(selectedCategories.length > 0 || searchQuery || sortBy !== 'default' || 
            priceFilter[0] > 0 || priceFilter[1] < priceRange.max) && (
            <div className="mb-6 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-500">Active filters:</span>
              
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-7"
                  onClick={() => setSearchQuery('')}
                >
                  Search: {searchQuery}
                  <X className="h-3 w-3" />
                </Button>
              )}
              
              {selectedCategories.map(category => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-7"
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                  <X className="h-3 w-3" />
                </Button>
              ))}
              
              {(priceFilter[0] > 0 || priceFilter[1] < priceRange.max) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-7"
                  onClick={() => setPriceFilter([0, priceRange.max])}
                >
                  Price: ${priceFilter[0]} - ${priceFilter[1]}
                  <X className="h-3 w-3" />
                </Button>
              )}
              
              {sortBy !== 'default' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-7"
                  onClick={() => setSortBy('default')}
                >
                  {sortBy === 'price-asc' ? 'Price: Low to High' :
                   sortBy === 'price-desc' ? 'Price: High to Low' :
                   sortBy === 'name-asc' ? 'Name: A to Z' :
                   'Name: Z to A'}
                  <X className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={handleClearFilters}
              >
                Clear all
              </Button>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filter sidebar */}
            <AnimatePresence>
              {isFilterVisible && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="lg:col-span-1 space-y-6"
                >
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Filters</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="h-8 text-sm"
                      >
                        Clear all
                      </Button>
                    </div>
                    
                    {/* Categories */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Categories</h4>
                      <div className="space-y-2">
                        {categories.map(category => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category}`}
                              checked={selectedCategories.includes(category)}
                              onCheckedChange={() => toggleCategory(category)}
                            />
                            <label
                              htmlFor={`category-${category}`}
                              className="text-sm leading-none cursor-pointer"
                            >
                              {category}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Price range */}
                    <div>
                      <h4 className="font-medium mb-3">Price Range</h4>
                      <div className="px-2">
                        <Slider
                          defaultValue={[0, 500]}
                          min={0}
                          max={500}
                          step={10}
                          value={priceFilter}
                          onValueChange={(value) => setPriceFilter(value as [number, number])}
                          className="mb-6"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-sm">${priceFilter[0]}</span>
                          <span className="text-sm">${priceFilter[1]}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Product grid */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ${isFilterVisible ? 'lg:col-span-3' : 'lg:col-span-4 lg:grid-cols-4'}`}>
              {sortedProducts.length === 0 ? (
                <div className="col-span-full py-12 text-center">
                  <h3 className="text-lg font-medium mb-2">No products found</h3>
                  <p className="text-gray-500 mb-6">
                    Try adjusting your search or filter criteria.
                  </p>
                  <Button onClick={handleClearFilters}>
                    Clear all filters
                  </Button>
                </div>
              ) : (
                sortedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
