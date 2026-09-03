import React, { useMemo } from 'react';
import { SchoolFinancialSummaryDto, ExecutiveSummaryReportDto } from '@daycare/shared-types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

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

  // --- RECHARTS DATA PREPARATION ---
  
  // 1. Mock Time Series Data for Revenue Area Chart
  const revenueTrendData = [
    { name: 'Jan', revenue: 200000 },
    { name: 'Feb', revenue: 250000 },
    { name: 'Mar', revenue: 220000 },
    { name: 'Apr', revenue: 300000 },
    { name: 'May', revenue: schoolFinancials?.totalRevenueCollected || 450000 },
  ];

  // 2. Program Revenue Data (Computed from Ledger)
  const programRevenueData = useMemo(() => {
    if (!schoolFinancials?.studentRosterLedger) return [];
    const grouped = schoolFinancials.studentRosterLedger.reduce((acc, curr) => {
      acc[curr.serviceName] = (acc[curr.serviceName] || 0) + (curr.agreedMonthlyPrice * curr.paidWeeksCount);
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value
    }));
  }, [schoolFinancials]);

  // 3. Payment Status Pie Chart Data
  const pieData = [
    { name: 'Fully Paid', value: schoolFinancials?.fullyPaidEnrollmentsCount || 10 },
    { name: 'In Arrears', value: schoolFinancials?.enrollmentsInArrearsCount || 2 },
  ];
  const COLORS = ['#16a34a', '#c2410c'];

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

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Trends Area Chart */}
        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-[#121c2a] font-display mb-4">
            Revenue Trends
          </h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} tickFormatter={(val) => `KES ${val / 1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <CartesianGrid vertical={false} stroke="#e6eeff" />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enrollment Status Pie Chart */}
        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-[#121c2a] font-display mb-4">
            Payment Status
          </h3>
          <div className="flex-1 min-h-[250px] flex items-center justify-center">
            {totalEnrolled === 0 ? (
               <p className="text-[#737686] text-sm">No enrollments yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Program Revenue Bar Chart */}
        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-extrabold text-[#121c2a] font-display mb-4">
            Revenue by Program
          </h3>
          <div className="flex-1 min-h-[300px]">
            {programRevenueData.length === 0 ? (
               <p className="text-[#737686] text-sm text-center pt-10">No revenue data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programRevenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e6eeff" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} tickFormatter={(val) => `KES ${val / 1000}k`} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8f9ff' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="value" fill="#6cf8bb" radius={[6, 6, 0, 0]} barSize={40} activeBar={{ fill: '#006c49' }} />
                </BarChart>
              </ResponsiveContainer>
            )}
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

