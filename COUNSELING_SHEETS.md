# カウンセリングシート

添付の鍼灸カルテ2枚を参考に、入力式のカウンセリングシートを追加した。紙面の画像はアプリに同梱していない。項目は入力欄に置き換え、人体図は正面・背面の簡易図を新しく描いている。

## 使い方

1. お客様が顧客アカウントでログインし、マイページの「カウンセリングシート」から対象の店舗を選ぶ。顧客レコードの `auth_user_id` がログイン中のユーザーと一致する場合に表示される。
2. お客様が病歴・症状・主訴を入力し、必要な部位に印を付けて提出する。提出済みの内容は変更せず、訂正時は新しいシートを提出する。
3. スタッフが「顧客管理 → 顧客詳細 → カウンセリングシート」を開く。提出内容を閲覧し、所見・診断・施術部位を追記して保存する。

お客様からの回答は `counseling_sheets`、スタッフの追記は `counseling_staff_notes` に分けて保存する。RLSはお客様に自身の回答だけ、店舗の所属組織メンバーに回答とスタッフ追記へのアクセスを許可する。診断欄はお客様の入力対象に含めていない。

## DBの準備

画面を使う前に [20260923000000_create_counseling_sheets.sql](supabase/migrations/20260923000000_create_counseling_sheets.sql) を対象Supabaseプロジェクトに適用する。適用前でも既存の顧客詳細・マイページは開けるが、シート画面の読み込みや保存はできない。既存の未コミットSQLとは独立したマイグレーションである。

2026-09-23時点の接続先確認: GitHub `Neukomjp/esthetics-booking` の公開Vercelプロジェクト `esthetics-booking-fm7n` は Supabase `esthetics-booking` (`hgpkvuyzpdpplniksyoi`) を使用する。一方、ローカルの `.env.local` は Supabase `salon-booking` (`olsmghkgtmadahvhysly`) を参照する。またローカルの `.vercel/project.json` のプロジェクトIDは、公開VercelプロジェクトのIDと一致しない。DB適用・動作確認・デプロイ時は対象を明示的に照合する。

本番 `esthetics-booking` には2026-09-23にこのSQLを適用済み。SupabaseのTable Editorで2テーブル、Policies画面で各テーブルのRLSと計6ポリシーを確認済み。ローカル設定先の `salon-booking` には未適用。アプリの変更は別途デプロイが必要。

現在の導線はログイン済みで顧客レコードに紐づいたお客様向け。ゲスト予約から後で顧客アカウントを作った場合、自動で既存の顧客レコードと紐づく仕組みはこの変更に含めていない。

## 開発時の確認

```powershell
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm run lint
```

画面で確認する場合は、お客様アカウントと店舗所属スタッフの2種類のログインで、回答の提出、スタッフによる追記、お客様からスタッフ追記が見えないことを確認する。
