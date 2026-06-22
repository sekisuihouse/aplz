# APLZ 記事GEO実装

実装日: 2026-06-22

対象: 公開記事210本

## 方針

GEOを検索エンジンとは別の特殊な抜け道として扱わない。GoogleはAI Overviews / AI Modeについて、通常のSEO以外の追加要件や特別な構造化データ、AI用テキストファイルは不要としている。そのため、読者が確認できる本文の明瞭さ、クロール可能性、根拠、更新情報、内部リンク、内容と一致する構造化データを改善した。

## 全記事へ適用した内容

- H1直後に短い「結論」を表示
- 最大4件の要点と本文アンカーを表示
- 実際の文字量に応じた読了時間を表示
- 公開日、更新日、編集主体を表示
- 編集方針ページを公開
- 各記事へ2件以上の関連する一次情報・公的資料を表示
- Article JSON-LDへ `abstract`、`citation`、`isPartOf`、可視見出しと一致する `hasPart` を追加
- FAQPageとパンくずのJSON-LDを継続
- 記事同士の関連度を編集領域、思想テーマ、カテゴリ、読者、キーワードから計算
- `OAI-SearchBot` と `ChatGPT-User` に公開ページのクロールを明示的に許可
- 210記事を対象にした自動検証を追加

## 採用しなかったもの

- `llms.txt`: 現時点でGoogleはAI検索掲載の必須要件としていない。サイト内に同じ情報を重複させず、HTML、robots.txt、sitemap、構造化データを正しく保つ。
- AI向けの隠し本文: 読者とクローラーへ異なる情報を出さない。
- 出典数だけを増やす引用: 記事テーマと関係する公的資料に限定する。
- 検索順位・AI回答への採用保証: 外部システムの判断であり保証しない。

## 調査した主要資料

- Google Search Central: AI features and your website
- Google Search Central: Article structured data
- OpenAI Platform: Overview of OpenAI Crawlers
- Princeton University / KDD 2024: GEO: Generative Engine Optimization
- Bing Webmaster Blog: AI Performance in Bing Webmaster Tools

GEO研究論文の実験結果はベンチマーク上の結果であり、APLZの記事が同じ割合で引用されることを意味しない。公開後はGoogle Search ConsoleとBing Webmaster Toolsの実測値で改善する。
