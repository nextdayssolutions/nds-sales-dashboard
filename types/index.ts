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
  amount: number;
  /** 歩合額のスナップショット（円）。登録時の商材レートに基づく計算結果 */
  commissionAmount: number;
  year: number;
  month: number; // 1-12
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

// ───────── 自己管理シート4種 (docs/採用後初期フォーマット.xlsx 準拠) ─────────

export type SheetKind = "vision" | "goal" | "development" | "oneonone";

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

export interface GoalWish {
  content: string;
  url: string;
}

export type CareerStage = "プレーヤー" | "主任" | "課長" | "部長" | "役員";

export interface CareerMilestone {
  income: string;
  requiredSkills: string;
}

export interface GoalSheet {
  createdAt: string;
  dueDate: string;
  age: string;
  wishes: Record<WishPeriod, GoalWish>;
  career: Record<CareerStage, CareerMilestone>;
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
  vision: VisionSheet;
  goal: GoalSheet;
  development: DevelopmentSheet;
  oneonone: OneOnOneSheet;
}
