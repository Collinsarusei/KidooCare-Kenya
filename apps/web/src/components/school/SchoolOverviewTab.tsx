import React from 'react';
import { SchoolFinancialSummaryDto, ExecutiveSummaryReportDto } from '@daycare/shared-types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
  const totalEnrolled = financials?.totalEnrolledChildrenCount ?? 0;
  const monthlyRevenue = `KES ${Math.round(financials?.totalRevenueCollected ?? 0).toLocaleString()}`;
  const totalArrears = `KES ${Math.round(financials?.totalOutstandingArrears ?? 0).toLocaleString()}`;
  const trend = financials?.monthlyTrend ?? [];
  const revenueData = trend.map((t) => ({ name: t.month, value: Math.round(t.revenue) }));
  const enrollmentData = trend.map((t) => ({ name: t.month, value: t.newEnrollments }));

  return (
    <div className="w-full mx-auto space-y-4 font-sans pb-20 animate-fadeIn">

      {/* Overview Top Header (Mockup 2 Match) */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0b2a3c] font-display tracking-tight">
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
            className="btn bg-[#0b6e99] hover:bg-[#085a7e] text-white text-xs font-bold py-2.5 px-4 rounded-full shadow-md flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-sm">description</span>
            {isGeneratingAi ? 'Generating...' : 'Generate Executive Summary'}
          </button>
        </div>

        {/* AI Generated Executive Summary Box if generated */}
        {aiReport && (
          <div className="bg-[#e8f6fb] border border-[#a9d6ea] rounded-2xl p-4 space-y-2 text-xs animate-fadeIn">
            <div className="flex items-center gap-2 text-[#0b6e99] font-bold">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              AI Executive Summary
            </div>
            <p className="text-[#0b2a3c] leading-relaxed">
              {(aiReport as any).summary || aiReport.revenueSummary || 'Your center is operating at high performance with positive growth trends.'}
            </p>
          </div>
        )}
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1: Total Enrolled */}
        <div className="bg-[#f4fbf7] border border-[#d1fae5] rounded-3xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#434655]">Total Enrolled</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-extrabold text-[#0b2a3c] font-display">{totalEnrolled}</h2>
              <span className="text-xs font-bold text-[#00876f] flex items-center gap-0.5">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                +12%
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#4fe8c9]/40 text-[#00876f] flex items-center justify-center font-bold shadow-xs">
            <span className="material-symbols-outlined text-2xl">sentiment_satisfied</span>
          </div>
        </div>

        {/* Stat Card 2: Revenue this Month */}
        <div className="bg-[#f0f5ff] border border-[#d2ecf7] rounded-3xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#434655]">Revenue this Month</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-extrabold text-[#0b2a3c] font-display">{monthlyRevenue}</h2>
              <span className="text-xs font-bold text-[#0b6e99] flex items-center gap-0.5">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                +5%
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#d2ecf7] text-[#0b6e99] flex items-center justify-center font-bold shadow-xs">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
        </div>

        {/* Stat Card 3: Total Arrears */}
        <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-3xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#434655]">Total Arrears</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-extrabold text-[#0b2a3c] font-display">{totalArrears}</h2>
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
      <div className="bg-white border border-[#dcf0f8] rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-extrabold text-[#0b2a3c] font-display">Revenue Trends (last 6 months)</h3>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0b6e99" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0b6e99" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737686', fontWeight: 'bold' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737686', fontWeight: 'bold' }} tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : `${val}`)} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dcf0f8" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#0b2a3c' }}
                itemStyle={{ color: '#0b6e99', fontWeight: 'bold' }}
                formatter={(val: any) => [`KES ${Number(val).toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="value" stroke="#0b6e99" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 2: ENROLLMENT GROWTH BAR CHART (Mockup 2 Match) */}
      <div className="bg-white border border-[#dcf0f8] rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-extrabold text-[#0b2a3c] font-display">New Enrollments per Month</h3>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={enrollmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737686', fontWeight: 'bold' }} dy={10} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737686', fontWeight: 'bold' }} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dcf0f8" />
              <Tooltip 
                formatter={(val: any) => [val, 'New enrollments']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f3fafd' }}
                labelStyle={{ fontWeight: 'bold', color: '#0b2a3c' }}
                itemStyle={{ color: '#00876f', fontWeight: 'bold' }}
              />
              <Bar dataKey="value" fill="#00876f" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
