import React, { useState } from 'react';
import { SchoolDetailDto } from '@daycare/shared-types';
import { UploadthingUploader } from '../common/UploadthingUploader';

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
  }) => Promise<void>;
  onDraftProfileWithAi: (prompt: string, location: string) => Promise<string | undefined>;
  isGeneratingAi: boolean;
  onCompleteWizard: () => void;
}

export const SchoolProfileWizard: React.FC<SchoolProfileWizardProps> = ({
  mySchool,
  onUpdateProfile,
  onDraftProfileWithAi,
  isGeneratingAi,
  onCompleteWizard,
}) => {
  const [promptText, setPromptText] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(
    mySchool.coverImages?.[0] || 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?auto=format&fit=crop&w=800&q=80'
  );
  
  const [submitting, setSubmitting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateAndFinish = async () => {
    if (!promptText.trim()) {
       setAiError("Please provide some details in the prompt.");
       return;
    }

    setSubmitting(true);
    setAiError(null);
    try {
      // Simulate sending prompt to AI and getting profile text back
      const aiResponse = await onDraftProfileWithAi(promptText, 'Nairobi'); // Using promptText as the input

      if (!aiResponse) {
        // AI Service Failed! Fallback caught here
        throw new Error("AI Service is currently unreachable or failed to generate the profile.");
      }

      await onUpdateProfile({
        name: mySchool.name || 'AI Generated Daycare',
        about: aiResponse,
        location: 'Nairobi',
        capacity: 50,
        ageRange: '0 - 5 Years',
        keyHighlights: ['AI Generated', 'Certified', 'Meals Included'],
        coverImages: [coverPhoto],
        logoUrl: coverPhoto,
        status: 'ACTIVE',
      });

      onCompleteWizard();
    } catch (e: any) {
      setAiError(e.message || "An unexpected error occurred during AI generation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={onCompleteWizard} 
            className="w-8 h-8 rounded-full bg-[#f8f9ff] text-[#121c2a] flex items-center justify-center font-bold hover:bg-[#e6eeff] transition-all"
          >
            ✕
          </button>
          <h1 className="text-xl font-extrabold text-[#004ac6] font-display flex items-center gap-1">
            KiddoCare <span className="text-[#006c49]">AI Setup</span>
          </h1>
        </div>
      </div>

      <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[#121c2a] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">auto_awesome</span>
            AI Profile Creator
          </h2>
          <p className="text-sm text-[#434655] mt-2 leading-relaxed">
            Provide details about your daycare in plain text, upload a great photo, and let our AI generate a professional profile for you instantly.
          </p>
        </div>

        {/* AI Error Banner */}
        {aiError && (
          <div className="bg-[#fff7ed] border border-[#fdba74] text-[#c2410c] px-4 py-3 rounded-2xl text-sm font-semibold flex items-start gap-2 shadow-sm">
             <span className="material-symbols-outlined text-base mt-0.5">warning</span>
             <div>
               <p>{aiError}</p>
               <p className="text-xs mt-1 font-normal">We captured this error because the AI service is not running or failed. Please try again or use manual setup later.</p>
             </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-2">
              Describe your Daycare
            </label>
            <textarea
              rows={4}
              placeholder="e.g. We are Sunshine Daycare in Westlands. We care for kids 1-5 years old, provide 2 hot meals, and have certified staff and a big outdoor play area..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full p-4 text-sm rounded-2xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-2">
              School Cover Image
            </label>
            <UploadthingUploader
              onUploadComplete={(url) => setCoverPhoto(url)}
              accept="JPG, PNG (Max 5MB)"
              label="Drag & drop your best image"
              sublabel="This will be used for your profile header"
            />
            {coverPhoto && (
              <div className="mt-3 relative h-32 rounded-2xl overflow-hidden shadow-sm">
                <img src={coverPhoto} alt="Cover Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-[#e6eeff]">
          <button 
            onClick={handleGenerateAndFinish} 
            disabled={submitting || isGeneratingAi} 
            className="btn bg-[#004ac6] hover:bg-[#003ea8] text-white text-sm font-extrabold py-3.5 px-8 rounded-full shadow-lg transition-all flex items-center gap-2 w-full justify-center"
          >
            <span className="material-symbols-outlined text-lg">magic_button</span>
            <span>{submitting || isGeneratingAi ? 'AI is working...' : 'Generate Profile & Launch'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

