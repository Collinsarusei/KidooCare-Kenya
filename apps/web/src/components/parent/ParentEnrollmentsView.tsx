import React from 'react';
import { EnrollmentDto } from '@daycare/shared-types';

interface ParentEnrollmentsViewProps {
  myEnrollments: EnrollmentDto[];
  onEndEnrollment: (id: string) => void;
  onNavigateToMarketplace: () => void;
}

export const ParentEnrollmentsView: React.FC<ParentEnrollmentsViewProps> = ({ 
  myEnrollments, 
  onEndEnrollment, 
  onNavigateToMarketplace 
}) => {
  return (
    <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-[#e6eeff] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#004ac6] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">assignment_turned_in</span>
            My Active Program Enrollments ({myEnrollments.length})
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
        <div className="text-center py-10 bg-[#f8f9ff] rounded-2xl border border-dashed border-[#c3c6d7] space-y-2">
          <span className="material-symbols-outlined text-4xl text-[#737686]">school</span>
          <p className="text-sm font-semibold text-[#121c2a]">No Active Program Enrollments</p>
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
              className="border border-[#e6eeff] bg-[#f8f9ff] rounded-2xl p-5 hover:border-[#b4c5ff] transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#e6eeff] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e6eeff] text-[#004ac6] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">child_care</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-[#004ac6] font-display">
                        {enr.child?.name}
                      </h4>
                      <span className={`badge ${
                        enr.status === 'ACTIVE' 
                          ? 'badge-green' 
                          : enr.status === 'WAITLISTED' 
                            ? 'badge-orange' 
                            : 'badge-blue'
                      }`}>
                        {enr.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#121c2a] mt-0.5">
                      {enr.service?.name} @ <span className="text-[#004ac6]">{enr.service?.school?.name}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-bold text-[#737686] uppercase tracking-wider">
                    Agreed Monthly Fee
                  </p>
                  <div className="text-base font-extrabold text-[#006c49]">
                    KES {enr.agreedMonthlyPrice.toLocaleString()} / mo
                  </div>
                  {(enr.status === 'ACTIVE' || enr.status === 'PENDING_PAYMENT' || enr.status === 'WAITLISTED') && (
                    <button 
                      onClick={() => onEndEnrollment(enr.id)}
                      disabled={enr.status === 'ACTIVE' && (enr.balance?.totalArrears || 0) > 0}
                      title={enr.status === 'ACTIVE' && (enr.balance?.totalArrears || 0) > 0 ? "Clear your arrears to cancel" : ""}
                      className={`mt-2 text-xs font-bold flex items-center justify-end gap-1 ml-auto ${
                        enr.status === 'ACTIVE' && (enr.balance?.totalArrears || 0) > 0
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

              {/* Weekly Installments Grid */}
              {enr.billingCycles && enr.billingCycles.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-[#004ac6] uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    Current Month Weekly Installment Breakdown
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {enr.billingCycles[0].weeklyInstallments.map((w) => (
                      <div 
                        key={w.id} 
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          w.status === 'PAID' 
                            ? 'bg-[#e6f7ef] border-[#6cf8bb]' 
                            : 'bg-[#fff7ed] border-[#fdba74]'
                        }`}
                      >
                        <div className="flex justify-between items-center font-bold">
                          <span>Week {w.weekNumber}</span>
                          <span className={`badge ${w.status === 'PAID' ? 'badge-green' : 'badge-orange'}`}>
                            {w.status}
                          </span>
                        </div>
                        <p className={`font-extrabold ${w.status === 'PAID' ? 'text-[#00714d]' : 'text-[#c2410c]'}`}>
                          KES {w.amountDue.toLocaleString()}
                        </p>
                      </div>
                    ))}
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

