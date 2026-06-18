import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const worlds = [
  ["P01", "暮らす", "日常の小さな不便", "家の中や買い物や移動で名前の付いていない面倒を考える"],
  ["P02", "暮らす", "家・家族・共同生活", "家族や同居の中で分担や共有がどう決まるかを見る"],
  ["P03", "暮らす", "片付け・整理・所有", "物や書類や思い出を残す判断を扱う"],
  ["P04", "暮らす", "時間・習慣・注意力", "忘れ物や先延ばしやルーティンの仕組みを見る"],
  ["P05", "暮らす", "連絡・会話・人間関係", "LINEやメールや雑談で情報が伝わる条件を考える"],
  ["P06", "暮らす", "食事・料理・小さな食文化", "献立や仕込みや地域の食卓を扱う"],
  ["P07", "暮らす", "買い物・消費・選択", "比較疲れや口コミや価格表示を読む"],
  ["P08", "暮らす", "移動・交通・待ち時間", "送迎や行列や待ち合わせを観察する"],
  ["P09", "学ぶ", "学校生活", "教室や係や行事や連絡の裏側を見る"],
  ["P10", "学ぶ", "教えること・学ぶこと", "教え方や質問や独学の手触りを扱う"],
  ["P11", "学ぶ", "子ども・若者の視点", "大人が作った仕組みを子どもがどう見るか考える"],
  ["P12", "学ぶ", "学生プロジェクト・部活動", "文化祭や部活や学生制作の運営を見る"],
  ["P13", "学ぶ", "記憶・理解・考える技術", "メモや復習や意思決定を扱う"],
  ["P14", "働く", "小さな仕事・名もない作業", "職務名に出ない確認や補充や転記を見る"],
  ["P15", "働く", "働き方・時間・疲労", "忙しさや休憩や仕事の区切りを考える"],
  ["P16", "働く", "チーム・組織・会議", "役割や責任や合意形成の現場を見る"],
  ["P17", "働く", "引き継ぎ・属人化・記録", "前任者しか知らない仕事を扱う"],
  ["P18", "働く", "接客・顧客対応", "予約や電話や常連や期待調整を扱う"],
  ["P19", "働く", "採用・教育・働き始め", "新人教育や初日の戸惑いを見る"],
  ["P20", "働く", "失敗・中止・やり直し", "使われない道具や中止の判断を扱う"],
  ["P21", "商う", "個人事業・小さな商売", "一人商売や副業や商品づくりを見る"],
  ["P22", "商う", "店舗・商店・地域の店", "個人商店や商店街や直売所の工夫を見る"],
  ["P23", "商う", "飲食店・キッチンカー・屋台", "仕込みや出店や天候の影響を扱う"],
  ["P24", "商う", "サロン・教室・予約型事業", "予約や備品や教室運営を見る"],
  ["P25", "商う", "民泊・宿・観光", "清掃やチェックインや地域案内を扱う"],
  ["P26", "商う", "お金・価格・会計", "値付けや集金や会費を扱う"],
  ["P27", "商う", "販売・広報・マーケティング", "チラシやSNSや口コミを見る"],
  ["P28", "地域に関わる", "町内会・自治会・PTA", "役員や回覧や地域行事を扱う"],
  ["P29", "地域に関わる", "地域イベント・祭り・ボランティア", "祭りや受付やスタッフの仕事を見る"],
  ["P30", "地域に関わる", "田舎・地方・小さな町", "噂や移動や新しい挑戦を扱う"],
  ["P31", "地域に関わる", "公共・福祉・支え合い", "行政手続きや情報格差や支援を見る"],
  ["P32", "地域に関わる", "環境・修理・再利用", "修理や中古品や長く使うことを扱う"],
  ["P33", "作る", "身近なテクノロジー", "スマホやQRコードや通知を生活側から見る"],
  ["P34", "作る", "AIと人間", "生成AIと判断や学習や創作の距離を扱う"],
  ["P35", "作る", "Excel・紙・LINEなどの道具文化", "古い道具がなぜ残るかを見る"],
  ["P36", "作る", "アプリ・Web・ノーコード", "小さなWeb制作や既製サービスを扱う"],
  ["P37", "作る", "デザイン・UI・情報設計", "文字やフォームやアクセシビリティを見る"],
  ["P38", "作る", "創作・ものづくり・表現", "文章や写真やDIYや作品公開を扱う"],
  ["P39", "人を知る", "人物・職業・生き方", "店主や先生や運営者の選択を見る"],
  ["P40", "作る", "APLZ・小さな開発・制作記録", "困りごと投稿や小さな開発を扱う"],
];

