import React from 'react';

interface LandingViewProps {
  onBrowseMarketplace: () => void;
  onOpenLogin: () => void;
  onOpenRegister: (role: 'PARENT' | 'SCHOOL') => void;
  onContact?: (topic: 'DAYCARE' | 'PARENT') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onBrowseMarketplace,
  onOpenLogin,
  onOpenRegister,
  onContact,
}) => {
  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#e8f6fb] via-white to-[#dcf0f8] rounded-3xl border border-[#a9d6ea] p-6 sm:p-12 md:p-16 shadow-lg">
        {/* Decorative background glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#a9d6ea]/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#4fe8c9]/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-10 right-1/3 w-56 h-56 bg-[#ffb36b]/25 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">
          <div className="space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b6e99]/10 text-[#0b6e99] font-bold text-xs border border-[#0b6e99]/20">
              <span className="material-symbols-outlined text-base">verified</span>
              Kenya's #1 Verified Daycare Marketplace
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0b2a3c] tracking-tight font-display leading-tight">
              Trusted Daycare for your Child with <span className="text-[#0b6e99]">Lipa</span>{' '}<span className="text-sunset-gradient">Mdogo Mdogo</span>
            </h1>

            <p className="text-sm sm:text-base text-[#434655] leading-relaxed max-w-xl mx-auto lg:mx-0">
              Connect with county-licensed daycares, track daily learning & attendance, and pay affordable weekly fees via M-Pesa.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={onBrowseMarketplace}
                className="w-full sm:w-auto btn btn-primary py-3.5 px-8 rounded-full shadow-lg text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <span className="material-symbols-outlined text-lg">search</span>
                Browse Daycares Near You
              </button>

              <button
                onClick={() => onOpenRegister('PARENT')}
                className="w-full sm:w-auto btn btn-orange py-3.5 px-6 rounded-full text-sm font-bold hover:scale-[1.02] transition-transform"
              >
                Register as Parent
              </button>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#c3c6d7]/40 max-w-md mx-auto lg:mx-0">
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-[#0b6e99] font-display">100%</p>
                <p className="text-[11px] text-[#737686] font-medium">Verified Licenses</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-[#009c84] font-display">M-Pesa</p>
                <p className="text-[11px] text-[#737686] font-medium">Weekly Installments</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-[#f26b0f] font-display">4.9 ★</p>
                <p className="text-[11px] text-[#737686] font-medium">Parent Rating</p>
              </div>
            </div>
          </div>

          {/* Hero Image with Glass Card (Screen 02 style) */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative aspect-[4/3] sm:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img
                src="/hero_image.jpg"
                alt="Kenyan children smiling at daycare"
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

              {/* Glassmorphic Badge Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-lg space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#ffe2c7] text-[#f26b0f] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-sm">star</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0b2a3c]">"Joy is safe and thriving every day"</p>
                    <p className="text-[11px] text-[#737686]">Sarah W., Parent in Kilimani, Nairobi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="about-kiddocare" className="space-y-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b6e99] font-display">
            About KiddoCare Kenya
          </h2>
          <p className="text-xs sm:text-sm text-[#737686]">
            Designed specifically for Kenyan working families with flexible payment plans and verified safety standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#dcf0f8] p-6 rounded-3xl shadow-sm space-y-3 hover:border-[#a9d6ea] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#dcf0f8] text-[#0b6e99] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>
            <h3 className="text-base font-bold text-[#0b2a3c] font-display">
              County License Verification
            </h3>
            <p className="text-xs text-[#737686] leading-relaxed">
              Every daycare undergoes strict admin document checks for county operating licenses and caregiver certifications before earning a Verified Badge.
            </p>
          </div>

          <div className="bg-white border border-[#dcf0f8] p-6 rounded-3xl shadow-sm space-y-3 hover:border-[#a9d6ea] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#e1faf4] text-[#009c84] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
            <h3 className="text-base font-bold text-[#0b2a3c] font-display">
              Lipa Mdogo Mdogo M-Pesa
            </h3>
            <p className="text-xs text-[#737686] leading-relaxed">
              No need to pay full month fees upfront. Pay weekly installments effortlessly via automated M-Pesa STK push with instant digital receipts.
            </p>
          </div>

          <div className="bg-white border border-[#dcf0f8] p-6 rounded-3xl shadow-sm space-y-3 hover:border-[#a9d6ea] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f6fb] text-[#1188c2] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <h3 className="text-base font-bold text-[#0b2a3c] font-display">
              Smart AI Daycare Intelligence
            </h3>
            <p className="text-xs text-[#737686] leading-relaxed">
              Daycare managers get automated AI profile generators, occupancy predictions, and executive financial health reports powered by advanced AI.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action for Daycare Providers */}
      <section className="bg-gradient-to-br from-[#073b55] via-[#0b6e99] to-[#009c84] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="badge bg-[#ff7a1a] text-white border-0 font-bold text-xs uppercase tracking-wider">
              For Daycare Managers
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
              Own or Manage a Daycare Center in Kenya?
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Reach thousands of parents in your neighborhood, streamline child intake, and automate M-Pesa tuition collection. Contact us to get your center verified and listed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {onContact && (
                <button
                  onClick={() => onContact('DAYCARE')}
                  className="inline-flex items-center justify-center gap-2 btn-orange transition-all font-extrabold text-xs px-5 py-2.5 rounded-full"
                >
                  <span className="material-symbols-outlined text-base">mail</span>
                  Contact us to get listed
                </button>
              )}
              <a
                href="https://wa.me/254700000000"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors text-white font-bold text-xs px-5 py-2.5 rounded-full border border-white/30"
              >
                <span className="material-symbols-outlined text-base">phone</span>
                WhatsApp Us
              </a>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl border border-white/20 p-6 text-center min-w-[200px]">
            <span className="material-symbols-outlined text-5xl text-[#4fe8c9] mb-2 block">domain_add</span>
            <p className="text-sm font-bold">Get Verified</p>
            <p className="text-xs text-white/70 mt-1">Admin onboarding in 24–48 hrs</p>
          </div>
        </div>
      </section>
    </div>
  );
};
