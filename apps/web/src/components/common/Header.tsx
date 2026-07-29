import React, { useState } from 'react';
import { UserRole } from '@daycare/shared-types';

interface HeaderProps {
  currentUser: any;
  onLogout: () => void;
  onNavigateHome: () => void;
  onNavigateMarketplace: () => void;
  onOpenAuth: (role?: UserRole, isRegistering?: boolean) => void;
  activeView?: 'landing' | 'marketplace' | 'dashboard' | 'auth';
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onNavigateHome,
  onNavigateMarketplace,
  onOpenAuth,
  activeView = 'landing',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-[#e6eeff] px-4 md:px-8 py-3.5 shadow-sm sticky top-0 z-50 w-full text-left">
      <div className="flex items-center justify-between">
        
        {/* Brand Logo (Left) */}
        <button 
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#004ac6] text-white flex items-center justify-center font-bold shadow-md group-hover:bg-[#003ea8] transition-colors">
            <span className="material-symbols-outlined text-2xl">child_care</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#004ac6] tracking-tight font-display flex items-center gap-1">
              KiddoCare <span className="text-[#006c49]">Kenya</span>
            </h1>
            <p className="text-[11px] text-[#737686] font-medium hidden sm:block">
              Verified Daycares • Lipa Mdogo Mdogo
            </p>
          </div>
        </button>

        {/* Desktop Navigation Links (Center) */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#f8f9ff] px-3 py-1.5 rounded-full border border-[#e6eeff] text-xs font-bold text-[#434655]">
          <button
            onClick={onNavigateHome}
            className={`px-4 py-2 rounded-full transition-all ${
              activeView === 'landing' ? 'bg-[#004ac6] text-white shadow-xs' : 'hover:text-[#004ac6]'
            }`}
          >
            Home
          </button>
          <button
            onClick={onNavigateMarketplace}
            className={`px-4 py-2 rounded-full transition-all ${
              activeView === 'marketplace' ? 'bg-[#004ac6] text-white shadow-xs' : 'hover:text-[#004ac6]'
            }`}
          >
            Browse Daycares
          </button>
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 rounded-full hover:text-[#004ac6] transition-all"
          >
            About KiddoCare
          </button>
          <a
            href="mailto:admin@kiddocare.co.ke"
            className="px-4 py-2 rounded-full hover:text-[#004ac6] transition-all text-[#006c49] no-underline"
          >
            For Daycares
          </a>
        </nav>

        {/* User Status / Action Buttons (Right) */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-bold text-xs text-[#121c2a]">{currentUser.name || currentUser.email}</p>
                <span className={`badge text-[10px] py-0.5 px-2 ${
                  currentUser.role === UserRole.ADMIN 
                    ? 'badge-orange' 
                    : currentUser.role === UserRole.SCHOOL 
                      ? 'badge-blue' 
                      : 'badge-green'
                }`}>
                  {currentUser.role}
                </span>
              </div>
              <button 
                onClick={onLogout}
                className="btn btn-secondary text-xs px-3.5 py-2 rounded-xl hover:bg-[#eff4ff] flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onOpenAuth(UserRole.PARENT, false)}
                className="btn text-xs font-bold text-[#004ac6] hover:bg-[#eff4ff] px-4 py-2.5 rounded-full transition-all"
              >
                Sign In
              </button>
              <button 
                onClick={() => onOpenAuth(UserRole.PARENT, true)}
                className="btn btn-primary text-xs font-bold px-5 py-2.5 rounded-full shadow-md flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                Register
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle (Right - Small Screens) */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden w-10 h-10 rounded-xl bg-[#f8f9ff] border border-[#e6eeff] flex items-center justify-center text-[#121c2a]"
          aria-label="Toggle Navigation Menu"
        >
          <span className="material-symbols-outlined text-2xl">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Slide-down Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-4 pt-4 border-t border-[#e6eeff] space-y-3 pb-2 animate-fadeIn">
          <div className="flex flex-col space-y-1 text-xs font-bold">
            <button
              onClick={() => { onNavigateHome(); setMobileMenuOpen(false); }}
              className="text-left px-4 py-2.5 rounded-xl hover:bg-[#f8f9ff] text-[#121c2a] flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg text-[#004ac6]">home</span>
              Home Page
            </button>
            <button
              onClick={() => { onNavigateMarketplace(); setMobileMenuOpen(false); }}
              className="text-left px-4 py-2.5 rounded-xl hover:bg-[#f8f9ff] text-[#121c2a] flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg text-[#004ac6]">storefront</span>
              Browse Daycares
            </button>
            <a
              href="mailto:admin@kiddocare.co.ke"
              className="text-left px-4 py-2.5 rounded-xl hover:bg-[#f8f9ff] text-[#006c49] flex items-center gap-2 no-underline"
            >
              <span className="material-symbols-outlined text-lg text-[#006c49]">domain_add</span>
              For Daycares — Contact Us
            </a>
          </div>

          {!currentUser && (
            <div className="pt-2 border-t border-[#e6eeff] flex flex-col gap-2">
              <button 
                onClick={() => { onOpenAuth(UserRole.PARENT, false); setMobileMenuOpen(false); }}
                className="w-full btn btn-secondary text-xs py-2.5 rounded-xl justify-center"
              >
                Sign In
              </button>
              <button 
                onClick={() => { onOpenAuth(UserRole.PARENT, true); setMobileMenuOpen(false); }}
                className="w-full btn btn-primary text-xs py-2.5 rounded-xl justify-center shadow-md"
              >
                Register Account
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
