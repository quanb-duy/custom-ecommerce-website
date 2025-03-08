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
import { ShoppingCart, Check, CreditCard, Truck, AlertCircle } from 'lucide-react';
import StripePaymentForm from '@/components/StripePaymentForm';
import PacketaPickupWidget from '@/components/PacketaPickupWidget';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

interface PacketaPoint {
  id: string;
  name: string;
  address: string;
  zip: string;
  city: string;
}

interface ValidationErrors {
  fullName?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
}

const Checkout = () => {
  const { cartItems, cartTotal, totalItems, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentStep, setPaymentStep] = useState(false);
  const [packetaPoint, setPacketaPoint] = useState<PacketaPoint | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

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

  const shippingCost = 
    shippingMethod === 'express' ? 15.00 : 
    shippingMethod === 'packeta' ? 7.50 : 5.00;
  
  const orderTotal = subtotal + shippingCost + (subtotal * 0.07);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to checkout",
        variant: "destructive",
      });
      navigate('/auth');
    }
  }, [cartItems.length, user, navigate, toast]);

  useEffect(() => {
    if (shippingMethod !== 'packeta') {
      setPacketaPoint(null);
    }
  }, [shippingMethod]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    const sanitizedValue = value.replace(/[<>"']/g, '');
    
    setShippingAddress(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof ValidationErrors];
        return newErrors;
      });
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[0-9+\- ()]+$/;
    return phoneRegex.test(phone);
  };

  const validateZipCode = (zipCode: string): boolean => {
    const zipRegex = /^[0-9A-Z]{3,10}(\s*[0-9A-Z]{2,4})?$/i;
    return zipRegex.test(zipCode);
  };

  const validateShippingInfo = () => {
    const errors: ValidationErrors = {};
    
    if (shippingMethod !== 'packeta') {
      if (!shippingAddress.fullName.trim()) {
        errors.fullName = "Full name is required";
      }
      
      if (!shippingAddress.addressLine1.trim()) {
        errors.addressLine1 = "Address is required";
      }
      
      if (!shippingAddress.city.trim()) {
        errors.city = "City is required";
      }
      
      if (!shippingAddress.state.trim()) {
        errors.state = "State is required";
      }
      
      if (!shippingAddress.zipCode.trim()) {
        errors.zipCode = "Zip code is required";
      } else if (!validateZipCode(shippingAddress.zipCode)) {
        errors.zipCode = "Invalid zip code format";
      }
      
      if (!shippingAddress.country.trim()) {
        errors.country = "Country is required";
      }
      
      if (!shippingAddress.phone.trim()) {
        errors.phone = "Phone number is required";
      } else if (!validatePhoneNumber(shippingAddress.phone)) {
        errors.phone = "Invalid phone number format";
      }
    } else {
      if (!packetaPoint) {
        toast({
          title: "Missing pickup point",
          description: "Please select a Packeta pickup point",
          variant: "destructive",
        });
        return false;
      }
      
      if (!shippingAddress.fullName.trim()) {
        errors.fullName = "Full name is required";
      }
      
      if (!shippingAddress.phone.trim()) {
        errors.phone = "Phone number is required";
      } else if (!validatePhoneNumber(shippingAddress.phone)) {
        errors.phone = "Invalid phone number format";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const proceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateShippingInfo()) {
      setPaymentStep(true);
      window.scrollTo(0, 0);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    setPaymentIntentId(paymentId);
    await createOrder(paymentId);
  };

  const handlePaymentError = (errorMessage: string) => {
    console.error('Payment error:', errorMessage);
    toast({
      title: "Payment failed",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const createOrder = async (paymentId: string = '') => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const shippingAddressData = shippingMethod === 'packeta' 
        ? {
            type: 'packeta',
            pickupPoint: packetaPoint,
            fullName: shippingAddress.fullName || user.email,
            phone: shippingAddress.phone || '',
          }
        : shippingAddress;
      
      const orderData = {
        shipping_address: shippingAddressData,
        total: orderTotal,
        shipping_method: shippingMethod,
        payment_status: paymentId ? 'paid' : 'pending',
      };
      
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity
      }));
      
      const { data, error } = await supabase.functions.invoke('create-order', {
        method: 'POST',
        body: {
          order_data: orderData,
          order_items: orderItems,
          user_id: user.id,
          payment_intent_id: paymentId
        }
      });
      
      if (error) {
        throw new Error(`Error creating order: ${error.message}`);
      }
      
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your purchase.",
      });
      
      navigate('/order-confirmation');
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Order creation failed",
        description: error.message || "There was an error processing your order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
        <h1 className="text-3xl font-bold mb-8">
          {paymentStep ? 'Payment' : 'Shipping Information'}
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {!paymentStep ? (
              <form onSubmit={proceedToPayment}>
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
                          <div className="text-sm text-gray-500">Pick up at a Packeta location</div>
                        </Label>
                        <div className="font-medium">$7.50</div>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {shippingMethod === 'packeta' && (
                  <Card className="mb-8">
                    <CardContent className="pt-6">
                      <h2 className="text-xl font-medium mb-4">Select Pickup Point</h2>
                      <PacketaPickupWidget 
                        onSelect={setPacketaPoint}
                        selectedPoint={packetaPoint}
                      />
                      
                      <div className="mt-4 space-y-4">
                        <div>
                          <Label htmlFor="pickupFullName">Full Name</Label>
                          <Input
                            id="pickupFullName"
                            name="fullName"
                            value={shippingAddress.fullName}
                            onChange={handleInputChange}
                            className={validationErrors.fullName ? "border-red-500" : ""}
                          />
                          {validationErrors.fullName && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.fullName}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="pickupPhone">Phone Number</Label>
                          <Input
                            id="pickupPhone"
                            name="phone"
                            type="tel"
                            value={shippingAddress.phone}
                            onChange={handleInputChange}
                            className={validationErrors.phone ? "border-red-500" : ""}
                            placeholder="e.g. +1 (555) 123-4567"
                          />
                          {validationErrors.phone && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {(shippingMethod === 'standard' || shippingMethod === 'express') && (
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
                            className={validationErrors.fullName ? "border-red-500" : ""}
                          />
                          {validationErrors.fullName && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.fullName}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="addressLine1">Address Line 1</Label>
                          <Input
                            id="addressLine1"
                            name="addressLine1"
                            value={shippingAddress.addressLine1}
                            onChange={handleInputChange}
                            className={validationErrors.addressLine1 ? "border-red-500" : ""}
                          />
                          {validationErrors.addressLine1 && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.addressLine1}</p>
                          )}
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
                              className={validationErrors.city ? "border-red-500" : ""}
                            />
                            {validationErrors.city && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="state">State/Province</Label>
                            <Input
                              id="state"
                              name="state"
                              value={shippingAddress.state}
                              onChange={handleInputChange}
                              className={validationErrors.state ? "border-red-500" : ""}
                            />
                            {validationErrors.state && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors.state}</p>
                            )}
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
                              className={validationErrors.zipCode ? "border-red-500" : ""}
                            />
                            {validationErrors.zipCode && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors.zipCode}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              name="country"
                              value={shippingAddress.country}
                              onChange={handleInputChange}
                              className={validationErrors.country ? "border-red-500" : ""}
                            />
                            {validationErrors.country && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors.country}</p>
                            )}
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
                            className={validationErrors.phone ? "border-red-500" : ""}
                            placeholder="e.g. +1 (555) 123-4567"
                          />
                          {validationErrors.phone && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Button type="submit" className="w-full">
                  Continue to Payment
                </Button>
              </form>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-medium mb-4">Payment Information</h2>
                  
                  <div className="mb-6">
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
                  </div>
                  
                  {paymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-md mb-4">
                        <p className="text-sm text-gray-600">
                          This is a test checkout. You can use Stripe test card number: 4242 4242 4242 4242
                        </p>
                        <p className="text-sm text-gray-600">
                          Any future date, any 3 digits for CVC, and any 5 digits for postal code.
                        </p>
                      </div>
                      
                      <StripePaymentForm 
                        amount={orderTotal}
                        onPaymentSuccess={handlePaymentSuccess}
                        onPaymentError={handlePaymentError}
                        disabled={isLoading}
                      />
                      
                      <div className="text-center mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setPaymentStep(false)}
                          disabled={isLoading}
                        >
                          Back to Shipping
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          <div>
            <Card className="sticky top-24">
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
