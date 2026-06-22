# APLZ 現状統合資料

最終確認日: 2026-06-22（JST）

対象: `https://aplz.dev` / GitHub `sekisuihouse/aplz` の `main` ブランチ

確認コミット: `8f7551c5b50600de5c896eaa319f181fa919eb93` (`chore: remove demo seeding`)

このファイルは、APLZの目的、仕様、画面、ユーザーフロー、技術、データ、インフラ、SEO、コンテンツ、運用状況、既知の課題を一か所で把握するための基準資料である。コード、Supabase、本番サイトを実測した内容を優先し、将来構想や過去仕様とは分けて記載する。

## 1. 現在の結論

APLZは、日常や現場の「外注するほどではないが、繰り返し面倒なこと」を投稿し、開発者が質問・回答・小さなWebアプリの提案を行うプラットフォームである。

現在の中心フローは次のとおり。

1. 投稿者が困りごとを書く
2. 開発者がコメント欄で気軽に質問する
3. 投稿者または他の利用者が回答する
4. 開発者が既存アプリまたは外部URLを解決案として投稿する
5. 投稿者が解決案を試し、フィードバックする
6. 投稿者が解決案を採用し、困りごとを解決済みにする

重要な現状:

- `/new` の「AIでアプリを作る」機能は廃止済み。アクセス時は困りごとページへ転送される。
- HTML/ZIPをアップロードする `/publish` は現在も残っている。
- アプリ詳細、編集、評価、コメント、リアクション機能も残っている。
- 本番DBには困りごと3件、解決案2件、アプリ2件がある。
- デモ用アカウント・デモ投稿・デモアプリは削除済み。
- Supabase自社アクセス解析を実装済み。2026-06-21以前の訪問履歴は遡って取得できない。
- コンテンツメディアとして記事210本、用途別ページ11本、無料ツール20本を公開対象にしている。
- 記事は実行時に共通の補足セクションを追加し、3,000文字以上にしている。ただし内容の反復と一次情報不足が残る。

## 2. プロダクトの目的と対象

### 2.1 提供価値

APLZが扱うのは、大規模なシステム導入ではなく、次のような小さな課題である。

- 町内会の当番表
- 学校や委員会の集計
- イベント受付や参加者整理
- 個人事業主の仕込み量、予約、チェックリスト
- LINE・紙・Excelで分散した連絡や記録
- 定型文、画像、資料の小さな作成作業

投稿者は完成した仕様書を書く必要がない。まず困っている作業を短く投稿し、不足情報は会話で補う設計である。

### 2.2 主な利用者

- 困りごとを投稿する人
- 困りごとに質問・回答する人
- Webアプリや既存ツールを提案する開発者
- 公開されたアプリを利用・評価する人
- 通報を確認する管理者
- 記事、用途別ページ、無料ツールを検索から読む一般ユーザー

### 2.3 現在のユーザー種別

アプリ内では、固定された複数アカウント種別より、プロフィール属性と行動で役割を表す。

- 通常ユーザー: `profiles.role = 'user'` が初期値
- 開発参加を希望するユーザー: `profiles.developer_enabled = true`
- 管理者: `ADMIN_EMAILS` 環境変数に含まれるメールアドレス
- コミュニティ内権限: `community_members.role`

本番の `profiles` は現在1件で、管理者ロールを設定済み。認証ユーザーは1件で、認証方式はメールである。

## 3. 投稿者の利用フロー

### 3.1 困りごとの発見から投稿まで

1. トップ、困りごと一覧、テンプレート、記事などから「困りごとを書く」を選ぶ。
2. 未ログインの場合は `/login?mode=signup&next=/requests/new` に移動する。
3. Googleまたはメールリンクで新規登録・ログインする。
4. 認証後、元の `/requests/new` に戻る。
5. 必須のタイトルと期限を入力する。
6. カテゴリ、説明、個人情報レベルを入力する。
7. 必要に応じて詳細項目を開いて入力する。
8. 投稿後、困りごと詳細ページへ移動する。

### 3.2 投稿フォーム

必須:

- タイトル
- 期限

主要項目:

- カテゴリ
- いま困っていることの説明
- 個人情報レベル

