
import React from 'react';
import Layout from '@/components/Layout';

const About = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-3xl font-bold mb-8">About Us</h1>
        <p className="text-gray-600 mb-8">
          We are dedicated to providing high-quality products with exceptional design. 
          Our mission is to bring beautiful, functional items into your home and life.
        </p>
      </div>
    </Layout>
  );
};

export default About;
