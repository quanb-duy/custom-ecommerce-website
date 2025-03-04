
import React from 'react';
import Layout from '@/components/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQ = () => {
  const faqs = [
    {
      question: "How do I track my order?",
      answer: "Once your order ships, you'll receive a tracking number via email. You can also check your order status in your account dashboard under 'Order History'."
    },
    {
      question: "What is your return policy?",
      answer: "We accept returns within 30 days of delivery. Items must be in original condition with tags attached. Return shipping is free for exchanges or store credit."
    },
    {
      question: "Do you ship internationally?",
      answer: "Yes, we ship to select countries internationally. Shipping costs and delivery times vary by location. Please check the shipping calculator at checkout."
    },
    {
      question: "How can I contact customer service?",
      answer: "You can reach our customer service team by email at support@shopnest.com, by phone at (800) 555-1234, or through our Contact page."
    },
    {
      question: "Are there any discounts for first-time customers?",
      answer: "Yes! First-time customers can sign up for our newsletter to receive a 10% discount code for their first purchase."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping typically takes 3-5 business days within the continental US. Expedited shipping options are available at checkout."
    },
    {
      question: "Do you offer assembly services?",
      answer: "For select furniture items, we offer assembly services for an additional fee. This option will be available at checkout for eligible items."
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
          Find answers to common questions about our products, shipping, returns, and more.
        </p>
        
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6 mb-12">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-gray-600">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Can't find the answer you're looking for?
          </p>
          <a href="/contact" className="text-blue-600 hover:underline">
            Contact our support team
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default FAQ;