任意の詳細:

- どうなったら嬉しいか
- 現在のやり方
- 面倒な点
- 入力データ
- 出力結果
- 誰が困っているか
- 使用頻度
- 参考URL
- 初心者向け回答を歓迎するか

投稿例として、当番表、アンケート集計、イベント参加者整理の3パターンを用意している。投稿完了条件を画面内で示し、タイトル・期限・安全確認の進捗を表示する。

### 3.3 投稿後

- 投稿者はステータスを変更できる。
- 他ユーザーからの質問に回答できる。
- 解決案を確認できる。
- 解決案へ「使えた」「ありがとう」「作業が楽になった」「わかりやすかった」「また使いたい」「修正してほしい」「使えなかった」の反応を送れる。
- 解決案を採用できる。
- 不適切な投稿、回答、アプリを通報できる。

## 4. 開発者の利用フロー

1. `/requests?filter=unsolved` などで未解決の困りごとを探す。
2. 詳細ページで期限、個人情報レベル、現在の方法、希望結果を確認する。
3. 情報が足りなければ「質問」として短いコメントを投稿する。
4. 外部で作ったアプリURL、または自分がAPLZへ公開したアプリを解決案として登録する。
5. 必要に応じて説明、使い方、できること、できないこと、取扱データ、通信・保存の有無、推奨環境、注意事項を書く。
6. 投稿者からのフィードバックや追加質問へ返答する。

現在、APLZ内でゼロからアプリを作るエディタへの導線はない。アプリ回答は次のどちらかになる。

- 外部URLを提案する
- `/publish?request=...` からHTML/ZIPをアップロードし、困りごとへ紐づける

## 5. 認証とアカウント

### 5.1 認証方式

- Supabase Auth
- Google OAuth
- メールOTP / Magic Link
- パスワード不要
- Next.jsサーバー側ではCookieベースのSSR認証を使用

ログイン画面には「ログイン」と「新規登録」の明示的な切替がある。ログインでは未登録メールからユーザーを作らず、新規登録時だけ `shouldCreateUser = true` にする。

### 5.2 認証コールバック

- URL: `/auth/callback`
- Supabaseの認証コードをセッションへ交換する。
- `next` パラメータがあれば、認証前に開いていた画面へ戻す。
- 認証に失敗した場合は `/login?error=auth` へ移動する。

### 5.3 プロフィール

保存項目:

- 表示名
- 自己紹介
- プロフィール画像
- GitHub URL
- SNS URL
- WebサイトURL
- 開発者として参加するか
- スキルカテゴリ（最大12件）

画像はJPG/JPEG/PNG/WebP、最大2MBで、Cloudflare R2へ保存する。

### 5.4 保護対象ページ

未ログイン時にログイン画面へ送るページ:

- `/publish`
- `/apps/[slug]/edit`
- `/profile`
- `/c/join`
- `/requests/new`
- `/dashboard`
- `/admin/reports`

ログイン済みで `/login` を開くと `/` へ移動する。

## 6. 画面一覧

### 6.1 公開ページ

| URL | 現在の役割 |
| --- | --- |
| `/` | APLZの説明、世界観、3つの利用目的への入口。困りごと・アプリの一覧は表示しない |
| `/for-requesters` | 困りごとを書く人向けの説明、投稿手順、安全上の注意、投稿導線 |
| `/for-developers` | 開発者向けの参加方法、回答手順、安全上の注意、未解決一覧への導線 |
| `/find-apps` | アプリを探す人向けの説明、公開アプリ・無料ツール・用途別ページへの導線 |
| `/requests` | 困りごと一覧。検索、状態、カテゴリ、個人情報、頻度、期限などで絞り込み |
| `/requests/[slug]` | 困りごと詳細、質問・回答、解決案、採用、フィードバック、通報 |
| `/apps` | 公開アプリ一覧 |
| `/apps/[slug]` | アプリ実行、説明、評価、リアクション、コメント、関連アプリ |
| `/templates` | 職種別の困りごと例。教育、医療、建設、飲食、農業など |
| `/use-cases` | 用途別ページ一覧 |
| `/use-cases/[slug]` | 用途ごとの課題、考え方、投稿例、FAQ |
| `/articles` | 記事一覧 |
| `/articles/[slug]` | 記事本文、目次、FAQ、構造化データ、関連導線 |
| `/tools` | 無料ツール一覧 |
| `/tools/[slug]` | ブラウザ内で動く無料ツール |
| `/c/[slug]` | コミュニティ詳細・コミュニティ内アプリ |
| `/login` | ログイン・新規登録 |

