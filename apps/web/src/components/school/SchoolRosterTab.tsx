import React from 'react';
import { EnrollmentDto } from '@daycare/shared-types';

interface SchoolRosterTabProps {
  schoolRoster: EnrollmentDto[];
  onPromoteWaitlist: (enrollmentId: string) => void;
  onEndEnrollment: (enrollmentId: string) => void;
}

export const SchoolRosterTab: React.FC<SchoolRosterTabProps> = ({
  schoolRoster,
  onPromoteWaitlist,
  onEndEnrollment,
}) => {
  return (
    <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-[#e6eeff] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#004ac6] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">groups</span>
            Daycare Enrolled Roster ({schoolRoster.length})
          </h3>
          <p className="text-xs text-[#737686]">Manage student enrollment statuses & waitlists</p>
        </div>
        <span className="badge badge-blue">
          <span className="material-symbols-outlined text-xs">how_to_reg</span>
          Active Placement
        </span>
      </div>

      <div className="space-y-3">
        {schoolRoster.map((enr) => (
          <div 
            key={enr.id} 
            className="border border-[#e6eeff] bg-[#f8f9ff] rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#b4c5ff] transition-all"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-lg text-[#004ac6]">child_care</span>
                <h4 className="font-bold text-[#121c2a] text-sm font-display">
                  {enr.child?.name}
                </h4>
                <span className={`badge ${
                  enr.status === 'ACTIVE' 
                    ? 'badge-green' 
                    : enr.status === 'WAITLISTED' 
                      ? 'badge-orange' 
                      : 'badge-gray'
                }`}>
                  {enr.status}
                </span>
              </div>
              <p className="text-xs text-[#737686] mt-1">
                Program: <span className="font-semibold text-[#121c2a]">{enr.service?.name}</span> | Enrolled: {new Date(enr.startDate).toLocaleDateString()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="badge badge-green font-bold">
                KES {enr.agreedMonthlyPrice.toLocaleString()} / mo
              </span>
              {enr.status === 'WAITLISTED' && (
                <button 
                  className="btn btn-success text-xs py-1.5 px-3 rounded-xl shadow-xs" 
                  onClick={() => onPromoteWaitlist(enr.id)}
                >
                  Promote to Active
                </button>
              )}
              {enr.status !== 'ENDED' && (
                <button 
                  className="btn btn-secondary text-xs py-1.5 px-3 rounded-xl" 
                  onClick={() => onEndEnrollment(enr.id)}
                >
                  End Enrollment
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

