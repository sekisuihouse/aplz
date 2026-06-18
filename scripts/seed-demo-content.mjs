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
    avatar: { initials: "高", color: "#1B4F72", mark: "班" },
  },
  {
    key: "school",
    email: "demo-school@aplz.dev",
    displayName: "デモ依頼者｜放課後教室の森",
    role: "requester",
    bio: "学校・保護者連絡まわりの課題を想定したデモアカウントです。",
    avatar: { initials: "森", color: "#2F6F4E", mark: "学" },
  },
  {
    key: "event",
    email: "demo-event@aplz.dev",
    displayName: "デモ依頼者｜小イベント受付",
    role: "requester",
    bio: "地域イベント・受付作業の課題を想定したデモアカウントです。",
    avatar: { initials: "受", color: "#8A4B2A", mark: "札" },
  },
  {
    key: "shop",
    email: "demo-shop@aplz.dev",
    displayName: "デモ依頼者｜商店街事務局",
    role: "requester",
    bio: "小規模店舗・商店街運営の課題を想定したデモアカウントです。",
    avatar: { initials: "商", color: "#9A3F3F", mark: "店" },
  },
  {
    key: "solo",
    email: "demo-solo@aplz.dev",
    displayName: "デモ依頼者｜個人事業の佐野",
    role: "requester",
    bio: "一人事業・現場運用の課題を想定したデモアカウントです。",
    avatar: { initials: "佐", color: "#B85C38", mark: "現" },
  },
  {
    key: "lesson",
    email: "demo-lesson@aplz.dev",
    displayName: "デモ依頼者｜小さな教室の中村",
    role: "requester",
    bio: "教室・ワークショップ運営の課題を想定したデモアカウントです。",
    avatar: { initials: "中", color: "#7B5A6A", mark: "教" },
  },
  {
    key: "dev-grid",
    email: "demo-dev-grid@aplz.dev",
    displayName: "デモ開発者｜表と集計が得意",
    role: "developer",
    bio: "一覧表、割り振り、集計ツールを担当するデモ開発者です。",
    avatar: { initials: "表", color: "#0F5E7A", mark: "Σ" },
  },
  {
    key: "dev-words",
    email: "demo-dev-words@aplz.dev",
    displayName: "デモ開発者｜文章整形屋",
    role: "developer",
    bio: "連絡文、貼り付け文、メモ整理を担当するデモ開発者です。",
    avatar: { initials: "文", color: "#315E8C", mark: "Aa" },
  },
  {
    key: "dev-field",
    email: "demo-dev-field@aplz.dev",
    displayName: "デモ開発者｜現場チェック係",
    role: "developer",
    bio: "スマホで使う現場チェック系UIを担当するデモ開発者です。",
    avatar: { initials: "確", color: "#4C6A77", mark: "✓" },
  },
  {
    key: "dev-calc",
    email: "demo-dev-calc@aplz.dev",
    displayName: "デモ開発者｜逆算ツール担当",
    role: "developer",
    bio: "材料、在庫、時間の逆算ツールを担当するデモ開発者です。",
    avatar: { initials: "逆", color: "#34727A", mark: "÷" },
  },
  {
    key: "dev-route",
    email: "demo-dev-route@aplz.dev",
    displayName: "デモ開発者｜順番整理係",
    role: "developer",
    bio: "順番、待ち列、時間割の整理を担当するデモ開発者です。",
    avatar: { initials: "順", color: "#5B578A", mark: "1" },
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
    description: "名前、前回担当、当番枠を見比べながら、町内会向けの割り振り案を作るデモアプリです。",
    request: {
      title: "【デモ】班の入れ替わりが多く、町内会の当番が一部の人に寄ってしまう",
      category: "町内会",
      status: "solved",
      privacy: "low",
      target: "町内会の班長、自治会の当番係",
      workflow: "班ごとの紙名簿に、前回の担当を赤ペンで書き込んでから当番表を作っています。",
      pain: "新しく入った世帯と高齢で免除の世帯が混ざるため、単純な順番表では回せません。説明できる公平さがほしいです。",
      outcome: "名前、免除メモ、当番枠を入れると、偏りの少ない案と確認用の表が出てほしいです。",
      frequency: "月1回",
      input: "名前、免除メモ、当番名、当番ごとの必要人数",
      output: "当番ごとの担当者リストと偏り確認",
    },
    fields: [
      { key: "names", label: "参加者", type: "textarea", value: "青木\n井上\n上田\n遠藤\n大野\n加藤\n木村\n佐々木" },
      { key: "tasks", label: "当番と人数", type: "textarea", value: "見回り:2\n集会所の鍵:1\n掲示板:2\n資源回収:3" },
    ],
    logic: "rota",
    comments: [
      ["question", "【デモ質問】免除や相談中の人は、完全に外す表示と候補に残す表示のどちらが近いですか？"],
      ["answer", "【デモ返答】候補には残したいです。あとで班長が事情を見て調整できる形がよいです。"],
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
    description: "保護者から届いた短い連絡を、スタッフが夕方に見やすい確認メモへ分けるデモアプリです。",
    request: {
      title: "【デモ】学童の連絡メモがLINE、口頭、紙で混ざり、夕方の確認が怖い",
      category: "学校・委員会",
      status: "answered",
      privacy: "medium",
      target: "学童スタッフ、放課後教室の担当者",
      workflow: "LINEのスクショ、電話メモ、子どもが持ってきた紙を見ながら、スタッフ用ノートへ書き写しています。",
      pain: "迎えに来る人、時間変更、欠席が同じメモ欄に混ざり、17時台だけ確認が集中します。個人名を残しすぎるのも避けたいです。",
      outcome: "短い連絡文を貼ると、欠席・時間変更・要確認だけに分かれ、終わったら消せるメモにしたいです。",
      frequency: "平日ほぼ毎日",
      input: "保護者からの短い連絡文、時刻、迎えに来る人の続柄",
      output: "夕方スタッフ向けの確認メモ",
    },
    fields: [
      { key: "raw", label: "連絡メモ", type: "textarea", value: "田中 17:30に祖母がお迎え\n山本 今日は欠席\n森 18:00 父が迎え\n小林 17:00に変更" },
    ],
    logic: "messages",
    comments: [
      ["question", "【デモ質問】確認済みチェックを付けたいですか、それとも印刷前提ですか？"],
      ["answer", "【デモ返答】スマホで確認済みにできると助かります。ただ保存はその日だけでよいです。"],
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
    description: "受付番号を窓口ごとに分け、呼び出し忘れと二重呼び出しを減らすデモアプリです。",
    request: {
      title: "【デモ】御朱印受付で番号札を配るが、二つの窓口で呼び出し順がずれる",
      category: "イベント運営",
      status: "testing",
      privacy: "none",
      target: "寺社イベントの受付ボランティア",
      workflow: "受付で番号札を渡し、書き手が空いた窓口から順番に呼んでいます。",
      pain: "片方の窓口だけ早く進むと番号が前後します。待っている人に『自分は飛ばされたのか』と聞かれます。",
      outcome: "受付番号と窓口数を入れると、窓口ごとの次候補と保留番号が一目で分かってほしいです。",
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
      ["question", "【デモ質問】番号を飛ばした理由も記録しますか？"],
      ["answer", "【デモ返答】理由までは不要です。『一度呼んだ』印だけあれば現場では足ります。"],
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
    description: "天候判断、集合場所、持ち物を抜けなく入れた連絡文へ整えるデモアプリです。",
    request: {
      title: "【デモ】少年団の雨天判断を送るたび、集合場所と持ち物を書き忘れそうになる",
      category: "文章作成",
      status: "answered",
      privacy: "none",
      target: "少年団、地域スポーツ、習い事の連絡係",
      workflow: "朝の天気を見て、過去のLINE文面を探し、場所と時間だけ書き換えています。",
      pain: "中止、延期、屋内変更で文面が変わります。急いで送るほど、集合場所や靴、タオルの注意を書き忘れます。",
      outcome: "開催判断を選ぶと、保護者にそのまま送れる短い文章と確認項目が出てほしいです。",
      frequency: "雨予報の日",
      input: "イベント名、場所、開催判断、集合時刻、持ち物",
      output: "LINEやメールに貼れる連絡文と送信前チェック",
    },
    fields: [
      { key: "event", label: "イベント名", type: "text", value: "土曜午前の練習" },
      { key: "place", label: "場所", type: "text", value: "第三グラウンド" },
      { key: "condition", label: "判断", type: "text", value: "開始を30分遅らせます" },
      { key: "note", label: "補足", type: "textarea", value: "着替えとタオルを持たせてください" },
    ],
    logic: "rain",
    comments: [
      ["question", "【デモ質問】中止・延期・場所変更の3パターンを切り替える形でよいですか？"],
      ["answer", "【デモ返答】はい。判断だけ変えれば文面が変わると、朝に迷わず送れます。"],
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
    description: "商店街イベントの抽選券配布数を、店舗別に合計して不足しそうな店を見つけるデモアプリです。",
    request: {
      title: "【デモ】商店街の抽選券が、どの店で足りなくなりそうか閉店まで分からない",
      category: "集計",
      status: "solved",
      privacy: "none",
      target: "商店街事務局、イベント係",
      workflow: "各店舗から『今日何枚出た』というLINEをもらい、事務局が閉店後に集計しています。",
      pain: "数字だけ送る店、文章で送る店、写真で送る店があり、追加配布が必要な店に気づくのが遅れます。",
      outcome: "店舗名と枚数を貼るだけで、合計、上位、追加配布候補が見えるようにしたいです。",
      frequency: "イベント期間中の毎晩",
      input: "店舗名、配布済み枚数",
      output: "合計、店舗別枚数、追加配布候補",
    },
    fields: [
      { key: "shops", label: "店舗名, 枚数", type: "textarea", value: "青葉精肉,42\nみどり文具,18\n駅前ベーカリー,55\n小林酒店,31" },
    ],
    logic: "lottery",
    comments: [
      ["question", "【デモ質問】店舗ごとの初期配布枚数も入れますか？"],
      ["answer", "【デモ返答】最初は配布済みだけでよいです。残数管理までやると入力が続かなそうです。"],
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
    description: "販売見込み、予備率、材料ごとの単位をもとに、前日仕込みの買い出し量を逆算するデモアプリです。",
    request: {
      title: "【デモ】キッチンカー出店前日、売れ残りを怖がって仕込み量が毎回ぶれる",
      category: "個人事業主",
      status: "answered",
      privacy: "none",
      target: "キッチンカー、屋台、イベント出店者",
      workflow: "天気、イベント規模、前回売上を見て、材料ごとに電卓で必要量を出しています。",
      pain: "米、肉、ソース、容器で単位が違います。忙しいと予備率を入れ忘れ、余らせる日と足りない日の差が大きいです。",
      outcome: "販売見込み、一食分の材料、予備率を入れると、買い出しメモと仕込み量が一画面で出てほしいです。",
      frequency: "出店前日",
      input: "販売予定数、天候メモ、予備率、材料ごとの一食分量",
      output: "買い出しメモ、仕込み量、余裕分",
    },
    fields: [
      { key: "servings", label: "販売予定数", type: "number", value: "85" },
      { key: "buffer", label: "予備率(%)", type: "number", value: "12" },
      { key: "ingredients", label: "材料名, 一食分g", type: "textarea", value: "ごはん,180\n鶏肉,95\nソース,35\n野菜,60" },
    ],
    logic: "stock",
    comments: [
      ["question", "【デモ質問】容器や割り箸のような個数管理も同じ画面に入れますか？"],
      ["answer", "【デモ返答】材料とは分けたいです。まずは食材のg計算が一番困っています。"],
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
    description: "物件ごとの違いを残したまま、当日の清掃だけをスマホ用チェックリストへ整えるデモアプリです。",
    request: {
      title: "【デモ】民泊清掃で、物件ごとの違いを新人スタッフに毎回口頭説明している",
      category: "個人事業主",
      status: "testing",
      privacy: "none",
      target: "小規模民泊の運営者、清掃担当者",
      workflow: "共通の紙チェック表に、物件ごとの注意点を手書きで足しています。",
      pain: "A室だけ予備鍵の場所が違う、B室だけ浴室乾燥の確認がある、という細かい差分が口頭伝達になっています。",
      outcome: "物件名と場所別の作業を貼ると、その日の担当者がスマホで順番に確認できる表にしたいです。",
      frequency: "チェックアウト日の午前",
      input: "物件名、場所、作業項目、注意メモ",
      output: "スマホ用の場所別チェックリスト",
    },
    fields: [
      { key: "rooms", label: "場所:作業", type: "textarea", value: "玄関:鍵返却確認\n浴室:排水口確認\n寝室:シーツ交換\nキッチン:冷蔵庫内確認\nリビング:忘れ物確認" },
    ],
    logic: "cleanup",
    comments: [
      ["question", "【デモ質問】チェック完了時刻まで残しますか？"],
      ["answer", "【デモ返答】時刻までは不要です。新人が迷わず見る順番が分かることが先です。"],
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
    description: "住所を入れずに、方面名と所要分数だけで送迎の順番と目安時刻を作るデモアプリです。",
    request: {
      title: "【デモ】個人住所をアプリに入れず、送迎のざっくり順番だけ組みたい",
      category: "予約・申込",
      status: "answered",
      privacy: "high",
      target: "少人数の教室、整体院、地域送迎の担当者",
      workflow: "スタッフだけが知っている方面名を紙に書き、前後の移動時間を足しながら順番を決めています。",
      pain: "住所は入れたくありません。ただ、出発が5分遅れた時に全部の到着目安を手で直すのが面倒です。",
      outcome: "出発時刻、方面名、人数、移動分だけで、個人情報なしの送迎タイムラインを出したいです。",
      frequency: "送迎がある日",
      input: "出発時刻、方面名、人数、移動分、戻り時間",
      output: "住所を含まない送迎タイムライン",
    },
    fields: [
      { key: "start", label: "出発時刻", type: "text", value: "15:30" },
      { key: "stops", label: "方面, 人数, 移動分", type: "textarea", value: "北口方面,2,12\n公園前,1,8\n駅南,3,15\n戻り,0,10" },
    ],
    logic: "route",
    comments: [
      ["question", "【デモ質問】地図表示は不要で、時刻表だけで足りますか？"],
      ["answer", "【デモ返答】地図は不要です。むしろ住所を入れない設計にしたいです。"],
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
    description: "参加人数、予備数、材料の単位をもとに、教室用キットの不足を防ぐデモアプリです。",
    request: {
      title: "【デモ】編み物教室の材料キットで、説明カードや袋だけ数え忘れる",
      category: "予約・申込",
      status: "solved",
      privacy: "none",
      target: "少人数教室の先生、ワークショップ主催者",
      workflow: "予約人数を見て、毛糸、針、説明カード、袋をそれぞれ手で数えています。",
      pain: "主材料は忘れませんが、説明カードや持ち帰り袋のような細かいものだけ不足します。追加参加があると全部数え直しです。",
      outcome: "人数と予備キット数、材料リストを入れると、買う数と詰める数がすぐ分かるようにしたいです。",
      frequency: "開催前",
      input: "参加人数、予備キット数、材料名、1人分個数",
      output: "材料ごとの必要数と不足確認",
    },
    fields: [
      { key: "people", label: "参加人数", type: "number", value: "14" },
      { key: "spare", label: "予備キット", type: "number", value: "2" },
      { key: "items", label: "材料名, 1人分個数", type: "textarea", value: "毛糸玉,2\n編み針,1\n説明カード,1\n持ち帰り袋,1" },
    ],
    logic: "kit",
    comments: [
      ["question", "【デモ質問】材料ごとの在庫数も入れて、不足だけ出す形にしますか？"],
      ["answer", "【デモ返答】それが理想です。まずは必要数が一目で分かるだけでも助かります。"],
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
    description: "予約数、使用枚数、残したい予備から、閉店後の洗濯枚数を決めるデモアプリです。",
    request: {
      title: "【デモ】整体院のタオル在庫が、忙しい日の夕方だけ急に足りなくなる",
      category: "個人事業主",
      status: "answered",
      privacy: "none",
      target: "整体院、美容室、個人サロンなどの小規模店舗",
      workflow: "明日の予約表を見て、閉店後に何枚洗うか感覚で決めています。",
      pain: "洗いすぎると干す場所が足りません。少ないと夕方の予約で足りなくなります。最低予備を残す計算を毎回忘れます。",
      outcome: "予約数、1人あたり使用枚数、清潔在庫、残したい予備を入れて、洗濯枚数の目安を出したいです。",
      frequency: "前日の閉店後",
      input: "予約数、1予約あたり使用枚数、在庫枚数、残したい予備",
      output: "必要枚数、不足枚数、閉店後の洗濯目安",
    },
    fields: [
      { key: "bookings", label: "予約数", type: "number", value: "18" },
      { key: "perBooking", label: "1予約あたり枚数", type: "number", value: "3" },
      { key: "stock", label: "清潔な在庫枚数", type: "number", value: "46" },
    ],
    logic: "laundry",
    comments: [
      ["question", "【デモ質問】バスタオルとフェイスタオルは分けて計算しますか？"],
      ["answer", "【デモ返答】最終的には分けたいですが、最初はフェイスタオルだけで大丈夫です。"],
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

    const avatarUrl = await uploadDemoAvatar(user);
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: authUser.id,
        display_name: user.displayName,
        avatar_url: avatarUrl,
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

async function uploadDemoAvatar(user) {
  const key = `avatars/demo/${user.key}.svg`;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(renderAvatarSvg(user), "utf8"),
      ContentType: "image/svg+xml; charset=utf-8",
    })
  );
  return getPublicUrl(key);
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
    :root { --accent: ${sample.accent}; --ink: #151515; --muted: #686868; --line: #dedbd4; --paper: #fffdf8; --soft: color-mix(in srgb, var(--accent) 10%, white); }
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
    main { max-width: 1120px; margin: 0 auto; padding: 24px 16px 40px; }
    .layout { min-height: calc(100vh - 48px); }
    .panel { background: var(--paper); border: 1px solid color-mix(in srgb, var(--accent) 18%, var(--line)); padding: 18px; box-shadow: 0 14px 34px rgba(0,0,0,.05); }
    .tag { display: inline-flex; color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 35%, white); background: white; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 800; margin-bottom: 12px; }
    h1 { margin: 0; font-size: clamp(25px, 5vw, 44px); line-height: 1.07; letter-spacing: 0; }
    p { color: var(--muted); line-height: 1.7; }
    label { display: grid; gap: 6px; color: #555; font-size: 13px; font-weight: 800; margin-bottom: 12px; }
    input, textarea { width: 100%; border: 1px solid var(--line); border-radius: 9px; padding: 10px 11px; font: inherit; background: white; color: var(--ink); }
    textarea { min-height: 116px; resize: vertical; line-height: 1.5; }
    button { width: 100%; min-height: 44px; border: 0; border-radius: 9px; background: var(--accent); color: white; font-weight: 900; cursor: pointer; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; font: 14px/1.7 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .note { margin-top: 10px; font-size: 12px; color: #777; }
    .ledger-grid { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 14px; }
    .ledger .panel { border-radius: 4px; box-shadow: none; }
    .ledger .result { min-height: 420px; background-image: linear-gradient(#0000 31px, rgba(27,79,114,.18) 32px); background-size: 100% 32px; }
    .sticky-board { display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 26px; padding: 18px; border: 10px solid #cfae75; background: #d8b781; }
    .sticky .panel { border: 0; border-radius: 3px; box-shadow: 8px 12px 18px rgba(85,66,22,.18); transform: rotate(-1deg); }
    .sticky .result { transform: rotate(1deg); min-height: 360px; }
    .ticket-wrap { max-width: 760px; margin: 0 auto; }
    .ticket-strip { display: grid; grid-template-columns: 1fr 1fr; border: 2px dashed var(--accent); background: var(--paper); }
    .ticket-strip .panel { border: 0; border-radius: 0; box-shadow: none; }
    .ticket-strip .result { border-left: 2px dashed var(--accent); min-height: 390px; }
    .broadcast-phone { max-width: 430px; margin: 0 auto; border-radius: 32px; padding: 14px; background: #1f2c3a; box-shadow: 0 24px 50px rgba(20,30,40,.22); }
    .broadcast-phone .panel { border-radius: 22px; border: 0; box-shadow: none; }
    .broadcast-phone .result { margin-top: 10px; min-height: 270px; background: #f6fbff; }
    .receipt-roll { max-width: 430px; margin: 0 auto; background: repeating-linear-gradient(90deg, #fff 0 8px, #f9f9f9 8px 16px); }
    .receipt-roll .panel { border-radius: 0; border-style: dashed; box-shadow: 0 10px 0 rgba(0,0,0,.04); }
    .receipt-roll .result { border-top: 0; min-height: 320px; }
    .kitchen-line { display: grid; grid-template-columns: minmax(280px, .9fr) minmax(0, 1.1fr); gap: 18px; align-items: stretch; }
    .kitchen .panel { border-radius: 18px 18px 8px 8px; border-bottom: 8px solid color-mix(in srgb, var(--accent) 24%, #6d3d28); }
    .kitchen .result { background: #fff7ed; min-height: 400px; }
    .checklist-phone { max-width: 480px; margin: 0 auto; background: #233534; padding: 12px; border-radius: 28px; }
    .checklist-phone .panel { border-radius: 20px; border: 0; box-shadow: none; }
    .checklist-phone .result { margin-top: 10px; min-height: 360px; }
    .route-map { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 16px; }
    .route-map .result { min-height: 480px; background: linear-gradient(135deg, #fff 0 24%, #eeeeff 24% 26%, #fff 26% 58%, #e8e8fb 58% 60%, #fff 60%); border-radius: 22px; }
    .craft-table { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: start; }
    .craft .panel { border-radius: 26px 6px 26px 6px; }
    .craft .result { background: radial-gradient(circle at 18px 18px, rgba(123,90,106,.18) 0 5px, transparent 6px), #fffafd; background-size: 36px 36px; min-height: 420px; }
    .salon-board { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .salon .panel { border-radius: 8px; border-top: 8px solid var(--accent); }
    .salon .result { min-height: 380px; background: linear-gradient(#fff 0 48%, #f0fbfa 48%); }
    @media (max-width: 760px) {
      main { padding-top: 18px; }
      .ledger-grid, .sticky-board, .ticket-strip, .kitchen-line, .route-map, .craft-table, .salon-board { grid-template-columns: 1fr; }
      .ticket-strip .result { border-left: 0; border-top: 2px dashed var(--accent); }
    }
  </style>
</head>
<body class="${escapeHtml(sample.variant)}">
  ${renderDemoLayout(sample)}
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

function renderDemoLayout(sample) {
  const title = escapeHtml(sample.name.replace("【デモ】", ""));
  const description = escapeHtml(sample.description);
  const formPanel = `<span class="tag">APLZ デモアプリ</span><h1>${title}</h1><p>${description}</p><form id="tool"></form><button id="run" type="button">結果を見る</button><p class="note">これはデモです。入力内容はブラウザ内だけで処理されます。</p>`;
  const resultPanel = `<pre id="result"></pre>`;

  if (sample.variant === "ledger") {
    return `<main><div class="layout ledger-grid"><section class="panel">${formPanel}</section><section class="panel result"><div class="tag">割り振り表</div>${resultPanel}</section></div></main>`;
  }

  if (sample.variant === "sticky") {
    return `<main><div class="layout sticky-board"><section class="panel">${formPanel}</section><section class="panel result"><div class="tag">夕方の確認メモ</div>${resultPanel}</section></div></main>`;
  }

  if (sample.variant === "ticket") {
    return `<main><div class="layout ticket-wrap"><section class="ticket-strip"><div class="panel">${formPanel}</div><div class="panel result"><div class="tag">呼び出し札</div>${resultPanel}</div></section></div></main>`;
  }

  if (sample.variant === "broadcast") {
    return `<main><div class="layout broadcast-phone"><section class="panel">${formPanel}</section><section class="panel result"><div class="tag">送信前プレビュー</div>${resultPanel}</section></div></main>`;
  }

  if (sample.variant === "receipt") {
    return `<main><div class="layout receipt-roll"><section class="panel">${formPanel}</section><section class="panel result"><div class="tag">集計レシート</div>${resultPanel}</section></div></main>`;
  }

  if (sample.variant === "kitchen") {
    return `<main><div class="layout kitchen-line"><section class="panel">${formPanel}</section><section class="panel result"><div class="tag">仕込み台メモ</div>${resultPanel}</section></div></main>`;
  }

  if (sample.variant === "checklist") {
    return `<main><div class="layout checklist-phone"><section class="panel">${formPanel}</section><section class="panel result"><div class="tag">現場チェック</div>${resultPanel}</section></div></main>`;
  }

  if (sample.variant === "route") {
    return `<main><div class="layout route-map"><section class="panel">${formPanel}</section><section class="panel result"><div class="tag">送迎タイムライン</div>${resultPanel}</section></div></main>`;
  }

  if (sample.variant === "craft") {
    return `<main><div class="layout craft-table"><section class="panel result"><div class="tag">キット準備表</div>${resultPanel}</section><section class="panel">${formPanel}</section></div></main>`;
  }

  if (sample.variant === "salon") {
    return `<main><div class="layout salon-board"><section class="panel">${formPanel}</section><section class="panel result"><div class="tag">閉店後チェック</div>${resultPanel}</section></div></main>`;
  }

  return `<main><div class="layout ledger-grid"><section class="panel">${formPanel}</section><section class="panel result">${resultPanel}</section></div></main>`;
}

function offsetIso(iso, hours) {
  const date = new Date(iso);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function randomPassword() {
  return `Demo-${Math.random().toString(36).slice(2)}-${Date.now()}!`;
}

function getPublicUrl(key) {
  return `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}

function renderAvatarSvg(user) {
  const color = user.avatar.color;
  const initials = escapeHtml(user.avatar.initials);
  const mark = escapeHtml(user.avatar.mark);
  const roleLabel = user.role === "developer" ? "DEV" : "REQ";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240" role="img" aria-label="${escapeHtml(user.displayName)}">
  <rect width="240" height="240" rx="56" fill="${color}"/>
  <circle cx="178" cy="58" r="34" fill="rgba(255,255,255,.22)"/>
  <circle cx="58" cy="182" r="42" fill="rgba(0,0,0,.13)"/>
  <rect x="30" y="28" width="92" height="30" rx="15" fill="rgba(255,255,255,.18)"/>
  <text x="76" y="49" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="800" fill="#fff">${roleLabel}</text>
  <text x="120" y="138" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="76" font-weight="900" fill="#fff">${initials}</text>
  <rect x="76" y="160" width="88" height="34" rx="17" fill="rgba(255,255,255,.92)"/>
  <text x="120" y="183" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="900" fill="${color}">${mark}</text>
</svg>`;
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
