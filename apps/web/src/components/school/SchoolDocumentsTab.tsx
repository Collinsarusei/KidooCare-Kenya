import React, { useState } from 'react';
import { SchoolDocumentDto, SchoolDocumentType } from '@daycare/shared-types';
import { UploadthingUploader, UploadedFileMeta } from '../common/UploadthingUploader';
import { openDocument, formatFileSize, isBrokenLegacyUrl } from '../common/openDocument';

interface SchoolDocumentsTabProps {
  schoolDocuments: SchoolDocumentDto[];
  onUploadDocument: (data: {
    type: SchoolDocumentType;
    fileUrl: string;
    title: string;
    fileName?: string;
    fileSize?: number;
  }) => Promise<void> | void;
  submittingDoc: boolean;
  schoolName?: string;
  verifiedBadge?: boolean;
}

const REQUIRED_DOCS: { title: string; type: SchoolDocumentType }[] = [
  { title: 'Ministry of Education License', type: SchoolDocumentType.LICENSE },
  { title: 'Public Health Certificate', type: SchoolDocumentType.CERTIFICATION },
  { title: 'Fire Safety Certificate', type: SchoolDocumentType.CERTIFICATION },
];
const OTHER = 'Other Document';

const docTitle = (doc: SchoolDocumentDto) =>
  doc.title ||
  (doc.type === SchoolDocumentType.LICENSE
    ? 'Operating License'
    : doc.type === SchoolDocumentType.CERTIFICATION
    ? 'Certification'
    : 'Other Document');

