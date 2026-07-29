import React from 'react';
import { ChildDto } from '@daycare/shared-types';

export interface EnrollingService {
  serviceId: string;
  serviceName: string;
  schoolName: string;
  price: number;
  capacity: number;
  currentCount: number;
}

interface EnrollmentModalProps {
  enrollingService: EnrollingService;
  myChildren: ChildDto[];
  selectedChildId: string;
  setSelectedChildId: (id: string) => void;
  onConfirm: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  enrollingService,
  myChildren,
  selectedChildId,
  setSelectedChildId,
  onConfirm,
  onClose,
}) => {
  const isFull = enrollingService.currentCount >= enrollingService.capacity;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-[540px] max-w-full p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex justify-between items-start border-b border-[#e6eeff] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#004ac6] text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">assignment_add</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#004ac6] font-display">
                Daycare Intake & Enrollment
              </h3>
              <p className="text-xs text-[#737686]">Complete child placement registration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f8f9ff] text-[#737686] hover:bg-[#e6eeff] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Service Summary Card */}
        <div className="bg-[#f8f9ff] border border-[#e6eeff] p-4 rounded-2xl space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-[#004ac6] text-base font-display">
                {enrollingService.serviceName}
              </h4>
              <p className="text-xs text-[#737686] flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-xs">domain</span>
                {enrollingService.schoolName}
              </p>
            </div>
            <span className={`badge ${isFull ? 'badge-orange' : 'badge-green'}`}>
              {isFull ? 'Waitlist' : 'Active Intake'}
            </span>
          </div>

          <div className="pt-2 border-t border-[#e6eeff] flex justify-between items-center text-xs">
            <span className="text-[#737686]">Agreed Monthly Rate:</span>
            <span className="font-extrabold text-[#006c49] text-sm">
              KES {enrollingService.price.toLocaleString()} / mo
            </span>
          </div>
          <p className="text-[11px] text-[#00714d] font-semibold flex items-center gap-1 pt-1">
            <span className="material-symbols-outlined text-xs">phone_iphone</span>
            Payable weekly via M-Pesa (4 weekly installments of KES {(enrollingService.price / 4).toLocaleString()})
          </p>
        </div>

        {isFull && (
          <div className="bg-[#fff7ed] border border-[#fdba74] p-3 rounded-2xl text-xs text-[#c2410c] flex items-start gap-2">
            <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">warning</span>
            <div>
              <span className="font-bold block">Capacity Reached ({enrollingService.currentCount}/{enrollingService.capacity})</span>
              Your child will be assigned a priority waitlist status. The daycare manager will approve as soon as a slot opens.
            </div>
          </div>
        )}

        {myChildren.length === 0 ? (
          <div className="bg-[#fff7ed] border border-[#fdba74] p-5 rounded-2xl text-center space-y-2">
            <span className="material-symbols-outlined text-3xl text-[#c2410c]">no_accounts</span>
            <p className="text-xs font-bold text-[#c2410c] uppercase">No Registered Children Profiles</p>
            <p className="text-xs text-[#434655]">
              Please close this dialog and complete the Child Intake Form in your Children tab before enrolling.
            </p>
            <button className="btn btn-secondary text-xs py-2 px-4 mt-2" onClick={onClose}>
              Close & Register Child
            </button>
          </div>
        ) : (
          <form onSubmit={onConfirm} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
                Select Child to Enroll *
              </label>
              <select
                required
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none font-medium"
              >
                {myChildren.map((child) => (
                  <option key={child.id} value={child.id}>
                    👶 {child.name} (DOB: {new Date(child.dob).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button 
                type="button" 
                className="btn btn-secondary text-xs px-5 py-2.5 rounded-xl" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                Confirm & Submit Intake
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

