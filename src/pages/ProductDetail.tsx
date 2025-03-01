
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
import { toast } from '@/components/ui/use-toast';

// Sample product data (would typically come from an API)
const productData = [
  {
    id: 1,
    name: "Modern Minimalist Sofa",
    description: "A sleek, comfortable sofa with clean lines and premium upholstery. Perfect for contemporary living spaces.",
    longDescription: "This Modern Minimalist Sofa combines style and comfort in a sleek, contemporary package. Featuring premium upholstery, this sofa is designed to complement modern living spaces while providing exceptional comfort. The clean lines and minimalist aesthetics make it a versatile piece that fits seamlessly into various interior design styles. The sturdy wooden frame ensures durability, while the high-density foam cushions provide superior comfort and longevity. This sofa is not just a piece of furniture; it's an investment in your home's aesthetic and your comfort.",
    price: 899.99,
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
      "https://images.unsplash.com/photo-1506898667547-42e22a46e125?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1772&q=80"
    ],
    category: "Furniture",
    features: [
      "Sturdy wooden frame",
      "Premium fabric upholstery",
      "High-density foam cushions",
      "Non-marking wooden legs",
      "Easy assembly required"
    ],
    specifications: {
      "Dimensions": "82\"W x 36\"D x 34\"H",
      "Weight": "95 lbs",
      "Material": "Wood, Foam, Polyester",
      "Colors": "Gray, Beige, Navy",
      "Warranty": "3-year limited warranty"
    },
    stock: 12
  },
  {
    id: 2,
    name: "Elegant Table Lamp",
    description: "Stylish table lamp with adjustable brightness. Creates a warm, inviting atmosphere in any room.",
    longDescription: "Enhance your home with our Elegant Table Lamp, designed to provide both functionality and style. This versatile lighting piece features adjustable brightness settings, allowing you to create the perfect ambiance for any occasion. The premium materials and thoughtful design ensure that this lamp is not just a light source but also a decorative element that elevates your interior design. The warm glow creates an inviting atmosphere, making any space more comfortable and welcoming. Perfect for bedrooms, living rooms, or home offices.",
    price: 129.99,
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
      "https://images.unsplash.com/photo-1540932239986-30128078f3c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80"
    ],
    category: "Lighting",
    features: [
      "Adjustable brightness",
      "Energy-efficient LED bulb included",
      "Touch-sensitive control",
      "Premium metal and fabric construction",
      "Compatible with smart home systems"
    ],
    specifications: {
      "Dimensions": "12\"W x 12\"D x 24\"H",
      "Weight": "5 lbs",
      "Material": "Metal, Fabric",
      "Colors": "Brass, Nickel, Black",
      "Warranty": "1-year limited warranty"
    },
    stock: 25
  },
  {
    id: 3,
    name: "Artisan Ceramic Vase",
    description: "Handcrafted ceramic vase with unique glazing. Each piece has subtle variations making it one-of-a-kind.",
    longDescription: "Add a touch of artisanal beauty to your home with our Artisan Ceramic Vase. Each piece is meticulously handcrafted by skilled artisans, ensuring that no two vases are exactly alike. The unique glazing technique creates stunning visual effects that change depending on lighting and perspective. This vase isn't just a container for flowers; it's a standalone art piece that adds character and warmth to any space. The durable ceramic construction balances delicate aesthetics with practical functionality, making it perfect for displaying fresh flowers or as a decorative element on its own.",
    price: 79.99,
    images: [
      "https://images.unsplash.com/photo-1612295592824-d9d02eea7828?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
      "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1932&q=80",
      "https://images.unsplash.com/photo-1596702874230-eb1549da4be1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80"
    ],
    category: "Decor",
    features: [
      "Handcrafted by artisans",
      "Unique glazing technique",
      "Food-safe interior",
      "Water-resistant finish",
      "Stable, weighted base"
    ],
    specifications: {
      "Dimensions": "8\"W x 8\"D x 12\"H",
      "Weight": "3 lbs",
      "Material": "Ceramic",
      "Colors": "Blue, White, Earth tones",
      "Care": "Hand wash only"
    },
    stock: 8
  },
  {
    id: 4,
    name: "Scandinavian Dining Chair",
    description: "Beautifully crafted wooden dining chair with ergonomic design. Combines style and comfort.",
    longDescription: "Elevate your dining experience with our Scandinavian Dining Chair. Inspired by Nordic design principles, this chair combines minimalist aesthetics with maximum functionality. The ergonomic design ensures comfort during long meals, while the solid wood construction guarantees durability for years to come. Each chair is carefully crafted with attention to detail, from the smooth curved backrest to the perfectly angled legs. These chairs are designed to complement a variety of dining tables and interior styles, making them a versatile addition to any home.",
    price: 249.99,
    images: [
      "https://images.unsplash.com/photo-1503602642458-232111445657?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
      "https://images.unsplash.com/photo-1577140917170-285929fb55b7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80",
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=765&q=80"
    ],
    category: "Furniture",
    features: [
      "Ergonomic design",
      "Solid wood construction",
      "Non-marking floor protectors",
      "Stackable for easy storage",
      "Available in sets"
    ],
    specifications: {
      "Dimensions": "20\"W x 22\"D x 32\"H",
      "Seat Height": "18 inches",
      "Weight": "12 lbs",
      "Material": "Solid oak wood",
      "Weight Capacity": "300 lbs"
    },
    stock: 20
  },
  {
    id: 5,
    name: "Pendant Ceiling Light",
    description: "Modern pendant light with adjustable height. Creates focused lighting for dining tables or kitchen islands.",
    longDescription: "Transform your space with our Pendant Ceiling Light, a perfect blend of form and function. This modern lighting fixture features adjustable height, allowing you to customize the lighting experience based on your needs. The focused lighting is ideal for dining tables, kitchen islands, or any area that requires concentrated illumination. The minimalist design complements various interior styles, from contemporary to industrial. Made from high-quality materials, this pendant light is built to last while providing the perfect lighting ambiance for your home.",
    price: 189.99,
    images: [
      "https://images.unsplash.com/photo-1530603907829-662ab52230b4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1773&q=80",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1519710889408-a67e1c7e0452?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80"
    ],
    category: "Lighting",
    features: [
      "Adjustable height mechanism",
      "Premium metal construction",
      "Compatible with LED bulbs",
      "Dimmable (dimmer switch sold separately)",
      "Professional installation recommended"
    ],
    specifications: {
      "Dimensions": "12\" diameter x adjustable height",
      "Weight": "6 lbs",
      "Material": "Metal, Glass",
      "Colors": "Black, Gold, Copper",
      "Bulb Type": "E26/E27 (not included)"
    },
    stock: 15
  },
  {
    id: 6,
    name: "Abstract Wall Art",
    description: "Contemporary abstract canvas print. Adds a splash of color and artistic flair to any room.",
    longDescription: "Make a statement with our Abstract Wall Art, a contemporary canvas print that instantly elevates any space. The vibrant colors and dynamic composition create visual interest and become a conversation piece in your home. This high-quality print features gallery-grade canvas stretched over a sturdy wooden frame, ensuring it maintains its shape and appearance for years to come. The abstract design is versatile enough to complement various interior styles while adding a personal touch to your decor. Whether placed in your living room, bedroom, or office, this wall art adds character and sophistication to your space.",
    price: 159.99,
    images: [
      "https://images.unsplash.com/photo-1549887534-1541e9326642?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1765&q=80",
      "https://images.unsplash.com/photo-1615529328331-f8917597711f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1480&q=80",
      "https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=690&q=80"
    ],
    category: "Decor",
    features: [
      "Gallery-quality canvas print",
      "Stretched over wooden frame",
      "Ready to hang (hardware included)",
      "Fade-resistant inks",
      "Available in multiple sizes"
    ],
    specifications: {
      "Dimensions": "36\"W x 24\"H x 1.5\"D",
      "Weight": "4 lbs",
      "Material": "Canvas, Wood",
      "Orientation": "Landscape",
      "Care": "Dust with soft, dry cloth"
    },
    stock: 10
  }
];

