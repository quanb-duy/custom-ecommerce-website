
import React from 'react';
import Layout from '@/components/Layout';

const Contact = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
        <p className="text-gray-600 mb-8">
          Have questions or feedback? We'd love to hear from you.
        </p>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                type="text" 
                id="name" 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5"
                placeholder="Your name" 
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                id="email" 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5"
                placeholder="Your email" 
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea 
                id="message" 
                rows={4} 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5"
                placeholder="Your message"
              ></textarea>
            </div>
            <button 
              type="submit" 
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-black/80 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
