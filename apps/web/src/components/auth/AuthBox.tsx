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
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#dee9fc] rounded-full blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#b4c5ff] rounded-full blur-[120px] opacity-30 pointer-events-none"></div>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left Side: Hero Image & Testimonial (Screen 02 Desktop Left) */}
        <div className="hidden md:flex flex-col justify-center h-full">
          <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-xl group border border-[#c3c6d7]/30">
            <img 
              src="/hero_image.jpg" 
              alt="Kenyan toddler playing at daycare" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121c2a]/80 via-transparent to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 p-6 w-full">
              <div className="p-5 rounded-2xl shadow-md backdrop-blur-md bg-white/85 border border-white/60 space-y-2">
                <p className="text-sm font-bold text-[#121c2a] font-display italic">
                  "KiddoCare made finding a safe daycare for Joy so easy."
                </p>
                <p className="text-xs font-semibold text-[#434655] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#6cf8bb] text-[#00714d] flex items-center justify-center">
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#dee9fc] text-[#004ac6] shadow-sm mb-1">
              <span className="material-symbols-outlined text-4xl">child_care</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display tracking-tight">
              Welcome to <span className="text-[#004ac6]">KiddoCare</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#434655]">
              Find the perfect, trusted care for your little ones in Kenya.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#c3c6d7] p-6 sm:p-8 space-y-5">
            
            {/* Account Mode Switcher (Sign In vs Register) */}
            <div className="flex bg-[#eff4ff] p-1 rounded-2xl border border-[#e6eeff] text-xs font-bold">
              <button
                type="button"
                className={`flex-1 py-2 rounded-xl transition-all ${!isRegistering ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#737686]'}`}
                onClick={() => setIsRegistering(false)}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-xl transition-all ${isRegistering ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#737686]'}`}
                onClick={() => setIsRegistering(true)}
              >
                Create Account
              </button>
            </div>

            {/* Parent Account Badge — role is always PARENT for public registration */}
            <div className="flex items-center gap-2 bg-[#e6f7ef] border border-[#6cf8bb] rounded-xl px-4 py-2.5">
              <span className="material-symbols-outlined text-base text-[#006c49]">family_restroom</span>
              <p className="text-xs font-bold text-[#00714d] flex-1">Parent Account</p>
              <span className="badge badge-green text-[10px]">
                {isRegistering ? 'Registering' : 'Signing In'}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-xs font-bold text-[#121c2a] mb-1">
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
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#121c2a] mb-1">
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121c2a] mb-1">
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
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#737686] hover:text-[#121c2a] transition-colors"
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
                className="w-full btn btn-primary py-3 px-4 rounded-full font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:bg-[#003ea8] transition-colors"
              >
                <span>{loading ? 'Processing...' : isRegistering ? 'Create Parent Account' : 'Continue'}</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </form>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-[#c3c6d7]"></div>
              <span className="flex-shrink-0 mx-3 text-[#737686] text-[10px] font-bold uppercase tracking-wider">
                Or continue with
              </span>
              <div className="flex-grow border-t border-[#c3c6d7]"></div>
            </div>

            {/* Social Auth Option (Google) */}
            <button
              type="button"
              onClick={() => alert('Google authentication simulation: Please enter your email/phone above to test standard login.')}
              className="w-full py-2.5 px-4 bg-white border border-[#c3c6d7] rounded-xl font-bold text-xs text-[#121c2a] hover:bg-[#eff4ff] transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
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
            <a href="#" className="text-[#004ac6] font-bold underline">Terms of Service</a> and{' '}
            <a href="#" className="text-[#004ac6] font-bold underline">Privacy Policy</a>.
          </p>
        </div>

      </div>
    </div>
  );
};
