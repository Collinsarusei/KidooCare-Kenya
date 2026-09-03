import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

export const AdminAnalyticsTab: React.FC = () => {
  // Mock Data for Platform Analytics
  const platformGrowthData = [
    { month: 'Jan', schools: 2, parents: 10, revenue: 50000 },
    { month: 'Feb', schools: 5, parents: 45, revenue: 120000 },
    { month: 'Mar', schools: 8, parents: 80, revenue: 250000 },
    { month: 'Apr', schools: 12, parents: 150, revenue: 450000 },
    { month: 'May', schools: 15, parents: 210, revenue: 650000 },
  ];

  const schoolStatusData = [
    { name: 'Active', value: 12 },
    { name: 'Pending Verification', value: 3 },
    { name: 'Suspended', value: 0 },
  ];
  
  const popularServicesData = [
    { name: 'Full Day', value: 85 },
    { name: 'Half Day', value: 45 },
    { name: 'Drop-in', value: 30 },
    { name: 'After School', value: 50 },
  ];

  const STATUS_COLORS = ['#16a34a', '#f59e0b', '#dc2626'];

  return (
    <div className="space-y-6">
      
      {/* Platform KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e6eeff] rounded-2xl p-5 shadow-xs flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-[#737686]">Total Daycare Centres</p>
            <p className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display mt-1">15</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] text-[#004ac6] flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">domain</span>
          </div>
        </div>
        <div className="bg-white border border-[#e6eeff] rounded-2xl p-5 shadow-xs flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-[#737686]">Total Parents</p>
            <p className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display mt-1">210</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#f0fdf4] text-[#16a34a] flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">family_restroom</span>
          </div>
        </div>
        <div className="bg-white border border-[#e6eeff] rounded-2xl p-5 shadow-xs flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-[#737686]">Platform GMV (May)</p>
            <p className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display mt-1">KES 650K</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#fff7ed] text-[#c2410c] flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">payments</span>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Platform Growth Area Chart */}
        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-[#121c2a] font-display mb-4">Platform Revenue Growth</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={platformGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPlatformRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004ac6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#004ac6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} tickFormatter={(val) => `KES ${val / 1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <CartesianGrid vertical={false} stroke="#e6eeff" />
                <Area type="monotone" dataKey="revenue" stroke="#004ac6" strokeWidth={3} fillOpacity={1} fill="url(#colorPlatformRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Line Chart */}
        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-[#121c2a] font-display mb-4">User Adoption (Schools vs Parents)</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={platformGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <CartesianGrid vertical={false} stroke="#e6eeff" />
                <Line yAxisId="left" type="monotone" dataKey="parents" stroke="#16a34a" strokeWidth={3} name="Parents" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="schools" stroke="#c2410c" strokeWidth={3} name="Schools" dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* School Status Pie Chart */}
        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-[#121c2a] font-display mb-4">School Verification Status</h3>
          <div className="flex-1 min-h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={schoolStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {schoolStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Services Bar Chart */}
        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-[#121c2a] font-display mb-4">Service Popularity</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularServicesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid horizontal={false} stroke="#e6eeff" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737686' }} width={80} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8f9ff' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [value, 'Enrollments']}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={20} activeBar={{ fill: '#7c3aed' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
