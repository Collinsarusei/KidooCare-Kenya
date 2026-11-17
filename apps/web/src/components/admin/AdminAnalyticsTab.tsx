import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import { fetchPlatformAnalytics, kes, PlatformAnalytics } from './platformReport';

const STATUS_COLORS = ['#16a34a', '#f59e0b', '#dc2626'];
const tooltipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' };

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="h-full min-h-[200px] flex items-center justify-center text-xs text-[#737686] bg-[#f8f9ff] rounded-2xl border border-dashed border-[#c3c6d7]">
    {text}
  </div>
);

export const AdminAnalyticsTab: React.FC = () => {
  const [data, setData] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchPlatformAnalytics());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-white border border-[#e6eeff] rounded-3xl p-10 text-center text-sm text-[#737686]">
        Loading live platform analytics...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white border border-[#ffdad6] rounded-3xl p-8 text-center space-y-3">
        <p className="text-sm font-bold text-[#ba1a1a]">Could not load analytics</p>
        <p className="text-xs text-[#737686]">{error}</p>
        <button onClick={load} className="btn btn-primary text-xs px-4 py-2 rounded-xl">Retry</button>
      </div>
    );
  }

  if (!data) return null;
  const k = data.kpis;
  const hasStatus = data.schoolStatus.some((s) => s.value > 0);

  const kpiCards = [
    { label: 'Daycare Centres', value: k.totalSchools, sub: `${k.activeSchools} active • ${k.verifiedSchools} verified`, icon: 'domain', tone: 'bg-[#eff4ff] text-[#004ac6]' },
    { label: 'Parents', value: k.totalParents, sub: `${k.totalChildren} children registered`, icon: 'family_restroom', tone: 'bg-[#f0fdf4] text-[#16a34a]' },
    { label: 'Active Enrollments', value: k.activeEnrollments, sub: `${k.pendingPaymentEnrollments} pending payment • ${k.waitlistedEnrollments} waitlisted`, icon: 'assignment_turned_in', tone: 'bg-[#f5f3ff] text-[#7c3aed]' },
    { label: 'Tutors', value: k.totalTutors, sub: `${k.totalUsers} users in total`, icon: 'co_present', tone: 'bg-[#ecfeff] text-[#0e7490]' },
    { label: 'Total Collected', value: kes(k.totalRevenue), sub: `${kes(k.revenueThisMonth)} this month`, icon: 'payments', tone: 'bg-[#fff7ed] text-[#c2410c]' },
    { label: 'Outstanding Arrears', value: kes(k.outstandingArrears), sub: 'across all enrollments', icon: 'account_balance_wallet', tone: 'bg-[#fef2f2] text-[#dc2626]' },
    { label: 'Docs Awaiting Review', value: k.pendingDocuments, sub: `${k.totalDocuments} documents submitted`, icon: 'verified', tone: 'bg-[#fefce8] text-[#a16207]' },
    { label: 'Open Disputes', value: k.openDisputes, sub: 'need attention', icon: 'gavel', tone: 'bg-[#fdf2f8] text-[#be185d]' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-[#121c2a] font-display">Platform Analytics</h2>
          <p className="text-xs text-[#737686]">Live data • updated {new Date(data.generatedAt).toLocaleTimeString()}</p>
        </div>
        <button onClick={load} disabled={loading} className="btn btn-secondary text-xs px-4 py-2 rounded-xl flex items-center gap-1">
          <span className="material-symbols-outlined text-base">refresh</span>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((c) => (
          <div key={c.label} className="bg-white border border-[#e6eeff] rounded-2xl p-5 shadow-xs flex justify-between items-center gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#737686]">{c.label}</p>
              <p className="text-2xl font-extrabold text-[#121c2a] font-display mt-1 truncate">{c.value}</p>
              <p className="text-[11px] text-[#737686] mt-0.5 truncate">{c.sub}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${c.tone}`}>
              <span className="material-symbols-outlined text-2xl">{c.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-[#121c2a] font-display mb-4">Revenue Collected (last 6 months)</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.monthly} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPlatformRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004ac6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#004ac6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                <RechartsTooltip contentStyle={tooltipStyle} formatter={(v: any) => [kes(Number(v)), 'Revenue']} />
                <CartesianGrid vertical={false} stroke="#e6eeff" />
                <Area type="monotone" dataKey="revenue" stroke="#004ac6" strokeWidth={3} fillOpacity={1} fill="url(#colorPlatformRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-[#121c2a] font-display mb-4">User Adoption (cumulative)</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.monthly} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} dy={10} />
                <YAxis yAxisId="left" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} />
                <YAxis yAxisId="right" allowDecimals={false} orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" height={30} iconType="circle" />
                <CartesianGrid vertical={false} stroke="#e6eeff" />
                <Line yAxisId="left" type="monotone" dataKey="parents" stroke="#16a34a" strokeWidth={3} name="Parents" dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="schools" stroke="#c2410c" strokeWidth={3} name="Schools" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-[#121c2a] font-display mb-4">School Status</h3>
          <div className="flex-1 min-h-[250px]">
            {hasStatus ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={data.schoolStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {data.schoolStatus.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty text="No schools onboarded yet" />
            )}
          </div>
        </div>

        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-[#121c2a] font-display mb-4">Service Popularity</h3>
          <div className="flex-1 min-h-[250px]">
            {data.servicePopularity.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.servicePopularity} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} layout="vertical">
                  <CartesianGrid horizontal={false} stroke="#e6eeff" />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} width={110} />
                  <RechartsTooltip cursor={{ fill: '#f8f9ff' }} contentStyle={tooltipStyle} formatter={(v: any) => [v, 'Enrollments']} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty text="No enrollments yet" />
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-extrabold text-[#121c2a] font-display mb-3">Top Schools by Revenue</h3>
        {data.topSchools.length ? (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[#e6eeff]">
              {data.topSchools.map((s, i) => (
                <tr key={s.name + i}>
                  <td className="py-2 w-8 font-bold text-[#737686]">{i + 1}</td>
                  <td className="py-2 font-semibold text-[#121c2a]">{s.name}</td>
                  <td className="py-2 text-right font-bold text-[#004ac6]">{kes(s.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-[#737686]">No completed payments yet.</p>
        )}
      </div>
    </div>
  );
};