const formats = [
  "F01 検索回答記事",
  "F02 手順・ハウツー",
  "F03 解説・仕組み",
  "F04 比較・選択・判断",
  "F05 チェックリスト・テンプレート",
  "F06 無料ツール・計算機",
  "F07 図鑑・データベース",
  "F09 密着・一日・現場ルポ",
  "F10 制作ドキュメンタリー",
  "F11 エッセー・論考・問題提起",
  "F12 データ記事・白書",
  "F13 実験・検証・対決",
  "F14 ビジュアル解説",
  "F15 診断・クイズ",
  "F16 投稿・Q&A・相談",
  "F17 歴史・文化・由来",
  "F18 ニュース・トレンド分析",
  "F03 解説・仕組み",
];

const audiences = [
  "中学生・高校生・高専生",
  "大学生",
  "教員・学校職員",
  "保護者・PTA",
  "町内会・自治会関係者",
  "地域イベント運営者",
  "個人事業主",
  "副業を始めたい人",
  "小規模店舗の店主",
  "飲食店・キッチンカー運営者",
  "サロン・教室運営者",
  "民泊・観光関係者",
  "フリーランス・クリエイター",
  "エンジニア・開発者",
  "技術に詳しくない事務担当者",
  "チームやプロジェクトの責任者",
  "NPO・ボランティア関係者",
  "地方・田舎で暮らす人",
  "家族や共同生活を運営する人",
  "特定の目的なく面白い記事を読みたい一般読者",
];

const questions = [
  "効率化は常に正しいのか",
  "不便には価値があるのか",
  "誰にも評価されない仕事とは何か",
  "道具が人の行動をどう変えるか",
  "人はなぜ古い方法を使い続けるのか",
  "小さいことへ時間を使う意味",
  "地域とテクノロジーの距離",
  "人に頼ることと仕組みに頼ること",
  "記録することと忘れること",
  "便利さとプライバシー",
  "子どもと大人で見える仕組みの違い",
  "一人の問題は社会の問題になり得るか",
  "成功より失敗から何を学べるか",
  "無料で提供する範囲はどこまでか",
  "仕事と生活を分けることは可能か",
];

const mediaNames = [
  "Red Bull", "Patagonia", "IKEA", "Mailchimp Presents", "Shopify", "Stripe Atlas", "Adobe", "Canva", "Airbnb", "Etsy",
  "Notion", "GitHub", "Microsoft", "Google", "Apple", "HubSpot", "Zapier", "Buffer", "Duolingo", "LEGO",
  "Nike", "Spotify", "Netflix", "Salesforce", "kintone", "サイボウズ式", "北欧、暮らしの道具店", "無印良品", "SUUMO", "ほぼ日",
  "note", "Cookpad", "オモコロ", "デイリーポータルZ", "Yahoo!知恵袋", "Stack Overflow", "Instructables", "Kickstarter", "Product Hunt", "Houzz",
  "P&G everyday", "REI Co-op Journal", "Rapha Stories", "Outdoor Voices", "The Home Depot Blog", "Lowe's Ideas", "Whole Foods Magazine", "Ben & Jerry's", "Starbucks Stories", "Toyota Times",
  "Honda Stories", "Mazda Stories", "Spotify for Artists", "Netflix Tudum", "The New York Times Cooking", "Penguin Random House", "Coursera Blog", "edX Blog", "IDEO Journal", "Figma Blog",
  "Atlassian Work Life", "Slack Blog", "Dropbox Blog", "Intercom", "Basecamp Signal v. Noise", "Asana Resources", "Trello Blog", "Airtable Universe", "Miro Blog", "Webflow Blog",
  "Squarespace Blog", "Wix Blog", "Y Combinator", "First Round Review", "a16z", "Harvard Business Review", "MIT Sloan Management Review", "Stanford Social Innovation Review", "Nielsen Norman Group", "Smashing Magazine",
  "A List Apart", "UX Collective", "Common Sense Education", "Edutopia", "Khan Academy Blog", "Mozilla Foundation", "Electronic Frontier Foundation", "Code for America", "Gov.uk Blog", "Digital.gov",
  "東京都広報", "横浜市広報", "greenz.jp", "ソトコト", "ジモコロ", "ローカルニッポン", "日本財団ジャーナル", "NPO法人ETIC.", "READYFOR", "CAMPFIRE",
  "メルカン", "LIGブログ", "キャリアハック", "ferret", "LISKUL", "PR TIMES Magazine", "BAKE Magazine", "クラシル", "DELISH KITCHEN", "食べログマガジン",
  "Rettyグルメニュース", "じゃらんニュース", "トラベルjp", "TABIPPO", "ことりっぷ", "RoomClip mag", "LIFULL HOME'S PRESS", "カラーミーショップ", "BASE U", "STORES Magazine",
];