### 6.2 ログイン後ページ

| URL | 現在の役割 |
| --- | --- |
| `/requests/new` | 困りごと投稿 |
| `/publish` | HTML/ZIPアプリのアップロードと公開 |
| `/apps/[slug]/edit` | 所有アプリの編集・再公開 |
| `/profile` | プロフィール編集 |
| `/dashboard` | 自分の投稿、解決案、通知などの確認 |
| `/settings/api-token` | APIトークン発行・管理 |
| `/c/join` | 招待コードでコミュニティ参加 |
| `/admin/reports` | 管理者向け通報一覧 |

### 6.3 廃止・互換ルート

| URL | 状態 |
| --- | --- |
| `/new` | 廃止済み。`request` があれば該当困りごとへ、それ以外は `/requests` へ転送 |

AIエディタのコンポーネントと `/api/ai-edit` はリポジトリに残っているが、通常UIから新規作成には使われない。完全削除はまだ行っていない。

## 7. 困りごと・回答の状態と分類

### 7.1 カテゴリ

- 集計
- 予約・申込
- 当番表
- イベント運営
- 学校・委員会
- 町内会
- 個人事業主
- 文章作成
- 画像・資料
- その他

### 7.2 ステータス

| DB値 | 表示 |
| --- | --- |
| `open` | 募集中 |
| `questions` | 質問あり |
| `in_progress` | 作成中 |
| `answered` | 回答あり |
| `testing` | 試用中 |
| `solved` | 解決済み |
| `on_hold` | 保留 |
| `hidden` | 非公開 |

### 7.3 個人情報レベル

| DB値 | 表示 |
| --- | --- |
| `none` | 個人情報なし |
| `low` | 注意 |
| `medium` | 要注意 |
| `high` | 高リスク |
| `unknown` | 不明 |

高リスクを選ぶと、個人情報を投稿本文へ直接書かないための警告を表示する。

## 8. アプリ公開機能

### 8.1 対応形式

- 単一HTML
- ZIP

アップロードされたファイルはCloudflare R2へ保存する。ZIPは展開し、公開アプリの `index.html` を起点として表示する。

### 8.2 公開先

- オープン公開
- コミュニティ公開
- 困りごとの解決案として紐づけ

### 8.3 アプリ詳細で提供する機能

- iframeによるアプリ表示
- 新しいタブで開く
- QRコード
- 説明、作者、更新日、バージョン
- 5段階評価（使いやすさ、デザイン、アイデア）
- 絵文字リアクション
- コメント
- 関連アプリ
- 所有者向け編集
- 通報

### 8.4 APIトークン

- `aplz_...` 形式
- Bearer Tokenとして利用
- `api_tokens` に保存
- 最終利用日時を更新
- `/api/publish` と `/api/apps/mine` などで利用可能

## 9. コンテンツメディア

### 9.1 現在の公開対象数

| 種類 | 数 |
| --- | ---: |
| 手書き定義の記事 | 10 |
| 生成記事 | 200 |
| 記事合計 | 210 |
| `content/` 内Markdown | 200 |
| 用途別ページ | 11 |
| 無料ツール | 20 |
| 調査対象企業メディア | 120 |

`src/lib/articles.ts` にある手書き記事と、`src/lib/generated-articles.ts` の200記事を結合して公開している。

### 9.2 編集領域

生成記事は次の40領域を各5本、合計200本で構成する。

- 暮らし: 日常の不便、家族、片付け、時間、連絡、食事、買い物、移動
- 学び: 学校、教える・学ぶ、子ども、学生プロジェクト、記憶・理解
- 働く: 名もない作業、疲労、チーム、引き継ぎ、接客、採用、失敗
- 商う: 個人事業、店舗、飲食、サロン、宿、会計、広報
- 地域: 町内会、イベント、地方、公共・福祉、環境・再利用
- 作る: テクノロジー、AI、Excel・紙・LINE、アプリ、デザイン、創作、APLZ
- 人を知る: 人物・職業・生き方

