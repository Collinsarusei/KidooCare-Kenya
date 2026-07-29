import React, { useState } from 'react';
import { PublicSchoolListingDto, SchoolReviewSummaryDto, UserRole } from '@daycare/shared-types';
import { EnrollingService } from '../common/EnrollmentModal';

interface MarketplaceViewProps {
  publicSchools: PublicSchoolListingDto[];
  searchKeyword: string;
  setSearchKeyword: (query: string) => void;
  onSearch: (query: string) => void;
  selectedSchool: PublicSchoolListingDto | null;
  setSelectedSchool: (school: PublicSchoolListingDto | null) => void;
  selectedSchoolReviews: SchoolReviewSummaryDto | null;
  currentUser: any;
  onEnrollClick: (service: EnrollingService) => void;
  onSubmitReview: (schoolId: string, rating: number, comment: string) => void;
  submittingReview: boolean;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  publicSchools,
  searchKeyword,
  setSearchKeyword,
  onSearch,
  selectedSchool,
  setSelectedSchool,
  selectedSchoolReviews,
  currentUser,
  onEnrollClick,
  onSubmitReview,
  submittingReview,
}) => {
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const handleReviewFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    onSubmitReview(selectedSchool.id, newRating, newComment);
    setNewComment('');
  };

  const filteredSchools = publicSchools.filter((school) => {
    if (activeFilter === 'verified') return school.verifiedBadge;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Search Header Banner (Screen 03 Hero) */}
      <div className="bg-gradient-to-br from-[#004ac6] via-[#2563eb] to-[#00714d] text-white p-8 md:p-10 rounded-3xl shadow-xl text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-[#6cf8bb]">
            <span className="material-symbols-outlined text-sm">verified</span>
            Kenya Daycare Marketplace Platform
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight leading-tight">
            Find Safe & Verified Daycares Near You
          </h2>
          <p className="text-sm md:text-base text-white/90 font-medium max-w-xl mx-auto">
            Explore trusted daycare centers with flexible weekly payments (<span className="text-[#6cf8bb] font-bold">Lipa Mdogo Mdogo</span>) & M-Pesa automated receipts.
          </p>

          <form 
            onSubmit={(e) => { e.preventDefault(); onSearch(searchKeyword); }} 
            className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto pt-2"
          >
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-[#737686]">
                search
              </span>
              <input
                type="text"
                placeholder="Search daycare name or location (e.g. Westlands, Kilimani, Nairobi)..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border-0 text-sm text-[#121c2a] bg-white shadow-inner focus:ring-2 focus:ring-[#004ac6] outline-none"
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-success px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">travel_explore</span>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6eeff] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#121c2a] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">storefront</span>
            Available Daycare Centers ({filteredSchools.length})
          </h3>
          <p className="text-xs text-[#737686]">Verified licensed centers in Kenya</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#e6eeff]">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeFilter === 'all' ? 'bg-[#004ac6] text-white shadow-sm' : 'text-[#737686] hover:text-[#121c2a]'
            }`}
          >
            All Daycares
          </button>
          <button
            onClick={() => setActiveFilter('verified')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              activeFilter === 'verified' ? 'bg-[#006c49] text-white shadow-sm' : 'text-[#737686] hover:text-[#121c2a]'
            }`}
          >
            <span className="material-symbols-outlined text-xs">verified</span>
            Verified Only
          </button>
        </div>
      </div>

      {/* School Cards Grid (Screen 03) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchools.map((school) => (
          <div
            key={school.id}
            onClick={() => setSelectedSchool(school)}
            className="bg-white rounded-3xl border border-[#e6eeff] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col group"
          >
            <div className="bg-gradient-to-r from-[#eff4ff] to-[#e6eeff] p-5 border-b border-[#e6eeff] flex justify-between items-start">
              <div>
                <h4 className="text-lg font-bold text-[#004ac6] group-hover:text-[#2563eb] transition-colors font-display">
                  {school.name}
                </h4>
                <p className="text-xs text-[#737686] flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm text-[#004ac6]">location_on</span>
                  {school.location || 'Location not specified'}
                </p>
              </div>
              {school.verifiedBadge && (
                <span className="badge badge-green shadow-sm">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Verified
                </span>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-[#434655] line-clamp-2 leading-relaxed">
                {school.about || 'Trusted daycare provider offering early childhood education & intake services.'}
              </p>

              <div className="pt-3 border-t border-[#f8f9ff] flex items-center justify-between text-xs">
                <span className="text-[#737686] font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">school</span>
                  {school.servicesCount} Program(s)
                </span>
                <span className="font-bold text-[#006c49]">
                  From KES {school.startingPrice ? school.startingPrice.toLocaleString() : 'N/A'} / mo
                </span>
              </div>

              <button className="w-full btn btn-secondary text-xs py-2.5 rounded-xl group-hover:bg-[#004ac6] group-hover:text-white transition-all">
                View Programs & Reviews
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* School Profile Detail Modal (Mockup Match) */}
      {selectedSchool && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 md:p-4 animate-fadeIn">
          <div className="bg-[#f8f9ff] w-full md:w-[450px] h-full md:h-[90vh] md:rounded-3xl overflow-y-auto shadow-2xl relative flex flex-col">
            
            {/* Banner Section */}
            <div className="relative h-64 shrink-0 bg-slate-300">
              <img 
                src={selectedSchool.coverImages?.[0] || 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?auto=format&fit=crop&w=800&q=80'} 
                alt={selectedSchool.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <button 
                className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#121c2a] shadow-md hover:bg-white transition-all"
                onClick={() => setSelectedSchool(null)}
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h2 className="text-2xl font-extrabold font-display mb-1">{selectedSchool.name}</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  <span className="flex items-center text-amber-400 gap-1">
                    <span className="material-symbols-outlined text-base fill">star</span>
                    {selectedSchoolReviews ? selectedSchoolReviews.averageRating : '4.9'} ({selectedSchoolReviews ? selectedSchoolReviews.totalReviews : '120'} reviews)
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    {selectedSchool.location || 'Nairobi'}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4 space-y-6 flex-1 pb-24">
              
              {/* About Us */}
              <div className="bg-white p-5 rounded-3xl shadow-sm space-y-4">
                <h3 className="text-lg font-extrabold font-display text-[#121c2a]">About Us</h3>
                <p className="text-sm text-[#434655] leading-relaxed">
                  {selectedSchool.about || `At ${selectedSchool.name}, we provide a nurturing, safe, and stimulating environment for your little ones. Our play-based curriculum is designed to foster creativity, social skills, and early cognitive development. We believe every child deserves a warm, home-like atmosphere where they can explore and grow with confidence.`}
                </p>
                
                {/* Feature Chips */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#f8f9ff] rounded-2xl p-3 flex flex-col items-center justify-center gap-1 text-[#004ac6] border border-[#e6eeff]">
                    <span className="material-symbols-outlined text-2xl">child_care</span>
                    <span className="text-xs font-bold text-[#121c2a]">Ages 1-5</span>
                  </div>
                  <div className="bg-[#f8f9ff] rounded-2xl p-3 flex flex-col items-center justify-center gap-1 text-[#004ac6] border border-[#e6eeff]">
                    <span className="material-symbols-outlined text-2xl">restaurant</span>
                    <span className="text-xs font-bold text-[#121c2a]">Meals Included</span>
                  </div>
                  <div className="bg-[#f8f9ff] rounded-2xl p-3 flex flex-col items-center justify-center gap-1 text-[#004ac6] border border-[#e6eeff]">
                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                    <span className="text-xs font-bold text-[#121c2a]">Certified Staff</span>
                  </div>
                  <div className="bg-[#f8f9ff] rounded-2xl p-3 flex flex-col items-center justify-center gap-1 text-[#004ac6] border border-[#e6eeff]">
                    <span className="material-symbols-outlined text-2xl">park</span>
                    <span className="text-xs font-bold text-[#121c2a]">Outdoor Play</span>
                  </div>
                </div>
              </div>

              {/* Gallery */}
              <div className="space-y-3">
                <h3 className="text-lg font-extrabold font-display text-[#121c2a] px-1">Gallery</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-32 rounded-3xl overflow-hidden bg-slate-200">
                     <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80" alt="Gallery 1" className="w-full h-full object-cover" />
                  </div>
                  <div className="h-32 rounded-3xl overflow-hidden bg-slate-200">
                     <img src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=400&q=80" alt="Gallery 2" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-white p-5 rounded-3xl shadow-sm space-y-3 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold font-display text-[#121c2a]">Reviews</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-light text-[#121c2a]">{selectedSchoolReviews ? selectedSchoolReviews.averageRating : '4.9'}</span>
                    <div className="flex flex-col">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                           <span key={i} className="material-symbols-outlined text-lg fill">star</span>
                        ))}
                      </div>
                      <span className="text-[10px] text-[#737686]">Based on {selectedSchoolReviews ? selectedSchoolReviews.totalReviews : '120'} ratings</span>
                    </div>
                  </div>
                </div>
                <button className="text-sm font-bold text-[#004ac6]">See all</button>
              </div>

              {/* Available Services */}
              <div className="space-y-3">
                <h3 className="text-lg font-extrabold font-display text-[#121c2a] px-1">Available Services</h3>
                {selectedSchool.services.map((svc) => (
                  <div key={svc.id} className="bg-white p-5 rounded-3xl shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-bold text-[#121c2a] font-display">{svc.name}</h4>
                        <p className="text-xs text-[#737686] flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-sm">schedule</span> 8:00 AM - 5:00 PM
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-medium text-[#004ac6]">KES {svc.price.toLocaleString()}</div>
                        <div className="text-[10px] text-[#737686]">/ day</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 text-xs text-[#434655]">
                       <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-[#006c49]">check_circle</span> 2 hot meals & snacks</div>
                       <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-[#006c49]">check_circle</span> Nap time included</div>
                    </div>

                    <button 
                      className="w-full btn bg-[#004ac6] text-white py-3 rounded-full font-bold shadow-md hover:bg-[#003ea8] transition-colors"
                      onClick={() => {
                        if (!currentUser || currentUser.role !== UserRole.PARENT) {
                          alert('Please sign in as a Parent to enroll.');
                          return;
                        }
                        onEnrollClick({
                          serviceId: svc.id,
                          serviceName: svc.name,
                          schoolName: selectedSchool.name,
                          price: svc.price,
                          capacity: svc.capacity,
                          currentCount: svc.currentEnrollmentCount,
                        });
                      }}
                    >
                      Select {svc.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Floating Action */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#f8f9ff] via-[#f8f9ff] to-transparent">
               <div className="bg-white p-4 rounded-3xl border border-[#e6eeff] shadow-lg flex flex-col items-center gap-2">
                 <span className="material-symbols-outlined text-[#004ac6]">chat_bubble</span>
                 <p className="text-sm font-bold text-[#121c2a]">Have questions?</p>
                 <button className="w-full btn bg-white text-[#004ac6] border border-[#b4c5ff] py-2.5 rounded-full font-bold hover:bg-[#eff4ff]">
                   Message Provider
                 </button>
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

