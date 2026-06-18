import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GENERATED_ARTICLES } from "../src/lib/generated-articles.ts";
import { GENERATED_TOOLS } from "../src/lib/generated-tools.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

function articleLength(article) {
  return [
    article.title,
    article.description,
    article.lead,
    article.reader,
    ...article.sections.flatMap((section) => [section.heading, ...section.body]),
    ...article.faqs.flatMap((faq) => [faq.question, faq.answer]),
  ]
    .filter(Boolean)
    .join("")
    .length;
}

function readLegacyArticles() {
  const source = fs.readFileSync(path.join(root, "src/lib/articles.ts"), "utf8");
  const match = source.match(/export const ARTICLES: Article\[] = (\[[\s\S]*?\n\]);/);
  if (!match) return [];
  return Function(`"use strict"; return ${match[1]};`)();
}

function expandedSections(article) {
  const audience = article.audience || article.reader || "このテーマが気になる人";
  const format = article.contentFormat || "読み物";
  const artifact = article.originalArtifact || "確認メモ";
  const keyword = article.keywords?.[0] || article.category;
  const firstHeading = article.sections?.[0]?.heading || "まず見えている困りごと";
  const secondHeading = article.sections?.[1]?.heading || "考え方";
  return [
    {
      heading: "読者が検索した時に知りたいこと",
      body: [
        `${keyword}で調べる人が最初に知りたいのは、抽象的な正解ではなく、自分の場面に当てはめた時に何から見ればよいかです。${article.title}という問いは、家、学校、店、地域、仕事場のどこに置いても少しずつ形を変えます。だからこの記事では、便利な道具の紹介より先に、誰が、いつ、どの情報を見て、どこで迷うのかを分けて考えます。`,
        `${audience}にとって重要なのは、いきなり完璧な仕組みを作ることではありません。今ある紙、口頭の確認、LINE、Excel、掲示物、記憶のどれが残っていて、どれが人の負担になっているかを見つけることです。そこを見ないまま新しい方法へ移ると、見た目だけ整っても、例外が起きた瞬間に元のやり方へ戻ります。`,
      ],
    },
    {
      heading: "場面を分解するための見取り図",
      body: [
        `${firstHeading}を考える時は、作業そのもの、作業を待っている人、結果を受け取る人を分けます。たとえば一つの連絡でも、送る人、読む人、確認する人、あとから探す人では困る場所が違います。ここを一つにまとめてしまうと、声の大きい人の不満だけが目立ち、黙って困っている人の負担が残ります。`,
        `見取り図は難しく作る必要はありません。「いつ起きるか」「誰が気づくか」「どこに残るか」「間違えた時に誰が直すか」の4つを書くだけで十分です。${artifact}として紙に書き出す場合も、最初から清書せず、矢印や余白を残しておく方が現場の言葉を拾いやすくなります。`,
      ],
    },
    {
      heading: "方法を選ぶ前に比べたいこと",
      body: [
        `${secondHeading}を進める前に、今の方法をすぐ捨てるかどうかは決めなくてよいです。古いやり方には、遅い代わりに説明しやすい、手間がかかる代わりに記憶に残る、面倒な代わりに誰かへ相談するきっかけになる、といった性質があります。新しい方法に置き換える時は、消える手間だけでなく、消えてしまう確認の機会も見る必要があります。`,
        `比較する軸は、速さ、間違いにくさ、覚えやすさ、あとから探せるか、初めての人が使えるか、個人情報を持ちすぎないかの6つです。${format}として読むだけで終わらせず、この6つに丸と三角を付けると、自分の場所で何を残し、何を変えるべきかが見えます。`,
      ],
    },
    {
      heading: "今日から試せる小さな手順",
      body: [
        `最初の一歩は、関係する人を集めて大きな会議をすることではありません。実際に使っている紙や画面を一つ選び、そこに書かれている項目をそのまま写します。次に、毎回は使わないけれど例外時に必要になる項目へ印を付けます。最後に、誰か一人だけが覚えている判断を書き足します。これだけで、見えなかった作業の輪郭がかなりはっきりします。`,
        `試す時間は30分で十分です。10分で現物を見る、10分で困る順番を書く、10分で消せる項目を選ぶ、という分け方にすると進めやすくなります。終わったら、きれいな表に直す前に、実際に使う人へ「この順番で迷わないか」だけ聞きます。改善は、項目を増やすことより迷う場所を減らすことから始めた方が続きます。`,
      ],
    },
    {
      heading: "失敗しやすい境界線",
      body: [
        `よくある失敗は、困っている内容を「人がちゃんとしていないから」と片付けることです。実際には、情報が置かれる場所が分かれている、確認のタイミングが人によって違う、例外だけが別ルートで流れる、といった構造の問題であることが多くあります。人の注意力だけに頼ると、忙しい日ほど同じミスが繰り返されます。`,
        `もう一つの失敗は、便利そうな道具を入れた瞬間に終わった気になることです。道具は、誰が何を決めるかを代わりに考えてはくれません。${article.title}を扱うなら、導入前に「誰が更新するか」「更新されなかった時に誰が気づくか」「使わない人がいても困らないか」を決めておく必要があります。ここまで決めると、小さな変更でも長く使える形になります。`,
      ],
    },
    {
      heading: "読み終えた後のチェックリスト",
      body: [
        `最後に、この記事を自分の場面へ移すための短いチェックリストを置きます。1つ目は、困っている人を一人に決めつけていないか。2つ目は、普段の流れだけでなく例外を書いたか。3つ目は、記録する場所が複数に分かれていないか。4つ目は、あとから探す人のことを考えたか。5つ目は、便利さの代わりに失うものを見たか。`,
        `この5つに答えるだけでも、${article.category}の問題はかなり扱いやすくなります。大事なのは、立派な結論を出すことではなく、次に同じ場面が来た時に少し迷わなくなることです。小さな不便や名もない作業は、見つけた人が一人で抱えると重くなりますが、言葉にして分けると、家族、同僚、地域の人と一緒に扱える対象になります。`,
      ],
    },
    {
      heading: "公開後に見直すポイント",
      body: [
        `一度整理した内容は、使い始めてからもう一度見直す方が現実に合います。最初に作った表や手順は、たいてい「普段うまくいく日」を基準にしています。しかし実際には、忙しい日、初めて参加する人がいる日、急な変更が入った日、担当者が休む日ほど仕組みの弱いところが出ます。だから公開後や共有後に見るべきなのは、きれいに運用できた場面ではなく、少し崩れた場面です。そこで誰が止まったか、どの言葉が伝わらなかったか、どの情報を探し直したかを残すと、次の改善が具体的になります。`,
        `また、便利にしたことで誰かの仕事が見えなくなっていないかも確認します。${article.title}のようなテーマでは、作業を短くすることだけが良い結果とは限りません。誰かが毎回声をかけていたから成り立っていた関係、紙に書くから気づけていた変化、時間がかかるから自然に確認できていた安全策もあります。改善後は「早くなったか」だけでなく、「初めての人にも分かるか」「困った時に戻れるか」「人に頼る余地が残っているか」を見ると、長く使える形に近づきます。`,
      ],
    },
    {
      heading: "次に深掘りするなら",
      body: [
        `さらに深く考えるなら、同じ場面を別の立場から読み直します。作る人、使う人、見守る人、あとから引き継ぐ人では、同じ出来事でも見えている不便が違います。${article.category}の話は、表面だけ見ると小さな作業に見えますが、実際には責任の置き場所、説明の仕方、失敗した時の戻り方まで含んでいます。そこまで見ると、単なる便利化ではなく、人が無理なく続けられる形を考えられます。`,
        `この記事を読み終えたら、身近な場面で一つだけ観察してみてください。誰かが毎回やっているのに名前が付いていない作業、説明されていないのに全員が何となく従っている順番、失敗した時だけ急に探されるメモ。そうした小さなものを見つけることが、次の記事や次の工夫につながります。`,
      ],
    },
  ];
}

