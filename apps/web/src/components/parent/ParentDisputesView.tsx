import React from 'react';
import { DisputeDto } from '@daycare/shared-types';

interface ParentDisputesViewProps {
  parentDisputes: DisputeDto[];
}

export const ParentDisputesView: React.FC<ParentDisputesViewProps> = ({ parentDisputes }) => {
  return (
    <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-[#e6eeff] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#004ac6] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">flag</span>
            My Raised Payment Disputes ({parentDisputes.length})
          </h3>
          <p className="text-xs text-[#737686]">Track support tickets & M-Pesa refund status</p>
        </div>
        <span className="badge badge-blue">
          <span className="material-symbols-outlined text-xs">support_agent</span>
          Parent Disputes
        </span>
      </div>

      {parentDisputes.length === 0 ? (
        <div className="text-center py-10 bg-[#f8f9ff] rounded-2xl border border-dashed border-[#c3c6d7] space-y-2">
          <span className="material-symbols-outlined text-4xl text-[#737686]">verified</span>
          <p className="text-sm font-semibold text-[#121c2a]">No Payment Disputes Raised Yet</p>
          <p className="text-xs text-[#737686]">
            You can flag payment issues directly from your Financial Ledger tab.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {parentDisputes.map((d) => (
            <div 
              key={d.id} 
              className="border border-[#e6eeff] bg-[#f8f9ff] rounded-2xl p-5 hover:border-[#b4c5ff] transition-all space-y-3"
            >
              <div className="flex justify-between items-center text-xs">
                <span className={`badge ${d.status === 'OPEN' ? 'badge-orange' : 'badge-green'}`}>
                  Status: {d.status}
                </span>
                <span className="text-[#737686]">
                  Raised on: {new Date(d.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-[#121c2a] font-semibold">
                Reason: <span className="font-normal italic text-[#434655]">"{d.reason}"</span>
              </p>

              {d.resolutionNote && (
                <div className="bg-[#e6f7ef] border border-[#6cf8bb] p-3 rounded-xl text-xs text-[#00714d] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">task_alt</span>
                  <span><strong>Admin Resolution:</strong> {d.resolutionNote}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

