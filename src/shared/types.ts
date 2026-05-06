// ============================================================
// Shared TypeScript Interfaces — frontend & backend compatible
// No Mongoose dependency
// ============================================================

// ---- Enums ----

export enum UserRole {
  Student = 'student',
  Teacher = 'teacher',
  Parent = 'parent',
}

export enum HomeworkStatus {
  Pending = 'pending',
  Submitted = 'submitted',
  Graded = 'graded',
}

export enum TransactionType {
  HomeworkReward = 'homework_reward',
  CheckinReward = 'checkin_reward',
  CheckinStreakBonus = 'checkin_streak_bonus',
  FeedPet = 'feed_pet',
  BuyAccessory = 'buy_accessory',
  BuySkin = 'buy_skin',
  AdminAdjust = 'admin_adjust',
}

// ---- Coin Constants ----

export const COIN_REWARDS = {
  PERFECT_HOMEWORK: 50,
  DAILY_CHECKIN: 10,
  STREAK_7DAY_BONUS: 50,
  FEED_PET_COST: 5,
} as const;

// ---- Helper Types ----

export interface Timestamps {
  createdAt: string; // ISO date
  updatedAt: string;
}

export interface Reference {
  model: string;
  id: string;
}

// ---- User ----

export interface UserBase {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface StudentUser extends UserBase {
  role: UserRole.Student;
  coins: number;
  level: number;
  xp: number;
  parentId?: string; // ref User (parent)
}

export interface TeacherUser extends UserBase {
  role: UserRole.Teacher;
  subject: string;
  classIds: string[];
}

export interface ParentUser extends UserBase {
  role: UserRole.Parent;
  childrenIds: string[]; // ref User (students)
}

export type User = StudentUser | TeacherUser | ParentUser;

// ---- Homework ----

export interface Homework {
  _id: string;
  title: string;
  description: string;
  subject: string;
  teacherId: string;   // ref User
  studentId: string;   // ref User
  score: number;        // 0–100
  maxScore: number;
  status: HomeworkStatus;
  coinReward: number;   // auto: 50 if score === 100 else 0
  dueDate: string;
  submittedAt?: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- CheckIn ----

export interface CheckIn {
  _id: string;
  studentId: string;   // ref User
  date: string;         // YYYY-MM-DD
  streak: number;       // consecutive days
  coinReward: number;   // auto: 10 + (streak % 7 === 0 ? 50 : 0)
  createdAt: string;
}

// ---- Pet ----

export interface Accessory {
  name: string;
  icon: string;
  purchasedAt: string;
}

export interface EvolutionRecord {
  fromLevel: number;
  toLevel: number;
  newSpecies: string;
  triggeredAt: string;
}

/**
 * Evolution stages (species-dependent):
 *   Base   (Lv 1-2)
 *   Stage2 (Lv 3-5)
 *   Stage3 (Lv 6-9)
 *   Stage4 (Lv 10-49)
 *   Ultimate (Lv 50+)
 */
export interface Pet {
  _id: string;
  studentId: string;     // ref User (1:1)
  name: string;
  species: string;       // base species id/name
  level: number;         // 1–100
  xp: number;
  hunger: number;        // 0–100, cron drops 20 every 24h
  mood: number;          // 0–100
  accessories: Accessory[];
  skin: string;          // current appearance, changes on evolution
  lastFedAt: string;
  evolutionHistory: EvolutionRecord[];
  createdAt: string;
  updatedAt: string;
}

// ---- Transaction ----

export interface Transaction {
  _id: string;
  studentId: string;       // ref User
  type: TransactionType;
  amount: number;          // positive = earned, negative = spent
  balanceAfter: number;    // running balance after this tx
  reference?: Reference;   // linked business record
  description: string;
  createdAt: string;
}

// ---- API Payloads (subset of full models) ----

export interface CreateHomeworkPayload {
  title: string;
  description: string;
  subject: string;
  teacherId: string;
  studentId: string;
  dueDate: string;
  maxScore?: number;
}

export interface GradeHomeworkPayload {
  score: number;
}

export interface CreateCheckInPayload {
  studentId: string;
  date: string;
}

export interface CreatePetPayload {
  studentId: string;
  name: string;
  species: string;
}

export interface BuyAccessoryPayload {
  name: string;
  icon: string;
  price: number; // in coins
}

export interface FeedPetResponse {
  hunger: number;
  mood: number;
  coins: number;
}
