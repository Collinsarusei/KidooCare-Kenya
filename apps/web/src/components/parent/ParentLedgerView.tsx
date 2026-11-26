import React from 'react';
import { ParentLedgerSummaryDto } from '@daycare/shared-types';
import { StkInstallment } from '../common/StkPushModal';
import { ReceiptData } from '../common/ReceiptModal';

export interface ParentPaymentItem {
  id: string;
  amount: number;
  method: string;
  status: string;
  mpesaReceiptNumber?: string | null;
  mpesaCheckoutRequestId?: string | null;
  paidAt?: string | Date | null;
  createdAt: string | Date;
  weeklyInstallmentId?: string;
  weekNumber?: number;
  childName: string;
  childId?: string;
  schoolName: string;
  schoolId?: string;
  serviceName: string;
  dispute?: {
    id: string;
    reason: string;
    status: string;
    resolutionNote?: string | null;
    createdAt: string | Date;
  } | null;
}

interface ParentLedgerViewProps {
  parentLedger: ParentLedgerSummaryDto | null;
  payments?: ParentPaymentItem[];
  onPayClick: (installment: StkInstallment) => void;
  onViewReceipt: (receipt: ReceiptData) => void;
  onFlagDispute: (payment: { id: string; amount: number; weekNumber: number; childName: string }) => void;
}

