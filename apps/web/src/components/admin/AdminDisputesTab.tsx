import React, { useState } from 'react';
import { DisputeDto, DisputeStatus } from '@daycare/shared-types';

interface AdminDisputesTabProps {
  adminDisputes: DisputeDto[];
  onResolveDispute: (disputeId: string, status: DisputeStatus, resolutionNote: string) => void;
}

export const AdminDisputesTab: React.FC<AdminDisputesTabProps> = ({
  adminDisputes,
  onResolveDispute,
}) => {
  const [resolutionNoteMap, setResolutionNoteMap] = useState<{ [key: string]: string }>({});

  return (
    <div className="bg-white border border-[#dcf0f8] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-[#dcf0f8] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#0b6e99] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0b6e99]">gavel</span>
            Parent Payment Dispute Resolution ({adminDisputes.length})
          </h3>
          <p className="text-xs text-[#737686]">Investigate & resolve M-Pesa transaction disputes</p>
        </div>
        <span className="badge badge-orange">
          <span className="material-symbols-outlined text-xs">warning</span>
          Dispute Queue
        </span>
      </div>

      {adminDisputes.length === 0 ? (
        <div className="text-center py-10 bg-[#f3fafd] rounded-2xl border border-dashed border-[#c3c6d7] space-y-2">
          <span className="material-symbols-outlined text-4xl text-[#737686]">verified</span>
          <p className="text-sm font-semibold text-[#0b2a3c]">No Payment Disputes Raised</p>
          <p className="text-xs text-[#737686]">All parent M-Pesa payments are reconciled clean.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {adminDisputes.map((d: any) => (
            <div 
              key={d.id} 
              className="border border-[#dcf0f8] bg-[#f3fafd] rounded-2xl p-5 hover:border-[#a9d6ea] transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#dcf0f8] pb-3 gap-2">
                <div>
                  <h4 className="text-sm font-bold text-[#0b6e99] font-display flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">receipt_long</span>
                    Dispute ID: {d.id.slice(0, 8)}
                    {d.isEscalatedToAdmin && (
                      <span className="badge badge-orange ml-2 text-[10px] animate-pulse">
                        <span className="material-symbols-outlined text-[10px]">emergency</span>
                        ESCALATED
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-[#737686]">
                    Parent: <span className="font-semibold text-[#0b2a3c]">{d.raisedByParent?.email}</span> ({d.raisedByParent?.phone})
                  </p>
                </div>
                <span className={`badge ${d.status === 'OPEN' ? 'badge-orange' : 'badge-green'}`}>
                  Status: {d.status}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#dcf0f8]">
                <span className="text-[10px] font-bold text-[#737686] uppercase tracking-wider block mb-1">
                  Parent Statement / Dispute Reason
                </span>
                <p className="text-xs text-[#434655] italic">"{d.reason}"</p>
              </div>

              {d.status === 'OPEN' ? (
                <div className="bg-white p-4 rounded-xl border border-[#a9d6ea] space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#0b2a3c] uppercase tracking-wider mb-1">
                      Resolution Note / Action Taken
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verified with Safaricom & issued M-Pesa refund..."
                      value={resolutionNoteMap[d.id] || ''}
                      onChange={(e) => setResolutionNoteMap({ ...resolutionNoteMap, [d.id]: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#c3c6d7] bg-[#f3fafd] focus:ring-2 focus:ring-[#0b6e99] outline-none"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      className="btn btn-success text-xs py-2 px-4 rounded-xl shadow-xs flex items-center gap-1"
                      onClick={() => onResolveDispute(d.id, DisputeStatus.RESOLVED, resolutionNoteMap[d.id] || '')}
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      Mark RESOLVED
                    </button>
                    <button
                      className="btn btn-primary text-xs py-2 px-4 rounded-xl bg-[#c2410c] hover:bg-[#a13308] shadow-xs flex items-center gap-1"
                      onClick={() => onResolveDispute(d.id, DisputeStatus.REFUNDED, resolutionNoteMap[d.id] || '')}
                    >
                      <span className="material-symbols-outlined text-base">currency_exchange</span>
                      Mark REFUNDED
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#e1faf4] p-3 rounded-xl border border-[#4fe8c9] text-xs text-[#00876f] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span><strong>Resolution Note:</strong> {d.resolutionNote || 'Resolved.'}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

