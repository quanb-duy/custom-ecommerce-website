
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Package, User as UserIcon, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

interface Order {
  id: number;
  created_at: string;
  status: string;
  total: number;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
}

const Account = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/auth');
      return;
    }

    // Fetch user profile and orders
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        
        if (profileData) {
          setProfile(profileData);
          setFullName(profileData.full_name || '');
        }
        
        // In the future, fetch orders from a new orders table
        // For now, we'll use placeholder data
        setOrders([
          {
            id: 1001,
            created_at: new Date().toISOString(),
            status: 'Pending',
            total: 128.97,
            items: [
              { id: 1, product_name: 'Modern Minimalist Sofa', quantity: 1, price: 899.99 },
              { id: 2, product_name: 'Elegant Table Lamp', quantity: 1, price: 129.99 }
            ]
          }
        ]);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          full_name: fullName
        });
      }
      
      // Show success message
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Account</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {profile?.full_name || user?.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="mt-4 md:mt-0">
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-8 w-full md:w-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Orders
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    value={user?.email || ''} 
                    disabled 
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    Your email address is used for login and cannot be changed.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="Enter your full name"
                  />
                </div>
                
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isUpdating}
                  className="mt-4"
                >
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <div className="flex justify-center mb-4">
                      <ShoppingCart className="h-12 w-12 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-4">
                      You haven't placed any orders yet.
                    </p>
                    <Button asChild>
                      <a href="/products">Start Shopping</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-4 flex flex-col md:flex-row md:items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-500">Order #{order.id}</span>
                            <p className="font-medium">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="mt-2 md:mt-0 space-y-1 md:text-right">
                            <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {order.status}
                            </div>
                            <p className="font-medium">${order.total.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium mb-2">Items</h4>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between">
                                <span>
                                  {item.product_name} x{item.quantity}
                                </span>
                                <span className="font-medium">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Account;
