import React, { useEffect, useState } from 'react';
import { SchoolDetailDto } from '@daycare/shared-types';
import { UploadthingUploader } from '../common/UploadthingUploader';

export interface AiProfileDraftInput {
  name: string;
  location?: string;
  details?: string;
  ageRange?: string;
  capacity?: number;
  highlights?: string[];
}

export interface AiProfileDraftResult {
  about: string;
  keyFeatures?: string[];
}

interface SchoolProfileWizardProps {
  mySchool: SchoolDetailDto;
  onUpdateProfile: (data: {
    name?: string;
    about?: string;
    location?: string;
    capacity?: number;
    ageRange?: string;
    keyHighlights?: string[];
    coverImages?: string[];
    logoUrl?: string;
    status?: any;
  }) => Promise<boolean | void>;
  onDraftProfileWithAi: (input: AiProfileDraftInput) => Promise<AiProfileDraftResult | undefined>;
  isGeneratingAi: boolean;
  onCompleteWizard: () => void;
}

const MAX_PHOTOS = 8;
const inputCls =
  'w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#cbd5e1] bg-[#f3fafd] focus:ring-2 focus:ring-[#0b6e99] outline-none';
const labelCls = 'block text-xs font-bold text-[#0b2a3c] uppercase tracking-wider mb-1.5';