### 9.3 記事長

公開時に `ensureMinimumArticleLength()` が本文長を確認する。3,000文字未満の記事には共通の補足セクションを追加し、公開される `ALL_ARTICLES` を3,000文字以上にする。

注意:

- 元の生成記事データには `wordCount: 900` のものがある。
- 3,000文字化は実行時の共通展開で行われる。
- 文字数条件は満たすが、多くの記事で補足構成と表現が共通している。
- 公開前品質レポート自身も、一次資料、実取材、写真、図解、個別編集、表現重複の改善が必要と認識している。
- 全記事を一律86点とした品質スコアは自動設定値であり、人による個別査読結果ではない。

### 9.4 無料ツール

20件のツール定義があり、`/tools/[slug]` で動作する。例:

- 家事分担シャッフル
- 家族予定共有表
- 捨てるか残すか診断
- 忘れ物チェックリスト
- 会議時間コスト計算
- イベント必要スタッフ数計算
- 当番順シャッフル
- 席替え
- 町内会費集金チェック
- キッチンカー原価計算
- 値付けシミュレーター
- 予約枠数計算
- 引き継ぎ項目生成
- リマインド文作成
- メニュー文字サイズ確認
- フォーム質問数診断
- LINE管理限界診断
- Excel脱出診断
- イベント企画抜け漏れ診断
- 固定費計算

## 10. SEO

### 10.1 実装済み

- ページ別 `title`、`description`、`keywords`
- canonical URL
- Open Graph
- X/Twitter Card
- `robots.txt`
- 動的 `sitemap.xml`
- Web App Manifest
- Organization / WebSite JSON-LD
- Article / FAQPage / BreadcrumbList JSON-LD
- 全210記事の冒頭に結論、要点、本文アンカーを表示
- 全210記事に関連する一次情報・公的資料を2件以上表示
- Article JSON-LDの `abstract`、`citation`、`isPartOf`、`hasPart`
- 公開日、更新日、編集主体、編集方針の可視表示
- 記事領域、思想テーマ、カテゴリ、読者、キーワードによる関連記事選定
- `OAI-SearchBot` と `ChatGPT-User` の公開ページ取得を明示的に許可
- 全210記事を検査する `content:check:geo`
- SoftwareApplication JSON-LD
- 困りごと・アプリの動的サイトマップ登録
- Googlebot向け大きな画像・長いスニペット許可
- 非公開・管理・APIページのクロール除外

### 10.2 サイトマップ対象

- トップ
- 困りごと一覧・詳細
- アプリ一覧・詳細
- 用途別一覧・詳細
- 記事一覧・詳細
- ツール一覧・詳細
- テンプレート
- 編集方針

サイトマップは1時間ごとに再検証する設定である。

### 10.3 robotsの除外

- `/api/`
- `/admin/`
- `/dashboard`
- `/settings/`
- `/profile`
- `/new`
- `/publish`
- `/auth/`

公開ページは通常の検索クローラーに加え、OpenAIの検索用クローラーにも許可している。管理・認証・APIページは同じ除外規則を適用する。

### 10.4 SEOの現状と不足

実装上のSEO基盤はあるが、検索順位の効果測定は未完成である。

- Google Search Consoleのデータをコード側から確認できない。
- Supabase自社解析でPVと主要コンバージョンを取得する。検索クエリと検索表示回数はSearch Consoleが別途必要。
- 実検索順位を継続計測する仕組みがない。
- 生成記事の内容が似ており、検索意図の重複や低品質評価のリスクがある。
- 各記事へ領域別の公的資料を表示したが、記事固有の主張ごとの出典精査は引き続き必要。
- 公開本数に対して人手による編集品質が追いついていない。

## 11. デザインとUI方針

### 11.1 全体

