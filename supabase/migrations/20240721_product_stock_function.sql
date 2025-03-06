
-- Create function to decrease product stock
CREATE OR REPLACE FUNCTION public.decrease_product_stock(product_id INT, quantity INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products 
  SET stock = GREATEST(stock - quantity, 0)
  WHERE id = product_id;
END;
$$;
