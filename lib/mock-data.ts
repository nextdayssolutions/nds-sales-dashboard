import type { Customer, ScheduleEvent, UserRecord } from "@/types";

export const CUSTOMERS: Customer[] = [
  // 田中 誠司 (id 1) - 6社
  { id: 101, ownerId: 1, name: "株式会社テックフロンティア", industry: "IT", contact: "山田 太郎", products: ["N-Free", "はたらくAI"], relation: 8, lastContact: "2026-04-15", revenue: 2400000, status: "既存", memo: "定例MTG 月1回、キーパーソンは情シス部長" },
  { id: 102, ownerId: 1, name: "グローバルネット株式会社", industry: "通信", contact: "佐藤 花子", products: ["DX研修"], relation: 6, lastContact: "2026-04-10", revenue: 5800000, status: "既存", memo: "更新交渉中（6月締め）" },
  { id: 103, ownerId: 1, name: "ファーストリテール株式会社", industry: "小売", contact: "鈴木 一郎", products: ["claudeファイル"], relation: 4, lastContact: "2026-03-28", revenue: 1200000, status: "商談中" },
  { id: 104, ownerId: 1, name: "メディカルソリューション株式会社", industry: "医療", contact: "高橋 美咲", products: ["N-Free", "トリドリ"], relation: 9, lastContact: "2026-04-17", revenue: 3600000, status: "既存" },
  { id: 105, ownerId: 1, name: "コンストラクション株式会社", industry: "建設", contact: "田中 誠", products: [], relation: 3, lastContact: "2026-04-01", revenue: 0, status: "見込み", memo: "初回商談予定（4月21日）" },
  { id: 106, ownerId: 1, name: "フィンテック株式会社", industry: "金融", contact: "伊藤 由紀", products: ["DX研修", "はたらくAI"], relation: 7, lastContact: "2026-04-12", revenue: 4200000, status: "既存" },

  // 山田 優子 (id 2, manager) - 6社
  { id: 201, ownerId: 2, name: "東亜商事株式会社", industry: "商社", contact: "岡田 秀樹", products: ["DX研修", "N-Free"], relation: 9, lastContact: "2026-04-18", revenue: 8500000, status: "既存" },
  { id: 202, ownerId: 2, name: "日本マニュファクチャリング", industry: "製造", contact: "西村 聡", products: ["DX研修", "はたらくAI", "トリドリ"], relation: 10, lastContact: "2026-04-17", revenue: 12000000, status: "既存" },
  { id: 203, ownerId: 2, name: "グリーンロジスティクス", industry: "物流", contact: "古川 直子", products: ["N-Free"], relation: 8, lastContact: "2026-04-14", revenue: 6400000, status: "既存" },
  { id: 204, ownerId: 2, name: "スターテクノロジーズ", industry: "IT", contact: "松本 亮介", products: [], relation: 5, lastContact: "2026-04-09", revenue: 0, status: "商談中", memo: "見積提出済み、稟議待ち" },
  { id: 205, ownerId: 2, name: "パシフィック食品株式会社", industry: "食品", contact: "三浦 裕子", products: ["claudeファイル", "トリドリ"], relation: 7, lastContact: "2026-04-11", revenue: 5200000, status: "既存" },
  { id: 206, ownerId: 2, name: "リテールネクスト", industry: "小売", contact: "加藤 健", products: [], relation: 3, lastContact: "2026-03-30", revenue: 0, status: "見込み" },

  // 佐藤 健太 (id 3) - 6社
  { id: 301, ownerId: 3, name: "中央観光株式会社", industry: "観光", contact: "石川 真理", products: ["N-Free"], relation: 7, lastContact: "2026-04-16", revenue: 3800000, status: "既存" },
  { id: 302, ownerId: 3, name: "ミライエネルギー株式会社", industry: "エネルギー", contact: "森田 康介", products: ["DX研修"], relation: 8, lastContact: "2026-04-15", revenue: 7200000, status: "既存" },
  { id: 303, ownerId: 3, name: "アドバンスメディア", industry: "広告", contact: "藤井 梨花", products: [], relation: 5, lastContact: "2026-04-08", revenue: 1800000, status: "商談中" },
  { id: 304, ownerId: 3, name: "ヘルスケアプラス", industry: "医療", contact: "長谷川 翔太", products: ["トリドリ"], relation: 7, lastContact: "2026-04-13", revenue: 4000000, status: "既存" },
  { id: 305, ownerId: 3, name: "オリエンタル教育", industry: "教育", contact: "村上 さくら", products: [], relation: 4, lastContact: "2026-04-02", revenue: 0, status: "商談中" },
  { id: 306, ownerId: 3, name: "ジャパンファッション", industry: "アパレル", contact: "中村 遼", products: [], relation: 2, lastContact: "2026-03-24", revenue: 0, status: "見込み" },

  // 高橋 翔 (id 5) - 6社
  { id: 501, ownerId: 5, name: "ユニバーサルテック", industry: "IT", contact: "川村 美智子", products: ["N-Free", "はたらくAI"], relation: 8, lastContact: "2026-04-17", revenue: 5100000, status: "既存" },
  { id: 502, ownerId: 5, name: "NorthAsia Holdings", industry: "商社", contact: "井上 哲也", products: ["DX研修"], relation: 9, lastContact: "2026-04-16", revenue: 6800000, status: "既存" },
  { id: 503, ownerId: 5, name: "BlueOcean Resort", industry: "観光", contact: "鈴木 綾", products: [], relation: 6, lastContact: "2026-04-10", revenue: 2400000, status: "商談中" },
  { id: 504, ownerId: 5, name: "イースト不動産", industry: "不動産", contact: "佐々木 亮", products: ["トリドリ"], relation: 7, lastContact: "2026-04-14", revenue: 3200000, status: "既存" },
  { id: 505, ownerId: 5, name: "関西フードサービス", industry: "食品", contact: "山口 美和", products: ["claudeファイル"], relation: 6, lastContact: "2026-04-09", revenue: 3600000, status: "既存" },
  { id: 506, ownerId: 5, name: "エヌ・コミュニケーションズ", industry: "通信", contact: "田村 健", products: [], relation: 3, lastContact: "2026-03-27", revenue: 0, status: "見込み" },

  // 渡辺 龍一 (id 7, suspended) - 4社
  { id: 701, ownerId: 7, name: "新宿リサーチ", industry: "調査", contact: "橋本 翼", products: ["N-Free"], relation: 5, lastContact: "2026-03-20", revenue: 1400000, status: "既存" },
  { id: 702, ownerId: 7, name: "北海道ロジ", industry: "物流", contact: "森 美咲", products: [], relation: 6, lastContact: "2026-03-22", revenue: 2100000, status: "既存" },
  { id: 703, ownerId: 7, name: "スマートファーム", industry: "農業", contact: "白石 純", products: [], relation: 3, lastContact: "2026-03-18", revenue: 0, status: "商談中" },
  { id: 704, ownerId: 7, name: "コーラルビジネス", industry: "小売", contact: "岩田 玲奈", products: [], relation: 2, lastContact: "2026-03-15", revenue: 0, status: "見込み" },
];

