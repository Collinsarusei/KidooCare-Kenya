import React from 'react';
import { ParentLedgerSummaryDto } from '@daycare/shared-types';
import { StkInstallment } from '../common/StkPushModal';
import { ReceiptData } from '../common/ReceiptModal';

interface ParentLedgerViewProps {
  parentLedger: ParentLedgerSummaryDto | null;
  onPayClick: (installment: StkInstallment) => void;
  onViewReceipt: (receipt: ReceiptData) => void;
  onFlagDispute: (payment: { id: string; amount: number; weekNumber: number; childName: string }) => void;
}

export const ParentLedgerView: React.FC<ParentLedgerViewProps> = ({
  parentLedger,
  onPayClick,
  onViewReceipt,
  onFlagDispute,
}) => {
  return (
    <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#e6eeff] pb-5 gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#004ac6] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006c49]">payments</span>
            Parent Financial Ledger & Balance Summary
          </h3>
          <p className="text-xs text-[#737686] mt-0.5">
            Weekly Lipa Mdogo Mdogo progress & M-Pesa STK payment history
          </p>
        </div>

        {parentLedger && (
          <div className={`p-4 rounded-2xl border text-right ${
            parentLedger.isAllChildrenPaid 
              ? 'bg-[#e6f7ef] border-[#6cf8bb]' 
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
            <div key={childLedger.enrollmentId} className="border border-[#e6eeff] bg-[#f8f9ff] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#e6eeff] pb-3 gap-2">
                <div>
                  <h4 className="text-base font-bold text-[#004ac6] font-display flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#004ac6]">child_care</span>
                    {childLedger.childName}
                  </h4>
                  <p className="text-xs text-[#737686]">
                    {childLedger.serviceName} @ <span className="font-semibold text-[#121c2a]">{childLedger.schoolName}</span>
                  </p>
                </div>
                <span className={`badge ${childLedger.isAllWeeksPaid ? 'badge-green' : 'badge-orange'}`}>
                  {childLedger.isAllWeeksPaid ? '✓ ALL WEEKS PAID' : `ARREARS: KES ${childLedger.totalArrears.toLocaleString()}`}
                </span>
              </div>

              {/* Weekly Payment Action Grid (Screen 05) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {childLedger.weeklyInstallments.map((w) => (
                  <div 
                    key={w.id} 
                    className={`rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                      w.status === 'PAID' 
                        ? 'bg-[#e6f7ef] border-[#6cf8bb]' 
                        : 'bg-white border-[#e6eeff] shadow-xs hover:border-[#b4c5ff]'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#121c2a] flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#004ac6]">calendar_today</span>
                        Week {w.weekNumber}
                      </span>
                      <span className={`badge ${w.status === 'PAID' ? 'badge-green' : 'badge-orange'}`}>
                        {w.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-[#737686]">Amount Due</p>
                      <p className="text-lg font-extrabold text-[#004ac6]">
                        KES {w.amountDue.toLocaleString()}
                      </p>
                    </div>

                    {w.status !== 'PAID' ? (
                      <button
                        className="w-full btn btn-success text-xs py-2 rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                        onClick={() => {
                          onPayClick({
                            id: w.id,
                            weekNumber: w.weekNumber,
                            amount: w.amountDue,
                            childName: childLedger.childName,
                            schoolName: childLedger.schoolName,
                          });
                        }}
                      >
                        <span className="material-symbols-outlined text-sm">phone_iphone</span>
                        Pay M-Pesa STK
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-[#00714d] flex items-center gap-1">
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
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

