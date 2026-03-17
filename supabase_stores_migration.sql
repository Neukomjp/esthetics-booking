-- ============================================================
-- stores テーブルの不足カラム追加
-- 正しいSupabaseプロジェクト (hgpkvuyzpdpplniksyoi) で実行
-- ============================================================

-- stores テーブル
ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS theme_color text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS booking_interval_minutes integer DEFAULT 30;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS business_days jsonb DEFAULT '[]'::jsonb;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS cross_store_buffers jsonb DEFAULT '{}'::jsonb;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS organization_id uuid;

-- news テーブル（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS news (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text,
  image_url text,
  url text,
  is_published boolean DEFAULT false,
  published_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public can view published news" ON news FOR SELECT USING (is_published = true);
CREATE POLICY IF NOT EXISTS "Authenticated can manage news" ON news FOR ALL USING (auth.role() = 'authenticated');

-- organizations テーブル（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS organizations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  branding jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public can view organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated can manage organizations" ON organizations FOR ALL USING (auth.role() = 'authenticated');

-- organization_members テーブル（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, user_id)
);
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Authenticated can view own memberships" ON organization_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Authenticated can manage memberships" ON organization_members FOR ALL USING (auth.role() = 'authenticated');

-- キャッシュ再読み込み
NOTIFY pgrst, 'reload schema';