export const SchoolDocumentsTab: React.FC<SchoolDocumentsTabProps> = ({
  schoolDocuments,
  onUploadDocument,
  submittingDoc,
  schoolName,
  verifiedBadge,
}) => {
  const [docType, setDocType] = useState<string>(REQUIRED_DOCS[0].title);
  const [customTitle, setCustomTitle] = useState('');
  const [docFileUrl, setDocFileUrl] = useState('');
  const [fileMeta, setFileMeta] = useState<UploadedFileMeta | undefined>();
  const [resetKey, setResetKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFileUrl) {
      setFormError('Please upload a file first.');
      return;
    }
    const isOther = docType === OTHER;
    if (isOther && !customTitle.trim()) {
      setFormError('Please give this document a name.');
      return;
    }
    setFormError(null);
    const required = REQUIRED_DOCS.find((d) => d.title === docType);
    await onUploadDocument({
      type: required ? required.type : SchoolDocumentType.OTHER,
      title: isOther ? customTitle.trim() : docType,
      fileUrl: docFileUrl,
      fileName: fileMeta?.name,
      fileSize: fileMeta?.size,
    });
    setDocFileUrl('');
    setFileMeta(undefined);
    setCustomTitle('');
    setResetKey((k) => k + 1);
  };

  // Latest upload per required document title decides its status
  const latestByTitle = (title: string) =>
    schoolDocuments
      .filter((d) => docTitle(d) === title)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];

  const approvedRequired = REQUIRED_DOCS.filter((r) => latestByTitle(r.title)?.verifiedAt).length;
  const progressPct = Math.round((approvedRequired / REQUIRED_DOCS.length) * 100);
  const missingRequired = REQUIRED_DOCS.filter((r) => !latestByTitle(r.title));

  return (
    <div className="w-full mx-auto space-y-6 font-sans pb-12 animate-fadeIn">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display tracking-tight">
          Document Verification
        </h2>
        <p className="text-xs md:text-sm text-[#737686] mt-1 font-medium leading-relaxed">
          Upload your licensing and certification documents to complete your school's verification process. A verified badge builds trust with parents.
        </p>
      </div>

      {/* UPLOAD NEW DOCUMENT */}
      <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-7 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#004ac6] text-xl">upload_file</span>
          <h3 className="text-lg md:text-xl font-extrabold text-[#121c2a] font-display">Upload New Document</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider">Document Type</label>
            <div className="flex flex-wrap gap-2">
              {[...REQUIRED_DOCS.map((d) => d.title), OTHER].map((t) => (
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
            {docType === OTHER && (
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Document name, e.g. First Aid Certificate"
                maxLength={120}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white focus:ring-2 focus:ring-[#004ac6] outline-none"
              />
            )}
          </div>

          <UploadthingUploader
            resetKey={resetKey}
            onUploadComplete={(url, meta) => {
              setDocFileUrl(url);
              setFileMeta(meta);
              setFormError(null);
            }}
            maxSizeMb={10}
            label="Drag and drop your file here, or"
            sublabel="Supports PDF, JPG, PNG (Max 10MB)"
            buttonText="browse"
          />

          {formError && <p className="text-xs font-bold text-[#ba1a1a]">{formError}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submittingDoc || !docFileUrl}
              className="w-full sm:w-auto btn bg-[#004ac6] hover:bg-[#003ea8] text-white text-sm font-bold py-3.5 px-8 rounded-full shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submittingDoc ? 'Saving Document...' : 'Submit Document'} &rarr;
            </button>
          </div>
        </form>
      </div>

      {/* UPLOADED DOCUMENTS (live from backend) */}
      <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-7 shadow-sm space-y-4">
        <h3 className="text-lg md:text-xl font-extrabold text-[#121c2a] font-display">
          Uploaded Documents ({schoolDocuments.length})
        </h3>

        {schoolDocuments.length === 0 ? (
          <div className="text-center py-8 bg-[#f8f9ff] rounded-2xl border border-dashed border-[#c3c6d7] space-y-1">
            <span className="material-symbols-outlined text-3xl text-[#737686]">folder_open</span>
            <p className="text-sm font-semibold text-[#121c2a]">No documents uploaded yet</p>
            <p className="text-xs text-[#737686]">Upload your license and certificates above to start verification.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schoolDocuments.map((doc) => {
              const broken = isBrokenLegacyUrl(doc.fileUrl);
              return (
                <div
                  key={doc.id}
                  className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                    broken ? 'border-[#fecaca] bg-[#fff5f5]' : 'border-[#e2e8f0] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        doc.verifiedAt ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#eff4ff] text-[#2563eb]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {doc.verifiedAt ? 'verified' : 'hourglass_empty'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#121c2a] text-sm md:text-base font-display truncate">{docTitle(doc)}</h4>
                      <p className="text-xs text-[#64748b] mt-0.5 truncate">
                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        {doc.fileSize ? ` • ${formatFileSize(doc.fileSize)}` : ''}
                        {doc.fileName ? ` • ${doc.fileName}` : ''}
                      </p>
                      {broken && (
                        <p className="text-xs text-[#b91c1c] mt-0.5 font-semibold">
                          This file was not stored correctly. Please upload it again.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!broken && (
                      <button
                        type="button"
                        onClick={() => openDocument(doc.fileUrl)}
                        className="text-xs font-bold text-[#004ac6] border border-[#c3c6d7] px-3 py-1 rounded-full hover:bg-[#eff4ff]"
                      >
                        View
                      </button>
                    )}
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        doc.verifiedAt ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef3c7] text-[#92400e]'
                      }`}
                    >
                      {doc.verifiedAt ? 'Approved' : 'In Review'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VERIFICATION STATUS (computed) */}
      <div className="bg-[#eff4ff] border border-[#b4c5ff] rounded-3xl p-6 md:p-7 shadow-sm space-y-4">
        <h3 className="text-lg md:text-xl font-extrabold text-[#121c2a] font-display">Verification Status</h3>
        <p className="text-xs text-[#475569] -mt-2">Achieve 'Verified' status to stand out in the marketplace.</p>

        <div className="bg-white border border-[#e6eeff] rounded-2xl p-6 text-center space-y-4 shadow-xs">
          <div
            className={`w-16 h-16 rounded-full border-4 border-white shadow-md mx-auto flex items-center justify-center ${
              verifiedBadge ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef3c7] text-[#b45309]'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">{verifiedBadge ? 'verified' : 'pending'}</span>
          </div>

          <div>
            <h4 className="font-extrabold text-[#121c2a] text-base font-display">{schoolName || 'Your School'}</h4>
            <p
              className={`text-xs font-bold flex items-center justify-center gap-1 mt-0.5 ${
                verifiedBadge ? 'text-[#004ac6]' : 'text-[#b45309]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{verifiedBadge ? 'verified' : 'schedule'}</span>
              {verifiedBadge ? 'Verified Provider' : 'Verification Pending'}
            </p>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="w-full h-2.5 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div className="bg-[#004ac6] h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-xs text-[#64748b] text-left font-bold">
              {approvedRequired} of {REQUIRED_DOCS.length} required documents approved
            </p>
            {missingRequired.length > 0 && (
              <p className="text-xs text-[#b45309] text-left">
                Still needed: {missingRequired.map((m) => m.title).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#121c2a] text-white rounded-3xl p-6 md:p-7 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-2xl">help_outline</span>
          <h3 className="text-lg font-extrabold font-display">Need Help?</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Having trouble uploading your documents or not sure which ones are required? Our support team is here to guide you.
        </p>
        <p className="text-xs text-slate-200">
          Email <strong className="select-all">admin@kiddocare.co.ke</strong> or WhatsApp <strong>+254 700 000 000</strong>
        </p>
      </div>
    </div>
  );
};
