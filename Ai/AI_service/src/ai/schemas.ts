// genkit-service/src/ai/schemas.ts
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// KIDDOCARE DAYCARE MARKETPLACE — AI SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

// ── Profile Draft ────────────────────────────────────────────────────────────
export const draftProfileInputSchema = z.object({
  schoolName: z.string().min(2).describe('Name of the daycare center'),
  location: z.string().optional().describe('Nairobi neighbourhood or county location'),
  highlights: z.array(z.string()).optional().describe('Key features/services to mention'),
  capacity: z.number().optional().describe('Total child capacity of the center'),
});

export const draftProfileOutputSchema = z.object({
  about: z.string().describe('Professional 2-3 sentence "About Us" paragraph for the daycare profile'),
  tagline: z.string().describe('A short, catchy marketing tagline for the daycare (max 15 words)'),
  keyFeatures: z.array(z.string()).describe('3-5 key selling points for the daycare'),
});

export type DraftProfileInput = z.infer<typeof draftProfileInputSchema>;
export type DraftProfileOutput = z.infer<typeof draftProfileOutputSchema>;

// ── Daycare Executive Report ──────────────────────────────────────────────────
export const daycareReportInputSchema = z.object({
  schoolName: z.string().describe('Name of the daycare'),
  totalStudents: z.number().describe('Total active enrolled children'),
  totalRevenue: z.number().describe('Total revenue collected this period (KES)'),
  totalArrears: z.number().describe('Total outstanding unpaid fees (KES)'),
  paidCount: z.number().describe('Number of fully paid-up accounts'),
  arrearsCount: z.number().describe('Number of accounts with outstanding arrears'),
  totalServices: z.number().describe('Number of programs/services offered'),
  occupancyRate: z.number().optional().describe('Current occupancy as percentage (0-100)'),
  period: z.string().optional().describe('Reporting period label e.g. "July 2026"'),
});

export const daycareReportOutputSchema = z.object({
  financialHealthRating: z.enum(['EXCELLENT', 'GOOD', 'ATTENTION_REQUIRED']),
  executiveSummary: z.string().describe('2 paragraph executive summary of daycare financial and operational health'),
  revenueSummary: z.string().describe('Concise revenue performance statement with key figures'),
  arrearsAnalysis: z.string().describe('Analysis of arrears situation and risk level'),
  occupancyInsight: z.string().describe('Occupancy rate comment and capacity optimization advice'),
  actionableRecommendations: z.array(z.string()).describe('3-5 specific actions the school manager should take this month'),
});

export type DaycareReportInput = z.infer<typeof daycareReportInputSchema>;
export type DaycareReportOutput = z.infer<typeof daycareReportOutputSchema>;

// ── Parent KiddoCare Chat Assistant ─────────────────────────────────────────
export const parentChatInputSchema = z.object({
  message: z.string().min(1).max(600).describe("Parent's question or message"),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('Prior conversation turns'),
  context: z.object({
    childrenNames: z.array(z.string()).optional().describe("Names of parent's enrolled children"),
    enrolledSchool: z.string().optional().describe('Name of the daycare the child is enrolled in'),
  }).optional(),
});

export const parentChatOutputSchema = z.object({
  reply: z.string().describe("KiddoCare AI assistant response"),
});

export type ParentChatInput = z.infer<typeof parentChatInputSchema>;
export type ParentChatOutput = z.infer<typeof parentChatOutputSchema>;