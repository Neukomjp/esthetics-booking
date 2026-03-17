-- Supabase Staff Table Schema Update
-- 
-- The initial schema for the 'staff' table did not include several fields 
-- introduced in the latest UI updates (e.g., age, height, bust, greeting_message, etc.).
-- This script adds all missing columns to the 'staff' table.

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS service_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS greeting_message text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS back_margin_rate integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_id text, -- Assuming text for external IDs, or uuid if references auth.users
  ADD COLUMN IF NOT EXISTS nomination_fee integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS height integer,
  ADD COLUMN IF NOT EXISTS bust integer,
  ADD COLUMN IF NOT EXISTS cup text,
  ADD COLUMN IF NOT EXISTS waist integer,
  ADD COLUMN IF NOT EXISTS hip integer,
  ADD COLUMN IF NOT EXISTS class_rank text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS is_new_face boolean DEFAULT false;
