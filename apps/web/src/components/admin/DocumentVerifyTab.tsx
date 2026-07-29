import React from 'react';
import { SchoolDocumentDto } from '@daycare/shared-types';

interface DocumentVerifyTabProps {
  adminDocuments: SchoolDocumentDto[];
  onVerifyDocument: (docId: string, verified: boolean) => void;
}

export const DocumentVerifyTab: React.FC<DocumentVerifyTabProps> = ({
  adminDocuments,
  onVerifyDocument,
}) => {
  return (
    <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-[#e6eeff] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#004ac6] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">verified</span>
            Submitted Verification Queue ({adminDocuments.length})
          </h3>
          <p className="text-xs text-[#737686]">Review daycare county licenses & caregiver certificates</p>
        </div>
        <span className="badge badge-green">
          <span className="material-symbols-outlined text-xs">gavel</span>
          Admin Verification Queue
        </span>
      </div>

      {adminDocuments.length === 0 ? (
        <div className="text-center py-10 bg-[#f8f9ff] rounded-2xl border border-dashed border-[#c3c6d7] space-y-2">
          <span className="material-symbols-outlined text-4xl text-[#737686]">task_alt</span>
          <p className="text-sm font-semibold text-[#121c2a]">No Pending Verification Submissions</p>
          <p className="text-xs text-[#737686]">All submitted daycare licenses have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {adminDocuments.map((doc: any) => (
            <div 
              key={doc.id} 
              className="border border-[#e6eeff] bg-[#f8f9ff] rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#b4c5ff] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e6eeff] text-[#004ac6] flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-xl">description</span>
                </div>
                <div>
                  <h4 className="font-bold text-[#004ac6] text-sm font-display">{doc.school?.name}</h4>
                  <p className="text-xs text-[#121c2a] font-medium mt-0.5">
                    Doc Type: <span className="font-bold text-[#006c49] uppercase">{doc.type}</span>
                  </p>
                  <p className="text-xs text-[#737686] mt-0.5">
                    Link: <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-[#2563eb] underline font-medium">{doc.fileUrl}</a>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {doc.verifiedAt ? (
                  <button 
                    className="btn btn-secondary text-xs py-1.5 px-3 rounded-xl border-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffdad6]" 
                    onClick={() => onVerifyDocument(doc.id, false)}
                  >
                    Revoke Verification
                  </button>
                ) : (
                  <button 
                    className="btn btn-success text-xs py-1.5 px-4 rounded-xl shadow-xs flex items-center gap-1" 
                    onClick={() => onVerifyDocument(doc.id, true)}
                  >
                    <span className="material-symbols-outlined text-base">verified</span>
                    Approve & Grant Verified Badge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

