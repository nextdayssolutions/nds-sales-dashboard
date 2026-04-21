export type CustomerStatus = "既存" | "商談中" | "見込み";

export interface Customer {
  id: number;
  ownerId: number;
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
  ownerId: number;
  productName: string;
  revenueType: RevenueType;
  amount: number;
  year: number;
  month: number; // 1-12
  customerId?: number;
  memo?: string;
  recordedAt: string;
}

export interface RevenueTargets {
  ownerId: number;
  year: number;
  monthly: Record<number, number>; // month(1-12) -> yen
}

export type ScheduleType = "meeting" | "presentation" | "training" | "internal";

export interface ScheduleEvent {
  id: number;
  date: string;
  time: string;
  title: string;
  type: ScheduleType;
  customer: string | null;
}

export type UserRole = "admin" | "manager" | "member";
export type UserStatus = "active" | "invited" | "suspended" | "retired";

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  dept: string;
  title?: string;
  managerId?: number;
  lastLogin: string;
  achievement: number | null;
  customers: number | null;
  monthRevenue?: number;
  yearRevenue?: number;
  trainingProgress?: number;
}

export interface MockSession {
  userId: number;
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
  managerId?: number;
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
