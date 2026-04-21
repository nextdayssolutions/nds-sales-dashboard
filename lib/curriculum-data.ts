import type {
  CareerStage,
  CategoryItem,
  CurriculumStep,
  DevelopmentSheet,
  GoalSheet,
  OneOnOneSheet,
  VisionSheet,
  WishPeriod,
} from "@/types";

// ───────── 育成計画の3カテゴリ項目 (docs/採用後初期フォーマット.xlsx Sheet3 上部) ─────────

const MIND_ITEMS: Omit<CategoryItem, "selfUnderstood" | "selfCanDo" | "trainerUnderstood" | "trainerCanDo">[] = [
  { id: "mind-1", label: "会社ビジョンと個人ビジョンの親和" },
  { id: "mind-2", label: "レスポンス徹底 / 質問の徹底" },
  { id: "mind-3", label: "夢を忘れない！" },
];

const PORTABLE_ITEMS: Omit<CategoryItem, "selfUnderstood" | "selfCanDo" | "trainerUnderstood" | "trainerCanDo">[] = [
  { id: "portable-1", label: "情報正確性" },
  { id: "portable-2", label: "自発性" },
  { id: "portable-3", label: "終始の業務確認" },
];

const TECHNICAL_ITEMS: Omit<CategoryItem, "selfUnderstood" | "selfCanDo" | "trainerUnderstood" | "trainerCanDo">[] = [
  { id: "tech-1", label: "商材理解、競合市場理解" },
  { id: "tech-2", label: "ヒヤリングと提案適正能力" },
  { id: "tech-3", label: "目標達成へのエビデンス" },
];

const emptyEval = {
  selfUnderstood: false,
  selfCanDo: false,
  trainerUnderstood: false,
  trainerCanDo: false,
};

// ───────── 6ヶ月カリキュラムのステップ (docs/採用後初期フォーマット.xlsx Sheet3 下部) ─────────

type CurriculumSeed = Omit<CurriculumStep, "selfUnderstood" | "selfCanDo" | "trainerUnderstood" | "trainerCanDo">;

export const CURRICULUM_SEED: CurriculumSeed[] = [
  // 入社〜1週間
  { id: "w1-1", period: "入社〜1週間", group: "オンボーディング（営業マンマインド研修）2時間", goal: "人と社会が共存する仕組みの理解" },
  { id: "w1-2", period: "入社〜1週間", group: "PC 業務端末 zoom設定 1時間", goal: "各種設定完了 オペレーション確認" },
  { id: "w1-3", period: "入社〜1週間", group: "目標設定 ダッシュボード pdca 2時間×3回", goal: "個人ビジョン・理念・ミッション作成／組織課題との親和" },
  { id: "w1-4", period: "入社〜1週間", group: "会社方針理解 2時間", goal: "組織ビジョン・理念・ミッションの理解" },
  { id: "w1-5", period: "入社〜1週間", group: "ビジネスマナー 1時間", goal: "ビジネスマナー・文章・接待など" },

  { id: "w1-6", period: "入社〜1週間", group: "顧客&紹介者スプレッド管理 / 各種研修 各2時間", goal: "はたらくAI研修", milestone: "10日目のフィードバック" },
  { id: "w1-7", period: "入社〜1週間", group: "顧客&紹介者スプレッド管理 / 各種研修 各2時間", goal: "n-free研修" },
  { id: "w1-8", period: "入社〜1週間", group: "顧客&紹介者スプレッド管理 / 各種研修 各2時間", goal: "DX研修", milestone: "20日目のフィードバック" },
  { id: "w1-9", period: "入社〜1週間", group: "顧客&紹介者スプレッド管理 / 各種研修 各2時間", goal: "トリドリ採用研修" },
  { id: "w1-10", period: "入社〜1週間", group: "顧客&紹介者スプレッド管理 / 各種研修 各2時間", goal: "クロードファイル研修" },

  { id: "w1-11", period: "入社〜1週間", group: "HR総合研修 10時間", goal: "派遣業務理解" },
  { id: "w1-12", period: "入社〜1週間", group: "HR総合研修 10時間", goal: "BPO業務理解" },
  { id: "w1-13", period: "入社〜1週間", group: "HR総合研修 10時間", goal: "紹介理解" },
  { id: "w1-14", period: "入社〜1週間", group: "HR総合研修 10時間", goal: "代理店開拓・アライアンス・面談 理解" },

  // 1ヶ月 (入社30日)
  { id: "m1-1", period: "1ヶ月 (入社30日)", group: "営業研修 各1時間", goal: "最強ヒヤリング技術" },
  { id: "m1-2", period: "1ヶ月 (入社30日)", group: "営業研修 各1時間", goal: "顧客理解と提案の最適化" },
  { id: "m1-3", period: "1ヶ月 (入社30日)", group: "営業研修 各1時間", goal: "リード管理と契約締結" },

  { id: "m1-4", period: "1ヶ月 (入社30日)", group: "個人ビジョン目標設計 / HR総合テスト / マナーテスト 各1時間", goal: "個人ビジョン・キャリアマップ完成" },
  { id: "m1-5", period: "1ヶ月 (入社30日)", group: "個人ビジョン目標設計 / HR総合テスト / マナーテスト 各1時間", goal: "派遣 / BPO / 紹介 / アライアンス 基本テスト合格" },
  { id: "m1-6", period: "1ヶ月 (入社30日)", group: "個人ビジョン目標設計 / HR総合テスト / マナーテスト 各1時間", goal: "ビジネスマナーテスト合格" },

  { id: "m1-7", period: "1ヶ月 (入社30日)", group: "商材総合研修 はたらくAI / N-free / クロードファイル 各1時間", goal: "はたらくAI 基本テスト合格" },
  { id: "m1-8", period: "1ヶ月 (入社30日)", group: "商材総合研修 はたらくAI / N-free / クロードファイル 各1時間", goal: "Nフリー 基本テスト合格" },
  { id: "m1-9", period: "1ヶ月 (入社30日)", group: "商材総合研修 はたらくAI / N-free / クロードファイル 各1時間", goal: "DX研修 基本テスト合格" },
  { id: "m1-10", period: "1ヶ月 (入社30日)", group: "商材総合研修 はたらくAI / N-free / クロードファイル 各1時間", goal: "クロードファイル 基本テスト合格" },
  { id: "m1-11", period: "1ヶ月 (入社30日)", group: "商材総合研修 はたらくAI / N-free / クロードファイル 各1時間", goal: "トリドリ採用 基本テスト合格" },

  // 〜45日
  { id: "d45-1", period: "〜45日 (1ヶ月半)", group: "【社長面談】実戦振り返り 1on1", goal: "実戦振り返り" },
  { id: "d45-2", period: "〜45日 (1ヶ月半)", group: "棚卸しとPDCA", goal: "棚卸しとPDCA" },

  // 〜60日
  { id: "d60-1", period: "〜60日 (2ヶ月終わり)", group: "実績", goal: "2ヶ月目 月間獲得 50P" },
  { id: "d60-2", period: "〜60日 (2ヶ月終わり)", group: "実績", goal: "1軍3名ピックアップ" },

  // 3ヶ月
  { id: "m3-1", period: "3ヶ月", group: "実績", goal: "3ヶ月目 月間獲得 100P 達成" },

  // 6ヶ月
  { id: "m6-1", period: "6ヶ月", group: "実績", goal: "6ヶ月目 PDCA進捗" },
  { id: "m6-2", period: "6ヶ月", group: "実績", goal: "達成者人事評価" },

  // 随時
  { id: "ad-1", period: "随時", group: "新商材研修", goal: "随時新商材研修" },
];

