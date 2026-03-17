-- Supabase Staff Table RLS Policy Patch
-- 
-- The 'staff' table currently has Row Level Security (RLS) enabled,
-- but lacks any policies, meaning all users (even authenticated merchants)
-- are locked out from inserting, updating, or even viewing staff members.
-- This script fixes that.

-- 1. Drop existing policies on staff table just in case (for idempotency)
DROP POLICY IF EXISTS "Public can view staff" ON staff;
DROP POLICY IF EXISTS "Merchants can manage staff" ON staff;

-- 2. Allow public to view staff (needed for booking pages)
CREATE POLICY "Public can view staff" 
ON staff FOR SELECT 
USING (true);

-- 3. Allow authenticated users (merchants) to insert, update, delete staff
-- In a stricter environment, we would check if they own the store,
-- but for current MVP, checking 'authenticated' role is sufficient and matches 'staff_shifts'.
CREATE POLICY "Merchants can manage staff" 
ON staff FOR ALL 
USING (auth.role() = 'authenticated');
