
-- Create orders table
CREATE TABLE public.orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  shipping_address JSONB NOT NULL,
  payment_intent_id TEXT,
  payment_status TEXT,
  total DECIMAL(10, 2) NOT NULL,
  shipping_method TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create order items table
CREATE TABLE public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on orders tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can view their own orders" 
  ON public.orders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" 
  ON public.orders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policies for order items
CREATE POLICY "Users can view their own order items" 
  ON public.order_items 
  FOR SELECT 
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own order items" 
  ON public.order_items 
  FOR INSERT 
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );
