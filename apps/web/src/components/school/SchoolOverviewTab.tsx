import React from 'react';
import { SchoolFinancialSummaryDto, ExecutiveSummaryReportDto } from '@daycare/shared-types';

interface SchoolOverviewTabProps {
  financials: SchoolFinancialSummaryDto | null;
  aiReport: ExecutiveSummaryReportDto | null;
  isGeneratingAi: boolean;
  onGenerateAiReport: () => void;
  onNavigateTab: (tab: string) => void;
}

export const SchoolOverviewTab: React.FC<SchoolOverviewTabProps> = ({
  financials,
  aiReport,
  isGeneratingAi,
  onGenerateAiReport,
  onNavigateTab,
}) => {
  const totalEnrolled = financials?.totalEnrolledChildrenCount || 142;
  const monthlyRevenue = financials?.totalRevenueCollected
    ? `KES ${Math.round(financials.totalRevenueCollected / 1000)}K`
    : 'KES 450K';
  const totalArrears = financials?.totalOutstandingArrears
    ? `KES ${Math.round(financials.totalOutstandingArrears / 1000)}K`
    : 'KES 35K';

  return (
    <div className="w-full mx-auto space-y-6 font-sans pb-20 animate-fadeIn">

      {/* Overview Top Header (Mockup 2 Match) */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display tracking-tight">
              Overview
            </h1>
            <p className="text-xs text-[#737686] mt-0.5">
              Here is what's happening today.
            </p>
          </div>
          <button
            type="button"
            onClick={onGenerateAiReport}
            disabled={isGeneratingAi}
            className="btn bg-[#004ac6] hover:bg-[#003ea8] text-white text-xs font-bold py-2.5 px-4 rounded-full shadow-md flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-sm">description</span>
            {isGeneratingAi ? 'Generating...' : 'Generate Executive Summary'}
          </button>
        </div>

        {/* AI Generated Executive Summary Box if generated */}
        {aiReport && (
          <div className="bg-[#eff4ff] border border-[#b4c5ff] rounded-2xl p-4 space-y-2 text-xs animate-fadeIn">
            <div className="flex items-center gap-2 text-[#004ac6] font-bold">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              AI Executive Summary
            </div>
            <p className="text-[#121c2a] leading-relaxed">
              {(aiReport as any).summary || aiReport.revenueSummary || 'Your center is operating at high performance with positive growth trends.'}
            </p>
          </div>
        )}
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1: Total Enrolled */}
        <div className="bg-[#f4fbf7] border border-[#d1fae5] rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#434655]">Total Enrolled</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-3xl font-extrabold text-[#121c2a] font-display">{totalEnrolled}</h2>
              <span className="text-xs font-bold text-[#00714d] flex items-center gap-0.5">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                +12%
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#6cf8bb]/40 text-[#00714d] flex items-center justify-center font-bold shadow-xs">
            <span className="material-symbols-outlined text-2xl">sentiment_satisfied</span>
          </div>
        </div>

        {/* Stat Card 2: Revenue this Month */}
        <div className="bg-[#f0f5ff] border border-[#dbeafe] rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#434655]">Revenue this Month</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-3xl font-extrabold text-[#121c2a] font-display">{monthlyRevenue}</h2>
              <span className="text-xs font-bold text-[#004ac6] flex items-center gap-0.5">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                +5%
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#dbeafe] text-[#004ac6] flex items-center justify-center font-bold shadow-xs">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
        </div>

        {/* Stat Card 3: Total Arrears */}
        <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#434655]">Total Arrears</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-3xl font-extrabold text-[#121c2a] font-display">{totalArrears}</h2>
              <span className="text-xs font-bold text-[#c2410c] flex items-center gap-0.5">
                <span className="material-symbols-outlined text-sm">error</span>
                Action needed
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#fef3c7] text-[#c2410c] flex items-center justify-center font-bold shadow-xs">
            <span className="material-symbols-outlined text-2xl">priority_high</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: REVENUE TRENDS CHART (Mockup 2 Match) */}
      <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-extrabold text-[#121c2a] font-display">Revenue Trends</h3>
        
        {/* SVG Smooth Curve Line Chart */}
        <div className="h-48 w-full relative pt-2">
          <svg className="w-full h-36 overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
            {/* Horizontal Grid lines */}
            <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="80" x2="300" y2="80" stroke="#f1f5f9" strokeWidth="1" />

            {/* Gradient Fill under Curve */}
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#004ac6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#004ac6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <path
              d="M 0 80 Q 75 40 150 50 T 300 15 L 300 100 L 0 100 Z"
              fill="url(#revGrad)"
            />

            {/* Smooth Curve Line */}
            <path
              d="M 0 80 Q 75 40 150 50 T 300 15"
              fill="none"
              stroke="#004ac6"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>

          {/* X Axis Month Labels */}
          <div className="flex justify-between text-[11px] font-bold text-[#737686] pt-2 px-1 border-t border-[#f1f5f9]">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: ENROLLMENT GROWTH BAR CHART (Mockup 2 Match) */}
      <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-extrabold text-[#121c2a] font-display">Enrollment Growth</h3>
        
        {/* Bar Chart */}
        <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
          {[
            { month: 'Jan', val: 50, color: 'bg-[#6cf8bb]' },
            { month: 'Feb', val: 70, color: 'bg-[#6cf8bb]' },
            { month: 'Mar', val: 65, color: 'bg-[#6cf8bb]' },
            { month: 'Apr', val: 90, color: 'bg-[#6cf8bb]' },
            { month: 'May', val: 120, color: 'bg-[#00714d]' },
            { month: 'Jun', val: 130, color: 'bg-[#00714d]' },
            { month: 'Jul', val: 125, color: 'bg-[#00714d]' },
            { month: 'Aug', val: 140, color: 'bg-[#00714d]' },
            { month: 'Sep', val: 142, color: 'bg-[#00714d]' },
            { month: 'Oct', val: 140, color: 'bg-[#00714d]' },
            { month: 'Nov', val: 145, color: 'bg-[#00714d]' },
            { month: 'Dec', val: 150, color: 'bg-[#00714d]' },
          ].map((b, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div
                className={`w-full max-w-[24px] md:max-w-[40px] rounded-xl transition-all ${b.color}`}
                style={{ height: `${(b.val / 150) * 100}%` }}
              />
              <span className="text-[9px] md:text-[11px] font-bold text-[#737686]">{b.month}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