export const ParentLedgerView: React.FC<ParentLedgerViewProps> = ({
  parentLedger,
  payments = [],
  onPayClick,
  onViewReceipt,
  onFlagDispute,
}) => {
  return (
    <div className="bg-white border border-[#dcf0f8] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#dcf0f8] pb-5 gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#0b6e99] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#009c84]">payments</span>
            Parent Financial Ledger & Balance Summary
          </h3>
          <p className="text-xs text-[#737686] mt-0.5">
            Weekly Lipa Mdogo Mdogo progress & M-Pesa STK payment history
          </p>
        </div>

        {parentLedger && (
          <div className={`p-4 rounded-2xl border text-right ${
            parentLedger.isAllChildrenPaid 
              ? 'bg-[#e1faf4] border-[#4fe8c9]' 
              : 'bg-[#fff7ed] border-[#fdba74]'
          }`}>
            <p className="text-[11px] font-bold text-[#737686] uppercase tracking-wider">
              Account Status
            </p>
            <span className={`badge mt-1 ${parentLedger.isAllChildrenPaid ? 'badge-green' : 'badge-orange'}`}>
              <span className="material-symbols-outlined text-xs">
                {parentLedger.isAllChildrenPaid ? 'check_circle' : 'warning'}
              </span>
              {parentLedger.isAllChildrenPaid 
                ? 'ALL WEEKS PAID UP' 
                : `TOTAL ARREARS: KES ${parentLedger.totalOverallArrears.toLocaleString()}`}
            </span>
          </div>
        )}
      </div>

      {parentLedger && (
        <div className="space-y-6">
          {parentLedger.childrenLedgers.map((childLedger) => (
            <div key={childLedger.enrollmentId} className="border border-[#dcf0f8] bg-[#f3fafd] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#dcf0f8] pb-3 gap-2">
                <div>
                  <h4 className="text-base font-bold text-[#0b6e99] font-display flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0b6e99]">child_care</span>
                    {childLedger.childName}
                  </h4>
                  <p className="text-xs text-[#737686]">
                    {childLedger.serviceName} @ <span className="font-semibold text-[#0b2a3c]">{childLedger.schoolName}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`badge ${childLedger.isAllWeeksPaid ? 'badge-green' : 'badge-orange'}`}>
                    {childLedger.isAllWeeksPaid ? '✓ ALL WEEKS PAID' : `ARREARS: KES ${childLedger.totalArrears.toLocaleString()}`}
                  </span>
                  {!childLedger.isAllWeeksPaid && childLedger.weeklyInstallments.some(w => w.status !== 'PAID') && (
                    <button
                      className="btn btn-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1"
                      onClick={() => {
                        const oldestUnpaid = childLedger.weeklyInstallments.find(w => w.status !== 'PAID');
                        if (oldestUnpaid) {
                          onPayClick({
                            id: oldestUnpaid.id,
                            weekNumber: oldestUnpaid.weekNumber,
                            amount: childLedger.totalArrears, // Auto-fill with total arrears
                            childName: childLedger.childName,
                            schoolName: childLedger.schoolName,
                          });
                        }
                      }}
                    >
                      <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                      Clear Full Arrears (KES {childLedger.totalArrears.toLocaleString()})
                    </button>
                  )}
                </div>
              </div>

              {/* Weekly Payment Action Grid (Screen 05) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...childLedger.weeklyInstallments].sort((a, b) => a.weekNumber - b.weekNumber).map((w) => {
                  const remainingDue = Math.max(0, w.amountDue - w.amountPaid);
                  const isPartial = w.amountPaid > 0 && w.status !== 'PAID';
                  const percentPaid = Math.min(100, Math.round((w.amountPaid / w.amountDue) * 100));

                  return (
                    <div 
                      key={w.id} 
                      className={`rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                        w.status === 'PAID' 
                          ? 'bg-[#e1faf4] border-[#4fe8c9]' 
                          : isPartial
                            ? 'bg-[#fefce8] border-[#fde047] shadow-xs'
                            : 'bg-white border-[#dcf0f8] shadow-xs hover:border-[#a9d6ea]'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[#0b2a3c] flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-[#0b6e99]">calendar_today</span>
                          Week {w.weekNumber}
                        </span>
                        <span className={`badge ${
                          w.status === 'PAID' 
                            ? 'badge-green' 
                            : isPartial 
                              ? 'badge-orange' 
                              : 'badge-gray'
                        }`}>
                          {w.status === 'PAID' ? '✓ PAID' : isPartial ? `PARTIAL (${percentPaid}%)` : w.status}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <p className="text-xs text-[#737686]">Week Fee</p>
                          <p className="text-xs font-bold text-[#0b2a3c]">KES {w.amountDue.toLocaleString()}</p>
                        </div>

                        {isPartial ? (
                          <div className="space-y-1 bg-white/70 p-2 rounded-xl border border-[#fde047]">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-[#00876f]">Paid: KES {w.amountPaid.toLocaleString()}</span>
                              <span className="text-[#ba1a1a]">Bal: KES {remainingDue.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-[#e5e7eb] h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#00876f] h-full rounded-full transition-all" 
                                style={{ width: `${percentPaid}%` }}
                              />
                            </div>
                          </div>
                        ) : w.status === 'PAID' ? (
                          <div className="bg-white/70 p-2 rounded-xl border border-[#4fe8c9] text-center">
                            <p className="text-xs text-[#00876f] font-bold flex items-center justify-center gap-1">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              Paid KES {w.amountPaid.toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-lg font-extrabold text-[#0b6e99]">
                            KES {w.amountDue.toLocaleString()}
                          </p>
                        )}
                      </div>

                      {w.status !== 'PAID' ? (
                        <button
                          className={`w-full btn text-xs py-2 rounded-xl shadow-sm flex items-center justify-center gap-1.5 ${
                            isPartial ? 'btn-primary' : 'btn-success'
                          }`}
                          onClick={() => {
                            onPayClick({
                              id: w.id,
                              weekNumber: w.weekNumber,
                              amount: remainingDue > 0 ? remainingDue : w.amountDue,
                              childName: childLedger.childName,
                              schoolName: childLedger.schoolName,
                            });
                          }}
                        >
                          <span className="material-symbols-outlined text-sm">phone_iphone</span>
                          {isPartial ? `Pay Remaining (KES ${remainingDue.toLocaleString()})` : 'Pay M-Pesa STK'}
                        </button>
                      ) : (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-[#00876f] flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          Paid via Safaricom
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            className="flex-1 btn btn-primary text-[11px] py-1.5 px-2 rounded-lg"
                            onClick={() => {
                              onViewReceipt({
                                reference: `REC-${w.id.slice(0, 8).toUpperCase()}`,
                                childName: childLedger.childName,
                                schoolName: childLedger.schoolName,
                                serviceName: childLedger.serviceName,
                                weekNumber: w.weekNumber,
                                amountPaid: w.amountDue,
                                mpesaReceipt: `RCK${Date.now().toString().slice(-6)}`,
                                date: new Date().toLocaleDateString(),
                              });
                            }}
                          >
                            Receipt
                          </button>
                          <button
                            className="btn btn-secondary text-[11px] py-1.5 px-2 rounded-lg text-[#ba1a1a] border-[#ffdad6] hover:bg-[#ffdad6]"
                            onClick={() => {
                              onFlagDispute({
                                id: w.id,
                                amount: w.amountDue,
                                weekNumber: w.weekNumber,
                                childName: childLedger.childName,
                              });
                            }}
                          >
                            Dispute
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TRANSACTION HISTORY & DISPUTE SECTION */}
      <div className="border-t border-[#dcf0f8] pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h4 className="text-base font-bold text-[#0b6e99] font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0b6e99]">receipt_long</span>
              Payment Transactions & Dispute Center ({payments?.length || 0})
            </h4>
            <p className="text-xs text-[#737686]">
              Review your payments, download official receipts, or flag discrepancies directly
            </p>
          </div>
        </div>

        {payments && payments.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-[#dcf0f8]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f3fafd] text-[#434655] font-bold uppercase tracking-wider text-[10px] border-b border-[#dcf0f8]">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Child & Program</th>
                  <th className="p-3.5">Daycare School</th>
                  <th className="p-3.5">Receipt / Ref</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Dispute</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dcf0f8] text-[#0b2a3c]">
                {payments.map((p) => {
                  const dateStr = p.paidAt || p.createdAt ? new Date(p.paidAt || p.createdAt).toLocaleString() : 'N/A';
                  const isCompleted = p.status === 'COMPLETED';
                  const hasDispute = !!p.dispute;

                  return (
                    <tr key={p.id} className="hover:bg-[#f3fafd] transition-colors">
                      <td className="p-3.5 font-medium text-[#737686] whitespace-nowrap">{dateStr}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-[#0b6e99]">{p.childName}</p>
                        <p className="text-[11px] text-[#737686]">{p.serviceName} {p.weekNumber ? `(Week ${p.weekNumber})` : ''}</p>
                      </td>
                      <td className="p-3.5 font-medium">{p.schoolName}</td>
                      <td className="p-3.5">
                        <span className="font-mono font-semibold text-[#0b2a3c] bg-[#e8f6fb] px-2 py-0.5 rounded text-[11px]">
                          {p.mpesaReceiptNumber || p.mpesaCheckoutRequestId?.slice(0, 14) || 'Pending'}
                        </span>
                      </td>
                      <td className="p-3.5 font-extrabold text-[#00876f] whitespace-nowrap">
                        KES {p.amount.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className={`badge ${
                          p.status === 'COMPLETED' ? 'badge-green' : p.status === 'FAILED' ? 'badge-orange' : 'badge-gray'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {p.dispute ? (
                          <span className={`badge ${
                            p.dispute.status === 'RESOLVED' || p.dispute.status === 'REFUNDED' 
                              ? 'badge-green' 
                              : 'badge-orange'
                          }`}>
                            <span className="material-symbols-outlined text-xs">flag</span>
                            {p.dispute.status}
                          </span>
                        ) : (
                          <span className="text-[#a0a3b1] text-[11px]">None</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isCompleted && (
                            <button
                              type="button"
                              className="btn btn-primary text-[11px] py-1 px-2.5 rounded-lg flex items-center gap-1"
                              onClick={() => {
                                onViewReceipt({
                                  reference: `REC-${p.id.slice(0, 8).toUpperCase()}`,
                                  childName: p.childName,
                                  schoolName: p.schoolName,
                                  serviceName: p.serviceName,
                                  weekNumber: p.weekNumber || 1,
                                  amountPaid: p.amount,
                                  mpesaReceipt: p.mpesaReceiptNumber || 'MPESA-OFFICIAL',
                                  date: dateStr,
                                });
                              }}
                            >
                              <span className="material-symbols-outlined text-xs">receipt</span>
                              Receipt
                            </button>
                          )}
                          {isCompleted && !hasDispute && (
                            <button
                              type="button"
                              className="btn text-[11px] py-1 px-2.5 rounded-lg text-[#ba1a1a] border border-[#ffdad6] hover:bg-[#ffdad6] transition-colors flex items-center gap-1 font-bold"
                              onClick={() => {
                                onFlagDispute({
                                  id: p.id,
                                  amount: p.amount,
                                  weekNumber: p.weekNumber || 1,
                                  childName: p.childName,
                                });
                              }}
                            >
                              <span className="material-symbols-outlined text-xs">flag</span>
                              Dispute
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#f3fafd] border border-dashed border-[#a9d6ea] rounded-2xl p-6 text-center text-[#737686] space-y-1">
            <span className="material-symbols-outlined text-3xl text-[#0b6e99]">receipt</span>
            <p className="font-bold text-xs text-[#0b2a3c]">No Payment Transactions Yet</p>
            <p className="text-[11px]">Your completed M-Pesa payments and downloadable receipts will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

