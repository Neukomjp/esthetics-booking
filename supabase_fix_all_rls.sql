-- ==============================================================================
-- Comprehensive RLS Security Fix
-- Description: Dynamically enables Row-Level Security (RLS) on ALL tables in the public schema.
--              This addresses the "Table publicly accessible" security vulnerability.
-- ==============================================================================
-- IMPORTANT: Execute this ENTIRE script in Supabase Dashboard > SQL Editor
-- ==============================================================================

DO $$ 
DECLARE 
    t record;
BEGIN
    -- Loop through all tables in the 'public' schema
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        -- Enable RLS for each table
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.tablename);
        
        -- Print confirmation to the console (visible in SQL editor output)
        RAISE NOTICE 'Enabled RLS on table: public.%', t.tablename;
    END LOOP;
END $$;
