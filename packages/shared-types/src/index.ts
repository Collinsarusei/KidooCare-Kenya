export enum UserRole {
  ADMIN = 'ADMIN',
  SCHOOL = 'SCHOOL',
  PARENT = 'PARENT',
  TUTOR = 'TUTOR',
}

export enum SchoolStatus {
  PENDING_PROFILE = 'PENDING_PROFILE',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum ServiceBillingCycle {
  MONTHLY = 'MONTHLY',
}

export enum EnrollmentStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  ACTIVE = 'ACTIVE',
  WAITLISTED = 'WAITLISTED',
  ENDED = 'ENDED',
}

export enum WeeklyInstallmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum PaymentMethod {
  MPESA = 'MPESA',
  CASH = 'CASH',
  CARD = 'CARD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  REFUNDED = 'REFUNDED',
}

export enum AIReportType {
  EXEC_SUMMARY = 'EXEC_SUMMARY',
  PROFILE_DRAFT = 'PROFILE_DRAFT',
}

export enum SchoolDocumentType {
  LICENSE = 'LICENSE',
  CERTIFICATION = 'CERTIFICATION',
  OTHER = 'OTHER',
}

export enum DailyLogMood {
  HAPPY = 'HAPPY',
  SAD = 'SAD',
  TIRED = 'TIRED',
  ENERGETIC = 'ENERGETIC',
  CRANKY = 'CRANKY',
}

export interface UserDto {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  mustChangePassword?: boolean;
  employedAtSchoolId?: string | null;
  createdAt: string | Date;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  phone: string;
}

export interface OnboardSchoolDto {
  schoolName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword: string;
  location?: string;
  about?: string;
  mpesaConsumerKey?: string;
  mpesaConsumerSecret?: string;
  mpesaShortcode?: string;
  mpesaPasskey?: string;
}

export interface UpdateCredentialsDto {
  mpesaConsumerKey: string;
  mpesaConsumerSecret: string;
  mpesaShortcode: string;
  mpesaPasskey: string;
}

export interface SchoolCredentialsStatusDto {
  isConfigured: boolean;
  shortcodeLast4: string | null;
  providedAt?: string | Date | null;
  providedBy?: UserRole | null;
}

export interface SchoolDetailDto {
  id: string;
  userId: string;
  name: string;
  about: string | null;
  logoUrl: string | null;
  coverImages: string[];
  location: string | null;
  capacity?: number | null;
  ageRange?: string | null;
  keyHighlights?: string[];
  status: SchoolStatus;
  verifiedBadge: boolean;
  createdByAdminId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  credentialsStatus: SchoolCredentialsStatusDto;
  user?: {
    email: string;
    phone: string;
  };
}

export interface UpdateSchoolProfileDto {
  name?: string;
  about?: string;
  location?: string;
  logoUrl?: string;
  coverImages?: string[];
  capacity?: number;
  ageRange?: string;
  keyHighlights?: string[];
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  price: number;
  capacity: number;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  price?: number;
  capacity?: number;
}

export interface ServiceDto {
  id: string;
  schoolId: string;
  name: string;
  description: string | null;
  price: number;
  billingCycle: ServiceBillingCycle;
  capacity: number;
  currentEnrollmentCount: number;
  lastUpdatedAt: string | Date;
}

export interface SchoolSearchQueryDto {
  search?: string;
  location?: string;
}

export interface PublicSchoolListingDto {
  id: string;
  name: string;
  about: string | null;
  logoUrl: string | null;
  location: string | null;
  verifiedBadge: boolean;
  servicesCount: number;
  startingPrice: number | null;
  credentialsStatus: SchoolCredentialsStatusDto;
  services: ServiceDto[];
}

export interface CreateChildDto {
  name: string;
  dob: string;
  notes?: string;
}

export interface ChildDto {
  id: string;
  parentId: string;
  name: string;
  dob: string | Date;
  notes: string | null;
  schoolId: string | null;
  createdAt: string | Date;
}

export interface CreateEnrollmentDto {
  childId: string;
  serviceId: string;
  startDate?: string;
}