- 白背景
- グレーの面と境界線
- 濃い青を主要アクションに使用
- 赤は警告や補助アクセント
- 角丸は主に8px
- カードの装飾は控えめ
- sticky header + backdrop blur
- モバイル優先のレスポンシブ設計
- 過剰なアニメーションを避け、軽いfade-inのみ
- トップは一覧ページではなく、APLZの役割と世界観を伝えるホームページ
- トップの第一画面は写真を置かず、余白、文字、細い罫線を中心に構成
- ロゴの交差を抽象化した青・赤・白の生成パターンを、第一画面下端の細い帯だけに使用
- 困りごとを書く人、開発者、アプリを探す人の3導線を最初の画面直後に配置
- 3つの案内ページは共通レイアウトを使い、世界観と操作方法を統一

### 11.2 色

- Primary: `#1B4F72`
- Primary hover: `#15415F`
- Accent red: `#B83232`
- Main text: `#0f0f0f`
- Secondary text: `#606060`
- Muted text: `#909090`
- Border: `#e5e5e5`
- Surface: `#f5f5f5`
- Background: `#ffffff`

### 11.3 フォント

- 本文: DM Sans
- コード・数値: JetBrains Mono
- ロゴ: Baloo 2

### 11.4 アクセシビリティ

- キーボードフォーカス表示
- 最低40〜48px程度の主要タップ領域
- ラベル付きの件数・状態表示
- アイコンだけに依存しない情報表示
- モバイルで折り返すレイアウト

## 12. 技術スタック

### 12.1 フロントエンド・サーバー

- Next.js `16.1.6`
- React `19.2.3`
- React DOM `19.2.3`
- TypeScript `5`
- Next.js App Router
- Next.js Route Handlers
- Next.js Proxy（旧Middleware相当）
- Tailwind CSS `4`
- PostCSS
- lucide-react `0.576.0`
- Monaco Editor `4.7.0`（残存AIエディタ）
- JSZip `3.10.1`
- nanoid `5.1.6`

### 12.2 バックエンド・外部サービス

- Supabase Auth
- Supabase Postgres
- Supabase Data API
- Cloudflare R2
- AWS SDK S3 Client（R2接続）
- Anthropic Messages API（残存AI編集API）
- Vercel（本番ホスティング）
- Namecheap（`aplz.dev` のDNS管理）

### 12.3 サーバー構成

APLZのアプリサーバーはVercel上のNext.jsである。独立した常駐バックエンドサーバーはなく、画面SSRとAPIをNext.jsが処理する。

```text
Browser
  -> aplz.dev / Vercel / Next.js
       -> Supabase Auth（認証）
       -> Supabase Postgres / Data API（データ）
       -> Cloudflare R2（アプリファイル・プロフィール画像）
       -> Anthropic API（残存AI編集API）
```

## 13. リポジトリとデプロイ

### 13.1 Git remote

| 名前 | URL | 役割 |
| --- | --- | --- |
| `origin` | `https://github.com/sekisuihouse/aplz.git` | 現在の運用・デプロイ元 |
| `upstream` | `https://github.com/joemekw-code/aplz.git` | 引き継ぎ元 |

確認時点では `main` と `origin/main` は一致している。ローカル参照上、現在の `main` は `upstream/main` より18コミット進んでおり、upstream側だけにあるコミットは0件である。

### 13.2 Vercel

- Project name: `aplz`
- 独自ドメイン: `aplz.dev`
- GitHubの `main` へのpushを本番デプロイへつなぐ構成
- `.vercel/project.json` でローカルリポジトリとVercel Projectを紐づけ済み

### 13.3 DNS

- Registrar / DNS管理: Namecheap
- Apex `aplz.dev` と `www.aplz.dev` をVercelへ接続
- 過去に別Vercelアカウントとの所有権競合があり、TXTによる検証を実施済み

## 14. 環境変数

秘密値はこの資料に記録しない。必要な名前のみを示す。

### 必須

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `ANTHROPIC_API_KEY`

### 任意

- `ADMIN_EMAILS`

`.env.local` には確認時点で必須9項目が存在する。Vercel側にも同じ本番値が必要である。`NEXT_PUBLIC_APP_URL` の本番値は `https://aplz.dev` にする。

## 15. データモデル

### 15.1 コア

