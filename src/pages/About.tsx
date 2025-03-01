
import React from 'react';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">About Us</h1>
          
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              ShopNest was founded in 2020 with a simple mission: to bring beautiful, functional design into every home. What began as a small curated collection of handpicked items has grown into a comprehensive home goods destination, but our core values remain unchanged.
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed">
              We believe that thoughtfully designed spaces enhance our everyday experiences. Whether it's the perfect lamp that creates just the right ambiance, a comfortable sofa that brings the family together, or a unique decorative piece that sparks joy, we understand that these items are more than just objects—they're the building blocks of a home.
            </p>
          </div>

          {/* Mission and Values */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Mission & Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-gray-50 p-6 rounded-lg"
              >
                <h3 className="text-xl font-medium mb-3">Mission</h3>
                <p className="text-gray-600">
                  To provide high-quality, thoughtfully designed products that enhance people's living spaces and everyday experiences.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gray-50 p-6 rounded-lg"
              >
                <h3 className="text-xl font-medium mb-3">Vision</h3>
                <p className="text-gray-600">
                  To become the most trusted destination for home design, where quality, sustainability, and excellent customer service are the standard.
                </p>
              </motion.div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-medium mb-4">Our Core Values</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "Quality First",
                    description: "We never compromise on the quality of our products. Each item is carefully selected and tested to ensure it meets our high standards."
                  },
                  {
                    title: "Thoughtful Design",
                    description: "We believe in the power of good design to improve daily life, focusing on both aesthetics and functionality."
                  },
                  {
                    title: "Sustainability",
                    description: "We're committed to reducing our environmental impact by partnering with responsible manufacturers and using eco-friendly materials whenever possible."
                  },
                  {
                    title: "Customer Happiness",
                    description: "Your satisfaction is our priority. We strive to provide exceptional service at every step of your shopping journey."
                  }
                ].map((value, index) => (
                  <motion.div 
                    key={value.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white border border-gray-200 p-5 rounded-lg"
                  >
                    <h4 className="font-medium mb-2">{value.title}</h4>
                    <p className="text-gray-600 text-sm">{value.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Team section */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Our Team</h2>
            <p className="text-gray-600 mb-8">
              ShopNest is powered by a passionate team of design enthusiasts, customer service experts, and industry professionals who share a common goal: helping you create a home you love.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                {
                  name: "Alex Morgan",
                  role: "Founder & CEO",
                  image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80"
                },
                {
                  name: "Jordan Taylor",
                  role: "Creative Director",
                  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80"
                },
                {
                  name: "Sam Park",
                  role: "Head of Product",
                  image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=761&q=80"
                }
              ].map((member, index) => (
                <motion.div 
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="mb-4 rounded-full overflow-hidden w-32 h-32 mx-auto">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <h3 className="font-medium text-lg">{member.name}</h3>
                  <p className="text-gray-500">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Commitment section */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              At ShopNest, we're committed to providing you with not just products, but a complete shopping experience. From carefully curated collections to detailed product information, quick shipping, and responsive customer support, every aspect of our business is designed with you in mind.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We believe in building long-term relationships with our customers. Your feedback helps us grow and improve, so we encourage you to share your thoughts and experiences with us. Thank you for choosing ShopNest as your home goods destination.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
