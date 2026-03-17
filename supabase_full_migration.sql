-- ============================================================
-- 完全版：本番Supabaseプロジェクト (hgpkvuyzpdpplniksyoi) 用
-- 全テーブルのカラム追加・テーブル作成スクリプト
-- ============================================================

-- ============ 1. staff テーブル ============
ALTER TABLE staff ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS greeting_message text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS years_of_experience integer;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS service_ids uuid[] DEFAULT '{}';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS back_margin_rate integer DEFAULT 0;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS nomination_fee integer DEFAULT 0;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS height integer;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS bust integer;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS cup text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS waist integer;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS hip integer;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS class_rank text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS twitter_url text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_new_face boolean DEFAULT false;

-- ============ 2. services テーブル ============
ALTER TABLE services ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_time_before integer DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_time_after integer DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url text;

-- ============ 3. staff_shifts テーブル ============
ALTER TABLE staff_shifts ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE staff_shifts ADD COLUMN IF NOT EXISTS break_start_time time;
ALTER TABLE staff_shifts ADD COLUMN IF NOT EXISTS break_end_time time;

-- ============ 4. staff_shift_exceptions テーブル（新規作成） ============
CREATE TABLE IF NOT EXISTS staff_shift_exceptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  start_time time,
  end_time time,
  break_start_time time,
  break_end_time time,
  is_holiday boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(staff_id, date)
);

-- RLS設定
ALTER TABLE staff_shift_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view shift exceptions" ON staff_shift_exceptions FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage shift exceptions" ON staff_shift_exceptions FOR ALL USING (auth.role() = 'authenticated');

-- ============ 5. service_options テーブル ============
ALTER TABLE service_options ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE CASCADE;

-- ============ 6. スキーマキャッシュ再読み込み ============
NOTIFY pgrst, 'reload schema';
