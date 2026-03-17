-- Fix missing instagram_url column in the staff table
-- 
-- The initial schema included this column in the CREATE TABLE statement,
-- but the user's live database seems to be missing it entirely for some reason.

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS instagram_url text;