export const CURRICULUM_PERIODS = [
  "入社〜1週間",
  "1ヶ月 (入社30日)",
  "〜45日 (1ヶ月半)",
  "〜60日 (2ヶ月終わり)",
  "3ヶ月",
  "6ヶ月",
  "随時",
] as const;

export const WISH_PERIODS: WishPeriod[] = [
  "1ヶ月後",
  "2ヶ月後",
  "3ヶ月後",
  "6ヶ月後",
  "1年後",
  "2年後",
  "3年後",
  "5年後",
  "未来",
];

export const CAREER_STAGES: CareerStage[] = ["プレーヤー", "主任", "課長", "部長", "役員"];

// ───────── デフォルトシート生成 ─────────

export const emptyVision = (): VisionSheet => ({
  createdAt: "",
  joinedAt: "",
  age: "",
  birthplace: "",
  careerHistory: "",
  other: "",
  principle1: "",
  principle2: "",
  principle3: "",
});

export const emptyGoal = (): GoalSheet => ({
  createdAt: "",
  dueDate: "",
  age: "",
  wishes: Object.fromEntries(
    WISH_PERIODS.map((p) => [p, { content: "", url: "" }])
  ) as Record<WishPeriod, { content: string; url: string }>,
  career: Object.fromEntries(
    CAREER_STAGES.map((s) => [s, { income: "", requiredSkills: "" }])
  ) as Record<CareerStage, { income: string; requiredSkills: string }>,
});

export const emptyDevelopment = (): DevelopmentSheet => ({
  department: "",
  period: "",
  goal3Months: "",
  categoryItems: {
    mind: MIND_ITEMS.map((i) => ({ ...i, ...emptyEval })),
    portable: PORTABLE_ITEMS.map((i) => ({ ...i, ...emptyEval })),
    technical: TECHNICAL_ITEMS.map((i) => ({ ...i, ...emptyEval })),
  },
  curriculum: CURRICULUM_SEED.map((c) => ({ ...c, ...emptyEval })),
});

export const emptyOneOnOne = (): OneOnOneSheet => ({ entries: [] });

export const CATEGORY_LABELS = {
  mind: "マインド面",
  portable: "ポータブルスキル面",
  technical: "テクニカルスキル面",
} as const;

export const SHEET_META: Record<
  "vision" | "goal" | "development" | "oneonone",
  { label: string; color: string; tint: string; emoji: string }
> = {
  vision: { label: "理念・ビジョン", color: "#FFB07A", tint: "rgba(255,176,122,0.12)", emoji: "🟠" },
  goal: { label: "目標設定", color: "#00D4FF", tint: "rgba(0,212,255,0.12)", emoji: "🔵" },
  development: { label: "育成計画", color: "#E5E5E5", tint: "rgba(255,255,255,0.08)", emoji: "⚪" },
  oneonone: { label: "1on1シート", color: "#B794F4", tint: "rgba(183,148,244,0.12)", emoji: "🟣" },
};
