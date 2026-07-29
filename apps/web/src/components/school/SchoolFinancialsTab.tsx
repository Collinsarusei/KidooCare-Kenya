import React from 'react';
import { SchoolFinancialSummaryDto, ExecutiveSummaryReportDto } from '@daycare/shared-types';

interface SchoolFinancialsTabProps {
  schoolFinancials: SchoolFinancialSummaryDto | null;
  aiReport: ExecutiveSummaryReportDto | null;
  isGeneratingAi: boolean;
  onGenerateAiReport: () => void;
}

export const SchoolFinancialsTab: React.FC<SchoolFinancialsTabProps> = ({
  schoolFinancials,
  aiReport,
  isGeneratingAi,
  onGenerateAiReport,
}) => {
  const totalEnrolled = schoolFinancials?.totalEnrolledChildrenCount || 142;
  const revenueMonth = schoolFinancials?.totalRevenueCollected
    ? `KES ${(schoolFinancials.totalRevenueCollected / 1000).toFixed(0)}K`
    : 'KES 450K';
  const totalArrears = schoolFinancials?.totalOutstandingArrears
    ? `KES ${(schoolFinancials.totalOutstandingArrears / 1000).toFixed(0)}K`
    : 'KES 35K';

  return (
    <div className="w-full mx-auto space-y-6 font-sans">
      
      {/* Header (Screenshot 2 Match) */}
      <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display tracking-tight">
              Overview
            </h2>
            <p className="text-xs md:text-sm text-[#737686] mt-1 font-medium">
              Here's what's happening today.
            </p>
          </div>

          <button
            disabled={isGeneratingAi}
            onClick={onGenerateAiReport}
            className="btn bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs md:text-sm font-bold py-3 px-5 rounded-full shadow-md transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">description</span>
            {isGeneratingAi ? 'Generating Summary...' : 'Generate Executive Summary'}
          </button>
        </div>

        {/* 3 Metric Cards (Screenshot 2 Match) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* Total Enrolled */}
          <div className="bg-white border border-[#e6eeff] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#b4c5ff] transition-all relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#737686]">Total Enrolled</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display">{totalEnrolled}</p>
                  <span className="text-xs font-bold text-[#16a34a] flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                    +12%
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#6cf8bb]/30 text-[#00714d] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">sentiment_satisfied</span>
              </div>
            </div>
          </div>

          {/* Revenue this Month */}
          <div className="bg-white border border-[#e6eeff] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#b4c5ff] transition-all relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#737686]">Revenue this Month</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display">{revenueMonth}</p>
                  <span className="text-xs font-bold text-[#16a34a] flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                    +5%
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#dbeafe] text-[#2563eb] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
              </div>
            </div>
          </div>

          {/* Total Arrears */}
          <div className="bg-white border border-[#e6eeff] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#b4c5ff] transition-all relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#737686]">Total Arrears</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display">{totalArrears}</p>
                  <span className="text-xs font-bold text-[#c2410c] flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">trending_down</span>
                    Action needed
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#fef3c7] text-[#b45309] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">error_outline</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* AI Executive Summary Drawer */}
      {aiReport && (
        <div className="bg-gradient-to-r from-[#eff4ff] to-[#e6eeff] border border-[#b4c5ff] rounded-3xl p-6 shadow-md space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-[#b4c5ff]/50 pb-3">
            <h4 className="text-sm font-bold text-[#004ac6] font-display uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">smart_toy</span>
              AI Executive Summary
            </h4>
            <span className={`badge ${
              aiReport.financialHealthRating === 'EXCELLENT' 
                ? 'badge-green' 
                : aiReport.financialHealthRating === 'GOOD' 
                  ? 'badge-blue' 
                  : 'badge-orange'
            }`}>
              Health Rating: {aiReport.financialHealthRating}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-white">
              <span className="font-bold text-[#004ac6] block mb-1">Revenue Summary</span>
              <p className="text-[#434655]">{aiReport.revenueSummary}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-white">
              <span className="font-bold text-[#c2410c] block mb-1">Arrears Analysis</span>
              <p className="text-[#434655]">{aiReport.arrearsAnalysis}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-white">
              <span className="font-bold text-[#00714d] block mb-1">Occupancy Overview</span>
              <p className="text-[#434655]">{aiReport.occupancyOverview}</p>
            </div>
          </div>

          <div className="bg-white/90 p-4 rounded-2xl border border-white space-y-2">
            <h5 className="text-xs font-bold text-[#004ac6] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">lightbulb</span>
              AI Actionable Recommendations:
            </h5>
            <ul className="list-disc list-inside text-xs text-[#434655] space-y-1">
              {aiReport.actionableRecommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* CHARTS CONTAINER (Screenshot 2 Match) */}
      <div className="space-y-6">
        
        {/* Revenue Trends Chart Card */}
        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-7 shadow-sm space-y-4">
          <h3 className="text-lg md:text-xl font-extrabold text-[#121c2a] font-display">
            Revenue Trends
          </h3>

          {/* SVG Smooth Area Chart Representation */}
          <div className="pt-4">
            <div className="h-44 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area Fill */}
                <path
                  d="M 0,130 C 100,100 200,90 300,50 C 400,60 450,20 500,10 L 500,150 L 0,150 Z"
                  fill="url(#revenueGrad)"
                />

                {/* Smooth Curve Line */}
                <path
                  d="M 0,130 C 100,100 200,90 300,50 C 400,60 450,20 500,10"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-xs font-semibold text-[#737686] pt-3 px-2 border-t border-[#f1f5f9]">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
            </div>
          </div>
        </div>

        {/* Enrollment Growth Bar Chart Card */}
        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-7 shadow-sm space-y-4">
          <h3 className="text-lg md:text-xl font-extrabold text-[#121c2a] font-display">
            Enrollment Growth
          </h3>

          {/* Bar Chart Representation */}
          <div className="pt-6 flex items-end justify-between gap-4 h-48 px-4">
            <div className="w-full bg-[#6cf8bb]/40 rounded-t-xl h-[40%] transition-all hover:bg-[#6cf8bb]" />
            <div className="w-full bg-[#6cf8bb]/50 rounded-t-xl h-[55%] transition-all hover:bg-[#6cf8bb]" />
            <div className="w-full bg-[#6cf8bb]/60 rounded-t-xl h-[50%] transition-all hover:bg-[#6cf8bb]" />
            <div className="w-full bg-[#6cf8bb]/80 rounded-t-xl h-[75%] transition-all hover:bg-[#6cf8bb]" />
            <div className="w-full bg-[#006c49] rounded-t-xl h-[95%] transition-all hover:bg-[#005236]" />
          </div>
        </div>

      </div>

      {/* Student Roster Financial Table */}
      {schoolFinancials && (
        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="text-base font-bold text-[#121c2a] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">badge</span>
            Student Accounts Ledger
          </h4>
          <div className="overflow-x-auto border border-[#e6eeff] rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9ff] border-b border-[#e6eeff] text-[#737686] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Child Name</th>
                  <th className="p-3.5">Parent Contact</th>
                  <th className="p-3.5">Program</th>
                  <th className="p-3.5">Progress</th>
                  <th className="p-3.5">Arrears</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6eeff]">
                {schoolFinancials.studentRosterLedger.map((row) => (
                  <tr key={row.enrollmentId} className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="p-3.5 font-bold text-[#004ac6] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">child_care</span>
                      {row.childName}
                    </td>
                    <td className="p-3.5 text-[#434655]">
                      <span className="font-medium">{row.parentPhone}</span>
                      <br />
                      <span className="text-[#737686]">{row.parentEmail}</span>
                    </td>
                    <td className="p-3.5 font-medium text-[#121c2a]">{row.serviceName}</td>
                    <td className="p-3.5 text-[#434655]">{row.paidWeeksCount} of {row.totalWeeksCount} weeks</td>
                    <td className={`p-3.5 font-bold ${row.totalArrears > 0 ? 'text-[#c2410c]' : 'text-[#006c49]'}`}>
                      KES {row.totalArrears.toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span className={`badge ${row.isFullyPaid ? 'badge-green' : 'badge-orange'}`}>
                        {row.isFullyPaid ? 'PAID UP' : 'ARREARS'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

