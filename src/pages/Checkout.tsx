
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Check, CreditCard, Truck } from 'lucide-react';

interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

const Checkout = () => {
  const { cartItems, cartTotal, totalItems, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
  });

  // Calculate shipping cost based on selected method
  const shippingCost = shippingMethod === 'express' ? 15.00 : 5.00;
  
  // Calculate total with shipping
  const orderTotal = subtotal + shippingCost + (subtotal * 0.07);

  useEffect(() => {
    // Redirect to cart if cart is empty
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
    
    // Redirect to login if not authenticated
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to checkout",
        variant: "destructive",
      });
      navigate('/auth');
    }
  }, [cartItems.length, user, navigate, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Here we would normally:
    // 1. Create an order in the database
    // 2. Process payment with Stripe
    // 3. Redirect to order confirmation
    
    setTimeout(() => {
      // Simulating order creation and payment
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your purchase.",
      });
      setIsLoading(false);
      navigate('/order-confirmation');
    }, 2000);
  };

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>
          <div className="flex justify-center py-8">
            <div className="text-center">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">
                Add some products to your cart before checking out.
              </p>
              <Button asChild>
                <a href="/products">Browse Products</a>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {/* Shipping Address Section */}
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-medium mb-4">Shipping Address</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={shippingAddress.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input
                        id="addressLine1"
                        name="addressLine1"
                        value={shippingAddress.addressLine1}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                      <Input
                        id="addressLine2"
                        name="addressLine2"
                        value={shippingAddress.addressLine2}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={shippingAddress.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                          id="state"
                          name="state"
                          value={shippingAddress.state}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode">Postal/Zip Code</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={shippingAddress.zipCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          value={shippingAddress.country}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Shipping Method Section */}
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-medium mb-4">Shipping Method</h2>
                  
                  <RadioGroup 
                    value={shippingMethod} 
                    onValueChange={setShippingMethod}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-3 rounded-md border p-3">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label htmlFor="standard" className="flex-1 cursor-pointer">
                        <div className="font-medium">Standard Shipping</div>
                        <div className="text-sm text-gray-500">Delivery in 3-5 business days</div>
                      </Label>
                      <div className="font-medium">$5.00</div>
                    </div>
                    
                    <div className="flex items-center space-x-3 rounded-md border p-3">
                      <RadioGroupItem value="express" id="express" />
                      <Label htmlFor="express" className="flex-1 cursor-pointer">
                        <div className="font-medium">Express Shipping</div>
                        <div className="text-sm text-gray-500">Delivery in 1-2 business days</div>
                      </Label>
                      <div className="font-medium">$15.00</div>
                    </div>

                    <div className="flex items-center space-x-3 rounded-md border p-3">
                      <RadioGroupItem value="packeta" id="packeta" />
                      <Label htmlFor="packeta" className="flex-1 cursor-pointer">
                        <div className="font-medium">Packeta (Zásilkovna)</div>
                        <div className="text-sm text-gray-500">
                          Pick up at a Packeta location
                          <button
                            type="button"
                            className="ml-2 text-blue-600 hover:underline"
                            onClick={() => alert("Packeta widget will be implemented here")}
                          >
                            Select Pickup Point
                          </button>
                        </div>
                      </Label>
                      <div className="font-medium">$7.50</div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
              
              {/* Payment Method Section */}
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-medium mb-4">Payment Method</h2>
                  
                  <RadioGroup 
                    value={paymentMethod} 
                    onValueChange={setPaymentMethod}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-3 rounded-md border p-3">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">
                        <div className="flex items-center">
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span className="font-medium">Credit/Debit Card</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Secure payment with Stripe
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {paymentMethod === 'card' && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-500 mb-2">
                        This is a test checkout. In a production environment, a Stripe payment form would be displayed here.
                      </p>
                      <div className="flex space-x-2">
                        <img src="https://cdn-icons-png.flaticon.com/128/6124/6124998.png" alt="Visa" className="h-6" />
                        <img src="https://cdn-icons-png.flaticon.com/128/349/349228.png" alt="Mastercard" className="h-6" />
                        <img src="https://cdn-icons-png.flaticon.com/128/196/196539.png" alt="PayPal" className="h-6" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Processing...
                  </div>
                ) : (
                  'Place Order'
                )}
              </Button>
            </form>
          </div>
          
          {/* Order Summary */}
          <div>
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-medium mb-4">Order Summary</h2>
                
                <div className="space-y-4">
                  {cartItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">{item.product.name}</h3>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                          <span className="text-sm font-medium">${(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {cartItems.length > 3 && (
                    <div className="text-sm text-center text-gray-500">
                      +{cartItems.length - 3} more items
                    </div>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (7%)</span>
                    <span>${(subtotal * 0.07).toFixed(2)}</span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>${orderTotal.toFixed(2)}</span>
                </div>
                
                <div className="mt-6 bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center text-sm text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    Free returns within 30 days
                  </div>
                  <div className="flex items-center text-sm text-green-600 mt-1">
                    <Truck className="h-4 w-4 mr-2" />
                    Free shipping on orders over $100
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