export interface EnrollmentDto {
  id: string;
  childId: string;
  serviceId: string;
  startDate: string | Date;
  status: EnrollmentStatus;
  agreedMonthlyPrice: number;
  createdAt: string | Date;
  child?: ChildDto;
  service?: ServiceDto & { school?: { name: string; location: string | null } };
  billingCycles?: BillingCycleDto[];
  balance?: { totalArrears: number };
}

export interface WeeklyInstallmentDto {
  id: string;
  billingCycleId: string;
  weekNumber: number;
  weekStart: string | Date;
  weekEnd: string | Date;
  amountDue: number;
  amountPaid: number;
  status: WeeklyInstallmentStatus;
  reminderSentAt?: string | Date | null;
}

export interface BillingCycleDto {
  id: string;
  enrollmentId: string;
  monthStart: string | Date;
  monthEnd: string | Date;
  totalAmountDue: number;
  weeksInMonth: number;
  createdAt: string | Date;
  weeklyInstallments: WeeklyInstallmentDto[];
}

export interface DaycarePresetService {
  name: string;
  defaultPrice: number;
  defaultCapacity: number;
  description: string;
}

export const DAYCARE_SERVICE_PRESETS: DaycarePresetService[] = [
  { name: 'Full-Day Care (8–10 hours)', defaultPrice: 15000, defaultCapacity: 20, description: '8,000–25,000/month. Comprehensive full day care with meals, nap time, and early learning.' },
  { name: 'Half-Day Care (4–5 hours)', defaultPrice: 8000, defaultCapacity: 15, description: '5,000–15,000/month. Half day morning or afternoon care with structured activities.' },
  { name: 'Infant Care (3–12 months)', defaultPrice: 18000, defaultCapacity: 10, description: '10,000–30,000/month. High caregiver ratio with individual feeding and sleep routines.' },
  { name: 'Toddler Care (1–3 years)', defaultPrice: 14000, defaultCapacity: 15, description: '8,000–25,000/month. Active toddler stimulation, sensory play, and social development.' },
  { name: 'Preschool Prep (3–5 years)', defaultPrice: 18000, defaultCapacity: 20, description: '10,000–35,000/month. Foundational literacy, numeracy, and school readiness.' },
  { name: 'Special Needs Day Care', defaultPrice: 25000, defaultCapacity: 8, description: '15,000–40,000/month. Individualized care plans with trained special needs caregivers.' },
  { name: 'Transport Services', defaultPrice: 4000, defaultCapacity: 25, description: '2,000–6,000/month. Door-to-door safe shuttle transport service.' },
  { name: 'Meals & Snacks', defaultPrice: 2000, defaultCapacity: 30, description: '1,000–3,000/month. Freshly prepared warm lunch and 2 healthy tea breaks daily.' },
  { name: 'Day Care + Tuition Combo', defaultPrice: 25000, defaultCapacity: 15, description: '15,000–45,000/month. Combined daycare supervision with homework help and private tutoring.' },
];

export interface StkPushRequestDto {
  weeklyInstallmentId?: string;
  enrollmentId?: string;
  amount?: number;
  phone: string;
}

export interface StkPushResponseDto {
  paymentId: string;
  checkoutRequestId: string;
  merchantRequestId: string;
  status: PaymentStatus;
  customerMessage: string;
}

export interface PaymentDto {
  id: string;
  weeklyInstallmentId: string;
  amount: number;
  method: PaymentMethod;
  mpesaCheckoutRequestId: string | null;
  mpesaReceiptNumber: string | null;
  status: PaymentStatus;
  paidAt: string | Date | null;
  createdAt: string | Date;
}

export interface BalanceDto {
  id: string;
  enrollmentId: string;
  totalArrears: number;
  lastCalculatedAt: string | Date;
}

export interface ParentChildLedgerItemDto {
  childId: string;
  childName: string;
  enrollmentId: string;
  schoolName: string;
  serviceName: string;
  agreedMonthlyPrice: number;
  totalWeeksCount: number;
  paidWeeksCount: number;
  totalArrears: number;
  isAllWeeksPaid: boolean;
  weeklyInstallments: WeeklyInstallmentDto[];
}

