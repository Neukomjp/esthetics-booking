-- エステ・キャスト向けシステム：フェーズ1 アップデート用SQL
-- Supabaseの SQL Editor でこの内容を貼り付けて RUN してください。
-- （※既存のデータは消えずに新しい項目だけが追加されます）

-- 1. キャスト（staff）テーブルに新しい機能用の枠を追加
ALTER TABLE public.staff
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS back_margin_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS nomination_fee INTEGER DEFAULT 0;

-- 2. 予約（bookings）テーブルにお金計算用の枠を追加
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS nomination_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cast_back_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS course_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS options_amount INTEGER DEFAULT 0;

-- 完了メッセージを出すためのダミー出力（そのままRunしてください）
SELECT 'Phase 1 Database Update Completed!' as status;
