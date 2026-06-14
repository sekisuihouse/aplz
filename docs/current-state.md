# APLZ 現行仕様・技術資料

最終確認日: 2026-06-12

この資料は、現行の仕様・デザイン・技術スタックをできるだけ保ったまま大幅アップデートするための基準資料です。コードから確認できる内容を中心にまとめています。

## 1. プロダクト概要

APLZ は、AI で作った Web アプリや手元の HTML/ZIP アプリを公開し、他ユーザーからフィードバックを受け取るためのプラットフォームです。

主な体験は次の通りです。

- トップページで公開アプリを一覧表示する
- `/new` のエディタで HTML アプリを AI と一緒に作成する
- `/publish` で HTML または ZIP をアップロードして公開する
- `/apps/[slug]` で公開アプリを iframe 表示し、評価・リアクション・コメントを受ける
- `/apps/[slug]/edit` で自分の公開アプリを編集・再公開する
- コミュニティ単位でアプリを公開・閲覧する
- API トークンを発行し、MCP サーバー経由で AI ツールから公開する

## 2. 技術スタック

### Web アプリ本体

- フレームワーク: Next.js 16.1.6
- UI: React 19.2.3
- 言語: TypeScript
- ルーティング: Next.js App Router
- スタイリング: Tailwind CSS v4, PostCSS
- フォント: DM Sans, JetBrains Mono, Baloo 2
- アイコン: lucide-react
- エディタ: @monaco-editor/react
- ZIP 処理: jszip
- ID 生成: nanoid

### バックエンド/外部サービス

- API 実装: Next.js Route Handlers
- 認証: Supabase Auth
- DB: Supabase Postgres
- ファイルストレージ: Cloudflare R2
- R2 接続: @aws-sdk/client-s3
- AI 編集: Anthropic Messages API
- MCP: @modelcontextprotocol/sdk, zod

### 開発コマンド

```bash
npm run dev
npm run build
npm run start
npm run lint
```

### 主な環境変数

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `ANTHROPIC_API_KEY`
- MCP 側: `APLZ_API_TOKEN`
- MCP 側任意: `APLZ_API_BASE`

## 3. サーバー/インフラ構成

APLZ のアプリ本体は Next.js の Node.js サーバーとして動きます。ローカルでは `next dev`、本番では `next build` 後に `next start` できる構成です。

ただし、実際の機能は複数サービスに分散しています。

- Next.js: 画面表示、API、SSR、middleware
- Supabase: Auth、DB
- Cloudflare R2: 公開アプリの HTML/ZIP 展開ファイル、プロフィール画像
- Anthropic: エディタ内の AI 編集
- MCP サーバー: Claude Desktop / Claude Code / Cursor などから APLZ に公開するための別 Node.js パッケージ

リポジトリ内には `vercel.json`、Dockerfile、Render/Fly/Railway などの明示的なデプロイ設定はありません。README は create-next-app の初期文面が残っています。

## 4. 画面構成

### `/`

公開アプリ一覧ページです。

- Hero にロゴ、コピー、主要 CTA を表示
- CTA は「AIでアプリを作る」と「ファイルをアップロード」
- 公開アプリをグリッド表示
- `AppCard` は iframe サムネイル、タイトル、作者、評価、コメント数、日付、バージョンを表示
- `apps.is_public = true` のアプリを新着順に最大 30 件表示

### `/new`

新規アプリ作成エディタです。

- 初期 HTML テンプレートから開始
- 左/中央/右のエディタ体験を `EditorLayout` が管理
- AI チャットで HTML 全体を更新
- プレビュー iframe でクリックした要素を選択し、スタイル編集できる
- undo/redo と履歴あり
- 新規公開時は `/api/publish` に HTML 内容を送信する

### `/publish`

HTML/ZIP アップロード公開ページです。

- ドラッグ&ドロップまたはクリックで `.html` / `.zip` を選択
- アプリ名、説明、公開先を入力
- オープン公開とコミュニティ公開を選択可能
- 公開後に直接起動 URL とフィードバックページ URL を表示

### `/apps/[slug]`

アプリ詳細ページです。

- R2 上の `/{slug}/index.html` を iframe 表示
- アプリ名、説明、作者、バージョン、更新日を表示
- 所有者の場合は編集リンクを表示
- 新しいタブで開く、QR コード、編集導線あり
- リアクション、評価、コメント、関連アプリを表示
- desktop では関連アプリを右サイドバー、mobile では下部に表示

### `/apps/[slug]/edit`

公開済みアプリの編集ページです。

