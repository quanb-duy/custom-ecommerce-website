
import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax effect
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollPosition = window.scrollY;
      const parallaxElements = containerRef.current.querySelectorAll('.parallax');
      
      parallaxElements.forEach((element) => {
        const speed = parseFloat((element as HTMLElement).dataset.speed || '0.1');
        (element as HTMLElement).style.transform = `translateY(${scrollPosition * speed}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background with slight parallax */}
      <div 
        className="absolute inset-0 w-full h-full bg-gray-100 parallax" 
        data-speed="0.05"
      ></div>
      
      {/* Abstract shapes */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gray-200/50 mix-blend-multiply blur-3xl parallax" data-speed="0.2"></div>
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-gray-200/50 mix-blend-multiply blur-3xl parallax" data-speed="0.15"></div>
      
      {/* Content container */}
      <div className="container mx-auto px-4 z-10 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center md:text-left space-y-6"
          >
            <div className="inline-block bg-black/5 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-sm font-medium">New Collection 2024</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">
              Discover Exceptional <br className="hidden md:block" />
              <span className="relative">
                Design
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-black/10"></span>
              </span> Pieces
            </h1>
            
            <p className="text-lg text-gray-600 max-w-md mx-auto md:mx-0">
              Curated selection of premium products with timeless design and exceptional quality.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/products">
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </motion.div>
          
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative aspect-square max-w-md mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white rounded-3xl -rotate-6 transform-gpu"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100 rounded-3xl rotate-3 transform-gpu shadow-lg"></div>
            <img 
              src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
              alt="Minimal design chair" 
              className="relative z-10 w-full h-full object-cover rounded-3xl shadow-lg"
            />
            <div className="absolute -bottom-6 -right-6 bg-white rounded-full shadow-lg p-4 z-20 animate-float">
              <div className="bg-black text-white text-sm font-medium px-4 py-2 rounded-full">
                Premium Quality
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
