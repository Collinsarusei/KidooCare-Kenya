import React, { useState } from 'react';
import { DisputeDto, DisputeStatus } from '@daycare/shared-types';

interface SchoolDisputesTabProps {
  disputes: DisputeDto[];
  onResolveDispute: (disputeId: string, status: DisputeStatus, resolutionNote: string) => Promise<void>;
}

export const SchoolDisputesTab: React.FC<SchoolDisputesTabProps> = ({
  disputes,
  onResolveDispute,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedDispute, setSelectedDispute] = useState<DisputeDto | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionType, setActionType] = useState<DisputeStatus>(DisputeStatus.RESOLVED);
  const [submitting, setSubmitting] = useState(false);

  // Sample disputes matching Image 2 if backend data is empty
  const defaultDisputes: Array<Partial<DisputeDto> & { id: string; code: string; title: string; filedDate: string; parentName: string; schoolName: string }> = [
    {
      id: 'dsp-4092',
      code: '#DSP-4092',
      title: 'Billing Discrepancy',
      filedDate: 'Oct 24, 2023',
      status: DisputeStatus.OPEN,
      reason: 'Parent claims they were charged for 5 days of care but child only attended 3 days due to illness.',
      parentName: 'Grace Wambui',
      schoolName: 'Little Stars Academy',
    },
    {
      id: 'dsp-4105',
      code: '#DSP-4105',
      title: 'Safety Concern',
      filedDate: 'Oct 25, 2023',
      status: DisputeStatus.OPEN,
      reason: 'Minor scrape occurred during playground time. Parent unhappy with communication timeframe from staff.',
      parentName: 'David Ochieng',
      schoolName: 'Sunny Days Creche',
    },
    {
      id: 'dsp-3988',
      code: '#DSP-3988',
      title: 'Cancellation Refund',
      filedDate: 'Oct 20, 2023',
      status: 'REVIEWING' as any,
      reason: 'Awaiting documentation from provider regarding cancellation policy agreement signed by parent.',
      parentName: 'Amina Hassan',
      schoolName: 'Kibera Early Learning',
    },
  ];

  const displayList = disputes.length > 0 ? disputes : (defaultDisputes as any);

  const filteredDisputes = displayList.filter((d: any) => {
    if (filterStatus === 'ALL') return true;
    return d.status === filterStatus;
  });

  const handleOpenResolveModal = (disp: DisputeDto, targetStatus: DisputeStatus) => {
    setSelectedDispute(disp);
    setActionType(targetStatus);
    setResolutionNote('');
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setSubmitting(true);
    try {
      await onResolveDispute(selectedDispute.id, actionType, resolutionNote);
      setSelectedDispute(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full mx-auto space-y-6 font-sans pb-20 animate-fadeIn">

      {/* Page Title & Subtitle (Mockup 2 Match) */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display tracking-tight">
          Dispute Management
        </h2>
        <p className="text-xs text-[#737686] mt-0.5">
          Review and resolve active disputes between parents and providers.
        </p>
      </div>

      {/* Action Filter & Sort Buttons (Mockup 2 Match) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const next = filterStatus === 'ALL' ? 'OPEN' : filterStatus === 'OPEN' ? 'RESOLVED' : 'ALL';
            setFilterStatus(next);
          }}
          className="btn bg-white border border-[#cbd5e1] text-[#121c2a] text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 hover:bg-[#f8f9ff]"
        >
          <span className="material-symbols-outlined text-base">tune</span>
          Filter: {filterStatus}
        </button>
        <button
          type="button"
          className="btn bg-[#eff4ff] text-[#004ac6] text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 hover:bg-[#e6eeff]"
        >
          <span className="material-symbols-outlined text-base">sort</span>
          Sort
        </button>
      </div>

      {/* DISPUTE CARDS LIST (EXACT MATCH FOR MOCKUP 2) */}
      <div className="space-y-4">
        {filteredDisputes.map((disp: any) => {
          const status = disp.status || 'OPEN';
          const code = disp.code || `#DSP-${disp.id.slice(0, 4).toUpperCase()}`;
          const parentName = disp.parentName || disp.raisedByParent?.email || 'Parent User';
          const schoolName = disp.schoolName || disp.payment?.weeklyInstallment?.billingCycle?.enrollment?.service?.school?.name || 'Daycare Facility';
          const filedDate = disp.filedDate || (disp.createdAt ? new Date(disp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 24, 2023');
          const title = disp.title || 'Payment / Billing Dispute';

          // Status Badge Colors
          let badgeStyle = 'bg-[#fef3c7] text-[#92400e]'; // Yellow for OPEN
          if (status === 'REVIEWING') badgeStyle = 'bg-[#e0f2fe] text-[#0369a1]';
          else if (status === 'RESOLVED') badgeStyle = 'bg-[#dcfce7] text-[#166534]';
          else if (status === 'REFUNDED') badgeStyle = 'bg-[#fee2e2] text-[#991b1b]';

          return (
            <div
              key={disp.id}
              className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm space-y-4 hover:border-[#b4c5ff] transition-all"
            >
              {/* Card Header: Status Tag & ID */}
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${badgeStyle}`}>
                  {status}
                </span>
                <span className="text-xs font-bold text-[#737686] tracking-wider font-mono">
                  ID: {code}
                </span>
              </div>

              {/* Title & Filed Date */}
              <div>
                <h3 className="text-xl font-extrabold text-[#121c2a] font-display">
                  {title}
                </h3>
                <p className="text-xs text-[#737686] mt-0.5">
                  Filed on {filedDate}
                </p>
              </div>

              {/* Parent & School Info Box (Mockup 2 Match) */}
              <div className="bg-[#eff4ff] border border-[#e6eeff] rounded-2xl p-4 space-y-2 text-xs text-[#121c2a]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#737686]">person</span>
                  <span>Parent: <strong className="font-bold">{parentName}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#737686]">school</span>
                  <span>School: <strong className="font-bold">{schoolName}</strong></span>
                </div>
              </div>

              {/* Dispute Reason Text */}
              <p className="text-xs text-[#434655] leading-relaxed">
                {disp.reason}
              </p>

              {/* Action Buttons Row (Mockup 2 Match) */}
              <div className="pt-2">
                {status === 'OPEN' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenResolveModal(disp, DisputeStatus.RESOLVED)}
                      className="btn bg-[#004ac6] hover:bg-[#003ea8] text-white text-xs font-extrabold py-3 px-4 rounded-xl shadow-sm text-center"
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenResolveModal(disp, DisputeStatus.REFUNDED)}
                      className="btn bg-[#fee2e2] hover:bg-[#fca5a5] text-[#991b1b] text-xs font-extrabold py-3 px-4 rounded-xl text-center"
                    >
                      Escalate
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenResolveModal(disp, DisputeStatus.RESOLVED)}
                    className="w-full btn bg-[#eff4ff] hover:bg-[#e6eeff] text-[#004ac6] text-xs font-extrabold py-3 px-4 rounded-xl text-center"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* RESOLVE / ESCALATE DISPUTE MODAL */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-[480px] max-w-full p-6 md:p-7 shadow-2xl space-y-5 border border-[#e6eeff] animate-fadeIn">
            <div className="flex justify-between items-center border-b border-[#e6eeff] pb-4">
              <h3 className="text-lg font-extrabold text-[#121c2a] font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004ac6]">gavel</span>
                Resolve Dispute Ticket #{selectedDispute.id.slice(0, 6)}
              </h3>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-[#f8f9ff] text-[#737686] hover:bg-[#e6eeff] flex items-center justify-center font-bold"
                onClick={() => setSelectedDispute(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
                  Resolution Action *
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as DisputeStatus)}
                  className="w-full px-4 py-3 text-xs rounded-xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none font-bold text-[#004ac6]"
                >
                  <option value={DisputeStatus.RESOLVED}>RESOLVED (Close Ticket)</option>
                  <option value={DisputeStatus.REFUNDED}>REFUNDED (Process M-Pesa Refund)</option>
                  <option value={DisputeStatus.OPEN}>KEEP OPEN (Under Investigation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
                  Resolution Note / Official Response *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide resolution details or feedback for parent and provider..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full p-3.5 text-xs rounded-xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  className="btn bg-[#eff4ff] text-[#004ac6] text-xs font-bold py-3 px-5 rounded-full hover:bg-[#e6eeff]"
                  onClick={() => setSelectedDispute(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn bg-[#004ac6] hover:bg-[#003ea8] text-white text-xs font-extrabold py-3 px-6 rounded-full shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  {submitting ? 'Saving...' : 'Submit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