| テーブル | 用途 |
| --- | --- |
| `profiles` | 表示名、画像、自己紹介、外部リンク、開発者属性、役割 |
| `communities` | 公開・非公開コミュニティ |
| `community_members` | コミュニティ所属と役割 |
| `apps` | 公開アプリのメタデータ |
| `comments` | アプリコメント |
| `ratings` | アプリの使いやすさ・デザイン・アイデア評価 |
| `reactions` | アプリへの絵文字リアクション |
| `api_tokens` | API/MCP用トークン |

### 15.2 困りごとプラットフォーム

| テーブル | 用途 |
| --- | --- |
| `requests` | 困りごと本文、期限、状態、個人情報レベル |
| `solutions` | 困りごとへのアプリ・URL回答 |
| `request_comments` | 質問、回答、一般コメント、システムコメント |
| `solution_feedback` | 解決案への利用者反応 |
| `notifications` | 質問、回答、解決案などの通知 |
| `reports` | 不適切コンテンツの通報 |

### 15.3 主な関連

- Auth user 1 : 0..1 Profile
- Auth user 1 : N Request
- Request 1 : N Solution
- Request 1 : N Request Comment
- Solution 1 : N Feedback
- App 0..1 : N Solution
- Community 1 : N App
- Community N : N User (`community_members`)

### 15.4 RLS

全主要テーブルでRow Level Securityを有効化している。

- 公開困りごと、公開アプリ、公開コミュニティは閲覧可能
- 非公開データは所有者またはコミュニティメンバーに限定
- 困りごと、解決案、質問、フィードバック、通報の作成は認証ユーザーに限定
- プロフィール更新は本人に限定
- 通知は本人だけ閲覧・更新可能
- 管理者の通報閲覧はservice roleを使うAPI経由

注意: サーバー用 `createServerClient()` はservice roleを使用しRLSを迂回する。API Routeでは必ず個別に認証・所有権を検証する必要がある。

## 16. API一覧

### 困りごと

- `/api/requests`
- `/api/requests/[slug]`
- `/api/requests/[slug]/comments`
- `/api/requests/[slug]/solutions`
- `/api/solutions/[id]/accept`
- `/api/solutions/[id]/feedback`

### アプリ

- `/api/apps`
- `/api/apps/mine`
- `/api/apps/[slug]/feedback`
- `/api/apps/[slug]/source`
- `/api/publish`
- `/api/comments`
- `/api/ratings`
- `/api/reactions`
- `/api/related-apps`

### アカウント・運用

- `/api/profile`
- `/api/dashboard`
- `/api/notifications`
- `/api/notifications/[id]`
- `/api/settings/api-token`
- `/api/reports`
- `/api/communities`
- `/api/communities/join`

### 残存機能

- `/api/ai-edit`

## 17. 本番データ実測

2026-06-21にSupabase service roleで件数のみ確認した結果。

| 対象 | 件数 |
| --- | ---: |
| Auth users | 1 |
| Profiles | 1 |
| Communities | 0 |
| Community members | 0 |
| Apps | 2 |
| App comments | 0 |
| Ratings | 0 |
| Reactions | 0 |
| API tokens | 0 |
| Requests | 3 |
| Solutions | 2 |
| Request comments | 0 |
| Solution feedback | 1 |
| Notifications | 0 |
| Reports | 0 |

DB上の内訳は「公開中の困りごと3」「募集中1」「回答あり2」「公開アプリ2」。これらの一覧・件数はトップには表示せず、それぞれの専用ページで扱う。

プロフィールは1件あるが表示名が未設定のため、既存の投稿者名とアプリ作者名は匿名表示になっている。

## 18. アクセス解析

2026-06-21にSupabaseを使ったファーストパーティ分析を実装した。計測開始後のデータは `/admin/analytics` で確認できる。

保存テーブル:

- `analytics_visitors`: 匿名訪問者、初回・最終訪問、最初のページ、参照元ホスト
- `analytics_sessions`: 30分単位のセッション、ログインユーザーとの任意の関連
- `analytics_events`: ページ表示と主要操作

計測イベント:

