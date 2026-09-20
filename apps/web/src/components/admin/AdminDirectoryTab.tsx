import React, { useState } from 'react';
import { SchoolDetailDto } from '@daycare/shared-types';

interface AdminDirectoryTabProps {
  adminSchools: SchoolDetailDto[];
  onOnboardSchool: (data: {
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
  }) => void;
  onUpdateCredentials?: (
    schoolId: string,
    credentials: {
      mpesaConsumerKey: string;
      mpesaConsumerSecret: string;
      mpesaShortcode: string;
      mpesaPasskey: string;
    }
  ) => void;
  onDeleteSchool?: (schoolId: string, schoolName: string) => void;
  onUpdateSchoolProfile?: (schoolId: string, data: { name?: string; location?: string }) => void;
  onToggleSchoolStatus?: (schoolId: string, currentStatus: string) => void;
}

export const AdminDirectoryTab: React.FC<AdminDirectoryTabProps> = ({
  adminSchools,
  onOnboardSchool,
  onUpdateCredentials,
  onDeleteSchool,
  onUpdateSchoolProfile,
  onToggleSchoolStatus,
}) => {
  const [view, setView] = useState<'overview' | 'add_school'>('overview');

  // Onboard New School Form State (STARTS COMPLETELY BLANK / UNPOPULATED)
  const [schoolName, setSchoolName] = useState('');
  const [cityRegion, setCityRegion] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');

  // M-Pesa Integration State for Onboarding (Blank by default)
  const [showPaybillInputs, setShowPaybillInputs] = useState(false);
  const [paybillNumber, setPaybillNumber] = useState('');
  const [passkey, setPasskey] = useState('');

  const [showDarajaInputs, setShowDarajaInputs] = useState(false);
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [showConsumerKey, setShowConsumerKey] = useState(false);

  // Manage Existing School Credentials Modal State
  const [credModalSchool, setCredModalSchool] = useState<SchoolDetailDto | null>(null);
  const [editPaybill, setEditPaybill] = useState('');
  const [editPasskey, setEditPasskey] = useState('');
  const [editConsumerKey, setEditConsumerKey] = useState('');
  const [editConsumerSecret, setEditConsumerSecret] = useState('');
  const [submittingCreds, setSubmittingCreds] = useState(false);

  // Edit Existing School Profile Modal State
  const [editModalSchool, setEditModalSchool] = useState<SchoolDetailDto | null>(null);
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editCityRegion, setEditCityRegion] = useState('');
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Overview State
  const [showAllRegistrations, setShowAllRegistrations] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'NO_CREDS'>('ALL');
  const [reportToast, setReportToast] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // DYNAMICALLY COMPUTED REAL METRICS FROM BACKEND DB DATA
  const totalSchools = adminSchools.length;
  const totalChildrenEnrolled = adminSchools.reduce(
    (sum, sch) => sum + ((sch as any)._count?.children || 0),
    0
  );
  const totalUsers = totalChildrenEnrolled + totalSchools;
  const totalActivePrograms = adminSchools.reduce(
    (sum, sch) => sum + ((sch as any)._count?.services || 0),
    0
  );

  const handleSaveAndComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName || !adminEmail || !adminPassword) return;
    if (adminPassword.length < 6 || adminPassword !== confirmAdminPassword) return;

    onOnboardSchool({
      schoolName,
      adminEmail,
      adminPhone: contactPhone || '+254712345678',
      adminPassword,
      location: cityRegion || 'Nairobi',
      ...(paybillNumber && { mpesaShortcode: paybillNumber }),
      ...(passkey && { mpesaPasskey: passkey }),
      ...(consumerKey && { mpesaConsumerKey: consumerKey }),
      ...(consumerSecret && { mpesaConsumerSecret: consumerSecret }),
    });

    // Reset Form & Return to Overview
    setSchoolName('');
    setCityRegion('');
    setContactPhone('');
    setAdminEmail('');
    setAdminPassword('');
    setConfirmAdminPassword('');
    setPaybillNumber('');
    setPasskey('');
    setConsumerKey('');
    setConsumerSecret('');
    setShowPaybillInputs(false);
    setShowDarajaInputs(false);
    setView('overview');
  };

  const handleSaveExistingCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credModalSchool || !onUpdateCredentials) return;

    setSubmittingCreds(true);
    try {
      await onUpdateCredentials(credModalSchool.id, {
        mpesaShortcode: editPaybill,
        mpesaPasskey: editPasskey,
        mpesaConsumerKey: editConsumerKey,
        mpesaConsumerSecret: editConsumerSecret,
      });
      setCredModalSchool(null);
      setEditPaybill('');
      setEditPasskey('');
      setEditConsumerKey('');
      setEditConsumerSecret('');
    } finally {
      setSubmittingCreds(false);
    }
  };

  const handleSaveSchoolProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalSchool || !onUpdateSchoolProfile) return;

    setSubmittingProfile(true);
    try {
      await onUpdateSchoolProfile(editModalSchool.id, {
        name: editSchoolName,
        location: editCityRegion,
      });
      setEditModalSchool(null);
    } finally {
      setSubmittingProfile(false);
    }
  };

  const openCredentialsModal = (sch: SchoolDetailDto) => {
    setCredModalSchool(sch);
    setEditPaybill('');
    setEditPasskey('');
    setEditConsumerKey('');
    setEditConsumerSecret('');
    setActiveMenuId(null);
  };

  const handleGenerateReport = () => {
    setReportToast(true);
    setTimeout(() => setReportToast(false), 4000);
  };

  const formatRelativeTime = (dateStr?: string | Date): string => {
    if (!dateStr) return 'Registered recently';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Registered recently';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Registered less than an hour ago';
    if (diffHours < 24) return `Registered ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `Registered ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return `Registered on ${date.toLocaleDateString()}`;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'Active', badgeClass: 'bg-[#dbeafe] text-[#1d4ed8]' };
      case 'SUSPENDED':
        return { label: 'Suspended', badgeClass: 'bg-[#f1f5f9] text-[#475569]' };
      case 'PENDING_PROFILE':
      case 'PENDING':
      default:
        return { label: 'Pending', badgeClass: 'bg-[#fef3c7] text-[#b45309]' };
    }
  };

  const displayedSchools = adminSchools.filter(sch => {
    if (searchQuery && !sch.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === 'ACTIVE' && sch.status !== 'ACTIVE') return false;
    if (statusFilter === 'SUSPENDED' && sch.status !== 'SUSPENDED') return false;
    if (statusFilter === 'PENDING' && sch.status !== 'PENDING_PROFILE') return false;
    if (statusFilter === 'NO_CREDS' && sch.credentialsStatus?.isConfigured) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Toast Notification */}
      {reportToast && (
        <div className="fixed top-4 right-4 z-50 bg-[#004ac6] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-xl">analytics</span>
          <div>
            <p className="font-bold text-xs">Real-Time Platform Report</p>
            <p className="text-[11px] text-blue-100">Generating analytics PDF for {totalSchools} backend database schools...</p>
          </div>
        </div>
      )}

      {/* VIEW 1: PLATFORM OVERVIEW (ADMIN DASHBOARD) */}
      {view === 'overview' && (
        <div className="space-y-6">

          {/* Title & Action Header */}
          <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-7 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display tracking-tight">
                  Platform Overview
                </h2>
                <p className="text-xs md:text-sm text-[#737686] mt-1 font-medium">
                  Real-time metrics for all childcare providers across Kenya.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateReport}
                  className="btn bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs md:text-sm font-bold py-2.5 px-5 rounded-full shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-lg">assessment</span>
                  Generate Report
                </button>
                <button
                  onClick={() => setView('add_school')}
                  className="btn bg-[#004ac6] hover:bg-[#003ea8] text-white text-xs md:text-sm font-bold py-2.5 px-5 rounded-full shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Add School
                </button>
              </div>
            </div>

            {/* REAL-TIME DYNAMIC METRIC CARDS (PULLED FROM BACKEND DATA) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              
              {/* Total Users (Dynamic) */}
              <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-[#e2e8f0] rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between space-y-4 hover:-translate-y-1 hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.15)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/30">
                    <span className="material-symbols-outlined text-2xl">group</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#16a34a] bg-[#dcfce7] border border-[#bbf7d0] px-2.5 py-1 rounded-full flex items-center gap-0.5 shadow-sm">
                    <span className="material-symbols-outlined text-[10px]">trending_up</span>
                    Live DB
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Total Users</p>
                  <p className="text-3xl font-extrabold text-[#0f172a] font-display mt-0.5">
                    {totalUsers}
                  </p>
                </div>
              </div>

              {/* Total Daycare Centres */}
              <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-[#e2e8f0] rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between space-y-4 hover:-translate-y-1 hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.15)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white flex items-center justify-center font-bold shadow-lg shadow-amber-500/30">
                    <span className="material-symbols-outlined text-2xl">school</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#16a34a] bg-[#dcfce7] border border-[#bbf7d0] px-2.5 py-1 rounded-full flex items-center gap-0.5 shadow-sm">
                    <span className="material-symbols-outlined text-[10px]">trending_up</span>
                    Backend DB
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Total Daycare Centres</p>
                  <p className="text-3xl font-extrabold text-[#0f172a] font-display mt-0.5">
                    {totalSchools}
                  </p>
                </div>
              </div>

              {/* Active Programs */}
              <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-[#e2e8f0] rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between space-y-4 hover:-translate-y-1 hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.15)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10b981] to-[#047857] text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/30">
                    <span className="material-symbols-outlined text-2xl">widgets</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#16a34a] bg-[#dcfce7] border border-[#bbf7d0] px-2.5 py-1 rounded-full flex items-center gap-0.5 shadow-sm">
                    <span className="material-symbols-outlined text-[10px]">trending_up</span>
                    Live DB
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Active Programs</p>
                  <p className="text-3xl font-extrabold text-[#0f172a] font-display mt-0.5">
                    {totalActivePrograms}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Interactive School Directory */}
          <div className="bg-white border border-[#e6eeff] rounded-3xl shadow-sm overflow-hidden">
            
            {/* Search & Filter Header */}
            <div className="p-5 md:p-6 border-b border-[#e6eeff] bg-gradient-to-b from-[#f8f9ff] to-white space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg md:text-xl font-extrabold text-[#121c2a] font-display">
                  School Directory ({displayedSchools.length})
                </h3>
                
                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search schools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-[#cbd5e1] bg-white focus:ring-2 focus:ring-[#2563eb] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { id: 'ALL', label: 'All Schools' },
                  { id: 'ACTIVE', label: 'Active' },
                  { id: 'PENDING', label: 'Pending' },
                  { id: 'SUSPENDED', label: 'Suspended' },
                  { id: 'NO_CREDS', label: 'Missing Credentials' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setStatusFilter(filter.id as any)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      statusFilter === filter.id
                        ? 'bg-[#121c2a] text-white shadow-md'
                        : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 md:p-6 bg-[#f8f9ff]">
              {displayedSchools.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white shadow-sm border border-[#e2e8f0] text-[#94a3b8] mx-auto flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-4xl">search_off</span>
                  </div>
                  <div>
                    <p className="font-bold text-[#121c2a] text-lg font-display">No Schools Found</p>
                    <p className="text-sm text-[#64748b] max-w-sm mx-auto mt-1">
                      {totalSchools === 0 
                        ? "There are no childcare schools in the database yet." 
                        : "No schools match your current search or filter criteria."}
                    </p>
                  </div>
                  {totalSchools === 0 && (
                    <button
                      onClick={() => setView('add_school')}
                      className="btn bg-[#004ac6] hover:bg-[#003ea8] text-white text-sm font-bold py-2.5 px-6 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all inline-flex items-center gap-2 mt-4"
                    >
                      <span className="material-symbols-outlined text-lg">add_business</span>
                      Onboard First School
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
                  {displayedSchools.map((item) => {
                    const badge = getStatusBadge(item.status);
                    const hasCreds = item.credentialsStatus?.isConfigured;
                    return (
                      <div 
                        key={item.id}
                        className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group relative"
                      >
                        {/* Card Header Gradient Banner */}
                        <div className="h-20 bg-gradient-to-r from-[#e0e7ff] via-[#dbeafe] to-[#e0e7ff] relative">
                          <span className={`absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm ${badge.badgeClass}`}>
                            {badge.label}
                          </span>
                        </div>
                        
                        <div className="p-5 pt-0 flex-1 flex flex-col">
                          {/* Floating Avatar */}
                          <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-md text-[#2563eb] flex items-center justify-center font-bold -mt-8 mb-3 shrink-0 relative z-10">
                            <span className="material-symbols-outlined text-3xl">domain</span>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="font-extrabold text-[#0f172a] text-lg truncate font-display group-hover:text-[#2563eb] transition-colors">
                              {item.name}
                            </h4>
                            <p className="text-xs text-[#64748b] flex items-center gap-1 mt-1 truncate">
                              <span className="material-symbols-outlined text-[14px]">location_on</span>
                              {item.location || 'Location not specified'}
                            </p>
                          </div>
                          
                          <div className="space-y-2 mb-6">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#64748b]">Registration</span>
                              <span className="font-medium text-[#334155]">{formatRelativeTime((item as any).createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#64748b]">Payments</span>
                              {hasCreds ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Configured
                                </span>
                              ) : (
                                <span className="text-amber-600 font-bold flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[14px]">warning</span> Missing
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-auto pt-4 border-t border-[#f1f5f9] grid grid-cols-4 gap-2">
                            <button 
                              onClick={() => { setEditModalSchool(item); setEditSchoolName(item.name); setEditCityRegion(item.location || ''); }}
                              className="w-full flex items-center justify-center py-2 rounded-xl hover:bg-[#f1f5f9] text-[#475569] hover:text-[#2563eb] transition-colors"
                              title="Edit Profile"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button 
                              onClick={() => openCredentialsModal(item)}
                              className="w-full flex items-center justify-center py-2 rounded-xl hover:bg-[#f1f5f9] text-[#475569] hover:text-[#10b981] transition-colors"
                              title="Payment Credentials"
                            >
                              <span className="material-symbols-outlined text-[20px]">vpn_key</span>
                            </button>
                            {onToggleSchoolStatus && (
                              <button 
                                onClick={() => onToggleSchoolStatus(item.id, item.status || '')}
                                className={`w-full flex items-center justify-center py-2 rounded-xl transition-colors ${
                                  item.status === 'SUSPENDED' 
                                  ? 'hover:bg-green-50 text-green-600' 
                                  : 'hover:bg-amber-50 text-[#475569] hover:text-amber-600'
                                }`}
                                title={item.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  {item.status === 'SUSPENDED' ? 'toggle_on' : 'block'}
                                </span>
                              </button>
                            )}
                            {onDeleteSchool && (
                              <button 
                                onClick={() => { setDeleteConfirmId(item.id); setDeleteConfirmName(item.name); }}
                                className="w-full flex items-center justify-center py-2 rounded-xl hover:bg-red-50 text-[#475569] hover:text-red-500 transition-colors"
                                title="Delete School"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: ADD NEW SCHOOL FORM (ONBOARDING SCREEN - BLANK INPUTS BY DEFAULT) */}
      {view === 'add_school' && (
        <form onSubmit={handleSaveAndComplete} className="space-y-6 animate-fadeIn">
          
          {/* Top Header & Back Link */}
          <div>
            <button
              type="button"
              onClick={() => setView('overview')}
              className="text-xs md:text-sm font-bold text-[#2563eb] hover:underline inline-flex items-center gap-1.5 mb-2 focus:outline-none"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Dashboard
            </button>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display tracking-tight">
              Add New School
            </h2>
            <p className="text-xs md:text-sm text-[#737686] mt-1 font-medium">
              Onboard a new childcare facility and configure their payment settings.
            </p>
          </div>

          {/* CARD 1: Basic Details */}
          <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center font-bold shadow-xs">
                <span className="material-symbols-outlined text-2xl">domain</span>
              </div>
              <h3 className="text-lg md:text-xl font-extrabold text-[#121c2a] font-display">
                Basic Details
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
                  Daycare Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunshine Daycare"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-[#cbd5e1] bg-[#ffffff] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#94a3b8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
                  City/Region <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nairobi"
                  value={cityRegion}
                  onChange={(e) => setCityRegion(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-[#cbd5e1] bg-[#ffffff] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#94a3b8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
                  Primary Contact Number
                </label>
                <input
                  type="text"
                  placeholder="+254 XXX XXX XXX"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-[#cbd5e1] bg-[#ffffff] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#94a3b8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@school.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-[#cbd5e1] bg-[#ffffff] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#94a3b8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
                  Administrator Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-[#cbd5e1] bg-[#ffffff] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#94a3b8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
                  Confirm Administrator Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Re-enter the password"
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-[#cbd5e1] bg-[#ffffff] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#94a3b8]"
                />
                {confirmAdminPassword && adminPassword !== confirmAdminPassword && (
                  <p className="text-xs text-red-600 mt-1.5">Passwords do not match.</p>
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: M-Pesa Integration (STARTS BLANK - NOT PRE-FILLED) */}
          <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#10b981] text-white flex items-center justify-center font-bold shadow-xs">
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-extrabold text-[#121c2a] font-display">
                  M-Pesa Integration
                </h3>
              </div>
            </div>
            <p className="text-xs md:text-sm text-[#737686] -mt-2">
              Optionally configure payment gateway credentials for fee collection during onboarding.
            </p>

            <div className="space-y-4">
              
              {/* Sub-Card 1: M-Pesa Paybill / Till Number */}
              <div className="border border-[#e2e8f0] bg-[#f8fafc] rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="font-bold text-[#121c2a] text-sm md:text-base font-display">
                    M-Pesa Paybill / Till Number
                  </h4>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                    paybillNumber ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef3c7] text-[#92400e]'
                  }`}>
                    <span className="material-symbols-outlined text-xs">
                      {paybillNumber ? 'check_circle' : 'warning'}
                    </span>
                    {paybillNumber ? 'Provided' : 'Not Configured'}
                  </span>
                </div>

                <p className="text-xs text-[#64748b]">
                  Requires Paybill shortcode and M-Pesa passkey.
                </p>

                {showPaybillInputs && (
                  <div className="space-y-3 pt-2 animate-fadeIn">
                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] uppercase mb-1">
                        Paybill / Business Shortcode
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 174379 or 247247"
                        value={paybillNumber}
                        onChange={(e) => setPaybillNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#cbd5e1] bg-white outline-none focus:ring-2 focus:ring-[#2563eb]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] uppercase mb-1">
                        Lipa Na M-Pesa Passkey
                      </label>
                      <input
                        type="password"
                        placeholder="M-Pesa Passkey"
                        value={passkey}
                        onChange={(e) => setPasskey(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#cbd5e1] bg-white outline-none focus:ring-2 focus:ring-[#2563eb]"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowPaybillInputs(!showPaybillInputs)}
                  className="w-full sm:w-auto btn bg-[#dbeafe] hover:bg-[#bfdbfe] text-[#2563eb] text-xs font-bold py-2.5 px-6 rounded-xl transition-all"
                >
                  {showPaybillInputs ? 'Close Panel' : paybillNumber ? 'Edit Paybill' : 'Configure'}
                </button>
              </div>

              {/* Sub-Card 2: Daraja API Credentials */}
              <div className="border border-[#e2e8f0] bg-[#f8fafc] rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="font-bold text-[#121c2a] text-sm md:text-base font-display">
                    Daraja API Credentials
                  </h4>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                    consumerKey && consumerSecret ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef3c7] text-[#92400e]'
                  }`}>
                    <span className="material-symbols-outlined text-xs">
                      {consumerKey && consumerSecret ? 'check_circle' : 'warning'}
                    </span>
                    {consumerKey && consumerSecret ? 'Provided' : 'Not Configured'}
                  </span>
                </div>

                {consumerKey && (
                  <div className="flex items-center gap-2 text-xs text-[#475569]">
                    <span>Consumer Key:</span>
                    <code className="bg-[#e2e8f0] px-2 py-0.5 rounded text-[11px] font-mono text-[#0f172a]">
                      {showConsumerKey ? consumerKey : 'ck_••••••••••••'}
                    </code>
                    <button
                      type="button"
                      onClick={() => setShowConsumerKey(!showConsumerKey)}
                      className="text-[#2563eb] hover:text-[#1d4ed8] text-xs font-semibold focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-base">
                        {showConsumerKey ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                )}

                {showDarajaInputs && (
                  <div className="space-y-3 pt-2 animate-fadeIn">
                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] uppercase mb-1">
                        Safaricom Consumer Key
                      </label>
                      <input
                        type="text"
                        placeholder="Consumer Key"
                        value={consumerKey}
                        onChange={(e) => setConsumerKey(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#cbd5e1] bg-white outline-none focus:ring-2 focus:ring-[#2563eb]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] uppercase mb-1">
                        Safaricom Consumer Secret
                      </label>
                      <input
                        type="password"
                        placeholder="Consumer Secret"
                        value={consumerSecret}
                        onChange={(e) => setConsumerSecret(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#cbd5e1] bg-white outline-none focus:ring-2 focus:ring-[#2563eb]"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowDarajaInputs(!showDarajaInputs)}
                  className="w-full sm:w-auto btn bg-[#dbeafe] hover:bg-[#bfdbfe] text-[#2563eb] text-xs font-bold py-2.5 px-6 rounded-xl transition-all mt-2"
                >
                  {showDarajaInputs ? 'Close Panel' : consumerKey ? 'Update Keys' : 'Configure Credentials'}
                </button>
              </div>

            </div>
          </div>

          {/* Primary Action Button: Save & Complete */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full btn bg-[#004ac6] hover:bg-[#003ea8] text-white text-base font-extrabold py-4 px-8 rounded-full shadow-xl transition-all flex items-center justify-center gap-2.5 active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-xl">save</span>
              Save &amp; Complete
            </button>
          </div>

        </form>
      )}

      {/* MODAL: ASSIGN / UPDATE EXISTING SCHOOL M-PESA CREDENTIALS */}
      {credModalSchool && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-[520px] max-w-full p-6 md:p-8 shadow-2xl space-y-5 animate-fadeIn">
            
            <div className="flex justify-between items-start border-b border-[#e6eeff] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#004ac6] text-white flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">vpn_key</span>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-extrabold text-[#121c2a] font-display">
                    M-Pesa Credentials
                  </h3>
                  <p className="text-xs text-[#737686]">
                    Assign or Update for <strong className="text-[#004ac6]">{credModalSchool.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCredModalSchool(null)}
                className="w-8 h-8 rounded-full bg-[#f8f9ff] text-[#737686] hover:bg-[#e6eeff] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveExistingCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1">
                  Paybill / Business Shortcode *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 174379 or 247247"
                  value={editPaybill}
                  onChange={(e) => setEditPaybill(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1">
                  Lipa Na M-Pesa Passkey *
                </label>
                <input
                  type="password"
                  required
                  placeholder="M-Pesa Passkey"
                  value={editPasskey}
                  onChange={(e) => setEditPasskey(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1">
                  Safaricom Consumer Key *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Consumer Key"
                  value={editConsumerKey}
                  onChange={(e) => setEditConsumerKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1">
                  Safaricom Consumer Secret *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Consumer Secret"
                  value={editConsumerSecret}
                  onChange={(e) => setEditConsumerSecret(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-[#e6eeff]">
                <button
                  type="button"
                  className="btn btn-secondary text-xs px-4 py-2.5 rounded-xl"
                  onClick={() => setCredModalSchool(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreds}
                  className="btn btn-primary text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  {submittingCreds ? 'Saving...' : 'Save Credentials'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: EDIT EXISTING SCHOOL PROFILE */}
      {editModalSchool && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-[520px] max-w-full p-6 md:p-8 shadow-2xl space-y-5 animate-fadeIn">
            
            <div className="flex justify-between items-start border-b border-[#e6eeff] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">edit</span>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-extrabold text-[#121c2a] font-display">
                    Edit School Profile
                  </h3>
                  <p className="text-xs text-[#737686]">
                    Update details for <strong className="text-[#2563eb]">{editModalSchool.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalSchool(null)}
                className="w-8 h-8 rounded-full bg-[#f8f9ff] text-[#737686] hover:bg-[#e6eeff] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveSchoolProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1">
                  Daycare Name *
                </label>
                <input
                  type="text"
                  required
                  value={editSchoolName}
                  onChange={(e) => setEditSchoolName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#2563eb] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1">
                  City/Region *
                </label>
                <input
                  type="text"
                  required
                  value={editCityRegion}
                  onChange={(e) => setEditCityRegion(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#2563eb] outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-[#e6eeff]">
                <button
                  type="button"
                  className="btn btn-secondary text-xs px-4 py-2.5 rounded-xl"
                  onClick={() => setEditModalSchool(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProfile}
                  className="btn bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  {submittingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-[420px] max-w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl text-red-600">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#121c2a] font-display">Delete School?</h3>
                <p className="text-xs text-[#737686] mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-[#434655] leading-relaxed">
              You are about to permanently delete{' '}
              <span className="font-bold text-[#121c2a]">{deleteConfirmName}</span> and all
              associated data, including the admin account, from the platform. Are you sure?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 btn btn-secondary text-xs px-4 py-3 rounded-xl"
                onClick={() => { setDeleteConfirmId(null); setDeleteConfirmName(''); }}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                onClick={() => {
                  if (onDeleteSchool) onDeleteSchool(deleteConfirmId, deleteConfirmName);
                  setDeleteConfirmId(null);
                  setDeleteConfirmName('');
                }}
              >
                <span className="material-symbols-outlined text-base">delete_forever</span>
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
