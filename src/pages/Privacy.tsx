
import React from 'react';
import Layout from '@/components/Layout';

const Privacy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy</h1>
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-8">
              Last updated: June 15, 2024
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>
              ShopNest ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.
            </p>
            <p>
              Please read this Privacy Policy carefully. By accessing or using our website, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
            <p>We may collect information about you in various ways:</p>
            <h3 className="font-medium mt-4 mb-2">2.1 Personal Data</h3>
            <p>
              When you create an account, place an order, or subscribe to our newsletter, we may collect:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4 mb-4">
              <li>Contact information (name, email address, phone number, shipping and billing address)</li>
              <li>Account credentials (username and password)</li>
              <li>Payment information (credit card details, billing address)</li>
              <li>Order history and preferences</li>
            </ul>
            
            <h3 className="font-medium mt-4 mb-2">2.2 Automatically Collected Data</h3>
            <p>
              When you visit our website, we may automatically collect certain information about your device, including:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4 mb-4">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Pages visited and time spent</li>
              <li>Referring website addresses</li>
              <li>Device information</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We may use the information we collect for various purposes, including:</p>
            <ul className="list-disc list-inside space-y-1 pl-4 mb-4">
              <li>Processing and fulfilling your orders</li>
              <li>Managing your account</li>
              <li>Providing customer support</li>
              <li>Sending transactional emails</li>
              <li>Marketing and promotional communications (with your consent)</li>
              <li>Improving our website and services</li>
              <li>Analyzing usage patterns and trends</li>
              <li>Preventing fraudulent transactions and monitoring against errors</li>
              <li>Legal compliance</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">4. Sharing Your Information</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc list-inside space-y-1 pl-4 mb-4">
              <li>Service providers (payment processors, shipping companies, marketing partners)</li>
              <li>Business partners with your consent</li>
              <li>Legal authorities when required by law or to protect our rights</li>
            </ul>
            <p>
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties without your consent, except as described in this Privacy Policy.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">5. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our website and hold certain information. Cookies are files with small amounts of data that may include an anonymous unique identifier.
            </p>
            <p>
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to maintain the security of your personal information. However, please be aware that no method of transmission over the internet or method of electronic storage is 100% secure.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Your Rights</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul className="list-disc list-inside space-y-1 pl-4 mb-4">
              <li>Access to your personal information</li>
              <li>Correction of inaccurate information</li>
              <li>Deletion of your information</li>
              <li>Restriction of processing</li>
              <li>Data portability</li>
              <li>Objection to processing</li>
              <li>Withdrawal of consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information provided in the "Contact Us" section.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">8. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
            <p>
              You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@shopnest.com or through our Contact page.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
