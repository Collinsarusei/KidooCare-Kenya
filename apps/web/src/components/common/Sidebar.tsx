import React from 'react';
import { UserRole } from '@daycare/shared-types';

interface SidebarProps {
  currentUser: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts?: {
    children?: number;
    enrollments?: number;
    parentDisputes?: number;
    services?: number;
    roster?: number;
    tutors?: number;
    documents?: number;
    schoolDisputes?: number;
    schools?: number;
    adminDisputes?: number;
  };
  mySchool?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  counts = {},
  mySchool
}) => {
  if (!currentUser) return null;

  const parentLinks = [
    { id: 'marketplace', icon: 'storefront', label: 'Daycare Marketplace' },
    { id: 'children', icon: 'child_care', label: `My Children (${counts.children || 0})` },
    { id: 'enrollments', icon: 'assignment_turned_in', label: `Active Enrollments (${counts.enrollments || 0})` },
    { id: 'ledger', icon: 'payments', label: 'Financial Ledger & Balances' },
    { id: 'disputes', icon: 'flag', label: `My Disputes (${counts.parentDisputes || 0})` },
  ];

  const schoolLinks = [
    { id: 'overview', icon: 'dashboard', label: 'Overview' },
    { id: 'services', icon: 'tune', label: `Services (${counts.services || 0})` },
    { id: 'roster', icon: 'groups', label: `Roster (${counts.roster || 0})` },
    { id: 'tutors', icon: 'co_present', label: `Tutors (${counts.tutors || 0})` },
    { id: 'documents', icon: 'description', label: `Documents (${counts.documents || 0})` },
    { id: 'financials', icon: 'analytics', label: 'Financials' },
    { id: 'disputes', icon: 'gavel', label: `Disputes (${counts.schoolDisputes || 0})` },
    { id: 'profile', icon: 'edit', label: 'Edit Profile' },
  ];

  const adminLinks = [
    { id: 'analytics', icon: 'insights', label: 'Platform Analytics' },
    { id: 'directory', icon: 'domain', label: `Directory (${counts.schools || 0})` },
    { id: 'documents', icon: 'verified', label: `Verification (${counts.documents || 0})` },
    { id: 'disputes', icon: 'gavel', label: `Disputes (${counts.adminDisputes || 0})` },
    { id: 'audit', icon: 'receipt_long', label: `Audit Trail` },
  ];

  const links = currentUser.role === UserRole.PARENT ? parentLinks : currentUser.role === UserRole.SCHOOL ? schoolLinks : currentUser.role === UserRole.ADMIN ? adminLinks : [];

  return (
    <div className="w-full md:w-64 shrink-0 bg-[#ebf0fa] border-r border-[#d3e0fc] flex flex-col pt-6 px-4 pb-8 min-h-[500px]">
      <div className="space-y-2">
        {links.map(link => (
          <button
            key={link.id}
            onClick={() => setActiveTab(link.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === link.id ? 'bg-[#004ac6] text-white shadow-md' : 'text-[#434655] hover:bg-[#d3e0fc] hover:text-[#121c2a]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
            {link.label}
          </button>
        ))}
      </div>
    </div>
  );
};
