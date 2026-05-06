export type CustomerStatus = "既存" | "商談中" | "見込み";

export interface Customer {
  id: string;
  ownerId: string;
  name: string;
  industry: string;
  contact: string;
  contactEmail?: string;
  contactPhone?: string;
  products: string[];
  relation: number;
  lastContact: string;
  revenue: number;
  status: CustomerStatus;
  /** 次回アポイント予定日 (YYYY-MM-DD)。未来日を入れると status が自動で「商談中」になる */
  nextAppointment?: string;
  memo?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ───────── 売上レコード & 目標 ─────────

export type RevenueType = "stock" | "shot";

export interface SalesRecord {
  id: string;
  ownerId: string;
  productName: string;
  revenueType: RevenueType;
  /** 1 ヶ月あたりの売上金額（stock の場合は月額、shot の場合はその月の合計） */
  amount: number;
  /** 個数。fixed 歩合タイプの計算 (quantity × commission_fixed) に使用 */
  quantity: number;
  /** 1 ヶ月あたりの歩合額スナップショット（stock の場合は月額） */
  commissionAmount: number;
  /** 開始年（stock）／計上年（shot） */
  year: number;
  /** 開始月（stock）／計上月（shot）。1-12 */
  month: number;
  /** ストック解約年。NULL なら継続中（毎月自動計上） */
  endYear?: number;
  /** ストック解約月。NULL なら継続中。endYear/endMonth は両方セットか両方 undefined */
  endMonth?: number;
  customerId?: string;
  memo?: string;
  recordedAt: string;
}

export interface RevenueTargets {
  ownerId: string;
  year: number;
  monthly: Record<number, number>; // month(1-12) -> yen
}

export type ScheduleType = "meeting" | "presentation" | "training" | "internal";

export interface ScheduleEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  type: ScheduleType;
  customer: string | null;
}

export type UserRole = "admin" | "manager" | "member";
export type UserStatus = "active" | "invited" | "suspended" | "retired";

/**
 * ユーザープロフィール。担当顧客数・売上・達成率・育成進捗は集計値のため持たない
 * （`lib/metrics.ts` の `useUserMetrics()` で動的に算出する）。
 * Supabase `public.users` テーブルと 1:1 対応。
 */
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  dept: string;
  title?: string;
  managerId?: string;
  lastLogin: string;
}

/** 認証済みセッション情報（Supabase Auth 由来） */
export interface AuthedSession {
  userId: string;
  role: UserRole;
}

// ───────── 自己管理シート (4種 + 日報) ─────────

export type SheetKind = "daily" | "vision" | "goal" | "development" | "oneonone";

/** 日報の 1 エントリ。出社日に 1 件記入する想定 */
export interface DailyEntry {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** 出社 / リモート / 外勤 / 休み 等の自由記入 */
  attendance: string;
  /** 本日の活動・商談 */
  activities: string;
  /** 結果・成果 */
  results: string;
  /** 反省・気付き */
  improvement: string;
  /** 翌日のタスク・計画 */
  nextDay: string;
  managerComment?: string;
  managerId?: string;
  reviewedAt?: string;
}

export interface DailySheet {
  entries: DailyEntry[];
}

export interface VisionSheet {
  createdAt: string;
  joinedAt: string;
  age: string;
  birthplace: string;
  careerHistory: string;
  other: string;
  principle1: string;
  principle2: string;
  principle3: string;
}

export type WishPeriod =
  | "1ヶ月後"
  | "2ヶ月後"
  | "3ヶ月後"
  | "6ヶ月後"
  | "1年後"
  | "2年後"
  | "3年後"
  | "5年後"
  | "未来";

/**
 * 1 期間あたりの目標ワイヤフレーム。
 * PDCA サイクルに合わせて、生活水準（叶えたいこと）→ 必要月収・キャリア → アクションプラン（PDCA）の 3 軸で記述する。
 */
export interface GoalWish {
  /** 叶えたいこと・生活水準を具体的に */
  content: string;
  /** その生活水準を得るために必要な月収・年収・キャリア */
  monthlyIncome: string;
  /** 月収を達成するためのアクションプラン (Plan / Do / Check / Action) */
  pdca: string;
}

export interface GoalSheet {
  createdAt: string;
  dueDate: string;
  age: string;
  wishes: Record<WishPeriod, GoalWish>;
}

export type DevelopmentCategoryKey = "mind" | "portable" | "technical";

export interface CategoryItem {
  id: string;
  label: string;
  selfUnderstood: boolean;
  selfCanDo: boolean;
  trainerUnderstood: boolean;
  trainerCanDo: boolean;
}

export interface CurriculumStep {
  id: string;
  period: string;
  group: string;
  goal: string;
  milestone?: string;
  selfUnderstood: boolean;
  selfCanDo: boolean;
  trainerUnderstood: boolean;
  trainerCanDo: boolean;
  /** 管理者がカスタム追加した項目（true）か、初期シードか（false/undefined）。
   *  カスタム期間（2ヶ月以降）では削除可能フラグとしても利用 */
  custom?: boolean;
}

export interface DevelopmentSheet {
  department: string;
  period: string;
  goal3Months: string;
  categoryItems: Record<DevelopmentCategoryKey, CategoryItem[]>;
  curriculum: CurriculumStep[];
}

export interface OneOnOneEntry {
  id: string;
  date: string;
  health: string;
  personal: string;
  career: string;
  workAnxiety: string;
  monthlyReflection: string;
  other: string;
  managerComment?: string;
  managerId?: string;
  reviewedAt?: string;
}

export interface OneOnOneSheet {
  entries: OneOnOneEntry[];
}

export interface SheetSet {
  daily: DailySheet;
  vision: VisionSheet;
  goal: GoalSheet;
  development: DevelopmentSheet;
  oneonone: OneOnOneSheet;
}