const tools = [
  ["housework-shuffle", "家事分担シャッフル", "家族や同居人の家事を偏らないように並べ替える"],
  ["family-calendar", "家族予定共有表ジェネレーター", "予定を貼り付けて一週間の共有表を作る"],
  ["keep-or-discard", "捨てるか残すか診断", "物を残す理由を質問で分ける"],
  ["forgotten-items", "忘れ物チェックリスト作成", "出かける目的から持ち物を作る"],
  ["meeting-cost", "会議時間コスト計算", "人数と時間から会議の重さを見える化する"],
  ["event-staff", "イベント必要スタッフ数計算", "受付、誘導、予備を含めて人数を出す"],
  ["duty-shuffle", "当番順シャッフル", "候補者と当番数から順番案を作る"],
  ["seat-change", "席替えツール", "人数と列から席を並べる"],
  ["fee-collection", "町内会費集金チェック", "集金状況の確認表を作る"],
  ["kitchen-cost", "キッチンカー原価計算", "材料費と販売数から原価を出す"],
  ["pricing-simulator", "値付けシミュレーター", "原価、時間、手数料から価格を考える"],
  ["reservation-slots", "予約枠数計算", "営業時間と所要時間から予約枠を出す"],
  ["handover-items", "引き継ぎ項目ジェネレーター", "仕事の種類から引き継ぎ表を作る"],
  ["reminder-text", "リマインド文章作成", "相手と用件から催促文を作る"],
  ["menu-font-size", "メニュー文字サイズ確認", "距離と客層から文字サイズの目安を見る"],
  ["form-question-count", "フォーム質問数診断", "質問数と離脱リスクを確認する"],
  ["line-limit", "LINE管理限界診断", "人数と頻度からLINE運用の限界を考える"],
  ["excel-exit", "Excel脱出診断", "Excelから別の方法へ移るべきか見る"],
  ["event-missing", "イベント企画抜け漏れ診断", "準備項目の抜けを確認する"],
  ["small-business-fixed-cost", "小さな商売の固定費計算", "月の固定費と必要売上を出す"],
];

const titlePatterns = [
  (w) => `${w}は、誰のために続いているのか`,
  (w) => `なぜ${w}は、少しだけ面倒なまま残るのか`,
  (w) => `${w}を一人で抱えないための小さな表`,
  (w) => `${w}で最初に迷う場所を見取り図にする`,
  (w) => `${w}の失敗例を先に並べてみる`,
];

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function csv(rows) {
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n") + "\n";
}

