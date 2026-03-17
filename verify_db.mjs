import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
  console.log('==== データベース整合性検証（Database Integrity Check）====')
  let hasErrors = false
  
  // 1. Check 'news' table
  console.log('\n▶ 検証1: [news] テーブルへのアクセス (Phase 1.5)')
  const { error: newsError } = await supabase.from('news').select('id').limit(1)
  if (newsError) {
    console.error('❌ [news] テーブルへのアクセスに失敗しました。スキーマキャッシュの問題、またはテーブルが存在しない可能性があります。')
    console.error('   詳細:', newsError.message)
    hasErrors = true
  } else {
    console.log('✅ [news] テーブルは正常にアクセス可能です。')
  }

  // 2. Check 'staff' table new columns
  console.log('\n▶ 検証2: [staff] テーブルの拡張カラムへのアクセス (Phase 1 & 1.5)')
  const { error: staffError } = await supabase
    .from('staff')
    .select('age, height, bust, cup, waist, hip, class_rank, twitter_url, is_new_face, images, back_margin_rate, user_id, nomination_fee')
    .limit(1)
    
  if (staffError) {
    console.error('❌ [staff] テーブルの拡張カラムへのアクセスに失敗しました。')
    console.error('   詳細:', staffError.message)
    hasErrors = true
  } else {
    console.log('✅ [staff] テーブルの拡張カラム（年齢、スリーサイズ、SNS、バック率など）は正常にアクセス可能です。')
  }

  // 3. Print overall result
  console.log('\n=========================================')
  if (hasErrors) {
    console.log('⚠️ データベース・スキーマの反映に一部問題があります。SQLの実行モレやキャッシュ未更新の可能性があります。')
  } else {
    console.log('🎉 データベースの整合性チェックに合格しました。すべてのAPIエンドポイントが正常に新しいスキーマを認識しています。')
  }
}

verify()
