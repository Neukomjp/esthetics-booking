---
description: Gitブランチ運用ワークフロー - ブランチの作成・マージ・削除の手順
---

# Git ブランチ運用ワークフロー

## ブランチ命名規則

| プレフィックス | 用途 | 例 |
|--------------|------|-----|
| `feature/` | 新機能の開発 | `feature/online-payment` |
| `fix/` | バグ修正 | `fix/booking-calendar-error` |
| `refactor/` | コードの整理・改善 | `refactor/reserve-client` |
| `hotfix/` | 本番の緊急修正 | `hotfix/login-crash` |
| `chore/` | 設定変更・依存更新等 | `chore/update-dependencies` |

## 基本フロー

### 1. 作業開始時：ブランチを作成

```bash
# mainを最新にする
git checkout main
git pull origin main

# 新しいブランチを作成して切り替え
git checkout -b feature/作業内容を英語で簡潔に
```

### 2. 作業中：こまめにコミット

```bash
# 変更をステージング
git add .

# コミット（日本語でもOK）
git commit -m "feat: 予約フローにステップ表示を追加"
```

#### コミットメッセージのプレフィックス

- `feat:` - 新機能
- `fix:` - バグ修正
- `refactor:` - リファクタリング
- `chore:` - 雑務（設定変更等）
- `docs:` - ドキュメント更新
- `style:` - 見た目の変更（CSSなど）

### 3. 作業完了：mainにマージ

```bash
# mainに切り替え
git checkout main
git pull origin main

# ブランチをマージ
git merge feature/作業内容

# リモートにプッシュ
git push origin main

# 不要になったブランチを削除
git branch -d feature/作業内容
```

### 4. 競合が発生した場合

```bash
# マージ中に競合が起きたら
# 1. 競合ファイルを手動で修正
# 2. 修正を反映
git add .
git commit -m "merge: resolve conflicts"
```

## 注意事項

- **mainブランチに直接コミットしない**
- **1つのブランチでは1つの目的の作業のみ行う**
- **作業開始前に必ず `git pull origin main` で最新化する**
- **DBマイグレーションを含む変更は特に慎重にブランチを分ける**