const ProductDetail = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Find the product by id
  const product = productData.find(p => p.id === parseInt(id || "0"));
  
  if (!product) {
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
  
  const handleAddToCart = () => {
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
    if (quantity < product.stock) {
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
                src={product.images[selectedImage]} 
                alt={product.name}
                className="w-full h-full object-cover" 
              />
            </div>
            
            {/* Thumbnail gallery */}
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, idx) => (
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
          </div>
          
          {/* Product details */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="text-2xl font-medium mb-4">${product.price.toFixed(2)}</div>
            
            <p className="text-gray-600 mb-6">{product.description}</p>
            
            {/* Stock status */}
            <div className="flex items-center mb-6">
              <div className={`h-3 w-3 rounded-full mr-2 ${
                product.stock > 10 ? 'bg-green-500' : 
                product.stock > 5 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm">
                {product.stock > 10 ? 'In Stock' : 
                 product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
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
                  max={product.stock}
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), product.stock))}
                  className="border-y border-gray-300 p-2 w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button 
                  onClick={increaseQuantity}
                  disabled={quantity >= product.stock}
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
              disabled={product.stock <= 0}
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
              <p className="text-gray-600 leading-relaxed">{product.longDescription}</p>
            </div>
            
            {/* Features */}
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
            
            {/* Specifications */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Specifications</h2>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                {Object.entries(product.specifications).map(([key, value], index, array) => (
                  <div 
                    key={key}
                    className={`flex ${
                      index !== array.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    <div className="w-1/3 bg-gray-100 p-3 font-medium">{key}</div>
                    <div className="w-2/3 p-3">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