- ページ表示
- 認証開始
- 認証リンク送信
- ログイン・新規登録完了
- ログアウト
- 困りごと投稿
- 質問・回答
- 解決案投稿
- 解決案採用
- 解決案フィードバック
- アプリ公開
- プロフィール更新
- 通報
- コミュニティ参加
- APIトークン作成

管理画面で確認できる数値:

- 累計訪問者
- 累計セッション
- 累計イベント
- 登録アカウント
- 直近30日のアクティブ会員
- 開発者プロフィール数
- 主要イベント件数
- アカウント種別
- 30日の日別推移
- よく見られたページ

保存しない情報:

- IPアドレス
- メールアドレス
- 投稿本文
- フォーム入力内容
- URLクエリ
- 検索語

ローカル開発環境では計測を保存せず、本番アクセスだけを集計する。

外部サービスのVercel Web Analytics、GA4、Plausible等は使用していない。国・地域、端末、ブラウザ、広告アトリビューション、Google検索クエリは現在の自社計測には含まれない。2026-06-21以前の訪問履歴は遡って取得できない。

## 19. セキュリティと安全設計

### 実装済み

- Supabase Auth
- Cookieベースセッション
- RLS
- 非公開ページの認証保護
- URL入力の `http/https` 制限
- 投稿文字数の上限
- プロフィール画像の形式・容量制限
- 個人情報レベル表示
- 高リスク投稿への警告
- 通報機能
- 管理者メール制限
- robotsによる管理・認証ページ除外

### 注意点

- service roleを使うAPIの認可漏れは重大なリスクになる。
- アップロードHTML/ZIPをiframeで実行するため、R2の配信ドメイン分離、CSP、sandbox属性を継続確認する必要がある。
- 外部アプリURLや参考URLは第三者サイトへ移動する可能性がある。
- `ANTHROPIC_API_KEY`、Supabase service role、R2 secretは絶対にクライアントへ露出させない。
- APIトークンは生成時だけ見せ、漏えい時に再発行できる運用が必要。

## 20. 開発・検証コマンド

```bash
npm install
npm run dev
npm run lint
npm run build
npm run start
npm run check:supabase
npm run content:generate
npm run content:publish:seo
npm run content:check:published-seo
npm run content:check:bias
npm run content:check:geo
```

ローカルURL:

```text
http://localhost:3000
```

## 21. 2026-06-22の検証結果

- `npm run lint`: 成功
- `npm run build`: 成功
- TypeScript check: 成功
- Next.js production build: 282ページ生成、成功
- GEO検証: 全210記事で結論、要点、関連する公的資料、更新情報を確認
- 全17テーブルのSupabase接続: 成功
- 分析API: 匿名訪問者、セッション、PVの本番DB保存に成功
- 分析テストデータ: 検証後に削除済み
- 本番 `https://aplz.dev/`: 表示成功
- Git `main` と `origin/main`: 一致
- ワークツリー: 資料更新前はclean

自動テスト用の専用テストスクリプト、Playwright、Vitest、Jestは現在ない。検証はlint、build、スキーマ確認と手動確認が中心である。

## 22. 現在の既知の問題

優先度の高い順。

### P0: 検索計測は別途必要

自社アクセス解析は追加したが、Google検索の表示回数、検索語、掲載順位はSearch Consoleとの接続が必要。

### P0: 記事品質の均質化

210記事の多くが共通セクションで3,000文字化されている。文字数は満たすが、記事固有の調査、図、データ、経験、取材が不足し、内容が似て見える。大量の類似ページは検索評価とブランド信頼の両方に悪影響となり得る。

### P1: 廃止コードの残存

`/new` は無効化したが、Monaco Editor、AI編集コンポーネント、`/api/ai-edit`、Anthropic依存が残っている。今後使わないなら削除し、攻撃面、依存、保守負担を減らすべきである。

### P1: 自動テスト不足

投稿、認証、回答、採用、公開、権限、RLSの回帰テストがない。主要フローのPlaywright E2EとAPIの認可テストが必要。

### P1: READMEが初期状態

READMEはcreate-next-appの初期文面であり、セットアップ、環境変数、構成、デプロイ手順を説明していない。この統合資料を基に更新する必要がある。

### P2: 旧機能と新しい主軸の混在

