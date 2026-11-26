import React, { useState } from 'react';
import { EnrollmentDto } from '@daycare/shared-types';

interface SchoolRosterTabProps {
  schoolRoster: EnrollmentDto[];
  onPromoteWaitlist: (enrollmentId: string) => void;
  onEndEnrollment: (enrollmentId: string) => void;
  onWalkinEnrollmentClick: () => void;
  onApproveAdmission: (enrollmentId: string) => Promise<void> | void;
  onRejectAdmission: (enrollmentId: string, reason: string) => Promise<void> | void;
  onMarkRefundIssued: (enrollmentId: string, note: string) => Promise<void> | void;
}

const kes = (n?: number) => `KES ${Math.round(n || 0).toLocaleString()}`;

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Active', cls: 'badge-green' },
  PENDING_APPROVAL: { label: 'Paid — awaiting your approval', cls: 'badge-orange' },
  PENDING_PAYMENT: { label: 'Awaiting payment', cls: 'badge-blue' },
  WAITLISTED: { label: 'Waitlisted', cls: 'badge-orange' },
  REJECTED: { label: 'Rejected', cls: 'badge-gray' },
  ENDED: { label: 'Ended', cls: 'badge-gray' },
};

export const SchoolRosterTab: React.FC<SchoolRosterTabProps> = ({
  schoolRoster,
  onPromoteWaitlist,
  onEndEnrollment,
  onWalkinEnrollmentClick,
  onApproveAdmission,
  onRejectAdmission,
  onMarkRefundIssued,
}) => {
  const [rejecting, setRejecting] = useState<EnrollmentDto | null>(null);
  const [reason, setReason] = useState('');
  const [refunding, setRefunding] = useState<EnrollmentDto | null>(null);
  const [refundNote, setRefundNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');

  const awaitingApproval = schoolRoster.filter((e) => e.status === 'PENDING_APPROVAL');
  const awaitingPayment = schoolRoster.filter((e) => e.status === 'PENDING_PAYMENT');
  const refundsDue = schoolRoster.filter((e) => e.status === 'REJECTED' && e.refundStatus === 'PENDING');

  const roster = schoolRoster.filter((e) => {
    if (e.status === 'PENDING_APPROVAL' || e.status === 'PENDING_PAYMENT') return false; // shown in the inbox above
    if (filter === 'ACTIVE') return e.status === 'ACTIVE' || e.status === 'WAITLISTED';
    if (filter === 'CLOSED') return e.status === 'ENDED' || e.status === 'REJECTED';
    return true;
  });

  const parentLine = (enr: EnrollmentDto) => {
    const p = enr.child?.parent;
    if (!p) return null;
    return (
      <p className="text-[11px] text-[#737686] mt-0.5">
        Parent: {p.name ? `${p.name} • ` : ''}
        {p.email.endsWith('@kiddocare.local') ? 'walk-in' : p.email}
        {p.phone ? ` • ${p.phone}` : ''}
      </p>
    );
  };

  const submitReject = async () => {
    if (!rejecting || reason.trim().length < 3) return;
    setBusy(true);
    try {
      await onRejectAdmission(rejecting.id, reason.trim());
      setRejecting(null);
      setReason('');
    } finally {
      setBusy(false);
    }
  };

  const submitRefund = async () => {
    if (!refunding) return;
    setBusy(true);
    try {
      await onMarkRefundIssued(refunding.id, refundNote.trim());
      setRefunding(null);
      setRefundNote('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* REJECT MODAL */}
      {rejecting && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-[#121c2a] font-display">Reject {rejecting.child?.name}'s application</h3>
            {(rejecting.totalPaid || 0) > 0 ? (
              <p className="text-xs bg-[#fff7ed] border border-[#fdba74] text-[#9a3412] rounded-xl p-3">
                The parent has paid <strong>{kes(rejecting.totalPaid)}</strong>. They will be told to collect this refund from you.
                Record it under "Refunds to pay" once you have paid it back.
              </p>
            ) : (
              <p className="text-xs text-[#737686]">Nothing has been paid on this application, so no refund is due.</p>
            )}
            <div>
              <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">Reason (sent to the parent) *</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                placeholder="e.g. The program is full for this term / child is outside our age range"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setRejecting(null); setReason(''); }} className="btn btn-secondary text-xs px-4 py-2 rounded-xl">Cancel</button>
              <button
                onClick={submitReject}
                disabled={busy || reason.trim().length < 3}
                className="btn text-xs px-4 py-2 rounded-xl bg-[#ba1a1a] text-white disabled:opacity-50"
              >
                {busy ? 'Rejecting...' : 'Reject & notify parent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {refunding && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-[#121c2a] font-display">Record refund of {kes(refunding.refundAmount)}</h3>
            <p className="text-xs text-[#737686]">Confirm you have paid this back to the parent of {refunding.child?.name}.</p>
            <input
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
              maxLength={300}
              placeholder="Optional note, e.g. M-Pesa code QWE123XYZ / cash at front desk"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setRefunding(null); setRefundNote(''); }} className="btn btn-secondary text-xs px-4 py-2 rounded-xl">Cancel</button>
              <button onClick={submitRefund} disabled={busy} className="btn btn-success text-xs px-4 py-2 rounded-xl disabled:opacity-50">
                {busy ? 'Saving...' : 'Refund paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMISSIONS INBOX */}
      <div className="bg-white border border-[#e6eeff] rounded-3xl p-4 md:p-5 shadow-sm space-y-4">
        <div className="border-b border-[#e6eeff] pb-3">
          <h3 className="text-xl font-bold text-[#004ac6] font-display flex items-center gap-2">
            <span className="material-symbols-outlined">how_to_reg</span>
            Admission Requests ({awaitingApproval.length + awaitingPayment.length})
          </h3>
          <p className="text-xs text-[#737686]">
            Parents apply and pay online. A child joins your roster only after you approve. Rejecting tells the parent to collect their refund.
          </p>
        </div>

        {awaitingApproval.length + awaitingPayment.length === 0 ? (
          <p className="text-xs text-[#737686] bg-[#f8f9ff] border border-dashed border-[#c3c6d7] rounded-2xl p-4 text-center">
            No applications waiting for a decision.
          </p>
        ) : (
          <div className="space-y-3">
            {[...awaitingApproval, ...awaitingPayment].map((enr) => {
              const st = STATUS_STYLE[enr.status];
              const paid = enr.status === 'PENDING_APPROVAL';
              return (
                <div
                  key={enr.id}
                  className={`rounded-2xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    paid ? 'border-[#fdba74] bg-[#fff7ed]' : 'border-[#e6eeff] bg-[#f8f9ff]'
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-[#121c2a] text-sm">{enr.child?.name}</h4>
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                      {enr.admissionApprovedAt && <span className="badge badge-green">Pre-approved</span>}
                    </div>
                    <p className="text-xs text-[#434655] mt-1">
                      {enr.service?.name} • {kes(enr.agreedMonthlyPrice)}/mo • Paid so far: <strong>{kes(enr.totalPaid)}</strong>
                    </p>
                    {enr.child?.dob && (
                      <p className="text-[11px] text-[#737686] mt-0.5">
                        Date of birth: {new Date(enr.child.dob).toLocaleDateString()} • Applied {new Date(enr.createdAt).toLocaleDateString()}
                      </p>
                    )}
                    {parentLine(enr)}
                    {enr.child?.notes && <p className="text-[11px] text-[#434655] mt-1">Notes: {enr.child.notes}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!enr.admissionApprovedAt && (
                      <button onClick={() => onApproveAdmission(enr.id)} className="btn btn-success text-xs py-2 px-4 rounded-xl flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">check</span>
                        {paid ? 'Approve admission' : 'Approve in advance'}
                      </button>
                    )}
                    <button
                      onClick={() => setRejecting(enr)}
                      className="btn btn-secondary text-xs py-2 px-4 rounded-xl border-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffdad6]"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* REFUNDS DUE */}
      {refundsDue.length > 0 && (
        <div className="bg-white border border-[#fdba74] rounded-3xl p-4 md:p-5 shadow-sm space-y-3">
          <h3 className="text-lg font-bold text-[#9a3412] font-display flex items-center gap-2">
            <span className="material-symbols-outlined">currency_exchange</span>
            Refunds to pay ({refundsDue.length})
          </h3>
          {refundsDue.map((enr) => (
            <div key={enr.id} className="rounded-2xl border border-[#fed7aa] bg-[#fff7ed] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm text-[#121c2a]">
                  {enr.child?.name} — {kes(enr.refundAmount)}
                </p>
                <p className="text-xs text-[#434655]">
                  {enr.service?.name} • rejected {enr.rejectedAt ? new Date(enr.rejectedAt).toLocaleDateString() : ''} • {enr.rejectionReason}
                </p>
                {parentLine(enr)}
              </div>
              <button onClick={() => setRefunding(enr)} className="btn btn-success text-xs py-2 px-4 rounded-xl shrink-0">
                Mark refund paid
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ROSTER */}
      <div className="bg-white border border-[#e6eeff] rounded-3xl p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#e6eeff] pb-4">
          <div>
            <h3 className="text-xl font-bold text-[#004ac6] font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004ac6]">groups</span>
              Daycare Roster ({schoolRoster.filter((e) => e.status === 'ACTIVE').length} active)
            </h3>
            <p className="text-xs text-[#737686]">Admitted children, waitlist and history</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-[#f8f9ff] border border-[#e6eeff] rounded-full p-1 text-xs font-bold">
              {(['ALL', 'ACTIVE', 'CLOSED'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full ${filter === f ? 'bg-[#004ac6] text-white' : 'text-[#434655]'}`}>
                  {f === 'ALL' ? 'All' : f === 'ACTIVE' ? 'Current' : 'Ended/Rejected'}
                </button>
              ))}
            </div>
            <button onClick={onWalkinEnrollmentClick} className="btn btn-primary text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-md">
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              Walk-in
            </button>
          </div>
        </div>

        {roster.length === 0 ? (
          <p className="text-xs text-[#737686] text-center py-6">No children in this list.</p>
        ) : (
          <div className="space-y-3">
            {roster.map((enr) => {
              const st = STATUS_STYLE[enr.status] || { label: enr.status, cls: 'badge-gray' };
              return (
                <div
                  key={enr.id}
                  className="border border-[#e6eeff] bg-[#f8f9ff] rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#b4c5ff] transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-lg text-[#004ac6]">child_care</span>
                      <h4 className="font-bold text-[#121c2a] text-sm font-display">{enr.child?.name}</h4>
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                      {enr.status === 'REJECTED' && enr.refundStatus === 'REFUNDED' && <span className="badge badge-green">Refunded</span>}
                    </div>
                    <p className="text-xs text-[#737686] mt-1">
                      Program: <span className="font-semibold text-[#121c2a]">{enr.service?.name}</span> | Start: {new Date(enr.startDate).toLocaleDateString()}
                    </p>
                    {enr.status === 'REJECTED' && enr.rejectionReason && (
                      <p className="text-[11px] text-[#737686] mt-0.5">Reason: {enr.rejectionReason}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="badge badge-green font-bold">{kes(enr.agreedMonthlyPrice)} / mo</span>
                    {enr.status === 'WAITLISTED' && (
                      <>
                        <button className="btn btn-success text-xs py-1.5 px-3 rounded-xl shadow-xs" onClick={() => onPromoteWaitlist(enr.id)}>
                          Promote to Active
                        </button>
                        <button className="btn btn-secondary text-xs py-1.5 px-3 rounded-xl" onClick={() => setRejecting(enr)}>
                          Reject
                        </button>
                      </>
                    )}
                    {enr.status === 'ACTIVE' && (
                      <button className="btn btn-secondary text-xs py-1.5 px-3 rounded-xl" onClick={() => onEndEnrollment(enr.id)}>
                        End Enrollment
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
