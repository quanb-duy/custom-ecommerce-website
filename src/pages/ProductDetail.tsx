
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Check, 
  Truck, 
  RefreshCw, 
  ShieldCheck,
  ChevronLeft 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

// Fetch a single product from Supabase
const fetchProduct = async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

const ProductDetail = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch product using React Query
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id || '0'),
    enabled: !!id
  });
  
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
  
  if (error || !product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24 text-center">
          <h1 className="text-3xl font-bold mb-6">Product Not Found</h1>
          <p className="mb-8">Sorry, the product you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/products">Return to Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }
  
  // Parse specifications from JSON if needed
  const specifications = typeof product.specifications === 'string' 
    ? JSON.parse(product.specifications) 
    : product.specifications;
  
  // Prepare images array
  const images = product.images 
    ? (Array.isArray(product.images) ? product.images : [product.images]) 
    : [product.image];
  
  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to your cart",
        variant: "destructive",
      });
      return;
    }
    
    addToCart(product.id, quantity);
    
    toast({
      title: "Added to cart",
      description: `${quantity} × ${product.name} added to your cart`,
      action: (
        <Link to="/cart">
          <Button variant="outline" size="sm">
            View Cart
          </Button>
        </Link>
      ),
    });
  };
  
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const increaseQuantity = () => {
    if (quantity < (product.stock || 10)) {
      setQuantity(quantity + 1);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link to="/products" className="text-gray-500 hover:text-gray-800 flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Products
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Product images */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
              <motion.img 
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={images[selectedImage] || product.image} 
                alt={product.name}
                className="w-full h-full object-cover" 
              />
            </div>
            
            {/* Thumbnail gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, idx) => (
                  <button 
                    key={idx}
                    className={`aspect-square rounded-md overflow-hidden border-2 ${
                      selectedImage === idx 
                        ? 'border-black' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img 
                      src={image} 
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover" 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Product details */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="text-2xl font-medium mb-4">${product.price?.toFixed(2)}</div>
            
            <p className="text-gray-600 mb-6">{product.description}</p>
            
            {/* Stock status */}
            <div className="flex items-center mb-6">
              <div className={`h-3 w-3 rounded-full mr-2 ${
                (product.stock || 0) > 10 ? 'bg-green-500' : 
                (product.stock || 0) > 5 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm">
                {(product.stock || 0) > 10 ? 'In Stock' : 
                 (product.stock || 0) > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
              </span>
            </div>
            
            {/* Quantity selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="flex items-center">
                <button 
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  className="border border-gray-300 rounded-l-md p-2 hover:bg-gray-100 disabled:opacity-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input 
                  type="number" 
                  min="1" 
                  max={product.stock || 10}
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), product.stock || 10))}
                  className="border-y border-gray-300 p-2 w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button 
                  onClick={increaseQuantity}
                  disabled={quantity >= (product.stock || 10)}
                  className="border border-gray-300 rounded-r-md p-2 hover:bg-gray-100 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Add to cart button */}
            <Button 
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 mb-6"
              disabled={(product.stock || 0) <= 0}
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </Button>
            
            {/* Benefits */}
            <div className="border-t border-b py-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-gray-600" />
                  <span className="text-sm">Free Shipping</span>
                </div>
                <div className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2 text-gray-600" />
                  <span className="text-sm">30-Day Returns</span>
                </div>
                <div className="flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2 text-gray-600" />
                  <span className="text-sm">2-Year Warranty</span>
                </div>
              </div>
            </div>
            
            {/* Product description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-600 leading-relaxed">{product.long_description || product.description}</p>
            </div>
            
            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Features</h2>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Specifications */}
            {specifications && Object.keys(specifications).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Specifications</h2>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  {Object.entries(specifications).map(([key, value], index, array) => (
                    <div 
                      key={key}
                      className={`flex ${
                        index !== array.length - 1 ? 'border-b border-gray-200' : ''
                      }`}
                    >
                      <div className="w-1/3 bg-gray-100 p-3 font-medium">{key}</div>
                      <div className="w-2/3 p-3">{value as string}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
