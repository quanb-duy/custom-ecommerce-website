
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FcGoogle } from 'react-icons/fc';

const Auth = () => {
  const { signIn, signUp, signInWithGoogle, isLoading } = useAuth();
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(loginEmail, loginPassword);
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(registerEmail, registerPassword, registerName);
  };

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
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    type="email" 
                    id="email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Your email" 
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    type="password" 
                    id="password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Your password" 
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={signInWithGoogle}
                disabled={isLoading}
              >
                <FcGoogle className="mr-2 h-5 w-5" />
                Sign in with Google
              </Button>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Create Account</h2>
              
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    type="text" 
                    id="name" 
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Your full name" 
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input 
                    type="email" 
                    id="reg-email" 
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="Your email" 
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input 
                    type="password" 
                    id="reg-password" 
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Create a password (min. 6 characters)" 
                    required
                    minLength={6}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={signInWithGoogle}
                disabled={isLoading}
              >
                <FcGoogle className="mr-2 h-5 w-5" />
                Sign up with Google
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
