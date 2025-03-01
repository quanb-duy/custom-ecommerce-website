
import React from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';

const Auth = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24 flex justify-center">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Welcome Back</h2>
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5"
                  placeholder="Your password" 
                />
              </div>
              <Button className="w-full">Login</Button>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Create Account</h2>
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
                <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  id="reg-email" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5"
                  placeholder="Your email" 
                />
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  id="reg-password" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5"
                  placeholder="Create a password" 
                />
              </div>
              <Button className="w-full">Create Account</Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
