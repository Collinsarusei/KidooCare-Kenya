import React, { useState } from 'react';
import { UserRole } from '@daycare/shared-types';

interface HeaderProps {
  currentUser: any;
  onLogout: () => void;
  onNavigateHome: () => void;
  onNavigateAbout: () => void;
  onNavigateMarketplace: () => void;
  onNavigateContact?: (topic?: 'DAYCARE' | 'PARENT') => void;
  onOpenAuth: (role?: UserRole, isRegistering?: boolean) => void;
  activeView?: 'landing' | 'marketplace' | 'dashboard' | 'auth' | 'contact';
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onNavigateHome,
  onNavigateAbout,
  onNavigateMarketplace,
  onNavigateContact,
  onOpenAuth,
  activeView = 'landing',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-[#e4f3f9] border-b border-[#c3e3f1] px-4 md:px-8 py-3.5 shadow-sm sticky top-0 z-50 w-full text-left">
      <div className="accent-bar absolute inset-x-0 bottom-0 h-[3px]" />
      <div className="flex items-center justify-between">
        
        {/* Brand Logo (Left) */}
        <button 
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#0b6e99] text-white flex items-center justify-center font-bold shadow-md group-hover:bg-[#085a7e] transition-colors">
            <span className="material-symbols-outlined text-2xl">child_care</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0b6e99] tracking-tight font-display flex items-center gap-1">
              KiddoCare <span className="text-[#009c84]">Kenya</span>
            </h1>
            <p className="text-[11px] text-[#737686] font-medium hidden sm:block">
              Verified Daycares • Lipa Mdogo Mdogo
            </p>
          </div>
        </button>

        {/* Desktop Navigation Links (Center) */}
        <nav className={`hidden ${currentUser ? 'lg:hidden' : 'lg:flex'} items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-[#c3e3f1] text-xs font-bold text-[#434655]`}>
          <button
            onClick={onNavigateHome}
            className={`px-4 py-2 rounded-full transition-all ${
              activeView === 'landing' ? 'bg-[#0b6e99] text-white shadow-xs' : 'hover:text-[#0b6e99]'
            }`}
          >
            Home
          </button>
          <button
            onClick={onNavigateMarketplace}
            className={`px-4 py-2 rounded-full transition-all ${
              activeView === 'marketplace' ? 'bg-[#0b6e99] text-white shadow-xs' : 'hover:text-[#0b6e99]'
            }`}
          >
            Browse Daycares
          </button>
          <button
            onClick={onNavigateAbout}
            className="px-4 py-2 rounded-full hover:text-[#0b6e99] transition-all"
          >
            About KiddoCare
          </button>
          <button
            onClick={() => (onNavigateContact ? onNavigateContact('DAYCARE') : onNavigateAbout())}
            className="px-4 py-2 rounded-full hover:text-[#0b6e99] transition-all text-[#009c84]"
          >
            For Daycares
          </button>
          {onNavigateContact && (
            <button
              onClick={() => onNavigateContact()}
              className={`px-4 py-2 rounded-full transition-all ${
                activeView === 'contact' ? 'bg-[#0b6e99] text-white shadow-xs' : 'hover:text-[#0b6e99]'
              }`}
            >
              Contact Us
            </button>
          )}
        </nav>

        {/* User Status / Action Buttons (Right) */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-bold text-xs text-[#0b2a3c]">{currentUser.name || currentUser.email}</p>
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
              {onNavigateContact && (
                <button
                  onClick={() => (activeView === 'contact' ? onNavigateHome() : onNavigateContact())}
                  className="btn text-xs px-3.5 py-2 rounded-xl text-[#0b6e99] hover:bg-[#e8f6fb] flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">{activeView === 'contact' ? 'dashboard' : 'support_agent'}</span>
                  {activeView === 'contact' ? 'Dashboard' : 'Help'}
                </button>
              )}
              <button 
                onClick={onLogout}
                className="btn btn-secondary text-xs px-3.5 py-2 rounded-xl hover:bg-[#e8f6fb] flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onOpenAuth(UserRole.PARENT, false)}
                className="btn text-xs font-bold text-[#0b6e99] hover:bg-[#e8f6fb] px-4 py-2.5 rounded-full transition-all"
              >
                Sign In
              </button>
              <button 
                onClick={() => onOpenAuth(UserRole.PARENT, true)}
                className="btn btn-orange text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-1.5"
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
          className="lg:hidden w-10 h-10 rounded-xl bg-[#f3fafd] border border-[#dcf0f8] flex items-center justify-center text-[#0b2a3c]"
          aria-label="Toggle Navigation Menu"
        >
          <span className="material-symbols-outlined text-2xl">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Slide-down Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-4 pt-4 border-t border-[#dcf0f8] space-y-3 pb-2 animate-fadeIn">
          <div className="flex flex-col space-y-1 text-xs font-bold">
            <button
              onClick={() => { onNavigateHome(); setMobileMenuOpen(false); }}
              className="text-left px-4 py-2.5 rounded-xl hover:bg-[#f3fafd] text-[#0b2a3c] flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg text-[#0b6e99]">home</span>
              Home Page
            </button>
            <button
              onClick={() => { onNavigateMarketplace(); setMobileMenuOpen(false); }}
              className="text-left px-4 py-2.5 rounded-xl hover:bg-[#f3fafd] text-[#0b2a3c] flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg text-[#0b6e99]">storefront</span>
              Browse Daycares
            </button>
            {!currentUser && (
              <button
                onClick={() => { onNavigateAbout(); setMobileMenuOpen(false); }}
                className="text-left px-4 py-2.5 rounded-xl hover:bg-[#f3fafd] text-[#0b2a3c] flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg text-[#0b6e99]">info</span>
                About KiddoCare
              </button>
            )}
            {onNavigateContact && (
              <>
                <button
                  onClick={() => { onNavigateContact('DAYCARE'); setMobileMenuOpen(false); }}
                  className="text-left px-4 py-2.5 rounded-xl hover:bg-[#f3fafd] text-[#009c84] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg text-[#009c84]">domain_add</span>
                  For Daycares
                </button>
                <button
                  onClick={() => { onNavigateContact(); setMobileMenuOpen(false); }}
                  className="text-left px-4 py-2.5 rounded-xl hover:bg-[#f3fafd] text-[#0b2a3c] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg text-[#0b6e99]">support_agent</span>
                  Contact Us
                </button>
              </>
            )}
          </div>

          {!currentUser && (
            <div className="pt-2 border-t border-[#dcf0f8] flex flex-col gap-2">
              <button 
                onClick={() => { onOpenAuth(UserRole.PARENT, false); setMobileMenuOpen(false); }}
                className="w-full btn btn-secondary text-xs py-2.5 rounded-xl justify-center"
              >
                Sign In
              </button>
              <button 
                onClick={() => { onOpenAuth(UserRole.PARENT, true); setMobileMenuOpen(false); }}
                className="w-full btn btn-orange text-xs py-2.5 rounded-xl justify-center"
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
