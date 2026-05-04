-- Add Bluesky integration columns to the stores table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='bluesky_handle') THEN
        ALTER TABLE public.stores ADD COLUMN bluesky_handle TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='bluesky_app_password') THEN
        ALTER TABLE public.stores ADD COLUMN bluesky_app_password TEXT;
    END IF;
END $$;
