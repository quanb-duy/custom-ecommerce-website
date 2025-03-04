
import React from 'react';
import Layout from '@/components/Layout';

const Terms = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-3xl font-bold mb-8 text-center">Terms of Service</h1>
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-8">
              Last updated: June 15, 2024
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>
              Welcome to ShopNest. These Terms of Service ("Terms") govern your use of our website and services. By accessing or using our website, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access our website or use our services.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">2. Use of Our Website</h2>
            <h3 className="font-medium mt-4 mb-2">2.1 Account Registration</h3>
            <p>
              To access certain features of our website, you may be required to register for an account. You must provide accurate, current, and complete information during the registration process. You are responsible for safeguarding your account credentials and for all activities that occur under your account.
            </p>
            
            <h3 className="font-medium mt-4 mb-2">2.2 Prohibited Activities</h3>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 pl-4 mb-4">
              <li>Use our website in any way that violates any applicable laws or regulations</li>
              <li>Engage in unauthorized framing or linking to our website</li>
              <li>Attempt to gain unauthorized access to our systems or networks</li>
              <li>Interfere with or disrupt the integrity of our website or servers</li>
              <li>Introduce malware, viruses, or other harmful code</li>
              <li>Collect or track personal information of other users</li>
              <li>Impersonate another person or entity</li>
              <li>Use our website for any unauthorized commercial purposes</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">3. Products and Purchases</h2>
            <h3 className="font-medium mt-4 mb-2">3.1 Product Information</h3>
            <p>
              We strive to provide accurate product descriptions, pricing, and availability information. However, we do not warrant that product descriptions or other content on our website are accurate, complete, reliable, current, or error-free.
            </p>
            
            <h3 className="font-medium mt-4 mb-2">3.2 Pricing and Payment</h3>
            <p>
              All prices are shown in US dollars and exclude applicable taxes and shipping costs unless otherwise stated. We reserve the right to change prices at any time. Payment must be made using one of our accepted payment methods.
            </p>
            
            <h3 className="font-medium mt-4 mb-2">3.3 Order Acceptance</h3>
            <p>
              Your receipt of an order confirmation does not constitute our acceptance of your order. We reserve the right to limit or cancel quantities purchased per person, household, or order, and to refuse or cancel any order at any time.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">4. Intellectual Property</h2>
            <p>
              All content on our website, including text, graphics, logos, images, and software, is the property of ShopNest or our content suppliers and is protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You may not use, reproduce, distribute, modify, or create derivative works of our content without our express written permission.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">5. User Content</h2>
            <p>
              By posting, uploading, or submitting content to our website (such as product reviews or comments), you grant us a non-exclusive, royalty-free, perpetual, and worldwide license to use, modify, publicly display, reproduce, and distribute such content on our website and in our marketing materials.
            </p>
            <p>
              You represent and warrant that you own or have the necessary rights to the content you submit, and that such content does not violate the rights of any third party.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, ShopNest shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or in connection with your use of our website or services.
            </p>
            <p>
              In no event shall our total liability to you for all claims exceed the amount paid by you to us during the six (6) months preceding the event giving rise to the liability.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless ShopNest and our officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, costs, or expenses arising out of or relating to your violation of these Terms or your use of our website.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">8. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any legal action or proceeding arising out of or relating to these Terms shall be brought exclusively in the federal or state courts located in San Francisco County, California.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. The updated version will be effective as of the date it is posted. Your continued use of our website after any changes to the Terms constitutes your acceptance of the new Terms.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">10. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at legal@shopnest.com or through our Contact page.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