- 所有者のみ編集できる想定
- 既存ソースを取得して `EditorLayout` に渡す
- 保存/再公開で `PUT /api/publish` を使う
- バージョン番号と `last_published_at` を更新する

### `/login`

ログインページです。

- Google OAuth
- メール OTP / magic link
- ログイン後は `/auth/callback` を経由

### `/profile`

プロフィール設定ページです。

- 表示名などのプロフィール情報を更新
- 画像アップロードは R2 を使う

### `/settings/api-token`

API トークン設定ページです。

- `aplz_...` 形式のトークンを生成
- トークンは生成時のみ表示
- MCP サーバーのセットアップ例を表示

### `/c/[slug]`

コミュニティページです。

- コミュニティ内アプリを一覧表示
- private community はログインと membership が必要
- メンバーでない場合は招待コード参加導線を表示
- コミュニティ向け公開リンクは `/publish?community=[slug]`

### `/c/join`

コミュニティ参加ページです。

- 招待コードでコミュニティに参加する導線

### `/templates`

テンプレートページです。現時点ではナビに導線があります。

## 5. 現行デザインの特徴

### 全体トーン

- 白背景中心
- 控えめなグレー階調
- 角丸 8px 前後の UI
- 余白は広めだが、一覧は密度高め
- 装飾は少なく、プロダクト UI として静かな印象
- ロゴとブランドカラーで個性を出している

### ブランド要素

- ブランド名: APLZ
- ロゴ: 青と赤の交差する曲線 + 中央ドット
- ロゴフォント: Baloo 2
- 主要カラー:
  - Primary blue: `#1B4F72`
  - Primary blue hover: `#15415F`
  - Accent red: `#B83232`
  - Text: `#0f0f0f`, `#1a1a1a`
  - Secondary text: `#606060`
  - Muted text: `#909090`
  - Border: `#e5e5e5`
  - Surface: `#f5f5f5`
  - White: `#ffffff`

### レイアウト

- Header は sticky、白 80% + backdrop blur
- Header 高さは 64px
- Header 内幅は `max-w-5xl`
- 一覧ページや詳細ページは `max-w-[1800px]`
- アプリ一覧は 2〜7 カラムの responsive grid
- 詳細ページは desktop でメイン + 右サイドバー、mobile で縦積み
- アプリ iframe は詳細で 16:9、カードで 16:10

### コンポーネント傾向

- ボタン: `rounded-lg`, primary は青地白文字
- 入力: `bg-[#f5f5f5]`, `border-[#e5e5e5]`, focus はグレーまたは青
- カード: 白背景、薄い border、hover shadow
- Dropdown: 白背景、薄い border、shadow
- Animation: `animate-fade-in` のみ。過度な動きはない

### デザイン維持の注意

大幅アップデートでも、次の要素は維持すると現行の印象を保ちやすいです。

- 白背景 + グレー UI + primary blue の比率
- `rounded-lg` 中心の角丸
- Header の sticky / blur / thin border
- アプリカードの iframe サムネイル
- 一覧の密度感
- APLZ ロゴの Baloo 2 と青赤曲線
- テキストサイズは控えめにし、hero 以外で大きくしすぎない

## 6. 認証/権限

### 認証方式

- Supabase Auth
- Google OAuth
- メール OTP / magic link
- SSR Cookie ベースの auth client を使用

### middleware の保護対象

- `/publish`
- `/apps/*/edit`
- `/profile`
- `/c/join`
- `/login` はログイン済みユーザーを `/` にリダイレクト

### API トークン認証

`/api/publish` と `/api/apps/mine` は Bearer token に対応しています。

- `Authorization: Bearer aplz_...`
- `api_tokens` テーブルで token を検索
- `last_used_at` を更新
- MCP サーバーからの公開・一覧取得・フィードバック取得で使用

## 7. データモデル

コードから確認できる主なテーブルです。正式な migration/schema ファイルはリポジトリ内に見当たりません。

### `apps`

主な用途: 公開アプリのメタデータ

確認できる主なカラム:

- `id`
- `name`
- `description`
- `slug`
- `author_token`
- `file_count`
- `community_id`
- `user_id`
- `author_name`
- `is_public`
- `version`
- `last_published_at`
- `created_at`

### `profiles`

主な用途: ユーザープロフィール

確認できる主なカラム:

- `id`
- `display_name`
- `avatar_url`

### `comments`

主な用途: アプリへのコメント

確認できる主なカラム:

- `id`
- `app_id`
- `content`
- `created_at`

### `ratings`

