
-- Create products table
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 10,
  features TEXT[] DEFAULT '{}'::TEXT[],
  specifications JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart items table
CREATE TABLE public.cart_items (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Set up RLS (Row Level Security)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Products table policies (everyone can view, only admins can modify)
CREATE POLICY "Anyone can view products" ON public.products 
  FOR SELECT USING (true);

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Cart items policies
CREATE POLICY "Users can view their own cart items" ON public.cart_items 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cart items" ON public.cart_items 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart items" ON public.cart_items 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cart items" ON public.cart_items 
  FOR DELETE USING (auth.uid() = user_id);

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample product data
INSERT INTO public.products (name, description, long_description, price, image, category, stock, features, specifications)
VALUES 
  ('Modern Minimalist Sofa', 'A sleek, comfortable sofa with clean lines and premium upholstery.', 'This Modern Minimalist Sofa combines style and comfort in a sleek, contemporary package. Featuring premium upholstery, this sofa is designed to complement modern living spaces while providing exceptional comfort. The clean lines and minimalist aesthetics make it a versatile piece that fits seamlessly into various interior design styles.', 899.99, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80', 'Furniture', 12, ARRAY['Sturdy wooden frame', 'Premium fabric upholstery', 'High-density foam cushions', 'Non-marking wooden legs'], '{"Dimensions": "82\"W x 36\"D x 34\"H", "Weight": "95 lbs", "Material": "Wood, Foam, Polyester", "Colors": "Gray, Beige, Navy", "Warranty": "3-year limited warranty"}'::JSONB),
  
  ('Elegant Table Lamp', 'Stylish table lamp with adjustable brightness.', 'Enhance your home with our Elegant Table Lamp, designed to provide both functionality and style. This versatile lighting piece features adjustable brightness settings, allowing you to create the perfect ambiance for any occasion.', 129.99, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80', 'Lighting', 25, ARRAY['Adjustable brightness', 'Energy-efficient LED bulb included', 'Touch-sensitive control'], '{"Dimensions": "12\"W x 12\"D x 24\"H", "Weight": "5 lbs", "Material": "Metal, Fabric", "Colors": "Brass, Nickel, Black"}'::JSONB),
  
  ('Artisan Ceramic Vase', 'Handcrafted ceramic vase with unique glazing.', 'Add a touch of artisanal beauty to your home with our Artisan Ceramic Vase. Each piece is meticulously handcrafted by skilled artisans, ensuring that no two vases are exactly alike.', 79.99, 'https://images.unsplash.com/photo-1612295592824-d9d02eea7828?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80', 'Decor', 8, ARRAY['Handcrafted by artisans', 'Unique glazing technique', 'Food-safe interior'], '{"Dimensions": "8\"W x 8\"D x 12\"H", "Weight": "3 lbs", "Material": "Ceramic", "Colors": "Blue, White, Earth tones"}'::JSONB),
  
  ('Scandinavian Dining Chair', 'Beautifully crafted wooden dining chair with ergonomic design.', 'Elevate your dining experience with our Scandinavian Dining Chair. Inspired by Nordic design principles, this chair combines minimalist aesthetics with maximum functionality.', 249.99, 'https://images.unsplash.com/photo-1503602642458-232111445657?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80', 'Furniture', 20, ARRAY['Ergonomic design', 'Solid wood construction', 'Non-marking floor protectors'], '{"Dimensions": "20\"W x 22\"D x 32\"H", "Seat Height": "18 inches", "Weight": "12 lbs", "Material": "Solid oak wood"}'::JSONB),
  
  ('Pendant Ceiling Light', 'Modern pendant light with adjustable height.', 'Transform your space with our Pendant Ceiling Light, a perfect blend of form and function. This modern lighting fixture features adjustable height, allowing you to customize the lighting experience based on your needs.', 189.99, 'https://images.unsplash.com/photo-1530603907829-662ab52230b4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1773&q=80', 'Lighting', 15, ARRAY['Adjustable height mechanism', 'Premium metal construction', 'Compatible with LED bulbs'], '{"Dimensions": "12\" diameter", "Weight": "6 lbs", "Material": "Metal, Glass", "Colors": "Black, Gold, Copper"}'::JSONB),
  
  ('Abstract Wall Art', 'Contemporary abstract canvas print.', 'Make a statement with our Abstract Wall Art, a contemporary canvas print that instantly elevates any space. The vibrant colors and dynamic composition create visual interest and become a conversation piece in your home.', 159.99, 'https://images.unsplash.com/photo-1549887534-1541e9326642?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1765&q=80', 'Decor', 10, ARRAY['Gallery-quality canvas print', 'Stretched over wooden frame', 'Ready to hang (hardware included)'], '{"Dimensions": "36\"W x 24\"H x 1.5\"D", "Weight": "4 lbs", "Material": "Canvas, Wood", "Orientation": "Landscape"}'::JSONB);
