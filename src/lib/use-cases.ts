import { REQUEST_CATEGORIES } from "./request-platform";

export interface UseCase {
  slug: string;
  category: (typeof REQUEST_CATEGORIES)[number];
  title: string;
  description: string;
  keywords: string[];
  examples: string[];
  howToWrite: string[];
}

export const USE_CASES: UseCase[] = [
  {
    slug: "aggregation",
    category: "集計",
    title: "集計アプリの困りごとを投稿する",
    description: "店舗別、参加者別、日別などの手作業集計を、小さなWebアプリで楽にするための投稿ページです。",
    keywords: ["集計 アプリ", "Excel 集計 面倒", "手作業 集計 自動化"],
    examples: ["抽選券の配布枚数を店舗別に合計したい", "アンケート結果を貼り付けて分類したい", "売上メモから日別の合計を出したい"],
    howToWrite: ["何を合計したいか", "元データがどんな形か", "最後に見たい表や数字"],
  },
  {
    slug: "booking",
    category: "予約・申込",
    title: "予約・申込まわりの小さなアプリを相談する",
    description: "少人数教室、イベント、送迎、ワークショップなどの予約・申込作業を軽くする投稿ページです。",
    keywords: ["予約 管理 小規模", "申込 管理 アプリ", "ワークショップ 予約"],
    examples: ["参加人数から材料キット数を出したい", "送迎の順番と時刻を住所なしで組みたい", "申込者一覧から受付表を作りたい"],
    howToWrite: ["予約や申込の入力項目", "確認したい順番", "個人情報を扱うかどうか"],
  },
  {
    slug: "duty-roster",
    category: "当番表",
    title: "当番表アプリの困りごとを投稿する",
    description: "町内会、学校、店舗、チームの当番表作成を、公平に見える形へ整理するための投稿ページです。",
    keywords: ["当番表 アプリ", "当番 割り振り", "当番表 自動作成"],
    examples: ["班の人数が変わっても当番を割り振りたい", "前回担当と重ならないようにしたい", "必要人数が違う係をまとめたい"],
    howToWrite: ["参加者名", "当番の種類", "避けたい割り振り条件"],
  },
  {
    slug: "event-operations",
    category: "イベント運営",
    title: "イベント運営の小さな作業をアプリ化する",
    description: "受付番号、待ち列、備品、雨天判断など、地域イベントや小規模イベントの運営作業を相談できます。",
    keywords: ["イベント運営 アプリ", "受付 番号札", "小規模イベント 管理"],
    examples: ["番号札の呼び出し順を整理したい", "備品チェックをスマホで見たい", "雨天時の判断文を作りたい"],
    howToWrite: ["当日の流れ", "詰まりやすい場面", "スタッフが見たい画面"],
  },
  {
    slug: "school-committee",
    category: "学校・委員会",
    title: "学校・委員会の連絡や集計を小さく改善する",
    description: "PTA、学童、放課後教室、委員会などの連絡・確認・集計の困りごとを投稿できます。",
    keywords: ["PTA 業務改善", "学童 連絡 管理", "委員会 集計"],
    examples: ["お迎え変更を欠席・時間変更に分けたい", "係決めを公平にしたい", "提出状況を一覧にしたい"],
    howToWrite: ["誰が見るか", "いつ確認するか", "保存してよい情報の範囲"],
  },
  {
    slug: "neighborhood",
    category: "町内会",
    title: "町内会・自治会の面倒な作業をアプリ化する",
    description: "班長、当番、回覧、集金、名簿確認など、町内会の小さな作業を相談するページです。",
    keywords: ["町内会 アプリ", "自治会 当番", "班長 業務"],
    examples: ["当番表を偏りなく作りたい", "回覧順を見える化したい", "集金チェック表を作りたい"],
    howToWrite: ["紙でやっている内容", "毎回変わる条件", "個人名を使うかどうか"],
  },
  {
    slug: "solo-business",
    category: "個人事業主",
    title: "個人事業主の小さな業務アプリを相談する",
    description: "サロン、教室、キッチンカー、民泊など、一人または少人数で回す業務の困りごとを投稿できます。",
    keywords: ["個人事業主 業務改善", "小規模店舗 アプリ", "サロン 在庫 管理"],
    examples: ["タオル洗濯枚数を予約数から出したい", "仕込み量を販売予定数から逆算したい", "清掃チェックを物件別にしたい"],
    howToWrite: ["作業の頻度", "入力できる数字", "結果として見たいメモ"],
  },
  {
    slug: "writing",
    category: "文章作成",
    title: "連絡文・案内文を作る小さなアプリを相談する",
    description: "LINE、メール、掲示、案内文など、毎回少しだけ書き換える文章作成を軽くできます。",
    keywords: ["連絡文 作成", "LINE 文面 テンプレート", "案内文 自動作成"],
    examples: ["雨天連絡文を判断別に作りたい", "催促文をやわらかく整えたい", "持ち物案内を抜けなく作りたい"],
    howToWrite: ["送る相手", "入れたい項目", "避けたい言い方"],
  },
  {
    slug: "documents-images",
    category: "画像・資料",
    title: "画像・資料まわりの小さな整理アプリを相談する",
    description: "掲示物、資料、画像チェック、印刷前確認などの小さな作業をアプリ化するための投稿ページです。",
    keywords: ["資料 作成 補助", "掲示物 チェック", "画像 整理 アプリ"],
    examples: ["掲示物に必要事項が入っているか確認したい", "資料のチェック項目を一覧にしたい", "画像名を用途別に整理したい"],
    howToWrite: ["扱う資料の種類", "確認したい項目", "出力したいチェック表"],
  },
  {
    slug: "other",
    category: "その他",
    title: "まだ名前がない小さな困りごとを投稿する",
    description: "カテゴリに迷う作業でも、いま困っていることから小さなアプリ化を相談できます。",
    keywords: ["小さな困りごと", "業務アプリ 相談", "作業効率化 アイデア"],
    examples: ["毎回同じ確認をしている", "紙から転記している", "人に説明するたびに同じ表を作っている"],
    howToWrite: ["いまのやり方", "面倒な点", "どうなったら楽か"],
  },
];

export function getUseCase(slug: string): UseCase | undefined {
  return USE_CASES.find((useCase) => useCase.slug === slug);
}

export function getUseCaseByCategory(category: string): UseCase | undefined {
  return USE_CASES.find((useCase) => useCase.category === category);
}
