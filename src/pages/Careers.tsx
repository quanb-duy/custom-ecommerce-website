
import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Careers = () => {
  const openPositions = [
    {
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "San Francisco, CA (Remote Option)",
      type: "Full-time",
      description: "We're looking for a Senior Frontend Developer with expertise in React and TypeScript to help build and improve our e-commerce platform."
    },
    {
      title: "UX/UI Designer",
      department: "Design",
      location: "San Francisco, CA (Remote Option)",
      type: "Full-time",
      description: "Join our design team to create beautiful, intuitive experiences that delight our customers and drive our brand forward."
    },
    {
      title: "Customer Success Manager",
      department: "Customer Support",
      location: "Remote",
      type: "Full-time",
      description: "Help our customers succeed by providing exceptional support and ensuring they have the best possible experience with our products."
    },
    {
      title: "Product Marketing Specialist",
      department: "Marketing",
      location: "San Francisco, CA",
      type: "Full-time",
      description: "Create compelling marketing campaigns to showcase our products and help drive sales and customer engagement."
    },
    {
      title: "Operations Coordinator",
      department: "Operations",
      location: "Portland, OR",
      type: "Full-time",
      description: "Support our logistics and operations teams to ensure smooth delivery of products to our customers."
    }
  ];

  const values = [
    {
      title: "Customer Obsession",
      description: "We start with the customer and work backwards. We work vigorously to earn and keep customer trust."
    },
    {
      title: "Quality & Craftsmanship",
      description: "We take pride in the products we create and the experiences we deliver. Every detail matters."
    },
    {
      title: "Sustainability",
      description: "We make decisions with the long-term health of our environment and communities in mind."
    },
    {
      title: "Innovation",
      description: "We constantly push boundaries and challenge assumptions to create better solutions."
    },
    {
      title: "Diversity & Inclusion",
      description: "We celebrate different perspectives and create an environment where everyone can thrive."
    },
    {
      title: "Continuous Learning",
      description: "We're curious, we ask questions, and we're committed to growth and development."
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-4xl font-bold mb-4 text-center">Join Our Team</h1>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
          At ShopNest, we're building the future of home furnishings. Join us in our mission to help people create spaces they love.
        </p>
        
        {/* Hero image */}
        <div className="relative h-80 rounded-2xl overflow-hidden mb-16">
          <img 
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
            alt="Team collaboration" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white p-6">
              <h2 className="text-3xl font-bold mb-4">Build Something Beautiful</h2>
              <p className="text-xl max-w-md mx-auto">
                Join a team dedicated to crafting exceptional experiences and products
              </p>
            </div>
          </div>
        </div>
        
        {/* Company values */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-8 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-xl font-medium mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </section>
        
        {/* Perks & Benefits */}
        <section className="mb-20 bg-gray-50 p-8 rounded-xl">
          <h2 className="text-2xl font-semibold mb-8 text-center">Perks & Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-medium mb-4">Work Life</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Flexible work hours and remote options</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Generous paid time off and holidays</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Parental leave for all new parents</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Modern, collaborative workspaces</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Company retreats and team-building events</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-4">Health & Financial</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Comprehensive health, dental, and vision insurance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>401(k) matching program</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Employee discounts on all products</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Professional development budget</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Wellness program and gym membership reimbursement</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* Open positions */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-8 text-center">Open Positions</h2>
          <div className="space-y-4">
            {openPositions.map((position, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="md:flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-medium">{position.title}</h3>
                    <p className="text-gray-600">{position.department} • {position.location} • {position.type}</p>
                  </div>
                  <Button className="mt-4 md:mt-0" size="sm">
                    Apply Now
                  </Button>
                </div>
                <p className="text-gray-600">{position.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Don't see a position that fits your skills?</p>
            <Button variant="outline" className="gap-2">
              Send us your resume <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Careers;
