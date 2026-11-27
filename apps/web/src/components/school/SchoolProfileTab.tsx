import React, { useState, useEffect } from 'react';
import { SchoolDetailDto } from '@daycare/shared-types';

interface SchoolProfileTabProps {
  mySchool: SchoolDetailDto | null;
  onUpdateProfile: (name: string, location: string, about: string) => void;
  onDraftAiProfile: (name: string, location: string) => Promise<string | undefined>;
  isGeneratingAi: boolean;
}

export const SchoolProfileTab: React.FC<SchoolProfileTabProps> = ({
  mySchool,
  onUpdateProfile,
  onDraftAiProfile,
  isGeneratingAi,
}) => {
  const [profileName, setProfileName] = useState(mySchool?.name || '');
  const [profileLocation, setProfileLocation] = useState(mySchool?.location || '');
  const [profileAbout, setProfileAbout] = useState(mySchool?.about || '');

  useEffect(() => {
    if (mySchool) {
      setProfileName(mySchool.name || '');
      setProfileLocation(mySchool.location || '');
      setProfileAbout(mySchool.about || '');
    }
  }, [mySchool]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileName, profileLocation, profileAbout);
  };

  const handleAiDraft = async () => {
    const drafted = await onDraftAiProfile(profileName, profileLocation);
    if (drafted) setProfileAbout(drafted);
  };

  return (
    <div className="w-full bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#e6eeff] pb-5 gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-[#004ac6] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">storefront</span>
            Daycare Center Profile & Onboarding
          </h3>
          <p className="text-xs text-[#737686]">Manage public daycare listing details & overview</p>
        </div>
        <button
          type="button"
          disabled={isGeneratingAi}
          onClick={handleAiDraft}
          className="btn btn-secondary text-xs py-2 px-3.5 rounded-xl border-[#b4c5ff] text-[#004ac6] hover:bg-[#e6eeff] flex items-center gap-1.5 shadow-2xs"
        >
          <span className="material-symbols-outlined text-base">auto_awesome</span>
          {isGeneratingAi ? 'Drafting...' : 'AI Auto-Draft'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
            Daycare Center Name *
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-3 text-[#737686] text-xl">
              school
            </span>
            <input
              type="text"
              required
              placeholder="e.g. Sunshine Little Scholars Daycare"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
            Location / Sub-County / City
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-3 text-[#737686] text-xl">
              location_on
            </span>
            <input
              type="text"
              placeholder="e.g. Westlands, Nairobi"
              value={profileLocation}
              onChange={(e) => setProfileLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
            About Daycare & Overview
          </label>
          <textarea
            rows={5}
            placeholder="Describe your caregiving standards, age groups served, operating hours, and meal options (or use AI auto-draft above)..."
            value={profileAbout}
            onChange={(e) => setProfileAbout(e.target.value)}
            className="w-full p-3.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none leading-relaxed"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary text-xs py-2.5 px-6 rounded-xl shadow-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">save</span>
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
};

