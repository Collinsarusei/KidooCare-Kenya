import React, { useState } from 'react';
import { SchoolDocumentDto, SchoolDocumentType } from '@daycare/shared-types';
import { UploadthingUploader } from '../common/UploadthingUploader';

interface SchoolDocumentsTabProps {
  schoolDocuments: SchoolDocumentDto[];
  onUploadDocument: (type: SchoolDocumentType, fileUrl: string) => void;
  submittingDoc: boolean;
}

export const SchoolDocumentsTab: React.FC<SchoolDocumentsTabProps> = ({
  schoolDocuments,
  onUploadDocument,
  submittingDoc,
}) => {
  const [docType, setDocType] = useState<string>('Public Health Certificate');
  const [docFileUrl, setDocFileUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetType =
      docType.includes('Education')
        ? SchoolDocumentType.LICENSE
        : docType.includes('Health')
        ? SchoolDocumentType.CERTIFICATION
        : SchoolDocumentType.OTHER;

    onUploadDocument(targetType, docFileUrl || 'https://utfs.io/f/cert-sample.pdf');
    setDocFileUrl('');
  };

  const approvedCount = schoolDocuments.filter((d) => d.verifiedAt).length;

  return (
    <div className="w-full mx-auto space-y-6 font-sans pb-12 animate-fadeIn">
      {/* Title Header (Mockup 1 Match) */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display tracking-tight">
          Document Verification
        </h2>
        <p className="text-xs md:text-sm text-[#737686] mt-1 font-medium leading-relaxed">
          Upload your licensing and certification documents to complete your school's verification process. A verified badge builds trust with parents.
        </p>
      </div>

      {/* CARD 1: UPLOAD NEW DOCUMENT (Uploadthing Integration - Mockup 1 Match) */}
      <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-7 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#004ac6] text-xl">upload_file</span>
          <h3 className="text-lg md:text-xl font-extrabold text-[#121c2a] font-display">
            Upload New Document
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Uploadthing Uploader Component */}
          <UploadthingUploader
            onUploadComplete={(url) => setDocFileUrl(url)}
            accept="PDF, JPG, PNG (Max 5MB)"
            label="Drag and drop your file here, or"
            sublabel="Supports PDF, JPG, PNG (Max 5MB) — Stored via Uploadthing"
            buttonText="browse"
          />

          {/* Document Type Selector Pills (Mockup 1 Match) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider">
              Document Type
            </label>
            <div className="flex flex-wrap gap-2">
              {['Ministry of Education License', 'Public Health Certificate', 'Fire Safety Certificate'].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setDocType(t)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                    docType === t
                      ? 'bg-[#dbeafe] text-[#1d4ed8] border-[#93c5fd] shadow-xs'
                      : 'bg-white text-[#475569] border-[#cbd5e1] hover:bg-[#f8fafc]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button (Mockup 1 Match) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submittingDoc}
              className="w-full sm:w-auto btn bg-[#004ac6] hover:bg-[#003ea8] text-white text-sm font-bold py-3.5 px-8 rounded-full shadow-md transition-all flex items-center justify-center gap-2"
            >
              {submittingDoc ? 'Saving Document...' : 'Submit Document'} &rarr;
            </button>
          </div>
        </form>
      </div>

      {/* CARD 2: UPLOADED DOCUMENTS (Mockup 1 Match) */}
      <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-7 shadow-sm space-y-4">
        <h3 className="text-lg md:text-xl font-extrabold text-[#121c2a] font-display">
          Uploaded Documents
        </h3>

        <div className="space-y-3">
          {/* Ministry of Education License */}
          <div className="border border-[#e2e8f0] bg-[#ffffff] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#dcfce7] text-[#166534] flex items-center justify-center font-bold shrink-0">
                <span className="material-symbols-outlined text-xl">verified</span>
              </div>
              <div>
                <h4 className="font-bold text-[#121c2a] text-sm md:text-base font-display">
                  Ministry of Education License
                </h4>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Uploaded on Oct 12, 2023 • 1.2 MB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-[#dcfce7] text-[#166534] px-3 py-1 rounded-full">
                Approved
              </span>
              <button type="button" className="text-[#64748b] hover:text-[#0f172a] p-1">
                <span className="material-symbols-outlined text-lg">more_vert</span>
              </button>
            </div>
          </div>

          {/* Public Health Certificate */}
          <div className="border border-[#e2e8f0] bg-[#ffffff] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#eff4ff] text-[#2563eb] flex items-center justify-center font-bold shrink-0">
                <span className="material-symbols-outlined text-xl">hourglass_empty</span>
              </div>
              <div>
                <h4 className="font-bold text-[#121c2a] text-sm md:text-base font-display">
                  Public Health Certificate
                </h4>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Uploaded on Oct 24, 2023 • 2.4 MB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-[#fef3c7] text-[#92400e] px-3 py-1 rounded-full">
                In Review
              </span>
              <button type="button" className="text-[#64748b] hover:text-[#0f172a] p-1">
                <span className="material-symbols-outlined text-lg">more_vert</span>
              </button>
            </div>
          </div>

          {/* Expired Document Alert Item (Mockup 1 Match) */}
          <div className="border border-[#fecaca] bg-[#fff5f5] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#fee2e2] text-[#b91c1c] flex items-center justify-center font-bold shrink-0">
                <span className="material-symbols-outlined text-xl">error_outline</span>
              </div>
              <div>
                <h4 className="font-bold text-[#121c2a] text-sm md:text-base font-display">
                  Fire Safety Certificate
                </h4>
                <p className="text-xs text-[#b91c1c] mt-0.5">
                  Document expired. Please upload renewed version.{' '}
                  <button type="button" onClick={() => setDocType('Fire Safety Certificate')} className="font-bold text-[#004ac6] underline">
                    Update
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Dynamically uploaded documents */}
          {schoolDocuments.map((doc) => (
            <div key={doc.id} className="border border-[#e2e8f0] bg-[#ffffff] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#dbeafe] text-[#2563eb] flex items-center justify-center font-bold shrink-0">
                  <span className="material-symbols-outlined text-xl">description</span>
                </div>
                <div>
                  <h4 className="font-bold text-[#121c2a] text-sm font-display uppercase tracking-wider">{doc.type}</h4>
                  <p className="text-xs text-[#64748b] mt-0.5">Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${doc.verifiedAt ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                {doc.verifiedAt ? 'Approved' : 'In Review'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CARD 3: VERIFICATION STATUS PROGRESS (Mockup 1 Match) */}
      <div className="bg-[#eff4ff] border border-[#b4c5ff] rounded-3xl p-6 md:p-7 shadow-sm space-y-4">
        <h3 className="text-lg md:text-xl font-extrabold text-[#121c2a] font-display">
          Verification Status
        </h3>
        <p className="text-xs text-[#475569] -mt-2">
          Achieve 'Verified' status to stand out in the marketplace.
        </p>

        <div className="bg-white border border-[#e6eeff] rounded-2xl p-6 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#dcfce7] border-4 border-white shadow-md mx-auto flex items-center justify-center relative">
            <span className="material-symbols-outlined text-2xl text-[#166534]">verified</span>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#10b981] text-white flex items-center justify-center text-xs">
              ✓
            </div>
          </div>

          <div>
            <h4 className="font-extrabold text-[#121c2a] text-base font-display">Sunshine Daycare</h4>
            <p className="text-xs font-bold text-[#004ac6] flex items-center justify-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-sm">verified</span>
              Verified Provider
            </p>
          </div>

          {/* Progress Bar (2 of 3 documents approved) */}
          <div className="space-y-1.5 pt-2">
            <div className="w-full h-2.5 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div className="bg-[#004ac6] h-full rounded-full transition-all" style={{ width: '66%' }} />
            </div>
            <p className="text-xs text-[#64748b] text-left font-bold">
              2 of 3 documents approved
            </p>
          </div>
        </div>
      </div>

      {/* CARD 4: NEED HELP? (Mockup 1 Match) */}
      <div className="bg-[#121c2a] text-white rounded-3xl p-6 md:p-7 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-2xl">help_outline</span>
          <h3 className="text-lg font-extrabold font-display">Need Help?</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Having trouble uploading your documents or not sure which ones are required? Our support team is here to guide you.
        </p>
        <div className="pt-1">
          <button
            type="button"
            onClick={() => alert('KiddoCare Support: admin@kiddocare.co.ke | +254 700 000 000')}
            className="w-full sm:w-auto btn bg-[#dbeafe] hover:bg-[#bfdbfe] text-[#004ac6] text-xs font-bold py-3 px-6 rounded-xl transition-all"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};