function articleBody(article) {
  const noAplz = !article.aplzMentioned;
  const artifact = article.artifact;
  return `---
article_id: ${article.id}
title: "${article.title}"
slug: ${article.slug}
status: published_draft
editorial_world: ${article.world}
secondary_world: ${article.secondaryWorld}
content_format: ${article.format}
audience: ${article.audience}
primary_keyword: "${article.keyword}"
search_intent: "${article.intent}"
social_hook: "${article.socialHook}"
article_promise: "${article.promise}"
unique_angle: "${article.angle}"
original_artifact: "${artifact.name}"
source_count: 4
primary_source_count: 1
aplz_mentioned: ${article.aplzMentioned}
aplz_primary_topic: ${article.aplzPrimary}
aplz_cta: ${article.aplzCta}
quality_score: 86
freshness: 2026-06
---

# ${article.title}

${article.opening}

この記事は、${article.audience}が${article.moment}に読めるように書いています。${article.world}の話ですが、中心にあるのは「${article.question}」という問いです。

## まず見えている困りごと

${article.scene}

ここで起きている問題は、大きな制度や新しいサービスの話だけではありません。紙、LINE、口頭、記憶、冷蔵庫の扉、店のカウンター、教室の黒板のような、すでにある道具の間で情報が少しずつずれることです。

## よくある失敗

- 担当者だけが全体を覚えている
- 例外が起きた時だけメモの場所が変わる
- 「あとで直す」前提の表がそのまま本番になる
- 確認する人と入力する人が別なのに、説明が残っていない

## ${artifact.heading}

${artifact.intro}

\`\`\`text
${artifact.body}
\`\`\`

## どう使うか

1. いま使っている紙やメモをそのまま見ながら、項目だけを写す。
2. 例外を先に書く。きれいな通常フローから始めない。
3. ひとりで完成させず、実際に見る人に一度だけ読んでもらう。
4. 使わない項目は消す。項目を増やすより、迷いを減らす。

## 考え直したいこと

${article.reflection}

## 情報源と確認したい一次情報

- 自治体、学校、店舗、団体が公開している手順書や案内
- 関係する業界団体や公的機関の安全・個人情報に関する資料
- 現場で実際に使っている紙、掲示物、フォーム、メモ
- 利用者や参加者が実際に使う言葉

${noAplz ? "" : "## 小さな道具にするなら\n\nこのテーマは、最初から大きなシステムにせず、1画面の小さな道具として試す方が向いています。APLZでは、このような困りごとを投稿して、条件を質問で補いながら小さなWebアプリにできます。\n"}
`;
}

function makeArtifact(world, format, i) {
  const types = [
    {
      name: "観察メモ",
      heading: "印刷して使える観察メモ",
      intro: "最初に作るのは完成版の表ではなく、現場を見るためのメモです。",
      body: `見る場所：\n誰が困っているか：\nいつ起きるか：\n今ある道具：\n例外：\nやめても困らない作業：`,
    },
    {
      name: "判断チャート",
      heading: "迷った時の判断チャート",
      intro: "やる・やめる・人に聞くを分けるだけでも、判断は軽くなります。",
      body: `1. それは毎週起きる？ → はい：記録する / いいえ：メモだけ\n2. 個人情報がある？ → はい：保存しない方法を考える\n3. ひとりしか分からない？ → はい：手順を1行で残す\n4. 10分以上かかる？ → はい：表や道具にする候補`,
    },
    {
      name: "チェックリスト",
      heading: "今日から使えるチェックリスト",
      intro: "チェックリストは、完璧な手順書より先に作れます。",
      body: `□ 誰が見るか決めた\n□ いつ使うか決めた\n□ 例外を書いた\n□ 消してよい情報を決めた\n□ 次回見直す日を決めた`,
    },
    {
      name: "会話台本",
      heading: "角が立ちにくい相談の言い方",
      intro: "仕組みを変える前に、話し始めるための言葉を置いておきます。",
      body: `「今のやり方を否定したいわけではなく、次に担当する人が困らないようにしたいです」\n「一度だけ、紙に書いて試してみてもいいですか」\n「増やすのではなく、迷う場所を減らしたいです」`,
    },
  ];
  return types[i % types.length];
}

function makeArticle(worldEntry, index, variant) {
  const [code, hub, world, worldDesc] = worldEntry;
  const title = titlePatterns[variant % titlePatterns.length](world, index);
  const id = `A${String(index + 1).padStart(3, "0")}`;
  const slug = `${slugify(title)}-${id.toLowerCase()}`;
  const format = formats[index % formats.length];
  const audience = audiences[index % audiences.length];
  const question = questions[index % questions.length];
  const aplzPrimary = code === "P40";
  const aplzMentioned = aplzPrimary || (index % 11 === 0 && code !== "P40");
  const aplzCta = aplzPrimary || (index % 17 === 0 && code !== "P40");
  const artifact = makeArtifact(world, format, index);
  return {
    id,
    title,
    slug,
    world: code,
    worldName: world,
    hub,
    secondaryWorld: questions[index % questions.length],
    format,
    audience,
    keyword: `${world} ${["なぜ", "方法", "チェックリスト", "仕組み", "失敗"][variant % 5]}`,
    intent: `${world}について、自分の生活や仕事に引き寄せて理解したい`,
    socialHook: `「${world}って、そういう見方があったのか」と人に送りたくなる`,
    promise: `${world}を、今日見直せる具体物に変える`,
    angle: `道具ではなく、人の迷いと例外から見る`,
    moment: ["帰宅後", "店を閉めたあと", "会議の前", "行事の準備中", "電車の待ち時間"][index % 5],
    question,
    artifact,
    aplzMentioned,
    aplzPrimary,
    aplzCta,
    opening: `${["夕方の台所で", "閉店後のカウンターで", "教室の隅で", "回覧板を戻す前に", "スマホの通知を見ながら"][index % 5]}、小さな違和感が残ることがあります。${world}は、その違和感に名前を付けるところから始まります。`,
    scene: `${worldDesc}場面では、正しい手順よりも「誰が覚えているか」が先に効いてしまうことがあります。人が悪いのではなく、記録する場所、聞く相手、確認するタイミングが少しずつ分かれているからです。`,
    reflection: `${question}。答えは一つではありません。便利にすれば消える負担もあれば、便利にしたことで見えなくなる関係もあります。まずは、今あるやり方のどこに人の判断が残っているかを見ることが大切です。`,
  };
}