export const PRODUCTS = ["N-Free", "はたらくAI", "DX研修", "claudeファイル", "トリドリ"];

export const SCHEDULE_EVENTS: ScheduleEvent[] = [
  { id: 1, date: "2026-04-19", time: "09:00", title: "株式会社テックフロンティア 定例MTG", type: "meeting", customer: "株式会社テックフロンティア" },
  { id: 2, date: "2026-04-19", time: "14:00", title: "フィンテック株式会社 提案プレゼン", type: "presentation", customer: "フィンテック株式会社" },
  { id: 3, date: "2026-04-21", time: "10:00", title: "コンストラクション株式会社 初回商談", type: "meeting", customer: "コンストラクション株式会社" },
  { id: 4, date: "2026-04-22", time: "13:00", title: "N-Free認定試験", type: "training", customer: null },
  { id: 5, date: "2026-04-23", time: "11:00", title: "メディカルソリューション QBR", type: "presentation", customer: "メディカルソリューション株式会社" },
  { id: 6, date: "2026-04-24", time: "15:00", title: "社内営業戦略会議", type: "internal", customer: null },
  { id: 7, date: "2026-04-25", time: "09:30", title: "グローバルネット 更新交渉", type: "meeting", customer: "グローバルネット株式会社" },
];

export const TODAY = "2026-04-19";

export const MOCK_USERS: UserRecord[] = [
  { id: 1, name: "田中 誠司", email: "tanaka@example.co.jp", role: "member", status: "active", dept: "営業1部", title: "シニアセールスエンジニア", managerId: 2, lastLogin: "2026-04-19 09:32", achievement: 58, customers: 6, monthRevenue: 3200000, yearRevenue: 19300000, trainingProgress: 55 },
  { id: 2, name: "山田 優子", email: "yamada@example.co.jp", role: "manager", status: "active", dept: "営業1部", title: "営業1部 部長", lastLogin: "2026-04-19 08:15", achievement: 112, customers: 6, monthRevenue: 6200000, yearRevenue: 24800000, trainingProgress: 82 },
  { id: 3, name: "佐藤 健太", email: "sato@example.co.jp", role: "member", status: "active", dept: "営業2部", title: "セールスエンジニア", lastLogin: "2026-04-18 18:44", achievement: 87, customers: 6, monthRevenue: 4800000, yearRevenue: 16200000, trainingProgress: 68 },
  { id: 4, name: "鈴木 まり", email: "suzuki@example.co.jp", role: "member", status: "invited", dept: "営業1部", title: "セールスエンジニア", managerId: 2, lastLogin: "—", achievement: 0, customers: 0, monthRevenue: 0, yearRevenue: 0, trainingProgress: 0 },
  { id: 5, name: "高橋 翔", email: "takahashi@example.co.jp", role: "member", status: "active", dept: "営業1部", title: "アカウントエグゼクティブ", managerId: 2, lastLogin: "2026-04-19 10:12", achievement: 94, customers: 6, monthRevenue: 5200000, yearRevenue: 21100000, trainingProgress: 71 },
  { id: 6, name: "椎葉 光太", email: "shiiba@nextdays-solutions.com", role: "admin", status: "active", dept: "代表", title: "代表", lastLogin: "2026-04-19 11:05", achievement: null, customers: null },
  { id: 7, name: "渡辺 龍一", email: "watanabe@example.co.jp", role: "member", status: "suspended", dept: "営業2部", title: "セールスエンジニア", lastLogin: "2026-03-28 14:22", achievement: 32, customers: 4, monthRevenue: 1800000, yearRevenue: 7400000, trainingProgress: 24 },
];
