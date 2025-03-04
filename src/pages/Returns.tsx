
import React from 'react';
import Layout from '@/components/Layout';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Returns = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-3xl font-bold mb-8 text-center">Returns & Refunds</h1>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
          We want you to be completely satisfied with your purchase. Learn about our return and refund policies.
        </p>
        
        <div className="max-w-4xl mx-auto mb-12">
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              All returns must be initiated within 30 days of delivery. Items must be in original condition with tags attached.
            </AlertDescription>
          </Alert>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Return Policy</h2>
            <div className="space-y-4 text-gray-600">
              <p>At ShopNest, we accept returns within 30 days of delivery for a full refund or exchange. To be eligible for a return, your item must be unused and in the same condition that you received it, with all original packaging and tags.</p>
              
              <h3 className="font-medium text-black mt-6 mb-2">Non-Returnable Items</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Custom or personalized items</li>
                <li>Gift cards</li>
                <li>Downloadable software products</li>
                <li>Items marked as "Final Sale" or "Clearance"</li>
                <li>Items that have been used, assembled, or show signs of wear</li>
              </ul>
              
              <h3 className="font-medium text-black mt-6 mb-2">Damaged or Defective Items</h3>
              <p>If you receive a damaged or defective item, please contact us immediately. We will arrange for a replacement or refund at our expense.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Return Process</h2>
            <div className="space-y-3 text-gray-600">
              <ol className="list-decimal list-inside space-y-4">
                <li>
                  <span className="font-medium text-black">Initiate Return:</span> Log into your account and visit the order history section, or contact our customer service team to initiate a return.
                </li>
                <li>
                  <span className="font-medium text-black">Return Authorization:</span> You will receive a Return Merchandise Authorization (RMA) number and return instructions via email.
                </li>
                <li>
                  <span className="font-medium text-black">Packaging:</span> Pack the item securely in its original packaging, including all accessories, manuals, and free gifts.
                </li>
                <li>
                  <span className="font-medium text-black">Shipping:</span> Attach the provided return label to the package and drop it off at the designated carrier location.
                </li>
                <li>
                  <span className="font-medium text-black">Processing:</span> Once we receive your return, we'll inspect the item and process your refund or exchange within 5-7 business days.
                </li>
              </ol>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Refund Information</h2>
            <div className="space-y-4 text-gray-600">
              <p>Once your return is received and inspected, we will send you an email to notify you that we have received your returned item and whether your refund has been approved.</p>
              
              <p>If approved, your refund will be processed and a credit will automatically be applied to your original method of payment within 5-7 business days. Please note that it may take an additional 2-5 business days for the refund to appear in your account, depending on your payment provider.</p>
              
              <h3 className="font-medium text-black mt-6 mb-2">Refund Options</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Original payment method refund</li>
                <li>Store credit (with an additional 10% bonus)</li>
                <li>Exchange for another item</li>
              </ul>
              
              <h3 className="font-medium text-black mt-6 mb-2">Return Shipping Costs</h3>
              <p>For standard returns, the customer is responsible for return shipping costs. If you're returning an item because it's defective or we sent you the wrong item, we'll cover the return shipping costs.</p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Need help with a return?
          </p>
          <a href="/contact" className="text-blue-600 hover:underline">
            Contact our support team
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default Returns;
