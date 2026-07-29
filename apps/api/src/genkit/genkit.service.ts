import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GenkitService {
  private readonly aiServiceUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:3002';
  }

  /**
   * Call the KiddoCare AI service to draft a school profile.
   * Falls back to static template if the AI service is unavailable.
   */
  async draftSchoolProfile(schoolName: string, location?: string, highlights: string[] = []) {
    try {
      const response = await fetch(`${this.aiServiceUrl}/draftDaycareProfile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName, location, highlights }),
        signal: AbortSignal.timeout(15000), // 15-second timeout
      });

      if (!response.ok) {
        throw new Error(`AI service responded with ${response.status}`);
      }

      const result = await response.json() as { about: string; tagline: string; keyFeatures: string[] };
      return {
        generatedAbout: result.about,
        suggestedTagline: result.tagline,
        keyFeatures: result.keyFeatures,
      };
    } catch (error) {
      // Graceful fallback if AI service is not running
      console.warn('[GenkitService] AI service unavailable, using template fallback:', (error as Error).message);
      const locationText = location ? ` located in ${location}` : '';
      const defaultHighlights = highlights.length > 0 ? highlights : [
        'Infant & Toddler Early Childhood Care',
        'Certified Caregivers & High Safety Ratios',
        'Flexible Lipa Mdogo Mdogo Weekly Billing',
      ];
      return {
        generatedAbout: `Welcome to ${schoolName}${locationText}! We are a premier, trusted early childhood development and daycare center committed to providing a safe, nurturing, and stimulating environment for your child. Key highlights: ${defaultHighlights.join(', ')}.`,
        suggestedTagline: `${schoolName} — Safe, Nurturing & Affordable Early Childhood Care in ${location || 'Kenya'}`,
        keyFeatures: defaultHighlights,
      };
    }
  }

  /**
   * Generate an AI-powered executive summary for a school.
   * Calls the KiddoCare AI service for real Gemini analysis.
   */
  async generateExecutiveSummary(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: { services: true },
    });

    if (!school) {
      throw new NotFoundException(`School with ID '${schoolId}' not found`);
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { service: { schoolId }, status: 'ACTIVE' },
      include: {
        billingCycles: {
          include: { weeklyInstallments: true },
          orderBy: { monthStart: 'desc' },
          take: 1,
        },
      },
    });

    let totalRevenue = 0;
    let totalArrears = 0;
    let paidCount = 0;
    let arrearsCount = 0;

    for (const enr of enrollments) {
      const cycle = enr.billingCycles[0];
      const insts = cycle ? cycle.weeklyInstallments : [];
      const paidWeeks = insts.filter((i) => i.status === 'PAID').length;
      const totalWeeks = insts.length || 4;

      const paid = insts.reduce((sum, i) => sum + i.amountPaid, 0);
      const arrears = insts.filter((i) => i.status !== 'PAID').reduce((sum, i) => sum + (i.amountDue - i.amountPaid), 0);

      totalRevenue += paid;
      totalArrears += arrears;

      if (insts.length > 0 && paidWeeks === totalWeeks) paidCount++;
      else arrearsCount++;
    }

    const totalStudents = enrollments.length;

    // Try real AI executive report
    try {
      const aiResponse = await fetch(`${this.aiServiceUrl}/generateDaycareReport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: school.name,
          totalStudents,
          totalRevenue,
          totalArrears,
          paidCount,
          arrearsCount,
          totalServices: school.services.length,
          period: new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }),
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (aiResponse.ok) {
        const aiResult = await aiResponse.json() as {
          financialHealthRating: string;
          executiveSummary: string;
          revenueSummary: string;
          arrearsAnalysis: string;
          occupancyInsight: string;
          actionableRecommendations: string[];
        };

        const summaryData = {
          schoolId: school.id,
          schoolName: school.name,
          generatedAt: new Date(),
          financialHealthRating: aiResult.financialHealthRating as 'EXCELLENT' | 'GOOD' | 'ATTENTION_REQUIRED',
          revenueSummary: aiResult.revenueSummary,
          arrearsAnalysis: aiResult.arrearsAnalysis,
          occupancyOverview: aiResult.occupancyInsight,
          actionableRecommendations: aiResult.actionableRecommendations,
          aiGeneratedSummary: aiResult.executiveSummary,
        };

        await this.prisma.aIReport.create({
          data: { schoolId: school.id, type: 'EXEC_SUMMARY', content: summaryData as any },
        });
        return summaryData;
      }
    } catch (err) {
      console.warn('[GenkitService] AI service unavailable for report, using template fallback:', (err as Error).message);
    }

    // Template fallback
    let rating: 'EXCELLENT' | 'GOOD' | 'ATTENTION_REQUIRED' = 'EXCELLENT';
    if (arrearsCount > paidCount) rating = 'ATTENTION_REQUIRED';
    else if (arrearsCount > 0) rating = 'GOOD';

    const summaryData = {
      schoolId: school.id,
      schoolName: school.name,
      generatedAt: new Date(),
      financialHealthRating: rating,
      revenueSummary: `Total revenue collected is KES ${totalRevenue.toLocaleString()} across ${totalStudents} active enrollments.`,
      arrearsAnalysis: `${paidCount} account(s) are fully paid; ${arrearsCount} account(s) have outstanding arrears totaling KES ${totalArrears.toLocaleString()}.`,
      occupancyOverview: `School currently hosts ${totalStudents} active enrollments across ${school.services.length} program(s).`,
      actionableRecommendations: [
        'Send automated weekly M-Pesa reminders to parents with overdue installments.',
        'Offer Lipa Mdogo Mdogo flexible options to parents in arrears.',
        'Review capacity limits for top-performing programs.',
      ],
    };

    await this.prisma.aIReport.create({
      data: { schoolId: school.id, type: 'EXEC_SUMMARY', content: summaryData as any },
    });

    return summaryData;
  }

  async getSchoolReports(schoolId: string) {
    return this.prisma.aIReport.findMany({
      where: { schoolId },
      orderBy: { generatedAt: 'desc' },
    });
  }
}