export interface ParentLedgerSummaryDto {
  totalOverallArrears: number;
  isAllChildrenPaid: boolean;
  childrenLedgers: ParentChildLedgerItemDto[];
}

export interface SchoolFinancialSummaryDto {
  schoolId: string;
  schoolName: string;
  totalRevenueCollected: number;
  totalOutstandingArrears: number;
  totalEnrolledChildrenCount: number;
  fullyPaidEnrollmentsCount: number;
  enrollmentsInArrearsCount: number;
  studentRosterLedger: {
    enrollmentId: string;
    childName: string;
    parentEmail: string;
    parentPhone: string;
    serviceName: string;
    agreedMonthlyPrice: number;
    paidWeeksCount: number;
    totalWeeksCount: number;
    totalArrears: number;
    isFullyPaid: boolean;
  }[];
}

export interface ReminderJobResultDto {
  success: boolean;
  timestamp: string | Date;
  installmentsScanned: number;
  remindersSentCount: number;
  sentReminders: {
    installmentId: string;
    childName: string;
    parentEmail: string;
    amountDue: number;
    weekNumber: number;
  }[];
}

export interface AuditLogDto {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  beforeState: any;
  afterState: any;
  createdAt: string | Date;
}

export interface DraftProfileRequestDto {
  schoolName: string;
  location?: string;
  highlights: string[];
}

export interface DraftProfileResponseDto {
  generatedAbout: string;
  suggestedTagline: string;
  keyFeatures: string[];
}

export interface ExecutiveSummaryReportDto {
  schoolId: string;
  schoolName: string;
  generatedAt: string | Date;
  financialHealthRating: 'EXCELLENT' | 'GOOD' | 'ATTENTION_REQUIRED';
  revenueSummary: string;
  arrearsAnalysis: string;
  occupancyOverview: string;
  actionableRecommendations: string[];
}

export interface ReviewDto {
  id: string;
  schoolId: string;
  parentId: string;
  parentName?: string;
  rating: number;
  comment: string;
  createdAt: string | Date;
}

export interface CreateReviewDto {
  schoolId: string;
  rating: number;
  comment: string;
}

export interface SchoolReviewSummaryDto {
  schoolId: string;
  averageRating: number;
  totalReviews: number;
  reviews: ReviewDto[];
}

export interface SchoolDocumentDto {
  id: string;
  schoolId: string;
  type: SchoolDocumentType;
  fileUrl: string;
  uploadedAt: string | Date;
  verifiedByAdminId: string | null;
  verifiedAt: string | Date | null;
  schoolName?: string;
}

export interface UploadDocumentDto {
  type: SchoolDocumentType;
  fileUrl: string;
}

export interface VerifyDocumentDto {
  verified: boolean;
}

export interface DisputeDto {
  id: string;
  paymentId: string;
  raisedByParentId: string;
  parentEmail?: string;
  parentPhone?: string;
  reason: string;
  status: DisputeStatus;
  resolvedByAdminId?: string | null;
  resolutionNote?: string | null;
  isEscalatedToAdmin: boolean;
  createdAt: string | Date;
  payment?: PaymentDto & {
    weeklyInstallment?: WeeklyInstallmentDto & {
      billingCycle?: BillingCycleDto & {
        enrollment?: EnrollmentDto;
      };
    };
  };
}

export interface CreateDisputeDto {
  paymentId: string;
  reason: string;
}

export interface ResolveDisputeDto {
  status: DisputeStatus.RESOLVED | DisputeStatus.REFUNDED;
  resolutionNote?: string;
}

export interface AIReportDto {
  id: string;
  schoolId: string;
  type: AIReportType;
  generatedAt: string | Date;
  content: ExecutiveSummaryReportDto | DraftProfileResponseDto | any;
}

export interface DailyLogDto {
  id: string;
  childId: string;
  tutorId: string;
  isPresent: boolean;
  mood: DailyLogMood;
  achievements: string[];
  milestones: string[];
  allergiesSpotted: string | null;
  assignments: string | null;
  createdAt: string | Date;
}