主な用途: 3 軸評価

確認できる主なカラム:

- `app_id`
- `usability`
- `design`
- `idea`

平均評価は `usability + design + idea` を回答数と 3 で割って算出しています。

### `reactions`

主な用途: アプリへのリアクション

確認できる主なカラム:

- `id`
- `app_id`
- `emoji`

`LEGACY_EMOJI_MAP` により旧 emoji 形式も新 reaction type に変換しています。

### `communities`

主な用途: コミュニティ管理

確認できる主なカラム:

- `id`
- `name`
- `slug`
- `description`
- `is_private`

### `community_members`

主な用途: コミュニティ参加状態

確認できる主なカラム:

- `id`
- `community_id`
- `user_id`

### `api_tokens`

主な用途: MCP/API 利用トークン

確認できる主なカラム:

- `id`
- `user_id`
- `token`
- `name`
- `created_at`
- `last_used_at`

## 8. API 仕様

### `GET /api/apps`

公開アプリ一覧を返します。

- `apps` を新着順に最大 30 件取得
- コメント数、リアクション数を集計

### `GET /api/apps/mine`

自分が公開したアプリ一覧を返します。

- Cookie auth または Bearer token 対応
- MCP の `list_apps` から利用

### `GET /api/apps/[slug]/feedback`

対象アプリの評価・コメント・リアクションを返します。

- MCP の `get_feedback` から利用

### `GET /api/apps/[slug]/source`

R2 上の `index.html` を取得して返す用途です。

### `POST /api/publish`

新規公開 API です。

対応形式:

- `application/json`: `html_content` を直接公開
- `multipart/form-data`: `.html` または `.zip` を公開

主な処理:

- Bearer token または Cookie auth でユーザー特定
- ZIP の場合は `index.html` の存在を必須にする
- `__MACOSX` と dotfile 系は除外
- 単一 root folder は strip する
- R2 に `/{slug}/...` としてアップロード
- Supabase `apps` にメタデータを保存
- `app_url` と `platform_url` を返す

### `PUT /api/publish`

公開済みアプリの更新 API です。

- 所有者のみ更新可能
- JSON または FormData 対応
- R2 の HTML/ZIP ファイルを更新
- `apps.version` を increment
- `last_published_at` を更新

### `POST /api/ai-edit`

AI 編集 API です。

- Anthropic Messages API を呼び出す
- 入力: `code`, `prompt`
- prompt 最大 500 文字
- code 最大 100KB
- AI には完全な HTML と日本語 summary を JSON 形式で返すよう指示
- JSON parse 失敗時は raw HTML として fallback

### `GET /api/communities`

コミュニティ一覧を返します。

- `mine=true` の場合はログインユーザーが所属するコミュニティのみ
- 通常は全コミュニティ

### `POST /api/communities/join`

招待コードなどを使ったコミュニティ参加 API です。

### `GET/POST/DELETE /api/settings/api-token`

API トークン管理 API です。

- `GET`: 自分の token metadata 一覧
- `POST`: token 作成。完全な token はこのレスポンスでのみ返す
- `DELETE`: token 削除

### `POST /api/comments`

コメント投稿 API です。

### `POST /api/ratings`

評価投稿 API です。

### `POST /api/reactions`

リアクション投稿/切り替え API です。

### `GET /api/related-apps`

関連アプリ取得 API です。

### `GET/POST /api/profile`

プロフィール取得・更新 API です。画像アップロード時は R2 を使います。

## 9. 公開ファイルの保存形式

公開アプリは Cloudflare R2 に次のようなキーで保存されます。

```text
{slug}/index.html
{slug}/assets/...
```

アプリ詳細ページでは次の URL を iframe に読み込んでいます。

```text
{R2_PUBLIC_URL}/{slug}/index.html
```

カードのサムネイルも同じ HTML を iframe で縮小表示しています。

## 10. エディタ仕様

### `EditorLayout`

新規作成と編集の共通レイアウトです。

主な状態:

- `code`
- `previewCode`
- `chatMessages`
- `aiPrompt`
- `undoStack`
- `redoStack`
- `selectedElement`
- `showPublishModal`

主な機能:

- 300ms debounce でプレビュー更新
- Cmd/Ctrl+Z と Cmd/Ctrl+Shift+Z
- AI 編集前の履歴保存
- 最大 50 件の履歴
- style editor と code editor の切り替え

### `PreviewPanel`

iframe `srcDoc` で HTML を表示します。

選択モードが有効な場合、HTML に script を注入して次を実現します。

