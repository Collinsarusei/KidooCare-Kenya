import React, { useEffect, useState } from 'react';
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
  onSubmitReview: (schoolId: string, rating: number, comment: string) => Promise<boolean> | void;
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

  const [hoverRating, setHoverRating] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<{
    canReview: boolean;
    reason: string | null;
    myReview: { rating: number; comment: string } | null;
  } | null>(null);

  const isParent = currentUser?.role === UserRole.PARENT;

  const loadReviewStatus = async (schoolId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`/api/reviews/school/${schoolId}/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setReviewStatus(data);
        if (data.myReview) {
          setNewRating(data.myReview.rating);
          setNewComment(data.myReview.comment);
        } else {
          setNewRating(5);
          setNewComment('');
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setReviewStatus(null);
    setShowAllReviews(false);
    if (selectedSchool && isParent) loadReviewStatus(selectedSchool.id);
  }, [selectedSchool?.id, isParent]);

  const handleReviewFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || newComment.trim().length < 3) return;
    const ok = await onSubmitReview(selectedSchool.id, newRating, newComment.trim());
    if (ok !== false) loadReviewStatus(selectedSchool.id);
  };

  const Stars: React.FC<{ value: number; size?: string }> = ({ value, size = 'text-lg' }) => (
    <div className="flex text-amber-400">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`material-symbols-outlined ${size} ${i <= Math.round(value) ? 'fill' : 'text-[#d1d5db]'}`}>
          star
        </span>
      ))}
    </div>
  );

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
            <div className="relative h-32 bg-slate-200">
              <img 
                src={(school as any).coverImages?.[0] || 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?auto=format&fit=crop&w=800&q=80'}
                alt={school.name}
                className="w-full h-full object-cover"
                onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (!img.dataset.fallback) { img.dataset.fallback = '1'; img.src = 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?auto=format&fit=crop&w=800&q=80'; } }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                <h4 className="text-lg font-bold text-white group-hover:text-[#6cf8bb] transition-colors font-display">
                  {school.name}
                </h4>
                <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {school.location || 'Location not specified'}
                </p>
              </div>
              {school.verifiedBadge && (
                <div className="absolute top-3 right-3 badge badge-green shadow-sm">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Verified
                </div>
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

      {/* Daycare Profile Detail Modal (Mockup Match) */}
      {selectedSchool && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 md:p-6 animate-fadeIn">
          {/* Floating Close Button */}
          <button 
            className="fixed top-4 right-4 md:top-8 md:right-8 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#121c2a] shadow-xl hover:bg-white hover:text-red-600 transition-all z-[60]"
            onClick={() => setSelectedSchool(null)}
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          <div className="bg-[#f8f9ff] w-full md:w-[600px] lg:w-[800px] h-full md:h-[90vh] md:rounded-3xl overflow-y-auto shadow-2xl relative flex flex-col">
            
            {/* Banner Section */}
            <div className="relative h-64 shrink-0 bg-slate-300">
              <img 
                src={(selectedSchool as any).coverImages?.[0] || 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?auto=format&fit=crop&w=800&q=80'} 
                alt={selectedSchool.name}
                className="w-full h-full object-cover"
                onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (!img.dataset.fallback) { img.dataset.fallback = '1'; img.src = 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?auto=format&fit=crop&w=800&q=80'; } }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h2 className="text-2xl font-extrabold font-display mb-1">{selectedSchool.name}</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  <span className="flex items-center text-amber-400 gap-1">
                    <span className="material-symbols-outlined text-base fill">star</span>
                    {selectedSchoolReviews?.totalReviews ? `${selectedSchoolReviews.averageRating} (${selectedSchoolReviews.totalReviews} reviews)` : 'No reviews yet'}
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
                
                {/* Feature chips from the school's own profile */}
                {(() => {
                  const sch: any = selectedSchool;
                  const chips: { icon: string; label: string }[] = [
                    ...(sch.ageRange ? [{ icon: 'child_care', label: `Ages ${sch.ageRange}` }] : []),
                    ...(sch.capacity ? [{ icon: 'groups', label: `Up to ${sch.capacity} children` }] : []),
                    ...((sch.keyHighlights || []) as string[]).slice(0, 6).map((h) => ({ icon: 'check_circle', label: h })),
                  ];
                  if (!chips.length) return null;
                  return (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {chips.map((c, i) => (
                        <div key={i} className="bg-[#f8f9ff] rounded-2xl p-3 flex flex-col items-center justify-center gap-1 text-[#004ac6] border border-[#e6eeff] text-center">
                          <span className="material-symbols-outlined text-2xl">{c.icon}</span>
                          <span className="text-xs font-bold text-[#121c2a]">{c.label}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Gallery — photos uploaded by the school */}
              {((selectedSchool as any).coverImages || []).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-extrabold font-display text-[#121c2a] px-1">Gallery</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {((selectedSchool as any).coverImages as string[]).map((url, i) => (
                      <a key={url + i} href={url} target="_blank" rel="noreferrer" className="h-32 rounded-3xl overflow-hidden bg-slate-200 block">
                        <img src={url} alt={`${selectedSchool.name} photo ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews & ratings */}
              <div className="bg-white p-5 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold font-display text-[#121c2a]">Reviews & Ratings</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-light text-[#121c2a]">
                        {selectedSchoolReviews?.totalReviews ? selectedSchoolReviews.averageRating.toFixed(1) : '–'}
                      </span>
                      <div className="flex flex-col">
                        <Stars value={selectedSchoolReviews?.averageRating || 0} />
                        <span className="text-[10px] text-[#737686]">
                          Based on {selectedSchoolReviews?.totalReviews || 0} rating{selectedSchoolReviews?.totalReviews === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {(selectedSchoolReviews?.reviews.length || 0) > 3 && (
                    <button onClick={() => setShowAllReviews((v) => !v)} className="text-sm font-bold text-[#004ac6]">
                      {showAllReviews ? 'Show less' : `See all (${selectedSchoolReviews?.reviews.length})`}
                    </button>
                  )}
                </div>

                {/* Review list */}
                {selectedSchoolReviews && selectedSchoolReviews.reviews.length > 0 ? (
                  <div className="space-y-3">
                    {(showAllReviews ? selectedSchoolReviews.reviews : selectedSchoolReviews.reviews.slice(0, 3)).map((r) => (
                      <div key={r.id} className="border border-[#e6eeff] bg-[#f8f9ff] rounded-2xl p-3 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-[#121c2a]">{r.parentName}</span>
                          <span className="text-[10px] text-[#737686]">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <Stars value={r.rating} size="text-sm" />
                        <p className="text-xs text-[#434655] leading-relaxed">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#737686]">No reviews yet.</p>
                )}

                {/* Write / edit review (parents only) */}
                {!currentUser ? (
                  <p className="text-xs text-[#737686] border-t border-[#e6eeff] pt-3">Sign in as a parent to leave a review.</p>
                ) : isParent && reviewStatus && !reviewStatus.canReview ? (
                  <p className="text-xs text-[#737686] border-t border-[#e6eeff] pt-3 flex items-start gap-1">
                    <span className="material-symbols-outlined text-sm">info</span>
                    {reviewStatus.reason}
                  </p>
                ) : isParent && reviewStatus?.canReview ? (
                  <form onSubmit={handleReviewFormSubmit} className="border-t border-[#e6eeff] pt-4 space-y-3">
                    <h4 className="text-sm font-extrabold text-[#121c2a]">
                      {reviewStatus.myReview ? 'Update your review' : 'Rate this daycare'}
                    </h4>
                    <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setNewRating(i)}
                          onMouseEnter={() => setHoverRating(i)}
                          className="p-0.5"
                          aria-label={`${i} star${i > 1 ? 's' : ''}`}
                        >
                          <span className={`material-symbols-outlined text-3xl ${i <= (hoverRating || newRating) ? 'fill text-amber-400' : 'text-[#d1d5db]'}`}>
                            star
                          </span>
                        </button>
                      ))}
                      <span className="text-xs font-bold text-[#434655] ml-2">
                        {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][hoverRating || newRating]}
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      maxLength={1000}
                      placeholder="How has your child's experience been? Staff, safety, meals, communication..."
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={submittingReview || newComment.trim().length < 3}
                      className="w-full btn bg-[#004ac6] text-white py-2.5 rounded-full font-bold disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting...' : reviewStatus.myReview ? 'Update review' : 'Submit review'}
                    </button>
                  </form>
                ) : null}
              </div>

              {/* Available Services */}
              <div className="space-y-3">
                <h3 className="text-lg font-extrabold font-display text-[#121c2a] px-1">Available Services</h3>
                {selectedSchool.services.map((svc) => (
                  <div key={svc.id} className="bg-white p-5 rounded-3xl shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-bold text-[#121c2a] font-display">{svc.name}</h4>
                        {svc.description && <p className="text-xs text-[#737686] mt-1">{svc.description}</p>}
                        <p className="text-[11px] text-[#737686] mt-1">
                          {Math.max(0, svc.capacity - svc.currentEnrollmentCount)} of {svc.capacity} places available
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-medium text-[#004ac6]">KES {svc.price.toLocaleString()}</div>
                        <div className="text-[10px] text-[#737686]">/ month</div>
                      </div>
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

          </div>
        </div>
      )}
    </div>
  );
};

