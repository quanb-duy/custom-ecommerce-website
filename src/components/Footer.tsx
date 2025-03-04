
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { toast } = useToast();
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    const email = emailInput.value;
    
    if (email) {
      toast({
        title: "Newsletter subscription successful!",
        description: `Thank you for subscribing with ${email}. You'll receive our next newsletter soon.`,
      });
      emailInput.value = '';
    }
  };
  
  return (
    <footer className="bg-gray-50 pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Newsletter */}
        <div className="mb-16 max-w-2xl mx-auto text-center">
          <h3 className="text-xl font-semibold mb-2">Join our newsletter</h3>
          <p className="text-gray-600 mb-6">
            Stay updated with our new arrivals, latest trends, and exclusive offers.
          </p>
          
          <form 
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            onSubmit={handleSubscribe}
          >
            <Input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-grow"
              required
            />
            <Button type="submit" className="whitespace-nowrap gap-2">
              Subscribe <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
        
        {/* Footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link to="/" className="text-2xl font-semibold tracking-tighter mb-4 inline-block">
              ShopNest
            </Link>
            <p className="text-gray-600 mb-4">
              Curated selection of premium products with timeless design and exceptional quality.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Links columns */}
          <div>
            <h4 className="font-medium mb-4">Shop</h4>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-gray-600 hover:text-black transition-colors">All Products</Link></li>
              <li><Link to="/products" className="text-gray-600 hover:text-black transition-colors">Furniture</Link></li>
              <li><Link to="/products" className="text-gray-600 hover:text-black transition-colors">Lighting</Link></li>
              <li><Link to="/products" className="text-gray-600 hover:text-black transition-colors">Decor</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-600 hover:text-black transition-colors">About</Link></li>
              <li><Link to="/contact" className="text-gray-600 hover:text-black transition-colors">Contact</Link></li>
              <li><Link to="/careers" className="text-gray-600 hover:text-black transition-colors">Careers</Link></li>
              <li><Link to="/blog" className="text-gray-600 hover:text-black transition-colors">Blog</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/faq" className="text-gray-600 hover:text-black transition-colors">FAQ</Link></li>
              <li><Link to="/shipping" className="text-gray-600 hover:text-black transition-colors">Shipping</Link></li>
              <li><Link to="/returns" className="text-gray-600 hover:text-black transition-colors">Returns</Link></li>
              <li><Link to="/privacy" className="text-gray-600 hover:text-black transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-600 hover:text-black transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom footer */}
        <div className="pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>&copy; {currentYear} ShopNest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
