
-- Add phone column to user_addresses table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_addresses'
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.user_addresses ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Add tracking_number column to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders'
    AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN tracking_number TEXT;
  END IF;
END $$;
