
import React from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/Hero';
import FeaturedProducts from '@/components/FeaturedProducts';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Index: React.FC = () => {
  return (
    <Layout>
      <div className="pt-16"> {/* Add padding for the fixed navbar */}
        <Hero />
        
        <FeaturedProducts />
        
        {/* Categories section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-semibold mb-4">Shop by Category</h2>
              <p className="text-gray-600">
                Explore our collection of carefully curated products across different categories.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Furniture',
                  description: 'Timeless pieces for every space',
                  image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=765&q=80',
                  link: '/products?category=furniture'
                },
                {
                  title: 'Lighting',
                  description: 'Illuminate your space with style',
                  image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
                  link: '/products?category=lighting'
                },
                {
                  title: 'Decor',
                  description: 'Finishing touches that make a difference',
                  image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
                  link: '/products?category=decor'
                }
              ].map((category, index) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-xl aspect-[4/5]"
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 z-10" />
                  <img 
                    src={category.image} 
                    alt={category.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20 p-6 text-center">
                    <h3 className="text-2xl font-semibold mb-2">{category.title}</h3>
                    <p className="mb-6 max-w-xs">{category.description}</p>
                    <Button asChild variant="secondary" className="hover:bg-white">
                      <a href={category.link}>Explore</a>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Banner */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="bg-gray-100 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-12 lg:p-16 flex flex-col justify-center">
                  <h2 className="text-3xl font-semibold mb-4">New Collection 2024</h2>
                  <p className="text-gray-600 mb-8 max-w-md">
                    Discover our latest arrivals featuring premium materials and timeless design. 
                    Limited quantities available.
                  </p>
                  <div>
                    <Button asChild className="gap-2">
                      <a href="/products">
                        Explore Collection
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="relative min-h-[300px] md:min-h-0">
                  <img 
                    src="https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
                    alt="New collection" 
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-semibold mb-4">What Our Customers Say</h2>
              <p className="text-gray-600">
                Don't just take our word for it – here's what customers think about our products.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  quote: "The quality of the furniture exceeded my expectations. Simple, functional, and beautifully made.",
                  author: "Alexandra Smith",
                  role: "Interior Designer"
                },
                {
                  quote: "Exceptional customer service and the products are exactly as described. I'll definitely be shopping here again.",
                  author: "Michael Johnson",
                  role: "Architect"
                },
                {
                  quote: "I've been looking for minimalist pieces like these for months. So happy to have discovered this store!",
                  author: "Emily Chen",
                  role: "Home Stylist"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={testimonial.author}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gray-50 p-8 rounded-xl relative neo-morphism"
                >
                  <svg
                    className="absolute top-6 left-6 text-gray-200 w-10 h-10"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <div className="relative z-10">
                    <p className="mb-6 text-gray-600 leading-relaxed">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-medium">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