- iframe 内クリックで対象要素を outline
- computed style を parent に `postMessage`
- parent から `apply-style` message を受けて inline style を変更

### `ChatPanel`

AI 指示入力と会話履歴です。

- user は青背景
- assistant はグレー背景
- loading は「考え中...」
- Enter で送信

## 11. MCP サーバー

`mcp-server` は Web 本体とは別の Node.js パッケージです。

主な用途:

- Claude Desktop / Claude Code / Cursor などから APLZ にアプリを公開する
- 公開済みアプリ一覧を取得する
- フィードバックを取得する
- 公開済みアプリを更新する

主な tool:

- `publish_app`
- `list_apps`
- `get_feedback`
- `update_app`

デフォルト API base は `https://aplz.dev` です。`APLZ_API_BASE` で変更できます。

## 12. 現行の強み

- 機能の主軸が明確: 作る、公開する、見てもらう、直す
- R2 に静的アプリを置く構成なので公開物の配信がシンプル
- Supabase によって auth と DB がコンパクトにまとまっている
- MCP 連携があり、AI ツールからの公開導線がある
- iframe サムネイルにより一覧で実際のアプリの雰囲気が伝わる
- デザインが控えめで、機能追加しても破綻しにくい

## 13. 現行の弱点/アップデート時の注意

- README が実態と合っていない
- DB schema/migration がリポジトリにない
- Supabase の型生成が使われていない
- API route 内で同じような auth/user 取得処理が重複している
- Service role client を多く使っているため、RLS と責務分離の確認が必要
- `api_tokens.token` は平文保存に見えるため、hash 保存を検討したい
- iframe sandbox は機能上広めに許可されているため、セキュリティ設計の明文化が必要
- AI 編集は HTML 全体差し替え方式なので、大きいアプリや複数ファイル編集には弱い
- ZIP 更新時に古い R2 オブジェクト削除の扱いがコード上明確ではない
- 一覧ページで rating/profile を別クエリ集計しており、データ増加時は最適化余地がある
- `mcp-server/package.json` の package name と README の `@aplz/mcp-server` 表記に差がある
- 一部 `.DS_Store` がリポジトリ内に存在する

## 14. 大幅アップデート時に守るべき互換性

### URL 互換

維持したい URL:

- `/`
- `/new`
- `/publish`
- `/apps/[slug]`
- `/apps/[slug]/edit`
- `/login`
- `/profile`
- `/settings/api-token`
- `/c/[slug]`
- `/c/join`
- `/templates`

### API 互換

MCP や外部連携のため、特に次は壊さない方がよいです。

- `POST /api/publish`
- `PUT /api/publish`
- `GET /api/apps/mine`
- `GET /api/apps/[slug]/feedback`
- `GET /api/settings/api-token`
- `POST /api/settings/api-token`

### データ互換

既存公開アプリの前提:

- R2: `{slug}/index.html`
- DB: `apps.slug`
- 詳細 URL: `/apps/{slug}`
- 直接起動 URL: `{R2_PUBLIC_URL}/{slug}/index.html`

この形式を変える場合は migration と redirect、MCP 互換を同時に設計する必要があります。

## 15. 推奨アップデート方針

現行デザインを保ったまま大幅アップデートするなら、次の順序が安全です。

1. README と docs を実態に合わせる
2. Supabase schema/migration と型生成を導入する
3. auth helper と API error handling を共通化する
4. UI コンポーネントの色・余白・ボタン・入力を小さな design token に整理する
5. 公開/更新処理を service layer に分離する
6. R2 の old object cleanup と versioning 方針を決める
7. エディタを単一 HTML から複数ファイル対応へ拡張するか判断する
8. MCP API 互換を保ったまま、機能追加する
9. 主要導線の Playwright/e2e test を追加する

## 16. 参照すべき主要ファイル

- `package.json`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/new/page.tsx`
- `src/app/publish/page.tsx`
- `src/app/apps/[slug]/page.tsx`
- `src/app/apps/[slug]/edit/page.tsx`
- `src/app/c/[slug]/page.tsx`
- `src/app/components/AppCard.tsx`
- `src/app/components/WorkspaceSwitcher.tsx`
- `src/app/components/editor/EditorLayout.tsx`
- `src/app/components/editor/PreviewPanel.tsx`
- `src/app/api/publish/route.ts`
- `src/app/api/ai-edit/route.ts`
- `src/lib/supabase.ts`
- `src/lib/supabase-server.ts`
- `src/lib/r2.ts`
- `src/middleware.ts`
- `mcp-server/src/index.ts`

