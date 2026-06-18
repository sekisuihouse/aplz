import fs from "node:fs";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const env = readEnv(path.join(process.cwd(), ".env.local"));
for (const [key, value] of Object.entries(env)) process.env[key] ??= value;

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in .env.local`);
    process.exit(1);
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const demoUsers = [
  {
    key: "neighborhood",
    email: "demo-neighborhood@aplz.dev",
    displayName: "デモ依頼者｜自治会の高橋",
    role: "requester",
    bio: "自治会・町内会まわりの小さな作業を想定したデモアカウントです。",
  },
  {
    key: "school",
    email: "demo-school@aplz.dev",
    displayName: "デモ依頼者｜放課後教室の森",
    role: "requester",
    bio: "学校・保護者連絡まわりの課題を想定したデモアカウントです。",
  },
  {
    key: "event",
    email: "demo-event@aplz.dev",
    displayName: "デモ依頼者｜小イベント受付",
    role: "requester",
    bio: "地域イベント・受付作業の課題を想定したデモアカウントです。",
  },
  {
    key: "shop",
    email: "demo-shop@aplz.dev",
    displayName: "デモ依頼者｜商店街事務局",
    role: "requester",
    bio: "小規模店舗・商店街運営の課題を想定したデモアカウントです。",
  },
  {
    key: "solo",
    email: "demo-solo@aplz.dev",
    displayName: "デモ依頼者｜個人事業の佐野",
    role: "requester",
    bio: "一人事業・現場運用の課題を想定したデモアカウントです。",
  },
  {
    key: "lesson",
    email: "demo-lesson@aplz.dev",
    displayName: "デモ依頼者｜小さな教室の中村",
    role: "requester",
    bio: "教室・ワークショップ運営の課題を想定したデモアカウントです。",
  },
  {
    key: "dev-grid",
    email: "demo-dev-grid@aplz.dev",
    displayName: "デモ開発者｜表と集計が得意",
    role: "developer",
    bio: "一覧表、割り振り、集計ツールを担当するデモ開発者です。",
  },
  {
    key: "dev-words",
    email: "demo-dev-words@aplz.dev",
    displayName: "デモ開発者｜文章整形屋",
    role: "developer",
    bio: "連絡文、貼り付け文、メモ整理を担当するデモ開発者です。",
  },
  {
    key: "dev-field",
    email: "demo-dev-field@aplz.dev",
    displayName: "デモ開発者｜現場チェック係",
    role: "developer",
    bio: "スマホで使う現場チェック系UIを担当するデモ開発者です。",
  },
  {
    key: "dev-calc",
    email: "demo-dev-calc@aplz.dev",
    displayName: "デモ開発者｜逆算ツール担当",
    role: "developer",
    bio: "材料、在庫、時間の逆算ツールを担当するデモ開発者です。",
  },
  {
    key: "dev-route",
    email: "demo-dev-route@aplz.dev",
    displayName: "デモ開発者｜順番整理係",
    role: "developer",
    bio: "順番、待ち列、時間割の整理を担当するデモ開発者です。",
  },
];

const samples = [
  {
    slug: "demo-duty-wheel",
    requestSlug: "demo-request-duty-wheel",
    requester: "neighborhood",
    developer: "dev-grid",
    variant: "ledger",
    accent: "#1B4F72",
    createdAt: "2026-06-18T09:15:00+09:00",
    deadline: "2026-06-27",
    name: "【デモ】当番くるっと割り振り",
    authorName: "デモ開発者｜表と集計が得意",
    description: "名前と当番ごとの必要人数から、偏りを見ながら割り振り表を作るデモアプリです。",
    request: {
      title: "【デモ】町内会の当番表を、毎月組み直すのがつらい",
      category: "町内会",
      status: "solved",
      privacy: "low",
      target: "町内会の班長、自治会の当番係",
      workflow: "紙の名簿を見ながら、前月と重ならないように手で割り振っています。",
      pain: "欠席や引っ越しがあるたびに全体を見直します。公平にしたつもりでも、あとから偏りを指摘されます。",
      outcome: "名前と当番名、必要人数だけ入れたら、偏りが少ない割り振り表が出てほしいです。",
      frequency: "月1回",
      input: "名前、当番名、当番ごとの必要人数",
      output: "当番ごとの担当者リスト",
    },
    fields: [
      { key: "names", label: "参加者", type: "textarea", value: "青木\n井上\n上田\n遠藤\n大野\n加藤\n木村\n佐々木" },
      { key: "tasks", label: "当番と人数", type: "textarea", value: "見回り:2\n集会所の鍵:1\n掲示板:2\n資源回収:3" },
    ],
    logic: "rota",
    comments: [
      ["question", "【デモ質問】前回の担当履歴も入れて、連続しないようにしたいですか？"],
      ["answer", "【デモ返答】最初は今回の名簿だけで大丈夫です。履歴対応は次の版で考えたいです。"],
    ],
  },
  {
    slug: "demo-after-school-note",
    requestSlug: "demo-request-after-school-note",
    requester: "school",
    developer: "dev-words",
    variant: "sticky",
    accent: "#2F6F4E",
    createdAt: "2026-06-17T16:40:00+09:00",
    deadline: "2026-06-29",
    name: "【デモ】学童お迎え連絡まとめ",
    authorName: "デモ開発者｜文章整形屋",
    description: "お迎え時間の変更連絡を貼り付けると、欠席・時間変更・補足に分けるデモアプリです。",
    request: {
      title: "【デモ】学童のお迎え変更連絡を、夕方前に整理したい",
      category: "学校・委員会",
      status: "answered",
      privacy: "medium",
      target: "学童スタッフ、放課後教室の担当者",
      workflow: "LINEや紙のメモを見ながら、ホワイトボードに手で転記しています。",
      pain: "欠席、時間変更、迎えに来る人が混ざっていて、夕方の忙しい時間に見落としやすいです。",
      outcome: "連絡文を貼ると、欠席・変更・通常連絡に分かれた確認メモになってほしいです。",
      frequency: "平日ほぼ毎日",
      input: "保護者からの短い連絡文",
      output: "確認用の一覧メモ",
    },
    fields: [
      { key: "raw", label: "連絡メモ", type: "textarea", value: "田中 17:30に祖母がお迎え\n山本 今日は欠席\n森 18:00 父が迎え\n小林 17:00に変更" },
    ],
    logic: "messages",
    comments: [
      ["question", "【デモ質問】迎えに来る人の名前は保存しない前提でよいですか？"],
      ["answer", "【デモ返答】はい。画面で整えるだけで、保存はしない形が安心です。"],
    ],
  },
  {
    slug: "demo-temple-queue",
    requestSlug: "demo-request-temple-queue",
    requester: "event",
    developer: "dev-route",
    variant: "ticket",
    accent: "#8A4B2A",
    createdAt: "2026-06-16T11:05:00+09:00",
    deadline: "2026-07-05",
    name: "【デモ】御朱印待ち札ならべ",
    authorName: "デモ開発者｜順番整理係",
    description: "受付番号と窓口数から、窓口別の呼び出し順を作るデモアプリです。",
    request: {
      title: "【デモ】小さな寺社イベントで、御朱印の待ち札を整理したい",
      category: "イベント運営",
      status: "testing",
      privacy: "none",
      target: "寺社イベントの受付ボランティア",
      workflow: "番号札を渡して、呼び出し順を紙に書いています。",
      pain: "窓口が2つある日だけ順番がずれやすく、列に並び直す人が出て受付が詰まります。",
      outcome: "番号を入れると、窓口ごとの次の呼び出し候補が見える表になってほしいです。",
      frequency: "月数回の催事",
      input: "受付番号、窓口数",
      output: "窓口別の呼び出し順",
    },
    fields: [
      { key: "tickets", label: "受付番号", type: "textarea", value: "12\n13\n14\n15\n16\n17\n18" },
      { key: "lanes", label: "窓口数", type: "number", value: "2" },
    ],
    logic: "queue",
    comments: [
      ["question", "【デモ質問】途中で番号を飛ばすケースはありますか？"],
      ["answer", "【デモ返答】あります。呼んでもいない場合は後ろに回せると便利です。"],
    ],
  },
  {
    slug: "demo-rain-notice",
    requestSlug: "demo-request-rain-notice",
    requester: "school",
    developer: "dev-words",
    variant: "broadcast",
    accent: "#315E8C",
    createdAt: "2026-06-15T07:50:00+09:00",
    deadline: "2026-06-30",
    name: "【デモ】雨天連絡文メーカー",
    authorName: "デモ開発者｜文章整形屋",
    description: "少年団や地域イベント向けに、雨天時の連絡文を短く整えるデモアプリです。",
    request: {
      title: "【デモ】雨の日の少年団連絡文を、毎回ゼロから書いている",
      category: "文章作成",
      status: "answered",
      privacy: "none",
      target: "少年団、地域スポーツ、習い事の連絡係",
      workflow: "過去のLINEを探して、日付と場所を書き換えて送っています。",
      pain: "急いで送るので、集合時間や持ち物を書き忘れます。言い回しも毎回悩みます。",
      outcome: "イベント名、場所、判断、補足だけ入れたら、そのまま送れる文章にしたいです。",
      frequency: "雨予報の日",
      input: "イベント名、場所、開催判断、補足",
      output: "LINEやメールに貼れる連絡文",
    },
    fields: [
      { key: "event", label: "イベント名", type: "text", value: "土曜午前の練習" },
      { key: "place", label: "場所", type: "text", value: "第三グラウンド" },
      { key: "condition", label: "判断", type: "text", value: "開始を30分遅らせます" },
      { key: "note", label: "補足", type: "textarea", value: "着替えとタオルを持たせてください" },
    ],
    logic: "rain",
    comments: [
      ["question", "【デモ質問】敬語寄りと短文寄り、どちらが近いですか？"],
      ["answer", "【デモ返答】保護者向けなので、短いけど失礼にならない感じがよいです。"],
    ],
  },
  {
    slug: "demo-shopping-stamp",
    requestSlug: "demo-request-shopping-stamp",
    requester: "shop",
    developer: "dev-grid",
    variant: "receipt",
    accent: "#9A3F3F",
    createdAt: "2026-06-14T19:20:00+09:00",
    deadline: "2026-07-01",
    name: "【デモ】商店街抽選券カウンター",
    authorName: "デモ開発者｜表と集計が得意",
    description: "店舗ごとの抽選券枚数を貼り付けると、合計と上位店舗を出すデモアプリです。",
    request: {
      title: "【デモ】商店街イベントの抽選券残数を、閉店後に集計している",
      category: "集計",
      status: "solved",
      privacy: "none",
      target: "商店街事務局、イベント係",
      workflow: "店舗ごとにLINEで枚数を送ってもらい、事務局がExcelへ入れています。",
      pain: "表記がバラバラで転記ミスが出ます。どの店が多く配っているかもすぐ見えません。",
      outcome: "店舗名と枚数を貼るだけで、合計と店舗別一覧が出てほしいです。",
      frequency: "イベント期間中の毎晩",
      input: "店舗名、配布済み枚数",
      output: "合計、店舗別枚数、上位店舗",
    },
    fields: [
      { key: "shops", label: "店舗名, 枚数", type: "textarea", value: "青葉精肉,42\nみどり文具,18\n駅前ベーカリー,55\n小林酒店,31" },
    ],
    logic: "lottery",
    comments: [
      ["question", "【デモ質問】残数ではなく配布済み枚数の集計でよいですか？"],
      ["answer", "【デモ返答】はい。配布済みが分かれば追加印刷の判断ができます。"],
    ],
  },
  {
    slug: "demo-kitchen-car-prep",
    requestSlug: "demo-request-kitchen-car-prep",
    requester: "solo",
    developer: "dev-calc",
    variant: "kitchen",
    accent: "#B85C38",
    createdAt: "2026-06-13T22:10:00+09:00",
    deadline: "2026-06-26",
    name: "【デモ】キッチンカー仕込み逆算",
    authorName: "デモ開発者｜逆算ツール担当",
    description: "販売予定数と一食分の材料から、仕込み量をざっくり逆算するデモアプリです。",
    request: {
      title: "【デモ】キッチンカーの仕込み量を、イベントごとに勘で決めている",
      category: "個人事業主",
      status: "answered",
      privacy: "none",
      target: "キッチンカー、屋台、イベント出店者",
      workflow: "過去の販売数を見て、材料ごとに電卓で計算しています。",
      pain: "予備分を入れ忘れます。材料ごとに単位が違って、仕込み表を作るのに時間がかかります。",
      outcome: "販売予定数と一食分の量を入れると、必要な材料量が一覧になると助かります。",
      frequency: "出店前日",
      input: "販売予定数、予備率、材料ごとの一食分量",
      output: "材料ごとの必要量",
    },
    fields: [
      { key: "servings", label: "販売予定数", type: "number", value: "85" },
      { key: "buffer", label: "予備率(%)", type: "number", value: "12" },
      { key: "ingredients", label: "材料名, 一食分g", type: "textarea", value: "ごはん,180\n鶏肉,95\nソース,35\n野菜,60" },
    ],
    logic: "stock",
    comments: [
      ["question", "【デモ質問】単位はgだけで足りますか？"],
      ["answer", "【デモ返答】最初はgだけで大丈夫です。個数管理は別で見ています。"],
    ],
  },
  {
    slug: "demo-minpaku-clean",
    requestSlug: "demo-request-minpaku-clean",
    requester: "solo",
    developer: "dev-field",
    variant: "checklist",
    accent: "#4C6A77",
    createdAt: "2026-06-12T14:35:00+09:00",
    deadline: "2026-07-03",
    name: "【デモ】民泊清掃チェック差分",
    authorName: "デモ開発者｜現場チェック係",
    description: "部屋ごとの清掃項目を貼ると、スマホで見やすいチェックリストにするデモアプリです。",
    request: {
      title: "【デモ】民泊清掃の抜け漏れを、部屋ごとに確認したい",
      category: "個人事業主",
      status: "testing",
      privacy: "none",
      target: "小規模民泊の運営者、清掃担当者",
      workflow: "紙のチェック表を印刷して、終わったら写真で送っています。",
      pain: "物件ごとに項目が少し違います。紙を作り直すほどではないが、毎回確認が曖昧になります。",
      outcome: "場所と作業を貼るだけで、スマホで見やすいチェックリストになってほしいです。",
      frequency: "チェックアウト日の午前",
      input: "場所、作業項目",
      output: "部屋ごとのチェックリスト",
    },
    fields: [
      { key: "rooms", label: "場所:作業", type: "textarea", value: "玄関:鍵返却確認\n浴室:排水口確認\n寝室:シーツ交換\nキッチン:冷蔵庫内確認\nリビング:忘れ物確認" },
    ],
    logic: "cleanup",
    comments: [
      ["question", "【デモ質問】写真添付まで必要ですか？"],
      ["answer", "【デモ返答】今はチェックリストだけで十分です。写真は別で送っています。"],
    ],
  },
  {
    slug: "demo-pickup-route",
    requestSlug: "demo-request-pickup-route",
    requester: "lesson",
    developer: "dev-route",
    variant: "route",
    accent: "#5B578A",
    createdAt: "2026-06-11T08:25:00+09:00",
    deadline: "2026-07-04",
    name: "【デモ】送迎ざっくり時間割",
    authorName: "デモ開発者｜順番整理係",
    description: "住所を扱わず、方面と所要分数から送迎の目安時間を作るデモアプリです。",
    request: {
      title: "【デモ】送迎の順番メモを、住所なしでざっくり組みたい",
      category: "予約・申込",
      status: "answered",
      privacy: "high",
      target: "少人数の教室、整体院、地域送迎の担当者",
      workflow: "個別の住所を見ながら紙に順番を書いています。",
      pain: "住所をアプリに入れるのは避けたいです。でも方面と人数だけで所要時間の目安は見たいです。",
      outcome: "方面名、人数、移動分だけで、出発から戻りまでの時間割を作りたいです。",
      frequency: "送迎がある日",
      input: "出発時刻、方面名、人数、移動分",
      output: "住所を含まない送迎時間の目安",
    },
    fields: [
      { key: "start", label: "出発時刻", type: "text", value: "15:30" },
      { key: "stops", label: "方面, 人数, 移動分", type: "textarea", value: "北口方面,2,12\n公園前,1,8\n駅南,3,15\n戻り,0,10" },
    ],
    logic: "route",
    comments: [
      ["question", "【デモ質問】個別住所は絶対に入力しない運用でよいですか？"],
      ["answer", "【デモ返答】はい。方面名だけで十分です。個人情報を入れない前提にしたいです。"],
    ],
  },
  {
    slug: "demo-knit-kit",
    requestSlug: "demo-request-knit-kit",
    requester: "lesson",
    developer: "dev-calc",
    variant: "craft",
    accent: "#7B5A6A",
    createdAt: "2026-06-10T20:45:00+09:00",
    deadline: "2026-06-29",
    name: "【デモ】編み物教室キット数え",
    authorName: "デモ開発者｜逆算ツール担当",
    description: "参加人数と材料リストから、予備込みの材料数を数えるデモアプリです。",
    request: {
      title: "【デモ】編み物教室の材料キット数を、直前に数え直している",
      category: "予約・申込",
      status: "solved",
      privacy: "none",
      target: "少人数教室の先生、ワークショップ主催者",
      workflow: "参加人数を見ながら、材料ごとに手で掛け算してメモしています。",
      pain: "予備分を忘れがちです。材料が増えると、どれを何個買うか確認に時間がかかります。",
      outcome: "人数、予備数、材料リストを入れたら、必要数を一気に出したいです。",
      frequency: "開催前",
      input: "参加人数、予備数、材料名、1人分個数",
      output: "材料ごとの必要数",
    },
    fields: [
      { key: "people", label: "参加人数", type: "number", value: "14" },
      { key: "spare", label: "予備キット", type: "number", value: "2" },
      { key: "items", label: "材料名, 1人分個数", type: "textarea", value: "毛糸玉,2\n編み針,1\n説明カード,1\n持ち帰り袋,1" },
    ],
    logic: "kit",
    comments: [
      ["question", "【デモ質問】材料は小数ではなく個数管理でよさそうですか？"],
      ["answer", "【デモ返答】はい。袋やカードも含めて個数で数えたいです。"],
    ],
  },
  {
    slug: "demo-towel-rotation",
    requestSlug: "demo-request-towel-rotation",
    requester: "shop",
    developer: "dev-calc",
    variant: "salon",
    accent: "#34727A",
    createdAt: "2026-06-09T18:05:00+09:00",
    deadline: "2026-06-27",
    name: "【デモ】タオル洗濯ローテ表",
    authorName: "デモ開発者｜逆算ツール担当",
    description: "予約数とタオル在庫から、洗濯が必要な枚数の目安を出すデモアプリです。",
    request: {
      title: "【デモ】小さな店舗のタオル洗濯タイミングを、感覚で回している",
      category: "個人事業主",
      status: "answered",
      privacy: "none",
      target: "整体院、美容室、個人サロンなどの小規模店舗",
      workflow: "予約表を見て、足りなさそうな日に多めに洗濯しています。",
      pain: "忙しい日に不足しそうになります。逆に洗いすぎて干す場所が足りない日もあります。",
      outcome: "予約数、1予約あたり枚数、清潔な在庫から、洗濯の必要枚数を見たいです。",
      frequency: "前日の閉店後",
      input: "予約数、使用枚数、在庫枚数",
      output: "必要枚数、不足枚数、洗濯目安",
    },
    fields: [
      { key: "bookings", label: "予約数", type: "number", value: "18" },
      { key: "perBooking", label: "1予約あたり枚数", type: "number", value: "3" },
      { key: "stock", label: "清潔な在庫枚数", type: "number", value: "46" },
    ],
    logic: "laundry",
    comments: [
      ["question", "【デモ質問】予備として何枚くらい残す運用ですか？"],
      ["answer", "【デモ返答】最低10枚は残したいです。急な追加予約があるためです。"],
    ],
  },
];

await main();

async function main() {
  console.log("Preparing demo accounts...");
  const users = await ensureDemoUsers();
  await removeExistingDemoContent();

  for (const sample of samples) {
    await uploadHtml(sample);
    const app = await insertApp(sample, users);
    const request = await insertRequest(sample, users);
    const solution = await insertSolution(sample, request.id, app.id, users);
    await insertRequestComments(sample, request.id, users);
    await insertAppEngagement(sample, app.id);
    await insertSolutionFeedback(solution.id, users);
    console.log(`Seeded ${sample.name}`);
  }

  console.log(`\nDone. Seeded ${samples.length} labeled demo apps and requests.`);
}

async function ensureDemoUsers() {
  const existingByEmail = await listUsersByEmail();
  const result = {};

  for (const user of demoUsers) {
    let authUser = existingByEmail.get(user.email);
    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: randomPassword(),
        email_confirm: true,
        user_metadata: { display_name: user.displayName, demo_account: true },
      });
      throwIfError(error, `create auth user ${user.email}`);
      authUser = data.user;
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: authUser.id,
        display_name: user.displayName,
        bio: user.bio,
        developer_enabled: user.role === "developer",
        skill_categories:
          user.role === "developer" ? ["デモ", "小さな業務アプリ"] : [],
        role: user.role === "developer" ? "developer" : "user",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    throwIfError(profileError, `upsert profile ${user.email}`);
    result[user.key] = authUser.id;
  }

  return result;
}

async function listUsersByEmail() {
  const users = new Map();
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    throwIfError(error, "list auth users");
    for (const user of data.users) users.set(user.email, user);
    if (data.users.length < 1000) break;
    page += 1;
  }
  return users;
}

async function removeExistingDemoContent() {
  const requestSlugs = samples.map((sample) => sample.requestSlug);
  const appSlugs = samples.map((sample) => sample.slug);

  const { data: requests, error: requestError } = await supabase
    .from("requests")
    .select("id")
    .in("slug", requestSlugs);
  throwIfError(requestError, "select existing demo requests");
  if (requests?.length) {
    const { error } = await supabase
      .from("requests")
      .delete()
      .in("id", requests.map((row) => row.id));
    throwIfError(error, "delete existing demo requests");
  }

  const { data: apps, error: appError } = await supabase
    .from("apps")
    .select("id")
    .in("slug", appSlugs);
  throwIfError(appError, "select existing demo apps");
  if (apps?.length) {
    const { error } = await supabase
      .from("apps")
      .delete()
      .in("id", apps.map((row) => row.id));
    throwIfError(error, "delete existing demo apps");
  }
}

async function uploadHtml(sample) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `${sample.slug}/index.html`,
      Body: Buffer.from(renderHtml(sample), "utf8"),
      ContentType: "text/html; charset=utf-8",
    })
  );
}

async function insertApp(sample, users) {
  const { data, error } = await supabase
    .from("apps")
    .insert({
      name: sample.name,
      description: sample.description,
      slug: sample.slug,
      author_name: sample.authorName,
      file_count: 1,
      user_id: users[sample.developer],
      is_public: true,
      version: 1,
      created_at: sample.createdAt,
      last_published_at: offsetIso(sample.createdAt, 1),
    })
    .select("id")
    .single();
  throwIfError(error, `insert app ${sample.slug}`);
  return data;
}

async function insertRequest(sample, users) {
  const request = sample.request;
  const { data, error } = await supabase
    .from("requests")
    .insert({
      slug: sample.requestSlug,
      user_id: users[sample.requester],
      title: request.title,
      category: request.category,
      target_user_type: request.target,
      current_workflow: request.workflow,
      pain_point: request.pain,
      desired_outcome: request.outcome,
      usage_frequency: request.frequency,
      input_data: request.input,
      output_data: request.output,
      privacy_level: request.privacy,
      deadline: sample.deadline,
      description: `これはAPLZの動作確認用デモ投稿です。実在の依頼ではありません。\n\n${request.pain}`,
      status: request.status,
      is_public: true,
      is_beginner_friendly: true,
      created_at: sample.createdAt,
      updated_at: offsetIso(sample.createdAt, 4),
    })
    .select("id")
    .single();
  throwIfError(error, `insert request ${sample.requestSlug}`);
  return data;
}

async function insertSolution(sample, requestId, appId, users) {
  const { data, error } = await supabase
    .from("solutions")
    .insert({
      request_id: requestId,
      user_id: users[sample.developer],
      app_id: appId,
      app_slug: sample.slug,
      title: `【デモ回答】${sample.name.replace("【デモ】", "")}`,
      description:
        "APLZの使い方を確認するためのデモ回答です。課題からアプリ回答へつながる流れを確認できます。",
      usage_guide: sample.fields.map((field) => `${field.label}を入力`).join("、") + "して結果を確認します。",
      can_do: sample.request.outcome,
      cannot_do: "実データの長期保存、外部サービス連携、ログイン情報の保存はしません。",
      data_handled: sample.request.input,
      external_communication: false,
      data_storage: false,
      recommended_environment: "スマホまたはPCのブラウザ",
      version_note: "デモv1。入力内容はブラウザ内で処理されます。",
      caution_note:
        sample.request.privacy === "high"
          ? "住所や実名などの個人情報は入力しない前提のデモです。"
          : "デモ用途のため、実運用前に内容を確認してください。",
      is_accepted: sample.request.status === "solved",
      status: "published",
      created_at: offsetIso(sample.createdAt, 2),
      updated_at: offsetIso(sample.createdAt, 5),
    })
    .select("id")
    .single();
  throwIfError(error, `insert solution ${sample.slug}`);
  return data;
}

async function insertRequestComments(sample, requestId, users) {
  const rows = sample.comments.map(([commentType, body], index) => ({
    request_id: requestId,
    user_id: index % 2 === 0 ? users[sample.developer] : users[sample.requester],
    body,
    comment_type: commentType,
    created_at: offsetIso(sample.createdAt, index + 1),
  }));
  const { error } = await supabase.from("request_comments").insert(rows);
  throwIfError(error, `insert request comments ${sample.slug}`);
}

async function insertAppEngagement(sample, appId) {
  const appComments = [
    {
      app_id: appId,
      author_name: "デモ確認ユーザー",
      body: "デモとして触ると、入力から結果までの流れが分かります。",
      created_at: offsetIso(sample.createdAt, 6),
    },
    {
      app_id: appId,
      author_name: "デモ運用メモ",
      body: "実運用では、入力するデータの範囲を先に決めるとよさそうです。",
      created_at: offsetIso(sample.createdAt, 7),
    },
  ];
  const { error: commentError } = await supabase.from("comments").insert(appComments);
  throwIfError(commentError, `insert app comments ${sample.slug}`);

  const ratings = [
    { usability: 5, design: 4, idea: 5 },
    { usability: 4, design: 5, idea: 4 },
  ].map((rating, index) => ({
    app_id: appId,
    ...rating,
    created_at: offsetIso(sample.createdAt, 8 + index),
  }));
  const { error: ratingError } = await supabase.from("ratings").insert(ratings);
  throwIfError(ratingError, `insert ratings ${sample.slug}`);

  const reactions = ["like", "want", "feedback"].map((emoji, index) => ({
    app_id: appId,
    emoji,
    identifier: `demo-${sample.slug}-${index + 1}`,
    created_at: offsetIso(sample.createdAt, 10 + index),
  }));
  const { error: reactionError } = await supabase.from("reactions").insert(reactions);
  throwIfError(reactionError, `insert reactions ${sample.slug}`);
}

async function insertSolutionFeedback(solutionId, users) {
  const requesterIds = ["neighborhood", "school", "event", "shop", "solo", "lesson"]
    .map((key) => users[key])
    .filter(Boolean);
  const rows = ["thanks", "clear", "use_again"].map((feedbackType, index) => ({
    solution_id: solutionId,
    user_id: requesterIds[index % requesterIds.length],
    feedback_type: feedbackType,
    comment: null,
    created_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("solution_feedback").insert(rows);
  throwIfError(error, "insert solution feedback");
}

function renderHtml(sample) {
  const config = {
    title: sample.name,
    description: sample.description,
    accent: sample.accent,
    variant: sample.variant,
    logic: sample.logic,
    fields: sample.fields,
  };

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(sample.name)}</title>
  <style>
    :root { --accent: ${sample.accent}; --ink: #151515; --muted: #686868; --line: #dedbd4; --paper: #fffdf8; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg, #f7f3ec); color: var(--ink); }
    body.ledger { --bg: #f3f6f7; --paper: #ffffff; }
    body.sticky { --bg: #f8f5df; --paper: #fff9b8; }
    body.ticket { --bg: #f1e7d8; --paper: #fffaf2; }
    body.broadcast { --bg: #edf4fb; --paper: #ffffff; }
    body.receipt { --bg: #f8f1ef; --paper: #fff; }
    body.kitchen { --bg: #fff2e9; --paper: #fffaf6; }
    body.checklist { --bg: #eef5f4; --paper: #ffffff; }
    body.route { --bg: #efeff8; --paper: #ffffff; }
    body.craft { --bg: #f7edf3; --paper: #fffafd; }
    body.salon { --bg: #eaf5f4; --paper: #ffffff; }
    main { max-width: 1040px; margin: 0 auto; padding: 24px 16px 40px; }
    .shell { display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(320px, 1fr); gap: 16px; align-items: start; }
    .panel { background: var(--paper); border: 1px solid color-mix(in srgb, var(--accent) 18%, var(--line)); border-radius: var(--radius, 12px); padding: 18px; box-shadow: 0 14px 34px rgba(0,0,0,.05); }
    body.ticket .panel { border-style: dashed; border-radius: 2px; }
    body.receipt .panel { border-radius: 0; box-shadow: 0 8px 0 rgba(0,0,0,.04); }
    body.sticky .panel { transform: rotate(-0.4deg); }
    body.route .shell { grid-template-columns: 360px minmax(0, 1fr); }
    .tag { display: inline-flex; color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 35%, white); background: white; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 800; margin-bottom: 12px; }
    h1 { margin: 0; font-size: clamp(25px, 5vw, 44px); line-height: 1.07; letter-spacing: 0; }
    p { color: var(--muted); line-height: 1.7; }
    label { display: grid; gap: 6px; color: #555; font-size: 13px; font-weight: 800; margin-bottom: 12px; }
    input, textarea { width: 100%; border: 1px solid var(--line); border-radius: 9px; padding: 10px 11px; font: inherit; background: white; color: var(--ink); }
    textarea { min-height: 116px; resize: vertical; line-height: 1.5; }
    button { width: 100%; min-height: 44px; border: 0; border-radius: 9px; background: var(--accent); color: white; font-weight: 900; cursor: pointer; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; font: 14px/1.7 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .result { min-height: 300px; }
    .note { margin-top: 10px; font-size: 12px; color: #777; }
    @media (max-width: 760px) { .shell, body.route .shell { grid-template-columns: 1fr; } main { padding-top: 18px; } }
  </style>
</head>
<body class="${escapeHtml(sample.variant)}">
  <main>
    <div class="shell">
      <section class="panel">
        <span class="tag">APLZ デモアプリ</span>
        <h1>${escapeHtml(sample.name.replace("【デモ】", ""))}</h1>
        <p>${escapeHtml(sample.description)}</p>
        <form id="tool"></form>
        <button id="run" type="button">結果を見る</button>
        <p class="note">これはデモです。入力内容はブラウザ内だけで処理されます。</p>
      </section>
      <section class="panel result">
        <pre id="result"></pre>
      </section>
    </div>
  </main>
  <script>
    const config = ${JSON.stringify(config)};
    const form = document.querySelector("#tool");
    const result = document.querySelector("#result");
    for (const field of config.fields) {
      const label = document.createElement("label");
      label.append(field.label);
      const input = document.createElement(field.type === "textarea" ? "textarea" : "input");
      input.name = field.key;
      if (field.type !== "textarea") input.type = field.type;
      input.value = field.value;
      label.append(input);
      form.append(label);
    }
    document.querySelector("#run").addEventListener("click", run);
    form.addEventListener("input", run);
    run();
    function value(key) { return new FormData(form).get(key)?.toString().trim() || ""; }
    function lines(text) { return text.split(/\\n+/).map((line) => line.trim()).filter(Boolean); }
    function num(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
    function addMinutes(time, minutes) {
      const [h, m] = time.split(":").map(Number);
      const date = new Date(2026, 0, 1, h || 0, m || 0);
      date.setMinutes(date.getMinutes() + minutes);
      return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
    }
    function run() {
      const kind = config.logic;
      if (kind === "rota") return rota();
      if (kind === "messages") return messages();
      if (kind === "queue") return queue();
      if (kind === "rain") return rain();
      if (kind === "lottery") return lottery();
      if (kind === "stock") return stock();
      if (kind === "cleanup") return cleanup();
      if (kind === "route") return route();
      if (kind === "kit") return kit();
      if (kind === "laundry") return laundry();
    }
    function rota() {
      const names = lines(value("names"));
      let index = 0;
      result.textContent = "当番表\\n" + lines(value("tasks")).map((line) => {
        const [task, countText] = line.split(":");
        const count = Math.max(1, num(countText, 1));
        const people = Array.from({ length: count }, () => names[index++ % Math.max(names.length, 1)] || "未入力");
        return "・" + (task || "当番") + " : " + people.join("、");
      }).join("\\n");
    }
    function messages() {
      const rows = lines(value("raw"));
      const absent = rows.filter((row) => /欠席|休/.test(row));
      const changed = rows.filter((row) => /変更|祖母|父|母|迎え|[0-9]{1,2}[:：][0-9]{2}/.test(row) && !absent.includes(row));
      result.textContent = ["欠席", absent.join("\\n") || "なし", "", "お迎え・時間変更", changed.join("\\n") || "なし", "", "未分類", rows.filter((row) => !absent.includes(row) && !changed.includes(row)).join("\\n") || "なし"].join("\\n");
    }
    function queue() {
      const tickets = lines(value("tickets"));
      const lanes = Math.max(1, num(value("lanes"), 1));
      const grouped = Array.from({ length: lanes }, (_, lane) => tickets.filter((_, index) => index % lanes === lane));
      result.textContent = grouped.map((items, index) => "窓口" + (index + 1) + "\\n" + items.map((item, i) => "  " + (i + 1) + ". 番号 " + item).join("\\n")).join("\\n\\n");
    }
    function rain() {
      result.textContent = "本日の「" + value("event") + "」について\\n\\n" + value("place") + "の状態を確認し、" + value("condition") + "。\\n" + value("note") + "\\n\\n変更があれば、この連絡に追記します。";
    }
    function lottery() {
      const rows = lines(value("shops")).map((line) => { const [name, count] = line.split(","); return { name: name?.trim() || "店舗", count: num(count) }; }).sort((a, b) => b.count - a.count);
      result.textContent = "合計 " + rows.reduce((sum, row) => sum + row.count, 0) + "枚\\n\\n" + rows.map((row, i) => (i + 1) + ". " + row.name + " " + row.count + "枚").join("\\n");
    }
    function stock() {
      const servings = num(value("servings"));
      const buffer = 1 + num(value("buffer")) / 100;
      result.textContent = "仕込み目安（" + servings + "食、予備込み）\\n" + lines(value("ingredients")).map((line) => { const [name, grams] = line.split(","); return "・" + (name || "材料") + " " + Math.ceil(servings * num(grams) * buffer).toLocaleString() + "g"; }).join("\\n");
    }
    function cleanup() {
      result.textContent = "清掃チェック\\n" + lines(value("rooms")).map((line) => { const [room, task] = line.split(":"); return "□ " + (room || "場所") + " / " + (task || "作業"); }).join("\\n");
    }
    function route() {
      let current = value("start") || "09:00";
      result.textContent = "住所を含まない送迎目安\\n" + lines(value("stops")).map((line) => { const [place, people, mins] = line.split(","); const depart = current; current = addMinutes(current, num(mins)); return depart + " - " + current + "  " + (place || "方面") + "（" + num(people) + "人）"; }).join("\\n");
    }
    function kit() {
      const total = num(value("people")) + num(value("spare"));
      result.textContent = "合計 " + total + "名分\\n" + lines(value("items")).map((line) => { const [name, count] = line.split(","); return "・" + (name || "材料") + " " + total * num(count) + "個"; }).join("\\n");
    }
    function laundry() {
      const need = num(value("bookings")) * num(value("perBooking"));
      const stock = num(value("stock"));
      const reserve = 10;
      result.textContent = "必要枚数: " + need + "枚\\n残したい予備: " + reserve + "枚\\n清潔な在庫: " + stock + "枚\\n\\n洗濯したい枚数: " + Math.max(0, need + reserve - stock) + "枚";
    }
  </script>
</body>
</html>`;
}

function offsetIso(iso, hours) {
  const date = new Date(iso);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function randomPassword() {
  return `Demo-${Math.random().toString(36).slice(2)}-${Date.now()}!`;
}

function throwIfError(error, label) {
  if (!error) return;
  console.error(`${label}: ${error.message}`);
  process.exit(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readEnv(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}
