
import React from 'react';
import Layout from '@/components/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const Shipping = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-3xl font-bold mb-8 text-center">Shipping Information</h1>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
          Learn about our shipping options, timeframes, and policies to ensure you receive your order in a timely manner.
        </p>
        
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Shipping Options</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipping Method</TableHead>
                  <TableHead>Estimated Delivery</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Standard Shipping</TableCell>
                  <TableCell>3-5 business days</TableCell>
                  <TableCell className="text-right">$5.99 (Free over $50)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Expedited Shipping</TableCell>
                  <TableCell>2 business days</TableCell>
                  <TableCell className="text-right">$12.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Overnight Shipping</TableCell>
                  <TableCell>Next business day</TableCell>
                  <TableCell className="text-right">$24.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">International Shipping</TableCell>
                  <TableCell>7-14 business days</TableCell>
                  <TableCell className="text-right">Varies by location</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Shipping Policies</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-medium text-black mb-2">Processing Time</h3>
                <p>Orders are typically processed within 1-2 business days after payment confirmation. During peak seasons, processing may take longer.</p>
              </div>
              <div>
                <h3 className="font-medium text-black mb-2">Shipping Calculation</h3>
                <p>Shipping costs are calculated based on weight, dimensions, and destination. The exact shipping cost will be displayed at checkout before payment.</p>
              </div>
              <div>
                <h3 className="font-medium text-black mb-2">Tracking Orders</h3>
                <p>Once your order ships, you'll receive a confirmation email with tracking information. You can also track your order in your account dashboard.</p>
              </div>
              <div>
                <h3 className="font-medium text-black mb-2">International Shipping</h3>
                <p>For international orders, please note that customs fees, import taxes, or duties may apply. These fees are the responsibility of the recipient and are not included in the shipping cost.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-medium text-black mb-2">Delivery Confirmation</h3>
                <p>All shipments require a signature upon delivery unless otherwise specified during checkout.</p>
              </div>
              <div>
                <h3 className="font-medium text-black mb-2">Large Items</h3>
                <p>For furniture and other large items, delivery may be scheduled in advance. Our delivery partner will contact you to arrange a suitable delivery time.</p>
              </div>
              <div>
                <h3 className="font-medium text-black mb-2">Delivery Issues</h3>
                <p>If you experience any issues with your delivery, please contact our customer service team within 48 hours of the expected delivery date.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Have additional questions about shipping?
          </p>
          <a href="/contact" className="text-blue-600 hover:underline">
            Contact our support team
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default Shipping;
