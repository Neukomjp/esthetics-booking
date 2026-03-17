-- Phase 1.5 DB Schema Updates

-- 1. Add new fields to staff table
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS bust INTEGER,
ADD COLUMN IF NOT EXISTS cup TEXT,
ADD COLUMN IF NOT EXISTS waist INTEGER,
ADD COLUMN IF NOT EXISTS hip INTEGER,
ADD COLUMN IF NOT EXISTS class_rank TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS is_new_face BOOLEAN DEFAULT false;

-- 2. Create news table
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    url TEXT,
    is_published BOOLEAN DEFAULT true,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS policies for news (Admin can insert/update, public can view)
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active news
CREATE POLICY "Enable public read access for published news" ON news
    FOR SELECT USING (is_published = true);

-- Allow authenticated admins/owners to manage news
CREATE POLICY "Enable full access for authenticated admins on news" ON news
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            JOIN stores s ON s.organization_id = om.organization_id
            WHERE s.id = news.store_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );
