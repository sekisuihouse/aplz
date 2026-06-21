# Supabase を1から作る手順

APLZ を新しい Supabase project で動かすための手順です。

## 重要な前提

新しい Supabase を作ると、DB は空です。

既存の `aplz.dev` に表示されていたアプリ一覧、コメント、評価、プロフィール、APIトークン、コミュニティ情報は新DBには入りません。既存データを引き継ぐ場合は旧 Supabase から export/import が必要です。

空で始めるなら、この手順だけで進められます。

## 1. Supabase project を作る

Supabase Dashboard で新しい project を作成します。

控える値:

- Project URL
- anon public key
- service role key

## 2. SQL Editor で migration を実行

SQL Editor で、次の順番で SQL を実行します。

### 1本目: 既存APLZ機能用

`supabase/migrations/202606120000_initial_core_schema.sql`

この migration は次の既存機能用テーブルを作ります。

- `profiles`
- `communities`
- `apps`
- `comments`
- `ratings`
- `reactions`
- `community_members`
- `api_tokens`

### 2本目: 困りごとプラットフォーム用

`supabase/migrations/202606120001_request_platform.sql`

この migration は次の新機能用テーブルを作ります。

- `requests`
- `solutions`
- `request_comments`
- `solution_feedback`
- `notifications`
- `reports`

### 3本目: Data API 権限

`supabase/migrations/202606170001_data_api_grants.sql`

この migration は Supabase project 作成時に `Automatically expose new tables` をOFFにした場合に必要な Data API 権限を追加します。

RLS は各テーブルの policy で引き続き制御されます。

### 4本目: アクセス・プロダクト分析

`supabase/migrations/202606210001_product_analytics.sql`

このmigrationは次の分析テーブルを作ります。

- `analytics_visitors`
- `analytics_sessions`
- `analytics_events`

IPアドレス、メールアドレス、投稿本文、検索語は保存しません。分析テーブルはservice role経由のサーバーAPIだけが読み書きし、anon/authenticatedからの直接アクセスは許可しません。

### schema cache reload

各 migration の最後にも入っていますが、反映されない場合は最後にこれを実行します。

```sql
notify pgrst, 'reload schema';
```

## 3. Auth 設定

Supabase Dashboard の Authentication 設定で、最低限次を設定します。

Site URL:

```text
https://aplz.dev
```

Redirect URLs:

```text
https://aplz.dev/auth/callback
http://localhost:3000/auth/callback
```

Google login を使うなら、Authentication Providers で Google provider を有効化し、Google Cloud 側の OAuth redirect URI に Supabase の callback URL を設定します。

## 4. `.env.local` を新Supabaseへ差し替え

ローカルの `.env.local` を新 project の値に差し替えます。

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

R2 と Anthropic は今のまま使うなら変更不要です。

```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=...
ANTHROPIC_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

本番では `NEXT_PUBLIC_APP_URL` を次にします。

```env
NEXT_PUBLIC_APP_URL=https://aplz.dev
```

## 5. Vercel 環境変数も差し替え

Vercel Project Settings の Environment Variables にも、新 Supabase の値を入れます。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- 任意: `ADMIN_EMAILS`

`ADMIN_EMAILS` は `/admin/reports` を見る管理者メールをカンマ区切りで入れます。

例:

```env
ADMIN_EMAILS=you@example.com
```

## 6. ローカル確認

```bash
npm run dev
```

この環境で `npm` が PATH にない場合:

```bash
PATH=/opt/homebrew/bin:$PATH npm run dev
```

確認するページ:

- `http://localhost:3000`
- `http://localhost:3000/requests`
- `http://localhost:3000/requests/new`
- `http://localhost:3000/publish`
- `http://localhost:3000/new`

DBのテーブルが揃っているかは次で確認できます。

```bash
npm run check:supabase
```

この環境で `npm` が PATH にない場合:

```bash
PATH=/opt/homebrew/bin:$PATH npm run check:supabase
```

## 7. よくあるエラー

### `Could not find the table 'public.requests' in the schema cache`

原因:

- migration 未実行
- migration の実行順が逆
- schema cache が更新されていない

対応:

1. `202606120000_initial_core_schema.sql` を実行
2. `202606120001_request_platform.sql` を実行
3. `notify pgrst, 'reload schema';` を実行

分析画面でテーブルエラーが出る場合は、`202606210001_product_analytics.sql` も実行してください。

### `403 permission denied for table ...`

原因:

- Supabase project 作成時に `Automatically expose new tables` をOFFにした
- テーブルは存在するが、Data API 用 role にDB権限が付いていない

対応:

1. `202606170001_data_api_grants.sql` を実行
2. `notify pgrst, 'reload schema';` を実行

### ログイン後に戻れない

原因:

- Supabase Auth の Redirect URL が不足

対応:

Supabase Authentication の Redirect URLs に追加します。

```text
https://aplz.dev/auth/callback
http://localhost:3000/auth/callback
```

### 本番だけ古い表示のまま

原因:

- Vercel が別 GitHub repo を見ている
- Vercel deploy が blocked
- `aplz.dev` が別 Vercel project に紐づいている

対応:

- Vercel Project の Git repository が現在の repo か確認
- Deployments で最新 commit がデプロイされているか確認
- Domains で `aplz.dev` / `www.aplz.dev` が対象 project に紐づいているか確認
