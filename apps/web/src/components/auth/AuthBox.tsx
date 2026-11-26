import React, { useState } from 'react';
import { UserRole } from '@daycare/shared-types';

interface AuthBoxProps {
  onSubmitAuth: (data: { emailOrPhone: string; password: string; role: UserRole; isRegistering: boolean; name?: string }) => void;
  loading: boolean;
  initialRole?: UserRole;
  initialRegistering?: boolean;
}

export const AuthBox: React.FC<AuthBoxProps> = ({ 
  onSubmitAuth, 
  loading,
  initialRegistering = false,
}) => {
  const [isRegistering, setIsRegistering] = useState<boolean>(initialRegistering);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [showDaycareInfo, setShowDaycareInfo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Public self-registration always creates a PARENT account
    onSubmitAuth({ emailOrPhone, password, role: UserRole.PARENT, isRegistering, name });
  };

  return (
    <div className="w-full relative py-6">
      {/* Decorative Background Elements from Screen 02 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d3ecf6] rounded-full blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#a9d6ea] rounded-full blur-[120px] opacity-30 pointer-events-none"></div>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left Side: Hero Image & Testimonial (Screen 02 Desktop Left) */}
        <div className="hidden md:flex flex-col justify-center h-full">
          <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-xl group border border-[#c3c6d7]/30">
            <img 
              src="/hero_image.jpg" 
              alt="Kenyan toddler playing at daycare" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b2a3c]/80 via-transparent to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 p-6 w-full">
              <div className="p-5 rounded-2xl shadow-md backdrop-blur-md bg-white/85 border border-white/60 space-y-2">
                <p className="text-sm font-bold text-[#0b2a3c] font-display italic">
                  "KiddoCare made finding a safe daycare for Joy so easy."
                </p>
                <p className="text-xs font-semibold text-[#434655] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#4fe8c9] text-[#00876f] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px]">star</span>
                  </span>
                  Sarah W., Nairobi Parent
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Card (Screen 02 Right) */}
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#d3ecf6] text-[#0b6e99] shadow-sm mb-1">
              <span className="material-symbols-outlined text-4xl">child_care</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0b2a3c] font-display tracking-tight">
              Welcome to <span className="text-[#0b6e99]">KiddoCare</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#434655]">
              Find the perfect, trusted care for your little ones in Kenya.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#c3c6d7] p-6 sm:p-8 space-y-5">
            
            {/* Account Mode Switcher (Sign In vs Register) */}
            <div className="flex bg-[#e8f6fb] p-1 rounded-2xl border border-[#dcf0f8] text-xs font-bold">
              <button
                type="button"
                className={`flex-1 py-2 rounded-xl transition-all ${!isRegistering ? 'bg-white text-[#0b6e99] shadow-xs' : 'text-[#737686]'}`}
                onClick={() => setIsRegistering(false)}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-xl transition-all ${isRegistering ? 'bg-white text-[#0b6e99] shadow-xs' : 'text-[#737686]'}`}
                onClick={() => setIsRegistering(true)}
              >
                Create Account
              </button>
            </div>

            {/* Parent Account Badge — role is always PARENT for public registration */}
            <div className="flex items-center gap-2 bg-[#e1faf4] border border-[#4fe8c9] rounded-xl px-4 py-2.5">
              <span className="material-symbols-outlined text-base text-[#009c84]">family_restroom</span>
              <p className="text-xs font-bold text-[#00876f] flex-1">Parent Account</p>
              <span className="badge badge-green text-[10px]">
                {isRegistering ? 'Registering' : 'Signing In'}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-xs font-bold text-[#0b2a3c] mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737686]">
                      <span className="material-symbols-outlined text-lg">badge</span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Wanjiku"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f3fafd] focus:ring-2 focus:ring-[#0b6e99] outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0b2a3c] mb-1">
                  Email or M-Pesa Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737686]">
                    <span className="material-symbols-outlined text-lg">account_circle</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 0712 345 678 or name@example.com"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f3fafd] focus:ring-2 focus:ring-[#0b6e99] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0b2a3c] mb-1">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737686]">
                    <span className="material-symbols-outlined text-lg">lock</span>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f3fafd] focus:ring-2 focus:ring-[#0b6e99] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#737686] hover:text-[#0b2a3c] transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Continue CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3 px-4 rounded-full font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:bg-[#085a7e] transition-colors"
              >
                <span>{loading ? 'Processing...' : isRegistering ? 'Create Parent Account' : 'Continue'}</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </form>

          </div>

          {/* Daycare Owner Notice */}
          <div
            className="bg-[#fff7ed] border border-[#fdba74] rounded-2xl p-4 cursor-pointer hover:bg-[#fef3c7] transition-colors"
            onClick={() => setShowDaycareInfo(!showDaycareInfo)}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#c2410c]">domain_add</span>
              <p className="text-xs font-bold text-[#c2410c] flex-1">Own or manage a daycare center?</p>
              <span className="material-symbols-outlined text-base text-[#c2410c]">
                {showDaycareInfo ? 'expand_less' : 'expand_more'}
              </span>
            </div>
            {showDaycareInfo && (
              <div className="mt-3 pt-3 border-t border-[#fdba74] space-y-2">
                <p className="text-xs text-[#78350f] leading-relaxed">
                  Daycare accounts are created by our admin team after verification. To get your center listed:
                </p>
                <ul className="text-xs text-[#78350f] space-y-1.5 ml-1">
                  <li className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#c2410c]">mail</span>
                    Email: <strong>admin@kiddocare.co.ke</strong>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#c2410c]">phone</span>
                    WhatsApp: <strong>+254 700 000 000</strong>
                  </li>
                </ul>
                <p className="text-[11px] text-[#78350f]/70">
                  Once approved, you will receive login credentials via email with a temporary password.
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-[#737686] max-w-xs mx-auto">
            By continuing, you agree to KiddoCare's{' '}
            <span className="text-[#0b6e99] font-bold">Terms of Service</span> and{' '}
            <span className="text-[#0b6e99] font-bold">Privacy Policy</span>.
          </p>
        </div>

      </div>
    </div>
  );
};
