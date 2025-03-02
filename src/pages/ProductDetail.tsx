
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChevronLeft, Plus, Minus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Using a type that's compatible with our database schema
interface Product {
  id: number;
  name: string;
  description: string;
  long_description?: string;
  price: number;
  image: string;
  category: string;
  features?: string[];
  specifications?: Record<string, any>;
  stock: number;
}

const fetchProductById = async (id: string): Promise<Product> => {
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isLoading: isCartLoading } = useCart();
  
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id!),
    enabled: !!id,
  });

  const handleQuantityChange = (amount: number) => {
    const newQuantity = quantity + amount;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 10)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      await addToCart(product.id, quantity);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <div className="text-center py-12">
            <h2 className="text-2xl font-medium mb-4">Product not found</h2>
            <p className="text-gray-500 mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/products')}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate('/products')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-auto object-cover"
            />
          </div>
          
          {/* Product Details */}
          <div>
            <div className="mb-6">
              <Badge className="mb-3">{product.category}</Badge>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-2xl font-semibold text-gray-900">
                ${product.price.toFixed(2)}
              </p>
            </div>
            
            <p className="text-gray-600 mb-6">{product.description}</p>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center border rounded-md">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || isCartLoading}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (product.stock || 10) || isCartLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                className="flex-1" 
                onClick={handleAddToCart}
                disabled={isCartLoading}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {isCartLoading ? 'Adding...' : 'Add to Cart'}
              </Button>
            </div>
            
            <div className="border rounded-md p-3 bg-gray-50 mb-6">
              <p className="text-sm">
                <span className="font-medium">Availability: </span>
                {product.stock > 0 ? (
                  <span className="text-green-600">In Stock ({product.stock} available)</span>
                ) : (
                  <span className="text-red-600">Out of Stock</span>
                )}
              </p>
            </div>
            
            <Separator className="my-6" />
            
            <Tabs defaultValue="description">
              <TabsList className="mb-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="text-gray-600">
                {product.long_description || product.description}
              </TabsContent>
              
              <TabsContent value="specifications">
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 py-2 border-b">
                        <span className="font-medium text-gray-700">{key}</span>
                        <span className="col-span-2 text-gray-600">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No specifications available.</p>
                )}
              </TabsContent>
              
              <TabsContent value="features">
                {product.features && product.features.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No features listed.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