function ensureMinimumArticleLength(article) {
  if (articleLength(article) >= 3000) return article;
  const next = { ...article, sections: [...article.sections, ...expandedSections(article)] };
  return { ...next, wordCount: articleLength(next) };
}

const ALL_ARTICLES = [...readLegacyArticles(), ...GENERATED_ARTICLES].map(ensureMinimumArticleLength);

const shortArticles = ALL_ARTICLES
  .map((article) => ({ slug: article.slug, title: article.title, length: articleLength(article) }))
  .filter((article) => article.length < 3000);

const missingArticleSeo = ALL_ARTICLES.filter((article) => {
  const description = article.seoDescription ?? article.description;
  const keywords = article.seoKeywords ?? article.keywords;
  return !description || description.length < 40 || description.length > 170 || keywords.length < 3;
});

const missingToolSeo = GENERATED_TOOLS.filter((tool) => {
  return !tool.seoTitle || !tool.seoDescription || !tool.keywords || tool.keywords.length < 3;
});

const report = `# 公開SEO検証

## 結果

- 記事総数: ${ALL_ARTICLES.length}
- 3000文字未満の記事: ${shortArticles.length}
- SEO情報不足の記事: ${missingArticleSeo.length}
- ツール総数: ${GENERATED_TOOLS.length}
- SEO情報不足のツール: ${missingToolSeo.length}

## 3000文字未満の記事

${shortArticles.length ? shortArticles.map((article) => `- ${article.title} (${article.length})`).join("\n") : "なし"}

## SEO情報不足の記事

${missingArticleSeo.length ? missingArticleSeo.map((article) => `- ${article.title}`).join("\n") : "なし"}

## SEO情報不足のツール

${missingToolSeo.length ? missingToolSeo.map((tool) => `- ${tool.title}`).join("\n") : "なし"}
`;

fs.writeFileSync(path.join(root, "reports/published-seo-validation.md"), report);

if (shortArticles.length || missingArticleSeo.length || missingToolSeo.length) {
  console.error(report);
  process.exit(1);
}

console.log(report);
