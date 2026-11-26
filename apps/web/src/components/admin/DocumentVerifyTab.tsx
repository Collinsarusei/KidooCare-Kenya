import React, { useState } from 'react';
import { SchoolDocumentDto } from '@daycare/shared-types';
import { openDocument, formatFileSize, isBrokenLegacyUrl } from '../common/openDocument';

interface DocumentVerifyTabProps {
  adminDocuments: SchoolDocumentDto[];
  onVerifyDocument: (docId: string, verified: boolean) => void;
}

export const DocumentVerifyTab: React.FC<DocumentVerifyTabProps> = ({ adminDocuments, onVerifyDocument }) => {
  const [filter, setFilter] = useState<'PENDING' | 'VERIFIED' | 'ALL'>('PENDING');

  const pending = adminDocuments.filter((d) => !d.verifiedAt);
  const shown =
    filter === 'PENDING' ? pending : filter === 'VERIFIED' ? adminDocuments.filter((d) => d.verifiedAt) : adminDocuments;

  return (
    <div className="bg-white border border-[#dcf0f8] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#dcf0f8] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#0b6e99] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0b6e99]">verified</span>
            Verification Queue ({pending.length} pending)
          </h3>
          <p className="text-xs text-[#737686]">Open each document, review it, then approve or revoke.</p>
        </div>
        <div className="flex gap-1 bg-[#f3fafd] border border-[#dcf0f8] rounded-full p-1 text-xs font-bold">
          {(['PENDING', 'VERIFIED', 'ALL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full ${filter === f ? 'bg-[#0b6e99] text-white' : 'text-[#434655]'}`}
            >
              {f === 'PENDING' ? 'Pending' : f === 'VERIFIED' ? 'Verified' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-10 bg-[#f3fafd] rounded-2xl border border-dashed border-[#c3c6d7] space-y-2">
          <span className="material-symbols-outlined text-4xl text-[#737686]">task_alt</span>
          <p className="text-sm font-semibold text-[#0b2a3c]">Nothing here</p>
          <p className="text-xs text-[#737686]">
            {filter === 'PENDING' ? 'All submitted documents have been reviewed.' : 'No documents match this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((doc: any) => {
            const broken = isBrokenLegacyUrl(doc.fileUrl);
            return (
              <div
                key={doc.id}
                className="border border-[#dcf0f8] bg-[#f3fafd] rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#a9d6ea] transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#dcf0f8] text-[#0b6e99] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-xl">description</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#0b6e99] text-sm font-display">{doc.school?.name}</h4>
                    <p className="text-xs text-[#0b2a3c] font-semibold mt-0.5">
                      {doc.title || doc.type}{' '}
                      <span className="text-[10px] font-bold text-[#009c84] uppercase ml-1">{doc.type}</span>
                    </p>
                    <p className="text-[11px] text-[#737686] mt-0.5 truncate">
                      Uploaded {new Date(doc.uploadedAt).toLocaleString()}
                      {doc.fileSize ? ` • ${formatFileSize(doc.fileSize)}` : ''}
                      {doc.fileName ? ` • ${doc.fileName}` : ''}
                    </p>
                    {broken && (
                      <p className="text-[11px] text-[#ba1a1a] font-semibold mt-0.5">
                        File missing (uploaded before storage fix) — ask the school to re-upload.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs shrink-0">
                  <button
                    disabled={broken}
                    onClick={() => openDocument(doc.fileUrl)}
                    className="btn btn-secondary text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                    View
                  </button>
                  {doc.verifiedAt ? (
                    <button
                      className="btn btn-secondary text-xs py-1.5 px-3 rounded-xl border-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffdad6]"
                      onClick={() => onVerifyDocument(doc.id, false)}
                    >
                      Revoke
                    </button>
                  ) : (
                    <button
                      className="btn btn-success text-xs py-1.5 px-4 rounded-xl shadow-xs flex items-center gap-1"
                      onClick={() => onVerifyDocument(doc.id, true)}
                    >
                      <span className="material-symbols-outlined text-base">verified</span>
                      Approve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