export const SchoolProfileWizard: React.FC<SchoolProfileWizardProps> = ({
  mySchool,
  onUpdateProfile,
  onDraftProfileWithAi,
  isGeneratingAi,
  onCompleteWizard,
}) => {
  const isFirstSetup = (mySchool.status as any) === 'PENDING_PROFILE';

  const [name, setName] = useState(mySchool.name || '');
  const [location, setLocation] = useState(mySchool.location || '');
  const [ageRange, setAgeRange] = useState(mySchool.ageRange || '');
  const [capacity, setCapacity] = useState<string>(mySchool.capacity ? String(mySchool.capacity) : '');
  const [highlightsStr, setHighlightsStr] = useState((mySchool.keyHighlights || []).join(', '));
  const [details, setDetails] = useState('');
  const [about, setAbout] = useState(mySchool.about || '');
  const [photos, setPhotos] = useState<string[]>((mySchool.coverImages || []).filter(Boolean));
  const [logoUrl, setLogoUrl] = useState(mySchool.logoUrl || '');
  const [uploadKey, setUploadKey] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the form in sync if the school record is refreshed from the server
  useEffect(() => {
    setPhotos((mySchool.coverImages || []).filter(Boolean));
    setLogoUrl(mySchool.logoUrl || '');
  }, [mySchool.id, mySchool.coverImages?.join('|'), mySchool.logoUrl]);

  const highlights = highlightsStr.split(',').map((h) => h.trim()).filter(Boolean);

  const handleAiDraft = async () => {
    if (!name.trim()) {
      setError('Enter the daycare name first.');
      return;
    }
    if (!details.trim() && !about.trim()) {
      setError('Describe your daycare in the box above so the AI has something to work with.');
      return;
    }
    setError(null);
    const result = await onDraftProfileWithAi({
      name: name.trim(),
      location: location.trim() || undefined,
      details: (details.trim() || about.trim()) || undefined,
      ageRange: ageRange.trim() || undefined,
      capacity: capacity ? Number(capacity) : undefined,
      highlights,
    });
    if (!result?.about) {
      setError('The AI service did not return a description. You can still write it yourself and save.');
      return;
    }
    setAbout(result.about);
    if (!highlights.length && result.keyFeatures?.length) setHighlightsStr(result.keyFeatures.join(', '));
  };

  const addPhoto = (url: string) => {
    setPhotos((prev) => (prev.length >= MAX_PHOTOS ? prev : [...prev, url]));
    setUploadKey((k) => k + 1);
  };
  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  const makeCover = (i: number) => setPhotos((prev) => [prev[i], ...prev.filter((_, idx) => idx !== i)]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Daycare name is required.');
      return;
    }
    if (!about.trim()) {
      setError('Please add a description (write it or generate it with AI).');
      return;
    }
    if (photos.length === 0) {
      setError('Upload at least one photo so parents can see your daycare.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const ok = await onUpdateProfile({
        name: name.trim(),
        about: about.trim(),
        location: location.trim(),
        ageRange: ageRange.trim() || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        keyHighlights: highlights,
        coverImages: photos,
        logoUrl: logoUrl || photos[0],
        status: 'ACTIVE',
      });
      if (ok !== false) onCompleteWizard();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans pb-12 animate-fadeIn">
      <div className="flex justify-between items-center px-1">
        <h1 className="text-xl font-extrabold text-[#0b6e99] font-display flex items-center gap-2">
          <span className="material-symbols-outlined">auto_awesome</span>
          {isFirstSetup ? 'Set up your daycare profile' : 'Edit daycare profile'}
        </h1>
        {!isFirstSetup && (
          <button onClick={onCompleteWizard} className="btn btn-secondary text-xs px-4 py-2 rounded-xl">
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="bg-[#fff7ed] border border-[#fdba74] text-[#c2410c] px-4 py-3 rounded-2xl text-sm font-semibold flex items-start gap-2">
          <span className="material-symbols-outlined text-base mt-0.5">warning</span>
          {error}
        </div>
      )}

      {/* BASIC DETAILS */}
      <div className="bg-white border border-[#dcf0f8] rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-[#0b2a3c] font-display">Basic details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Daycare name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Westlands, Nairobi" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Age range</label>
            <input value={ageRange} onChange={(e) => setAgeRange(e.target.value)} placeholder="e.g. 6 months - 5 years" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Capacity (children)</label>
            <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 40" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Highlights (comma separated)</label>
          <input
            value={highlightsStr}
            onChange={(e) => setHighlightsStr(e.target.value)}
            placeholder="e.g. Hot meals, CCTV, Outdoor play, Certified staff"
            className={inputCls}
          />
        </div>
      </div>

      {/* PHOTOS */}
      <div className="bg-white border border-[#dcf0f8] rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#0b2a3c] font-display">Photos parents will see *</h2>
          <p className="text-xs text-[#737686]">
            The first photo is the cover shown in the marketplace. Up to {MAX_PHOTOS} photos.
          </p>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.map((url, i) => (
              <div key={url + i} className="relative group rounded-2xl overflow-hidden h-28 bg-slate-100 border border-[#dcf0f8]">
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-[#0b6e99] text-white px-2 py-0.5 rounded-full">Cover</span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                  {i !== 0 ? (
                    <button onClick={() => makeCover(i)} className="text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
                      Make cover
                    </button>
                  ) : <span />}
                  <button onClick={() => removePhoto(i)} className="text-[10px] font-bold text-white bg-red-600/80 px-2 py-0.5 rounded-full">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {photos.length < MAX_PHOTOS && (
          <UploadthingUploader
            resetKey={uploadKey}
            onUploadComplete={(url) => addPhoto(url)}
            maxSizeMb={10}
            label="Drag & drop a photo, or"
            sublabel="JPG, PNG or WEBP (Max 10MB) — add one at a time"
          />
        )}

        <div className="pt-2 border-t border-[#dcf0f8] grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-4 items-center">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-[#dcf0f8] flex items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-3xl text-[#94a3b8]">image</span>
            )}
          </div>
          <div>
            <label className={labelCls}>Logo (optional)</label>
            <UploadthingUploader onUploadComplete={(url) => setLogoUrl(url)} maxSizeMb={5} label="Upload logo," sublabel="Square image works best" />
          </div>
        </div>
      </div>

      {/* DESCRIPTION + AI */}
      <div className="bg-white border border-[#dcf0f8] rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-[#0b2a3c] font-display">Description</h2>
        <div>
          <label className={labelCls}>Tell the AI about your daycare</label>
          <textarea
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="e.g. We care for kids 1-5 years, serve 2 hot meals, have certified staff, CCTV and a big outdoor play area. Open 7am-6pm."
            className={inputCls}
          />
          <button
            type="button"
            onClick={handleAiDraft}
            disabled={isGeneratingAi}
            className="mt-2 btn btn-secondary text-xs py-2 px-4 rounded-xl border-[#a9d6ea] text-[#0b6e99] flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">magic_button</span>
            {isGeneratingAi ? 'AI is writing...' : 'Generate description with AI'}
          </button>
        </div>
        <div>
          <label className={labelCls}>Description parents will read *</label>
          <textarea rows={6} value={about} onChange={(e) => setAbout(e.target.value)} className={`${inputCls} leading-relaxed`} />
          <p className="text-[11px] text-[#737686] mt-1">You can edit the AI text before saving.</p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || isGeneratingAi}
        className="btn bg-[#0b6e99] hover:bg-[#085a7e] text-white text-sm font-extrabold py-3.5 px-8 rounded-full shadow-lg w-full flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-lg">save</span>
        {saving ? 'Saving...' : isFirstSetup ? 'Save & publish profile' : 'Save profile'}
      </button>
    </div>
  );
};