コミュニティ、APIトークン、アプリ評価、記事、ツール、テンプレートなど機能範囲が広く、主軸の困りごとフローが薄まる可能性がある。

### P2: 記事管理値の不整合

レポートによって記事数が200と210で異なる。理由は、生成記事200本に加えて手書き記事10本があるため。今後は「生成200、手書き10、公開合計210」と統一する。

## 23. 推奨する次の優先順位

1. Search Consoleを接続し、検索表示・クエリ・順位の計測を開始する。
2. Bing Webmaster Toolsを接続し、AI Performanceで引用URLと引用回数を計測する。
3. 投稿、質問、回答、解決案、採用までをPlaywrightで自動テストする。
4. 210記事を一括公開し続けるのではなく、重複度と一次情報で監査し、弱い記事を非公開・統合・個別改稿する。
5. 廃止したAIエディタ関連コードと依存を削除するか、今後使う機能として明確に再定義する。
6. READMEを現状に合わせる。
7. Supabase分析データを見て、困りごと詳細から質問・回答・解決案投稿までのUIを再改善する。

## 24. 変更履歴の要点

直近の主要コミット:

- `8f7551c` デモ投入スクリプトとデモデータを削除
- `6bba224` 「アプリを作る」新規作成フローを削除
- `42ebe17` 困りごと一覧・詳細のUI/UX改善
- `5be15e0` メディア記事公開と記事別SEO
- `17cf42f` 広範な編集メディア基盤を追加
- `263df16` 記事の読みやすさ改善
- `3973f58` 検索意図に合わせたSEO記事調整

## 25. 主要ファイル

| 対象 | ファイル |
| --- | --- |
| 全体レイアウト・ナビ | `src/app/layout.tsx` |
| トップ | `src/app/page.tsx` |
| 利用者別案内の共通レイアウト | `src/app/components/AudienceLanding.tsx` |
| 困りごとを書く人向け | `src/app/for-requesters/page.tsx` |
| 開発者向け | `src/app/for-developers/page.tsx` |
| アプリを探す人向け | `src/app/find-apps/page.tsx` |
| トップのブランドパターン | `public/images/aplz-brand-strip.jpg` |
| 困りごと一覧 | `src/app/requests/page.tsx` |
| 困りごと詳細 | `src/app/requests/[slug]/page.tsx` |
| 投稿フォーム | `src/app/requests/new/page.tsx` |
| ログイン | `src/app/login/LoginClient.tsx` |
| 認証保護 | `src/proxy.ts` |
| 困りごと定数・共通処理 | `src/lib/request-platform.ts` |
| Supabase client | `src/lib/supabase.ts` |
| SSR auth client | `src/lib/supabase-server.ts` |
| R2 | `src/lib/r2.ts` |
| 記事統合・3,000文字化 | `src/lib/articles.ts` |
| 記事GEO・関連資料・関連記事 | `src/lib/article-geo.ts` |
| 生成記事 | `src/lib/generated-articles.ts` |
| 無料ツール | `src/lib/generated-tools.ts` |
| SEO共通処理 | `src/lib/seo.tsx` |
| Sitemap | `src/app/sitemap.ts` |
| Robots | `src/app/robots.ts` |
| GEO検証 | `scripts/validate-geo.mjs` |
| GEO実装記録 | `reports/geo-implementation.md` |
| DB初期スキーマ | `supabase/migrations/202606120000_initial_core_schema.sql` |
| 困りごと拡張 | `supabase/migrations/202606120001_request_platform.sql` |
| Data API権限 | `supabase/migrations/202606170001_data_api_grants.sql` |
| アクセス解析DB | `supabase/migrations/202606210001_product_analytics.sql` |

## 26. この資料の更新ルール

次の変更を行ったら、このファイルも同じコミットで更新する。

- 主要フローの追加・削除
- URLやナビゲーション変更
- DBテーブル・カラム・RLS変更
- 認証方式変更
- Vercel、Supabase、R2、DNS変更
- 環境変数追加・削除
- 記事・ツールの公開方針変更
- アクセス解析導入
- 本番データを大きく変更
- 既知の問題の解消

秘密鍵、APIキー、個人メール、パスワード、トークン実値は記載しない。
