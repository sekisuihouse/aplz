# Google Search Console インデックス運用

最終更新: 2026-06-22

## 1. サイトマップ送信

Search Consoleでドメインプロパティ `aplz.dev` を開き、左メニューの「サイトマップ」を選ぶ。「新しいサイトマップの追加」には次だけを入力する。

```text
sitemap.xml
```

送信先は `https://aplz.dev/sitemap.xml` である。ルートの `robots.txt` にも同じサイトマップURLを記載している。

## 2. 現在のサイトマップ対象

- トップ
- 困りごと一覧・公開詳細
- アプリ一覧・公開詳細
- 用途別一覧・詳細
- 記事一覧・記事210本
- ツール一覧・ツール20本
- 投稿例
- 利用者別案内
- 編集方針
- 公開コミュニティ

ログイン、管理、設定、投稿フォーム、非公開コミュニティ、APIは検索対象にしない。

## 3. 送信後の確認

サイトマップの状態が「成功しました」になることを確認する。登録直後は「検出されたページ数」が0または一部でも異常とは限らない。Googleのクロールとインデックス登録には数日から数週間かかる場合がある。

「ページ」レポートでは次を見る。

- インデックス登録済み
- クロール済み - インデックス未登録
- 検出 - インデックス未登録
- 重複しています。Googleにより、ユーザーがマークしたページとは異なるページが正規ページとして選択されました
- robots.txtによりブロックされました

## 4. URL検査

URL検査と「インデックス登録をリクエスト」は、トップ、記事一覧、重要記事、新しく公開した困りごとなど少数の代表URLに使う。全URLを1件ずつ繰り返し送信しない。

最初に確認するURL:

```text
https://aplz.dev/
https://aplz.dev/articles
https://aplz.dev/articles/small-business-task-apps
https://aplz.dev/tools
https://aplz.dev/requests
https://aplz.dev/apps
```

## 5. コード側の監査

本番サイトマップ内の全URLについて、HTTP 200、title、description、H1、index許可、canonical一致を検査する。

```bash
npm run content:check:indexability
```

結果は `reports/indexability-audit.md` に保存される。

## 6. 注意

サイトマップ送信はURLをGoogleへ知らせるための手段であり、検索結果への掲載や順位を保証しない。記事の独自性、内容の重複、検索意図への回答、内部リンク、外部からの評価は継続して改善する。