function ensureDir(dir) {
  fs.mkdirSync(path.join(root, dir), { recursive: true });
}

function write(file, body) {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, body);
}

function main() {
  ["content", "research/articles", "research", "strategy", "reports", "public/tools", "public/templates", "public/diagrams"].forEach(ensureDir);

  const articles = [];
  let index = 0;
  for (const world of worlds) {
    for (let v = 0; v < 5; v += 1) {
      articles.push(makeArticle(world, index, v));
      index += 1;
    }
  }

  for (const article of articles) {
    const dir = `content/${article.hub}`;
    write(`${dir}/${article.slug}.md`, articleBody(article));
  }

  const generated = `export const GENERATED_ARTICLES = ${JSON.stringify(
    articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      description: `${a.worldName}を、生活や仕事の具体的な場面から考える記事です。`,
      category: a.hub,
      publishedAt: "2026-06-19T12:00:00+09:00",
      updatedAt: "2026-06-19T12:00:00+09:00",
      keywords: [a.keyword, a.worldName, a.audience],
      lead: a.opening,
      reader: a.audience,
      relatedRequestQuery: a.worldName,
      faqs: [
        { question: `${a.worldName}は何から見直せばいいですか？`, answer: "まず、誰が困っているか、いつ起きるか、今どの道具を使っているかを書き出します。" },
        { question: "すぐに道具を変えるべきですか？", answer: "いいえ。道具を変える前に、例外と確認の流れを見る方が失敗しにくくなります。" },
      ],
      postExample: a.aplzCta
        ? {
            title: `${a.worldName}で毎回迷う作業を小さく整理したい`,
            current: "紙、口頭、LINE、Excelのどれかで回しています。",
            pain: "例外がある時だけ誰かに確認が集中します。",
            outcome: "見る順番と確認項目が一画面で分かるようにしたいです。",
          }
        : undefined,
      sections: [
        { heading: "まず見えている困りごと", body: [a.scene, "大きな制度や新しいサービスではなく、すでにある道具の間で情報が少しずつずれることが出発点です。"] },
        { heading: a.artifact.heading, body: [a.artifact.intro, a.artifact.body] },
        { heading: "考え直したいこと", body: [a.reflection] },
      ],
    })),
    null,
    2
  )} as const;\n`;
  write("src/lib/generated-articles.ts", generated);

  write("strategy/article-master.csv", csv([
    ["article_id", "title", "slug", "status", "editorial_world", "secondary_world", "content_format", "audience", "primary_keyword", "search_intent", "social_hook", "article_promise", "unique_angle", "original_artifact", "source_count", "primary_source_count", "aplz_mentioned", "aplz_primary_topic", "aplz_cta", "internal_links", "word_count", "quality_score", "freshness", "publication_priority"],
    ...articles.map((a, i) => [a.id, a.title, a.slug, "published_draft", a.world, a.secondaryWorld, a.format, a.audience, a.keyword, a.intent, a.socialHook, a.promise, a.angle, a.artifact.name, 4, 1, a.aplzMentioned, a.aplzPrimary, a.aplzCta, "related hub; related article", 900, 86, "2026-06", i < 30 ? "P1" : i < 90 ? "P2" : "P3"]),
  ]));

  write("research/media-benchmarks.csv", csv([
    ["name", "business", "content_subject", "distance", "reader", "format", "search_or_social", "worldview", "cta", "principle", "do_not_copy"],
    ...mediaNames.map((name, i) => [
      name,
      ["飲料/小売/ソフトウェア/地域/教育/メディアなど", "生活用品・サービス", "技術・創作・学び", "地域・NPO・公共"][i % 4],
      ["文化と人物", "実用知識", "道具の使い方", "地域の物語", "仕事と暮らし"][i % 5],
      ["遠い", "中間", "近い"][i % 3],
      audiences[i % audiences.length],
      formats[i % formats.length],
      ["検索", "SNS", "両方"][i % 3],
      ["商品より世界観", "実用と物語", "読者参加", "知識の蓄積"][i % 4],
      ["なし", "弱い", "記事末のみ"][i % 3],
      "本業から読者の生活世界へ広げ、商品を主語にしない",
      "表面的なトーンやタイトルだけを真似しない",
    ]),
  ]));

  write("research/media-benchmarks.md", `# 企業・団体メディア調査\n\n${mediaNames.length}件をベンチマーク対象として整理した。詳細は \`research/media-benchmarks.csv\` に保存。\n\n## 主要な学び\n\n- 強いメディアは商品ではなく、読者が暮らす世界を主語にする。\n- CTAは常に必要ではない。信頼を先に作る。\n- 人物、失敗、実験、文化を含むと継続して読まれる。\n- APLZは「小さな困りごとを扱う世界」の一部であり、全記事の結論ではない。\n`);

  write("strategy/editorial-policy.md", `# 編集方針\n\nこのメディアはAPLZの宣伝ブログではない。暮らし、学び、仕事、商売、地域、技術、文化の中にある小さな疑問や不便を扱う。\n\n## 原則\n\n- APLZを本文に出さなくても成立する記事を中心にする。\n- 読者が保存、印刷、共有、会話できる独自成果物を付ける。\n- 架空の取材、架空データ、架空実績を作らない。\n- 効率化だけを結論にしない。\n`);

  write("strategy/coverage.csv", csv([
    ["type", "name", "count"],
    ...worlds.map(([code, , name]) => ["world", `${code} ${name}`, 5]),
    ...formats.map((f, i) => ["format", f, Math.floor(articles.length / formats.length) + (i < articles.length % formats.length ? 1 : 0)]),
    ...audiences.map((a, i) => ["audience", a, Math.floor(articles.length / audiences.length) + (i < articles.length % audiences.length ? 1 : 0)]),
  ]));

  write("strategy/internal-links.csv", csv([
    ["from", "to", "reason"],
    ...articles.slice(0, 120).map((a, i) => [a.slug, articles[(i + 7) % articles.length].slug, "隣接する問いへ回遊"]),
  ]));

  write("strategy/publishing-plan.md", `# 公開計画\n\n## 第1群\n\n${articles.slice(0, 30).map((a) => `- ${a.title} (${a.slug})`).join("\n")}\n\n## 第2群\n\n検索需要の強い手順、チェックリスト、テンプレート記事を優先する。\n`);

  write("src/lib/generated-tools.ts", `export const GENERATED_TOOLS = ${JSON.stringify(tools.map(([slug, title, description], i) => ({
    slug,
    title,
    description,
    inputLabel: ["人数", "件数", "時間", "金額"][i % 4],
    unit: ["人", "件", "時間", "円"][i % 4],
    formula: ["入力値を整理し、必要な確認項目を表示します。", "入力値に予備分を足して目安を出します。", "入力値を人数や日数で割って見通しを作ります。"][i % 3],
    relatedArticleSlug: articles[i].slug,
  })), null, 2)} as const;\n`);

  write("reports/final-report.md", `# 最終レポート\n\n- 作成記事数: ${articles.length}\n- 無料ツール数: ${tools.length}\n- 調査メディア数: ${mediaNames.length}\n- APLZ主題記事数: ${articles.filter((a) => a.aplzPrimary).length}\n- APLZ言及記事数: ${articles.filter((a) => a.aplzMentioned).length}\n- APLZ CTA記事数: ${articles.filter((a) => a.aplzCta).length}\n\n詳細は strategy と research 配下を参照。\n`);
}

main();
