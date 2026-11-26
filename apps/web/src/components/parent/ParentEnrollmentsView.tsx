import React from 'react';
import { EnrollmentDto } from '@daycare/shared-types';

interface ParentEnrollmentsViewProps {
  myEnrollments: EnrollmentDto[];
  onEndEnrollment: (id: string) => void;
  onCancelEnrollment?: (id: string) => void;
  onNavigateToMarketplace: () => void;
  onRateSchool?: (schoolId: string) => void;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PENDING_APPROVAL: 'Awaiting school approval',
  ACTIVE: 'Active',
  WAITLISTED: 'Waitlisted',
  REJECTED: 'Not approved',
  ENDED: 'Ended',
};

/** Parent may delete a program that was never paid for and never admitted. */
const canDelete = (enr: EnrollmentDto) =>
  ['PENDING_PAYMENT', 'WAITLISTED', 'REJECTED', 'ENDED'].includes(enr.status) &&
  (enr.totalPaid || 0) === 0 &&
  (!enr.admissionApprovedAt || enr.status === 'REJECTED');

export const ParentEnrollmentsView: React.FC<ParentEnrollmentsViewProps> = ({ 
  myEnrollments, 
  onEndEnrollment,
  onCancelEnrollment, 
  onNavigateToMarketplace,
  onRateSchool,
}) => {
  return (
    <div className="bg-white border border-[#dcf0f8] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-[#dcf0f8] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#0b6e99] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0b6e99]">assignment_turned_in</span>
            My Program Enrollments ({myEnrollments.length})
          </h3>
          <p className="text-xs text-[#737686]">Daycare placements & weekly billing schedules</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="badge badge-green hidden md:inline-flex">
            <span className="material-symbols-outlined text-xs">verified</span>
            Lipa Mdogo Mdogo
          </span>
          <button 
            onClick={onNavigateToMarketplace}
            className="btn btn-primary text-sm px-4 py-2 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Enroll New Child
          </button>
        </div>
      </div>

      {myEnrollments.length === 0 ? (
        <div className="text-center py-10 bg-[#f3fafd] rounded-2xl border border-dashed border-[#c3c6d7] space-y-2">
          <span className="material-symbols-outlined text-4xl text-[#737686]">school</span>
          <p className="text-sm font-semibold text-[#0b2a3c]">No Active Program Enrollments</p>
          <p className="text-xs text-[#737686]">
            Browse available daycare centers on the marketplace to enroll your child.
          </p>
          <div className="pt-2">
            <button onClick={onNavigateToMarketplace} className="btn btn-outline text-sm">
              Go to Marketplace
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {myEnrollments.map((enr) => (
            <div 
              key={enr.id} 
              className="border border-[#dcf0f8] bg-[#f3fafd] rounded-2xl p-5 hover:border-[#a9d6ea] transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#dcf0f8] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#dcf0f8] text-[#0b6e99] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">child_care</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-[#0b6e99] font-display">
                        {enr.child?.name}
                      </h4>
                      <span className={`badge ${
                        enr.status === 'ACTIVE'
                          ? 'badge-green'
                          : enr.status === 'WAITLISTED' || enr.status === 'PENDING_APPROVAL'
                            ? 'badge-orange'
                            : enr.status === 'REJECTED' || enr.status === 'ENDED'
                              ? 'badge-gray'
                              : 'badge-blue'
                      }`}>
                        {STATUS_LABEL[enr.status] || enr.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#0b2a3c] mt-0.5">
                      {enr.service?.name} @ <span className="text-[#0b6e99]">{enr.service?.school?.name}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-bold text-[#737686] uppercase tracking-wider">
                    Agreed Monthly Fee
                  </p>
                  <div className="text-base font-extrabold text-[#009c84]">
                    KES {enr.agreedMonthlyPrice.toLocaleString()} / mo
                  </div>
                  {canDelete(enr) && onCancelEnrollment && (
                    <button
                      onClick={() => onCancelEnrollment(enr.id)}
                      className="mt-2 text-xs font-bold flex items-center justify-end gap-1 ml-auto text-red-500 hover:text-red-700"
                      title="Nothing has been paid and the school has not admitted your child"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Delete program
                    </button>
                  )}
 {(enr.status === 'ACTIVE' || enr.status === 'ENDED') && onRateSchool && enr.service?.schoolId && (
                    <button
                      onClick={() => onRateSchool(enr.service!.schoolId)}
                      className="mt-2 text-xs font-bold flex items-center justify-end gap-1 ml-auto text-[#0b6e99] hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm fill text-amber-400">star</span>
                      Rate this daycare
                    </button>
                  )}
                  {enr.status === 'ACTIVE' && (
                    <button 
                      onClick={() => onEndEnrollment(enr.id)}
                      disabled={enr.status === 'ACTIVE' && ((enr as any).balance?.totalArrears || 0) > 0}
                      title={enr.status === 'ACTIVE' && ((enr as any).balance?.totalArrears || 0) > 0 ? "Clear your arrears to cancel" : ""}
                      className={`mt-2 text-xs font-bold flex items-center justify-end gap-1 ml-auto ${
                        enr.status === 'ACTIVE' && ((enr as any).balance?.totalArrears || 0) > 0
                        ? 'text-[#c3c6d7] cursor-not-allowed'
                        : 'text-red-500 hover:text-red-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      End Enrollment
                    </button>
                  )}
                </div>
              </div>

              {/* Admission status notices */}
              {enr.status === 'PENDING_PAYMENT' && (
                <p className="text-xs bg-white border border-[#dcf0f8] rounded-xl p-3 text-[#434655]">
                  {enr.admissionApprovedAt
                    ? '✓ The school has approved this admission. Pay the first installment in the Financial Ledger to activate it.'
                    : 'Pay the first installment in the Financial Ledger. The school will then review and approve the admission.'}
                </p>
              )}
              {enr.status === 'PENDING_APPROVAL' && (
                <p className="text-xs bg-[#fff7ed] border border-[#fdba74] rounded-xl p-3 text-[#9a3412]">
                  Payment received ({`KES ${(enr.totalPaid || 0).toLocaleString()}`}). Waiting for <strong>{enr.service?.school?.name}</strong> to approve the
                  admission. If they cannot admit your child, you will be notified to collect a refund.
                </p>
              )}
              {enr.status === 'REJECTED' && (
                <div className="text-xs bg-[#fef2f2] border border-[#fecaca] rounded-xl p-3 text-[#991b1b] space-y-1">
                  <p className="font-bold">The school did not approve this admission.</p>
                  {enr.rejectionReason && <p>Reason: {enr.rejectionReason}</p>}
                  {enr.refundStatus === 'PENDING' && (
                    <p className="font-bold">
                      Refund due: KES {(enr.refundAmount || 0).toLocaleString()} — please contact or visit {enr.service?.school?.name} to collect it.
                    </p>
                  )}
                  {enr.refundStatus === 'REFUNDED' && (
                    <p className="text-[#166534] font-bold">
                      ✓ Refund of KES {(enr.refundAmount || 0).toLocaleString()} recorded by the school
                      {enr.refundedAt ? ` on ${new Date(enr.refundedAt).toLocaleDateString()}` : ''}{enr.refundNote ? ` (${enr.refundNote})` : ''}.
                    </p>
                  )}
                </div>
              )}

              {/* Weekly Installments Grid */}
              {enr.status !== 'REJECTED' && enr.billingCycles && enr.billingCycles.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-[#0b6e99] uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    Current Month Weekly Installment Breakdown
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[...enr.billingCycles[0].weeklyInstallments].sort((a, b) => a.weekNumber - b.weekNumber).map((w) => {
                      const isPartial = w.amountPaid > 0 && w.status !== 'PAID';
                      const remaining = Math.max(0, w.amountDue - w.amountPaid);
                      return (
                        <div 
                          key={w.id} 
                          className={`p-3 rounded-xl border text-xs space-y-1 ${
                            w.status === 'PAID' 
                              ? 'bg-[#e1faf4] border-[#4fe8c9]' 
                              : isPartial
                                ? 'bg-[#fefce8] border-[#fde047]'
                                : 'bg-[#fff7ed] border-[#fdba74]'
                          }`}
                        >
                          <div className="flex justify-between items-center font-bold">
                            <span>Week {w.weekNumber}</span>
                            <span className={`badge ${
                              w.status === 'PAID' 
                                ? 'badge-green' 
                                : isPartial 
                                  ? 'badge-orange' 
                                  : 'badge-orange'
                            }`}>
                              {w.status === 'PAID' ? 'PAID' : isPartial ? 'PARTIAL' : w.status}
                            </span>
                          </div>
                          <p className={`font-extrabold ${w.status === 'PAID' ? 'text-[#00876f]' : 'text-[#c2410c]'}`}>
                            KES {w.amountDue.toLocaleString()}
                          </p>
                          {isPartial && (
                            <p className="text-[10px] text-[#00876f] font-semibold">
                              Paid: KES {w.amountPaid.toLocaleString()} (Bal: {remaining.toLocaleString()})
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

