import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Package, MapPin, User, LogOut, Plus, Clock, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Address, Order, OrderItem } from '@/types/supabase-custom';
import { PostgrestError } from '@supabase/supabase-js';

interface ValidationErrors {
  [key: string]: string;
}

interface PacketaPoint {
  id: string;
  name: string;
  address: string;
}

const Account = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [userProfile, setUserProfile] = useState({
    full_name: '',
    phone: ''
  });
  
  const [newAddress, setNewAddress] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchAddresses();
    fetchOrders();
    fetchUserProfile();
  }, [user, navigate]);

  const fetchAddresses = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Using a custom typed query for user_addresses
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setAddresses(data as Address[] || []);
    } catch (error: any) {
      console.error('Error fetching addresses:', error.message);
      toast({
        title: "Failed to load addresses",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch orders with custom typing
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      
      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);
          
          if (itemsError) throw itemsError;
          
          return {
            ...order,
            items: itemsData as OrderItem[] || []
          };
        })
      );
      
      setOrders(ordersWithItems as Order[]);
    } catch (error: any) {
      console.error('Error fetching orders:', error.message);
      toast({
        title: "Failed to load orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;

      // Get the default address for phone number
      const { data: addressData, error: addressError } = await supabase
        .from('user_addresses')
        .select('phone')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();
      
      if (addressError && addressError.code !== 'PGRST116') throw addressError;
      
      setUserProfile({
        full_name: profileData?.full_name || '',
        phone: addressData?.phone || ''
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error fetching user profile:', errorMessage);
      toast({
        title: "Failed to load profile",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: userProfile.full_name })
        .eq('id', user.id);
      
      if (profileError) throw profileError;

      // Update phone number in default address if exists
      const { data: defaultAddress } = await supabase
        .from('user_addresses')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (defaultAddress) {
        const { error: addressError } = await supabase
          .from('user_addresses')
          .update({ phone: userProfile.phone })
          .eq('id', defaultAddress.id);
        
        if (addressError) throw addressError;
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error updating profile:', errorMessage);
      toast({
        title: "Failed to update profile",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addAddress = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Check if this is the first address being added
      const isFirstAddress = addresses.length === 0;
      
      // If this is the first address, set it as default
      const addressToAdd = {
        ...newAddress,
        user_id: user.id,
        is_default: isFirstAddress ? true : newAddress.is_default
      };
      
      const { error } = await supabase
        .from('user_addresses')
        .insert([addressToAdd]);
      
      if (error) throw error;
      
      toast({
        title: "Address added",
        description: "Your new address has been saved.",
      });
      
      // If this was set as default, update other addresses
      if (newAddress.is_default && !isFirstAddress) {
        await updateDefaultAddress(null);
      }
      
      // Reset form and refresh addresses
      setNewAddress({
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        is_default: false
      });
      setIsAddingAddress(false);
      fetchAddresses();
    } catch (error: any) {
      console.error('Error adding address:', error.message);
      toast({
        title: "Failed to add address",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    try {
      setIsLoading(true);
      
      // Update this address to be default
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', addressId);
      
      if (error) throw error;
      
      // Update all other addresses to not be default
      await updateDefaultAddress(addressId);
      
      toast({
        title: "Default address updated",
        description: "Your default shipping address has been updated.",
      });
      
      fetchAddresses();
    } catch (error: any) {
      console.error('Error setting default address:', error.message);
      toast({
        title: "Failed to update default address",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateDefaultAddress = async (exceptAddressId: string | null) => {
    const { error } = await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .neq('id', exceptAddressId || '');
    
    if (error) throw error;
  };

  const removeAddress = async (addressId: string) => {
    try {
      setIsLoading(true);
      
      // Check if this is the default address
      const addressToRemove = addresses.find(addr => addr.id === addressId);
      
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId);
      
      if (error) throw error;
      
      toast({
        title: "Address removed",
        description: "The address has been removed from your account.",
      });
      
      // If the removed address was the default, set a new default if there are other addresses
      if (addressToRemove?.is_default) {
        const remainingAddresses = addresses.filter(addr => addr.id !== addressId);
        if (remainingAddresses.length > 0) {
          await setDefaultAddress(remainingAddresses[0].id);
        }
      }
      
      fetchAddresses();
    } catch (error: any) {
      console.error('Error removing address:', error.message);
      toast({
        title: "Failed to remove address",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Shipped</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Account</h1>
            <p className="mb-6">Please sign in to view your account.</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
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
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="text-gray-600">Welcome back, {user.email}</p>
          </div>
          <Button variant="outline" className="mt-4 md:mt-0" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
        
        <Tabs defaultValue="orders" className="space-y-8">
          <TabsList className="mb-8">
            <TabsTrigger value="orders" className="flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              Account Details
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Order History</h2>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-gray-500 mb-6">
                  When you place orders, they will appear here.
                </p>
                <Button onClick={() => navigate('/products')}>Start Shopping</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 pt-4 pb-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                            {getOrderStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Placed on {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">${order.total.toFixed(2)}</div>
                            <div className="text-sm text-gray-500">{(order.items?.length || 0)} items</div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {order.items?.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex justify-between items-center border-b pb-3">
                            <div>
                              <div className="font-medium">{item.product_name}</div>
                              <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                            </div>
                            <div className="font-medium">
                              ${(item.product_price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                        
                        {order.items && order.items.length > 3 && (
                          <div className="text-center text-sm text-gray-500 pt-2">
                            + {order.items.length - 3} more items
                          </div>
                        )}
                        
                        <div className="pt-2">
                          <div className="text-sm font-medium">Shipping Method</div>
                          <div className="text-sm text-gray-500 capitalize">{order.shipping_method}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="addresses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Saved Addresses</h2>
              {!isAddingAddress && (
                <Button onClick={() => setIsAddingAddress(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Address
                </Button>
              )}
            </div>
            
            {isAddingAddress && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Add New Address</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsAddingAddress(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address_line1">Address Line 1</Label>
                      <Input
                        id="address_line1"
                        name="address_line1"
                        value={newAddress.address_line1}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                      <Input
                        id="address_line2"
                        name="address_line2"
                        value={newAddress.address_line2}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={newAddress.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                          id="state"
                          name="state"
                          value={newAddress.state}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="postal_code">Postal/Zip Code</Label>
                        <Input
                          id="postal_code"
                          name="postal_code"
                          value={newAddress.postal_code}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          value={newAddress.country}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="is_default"
                        name="is_default"
                        checked={newAddress.is_default}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="is_default" className="text-sm font-normal">
                        Set as default shipping address
                      </Label>
                    </div>
                    
                    <div className="pt-2 flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingAddress(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={addAddress} 
                        disabled={
                          !newAddress.address_line1 || 
                          !newAddress.city || 
                          !newAddress.state || 
                          !newAddress.postal_code || 
                          !newAddress.country || 
                          isLoading
                        }
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Saving...
                          </div>
                        ) : (
                          'Save Address'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {isLoading && !isAddingAddress ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : addresses.length === 0 && !isAddingAddress ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No addresses saved</h3>
                <p className="text-gray-500 mb-6">
                  Add shipping addresses to speed up your checkout process.
                </p>
                <Button onClick={() => setIsAddingAddress(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Address
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map((address) => (
                  <Card key={address.id} className={address.is_default ? 'border-primary' : ''}>
                    <CardContent className="pt-6">
                      {address.is_default && (
                        <Badge className="mb-3">Default</Badge>
                      )}
                      
                      <div className="space-y-1">
                        <p>{address.address_line1}</p>
                        {address.address_line2 && <p>{address.address_line2}</p>}
                        <p>{address.city}, {address.state} {address.postal_code}</p>
                        <p>{address.country}</p>
                      </div>
                      
                      <div className="flex space-x-2 mt-4">
                        {!address.is_default && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setDefaultAddress(address.id)}
                            disabled={isLoading}
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeAddress(address.id)}
                          disabled={isLoading}
                        >
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={user?.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={userProfile.full_name}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center pt-4">
                    <Button 
                      onClick={updateProfile}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Saving...
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => 
                        toast({
                          title: "Feature coming soon",
                          description: "Password reset functionality will be available soon.",
                        })
                      }
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Account;
