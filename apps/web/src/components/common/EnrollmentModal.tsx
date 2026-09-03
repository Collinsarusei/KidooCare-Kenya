import React, { useState } from 'react';
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
  onConfirm: (e: React.FormEvent, paymentMode: string, amount: number) => void;
  onClose: () => void;
  onAddChildClick?: () => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  enrollingService,
  myChildren,
  selectedChildId,
  setSelectedChildId,
  onConfirm,
  onClose,
  onAddChildClick,
}) => {
  const isFull = enrollingService.currentCount >= enrollingService.capacity;
  
  const [step, setStep] = useState<1 | 2>(1);
  const [paymentMode, setPaymentMode] = useState<'LIPA_MDOGO_MDOGO' | 'ALL_FEES' | 'CUSTOM'>('LIPA_MDOGO_MDOGO');
  const [customAmount, setCustomAmount] = useState<string>('');

  const weeklyFee = enrollingService.price / 4;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFull) {
      // If waitlisted, skip payment
      onConfirm(e, 'WAITLIST', 0);
    } else {
      setStep(2);
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let amount = 0;
    if (paymentMode === 'LIPA_MDOGO_MDOGO') amount = weeklyFee;
    else if (paymentMode === 'ALL_FEES') amount = enrollingService.price;
    else if (paymentMode === 'CUSTOM') amount = parseFloat(customAmount);

    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    onConfirm(e, paymentMode, amount);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-[540px] max-w-full p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex justify-between items-start border-b border-[#e6eeff] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#004ac6] text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">
                {step === 1 ? 'assignment_add' : 'payments'}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#004ac6] font-display">
                {step === 1 ? 'Daycare Intake & Enrollment' : 'Initial Payment Required'}
              </h3>
              <p className="text-xs text-[#737686]">
                {step === 1 ? 'Complete child placement registration' : 'Secure your child\'s spot with an initial payment'}
              </p>
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
        </div>

        {step === 1 && (
          <>
            {isFull && (
              <div className="bg-[#fff7ed] border border-[#fdba74] p-3 rounded-2xl text-xs text-[#c2410c] flex items-start gap-2">
                <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">warning</span>
                <div>
                  <span className="font-bold block">Capacity Reached ({enrollingService.currentCount}/{enrollingService.capacity})</span>
                  Your child will be assigned a priority waitlist status. The daycare manager will approve as soon as a slot opens. No payment is required yet.
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
                <button type="button" className="btn btn-secondary text-xs py-2 px-4 mt-2" onClick={onAddChildClick}>
                  Register Child
                </button>
              </div>
            ) : (
              <form onSubmit={handleNextStep} className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider">
                      Select Child to Enroll *
                    </label>
                    <button 
                      type="button"
                      onClick={onAddChildClick}
                      className="text-xs font-bold text-[#004ac6] hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      Add Child
                    </button>
                  </div>
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
                    <span>{isFull ? 'Join Waitlist' : 'Continue to Payment'}</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-5">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider">
                Select Initial Payment Amount
              </label>
              
              <div 
                onClick={() => setPaymentMode('LIPA_MDOGO_MDOGO')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${paymentMode === 'LIPA_MDOGO_MDOGO' ? 'border-[#004ac6] bg-[#eff4ff]' : 'border-[#e6eeff] bg-white hover:border-[#c3c6d7]'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMode === 'LIPA_MDOGO_MDOGO' ? 'border-[#004ac6]' : 'border-[#c3c6d7]'}`}>
                  {paymentMode === 'LIPA_MDOGO_MDOGO' && <div className="w-2 h-2 rounded-full bg-[#004ac6]" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#121c2a]">Lipa Mdogo Mdogo (1 Week)</p>
                  <p className="text-xs text-[#737686]">KES {weeklyFee.toLocaleString()}</p>
                </div>
              </div>

              <div 
                onClick={() => setPaymentMode('ALL_FEES')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${paymentMode === 'ALL_FEES' ? 'border-[#004ac6] bg-[#eff4ff]' : 'border-[#e6eeff] bg-white hover:border-[#c3c6d7]'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMode === 'ALL_FEES' ? 'border-[#004ac6]' : 'border-[#c3c6d7]'}`}>
                  {paymentMode === 'ALL_FEES' && <div className="w-2 h-2 rounded-full bg-[#004ac6]" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#121c2a]">All Fees (Full Month)</p>
                  <p className="text-xs text-[#737686]">KES {enrollingService.price.toLocaleString()}</p>
                </div>
              </div>

              <div 
                onClick={() => setPaymentMode('CUSTOM')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${paymentMode === 'CUSTOM' ? 'border-[#004ac6] bg-[#eff4ff]' : 'border-[#e6eeff] bg-white hover:border-[#c3c6d7]'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMode === 'CUSTOM' ? 'border-[#004ac6]' : 'border-[#c3c6d7]'}`}>
                  {paymentMode === 'CUSTOM' && <div className="w-2 h-2 rounded-full bg-[#004ac6]" />}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <p className="text-sm font-bold text-[#121c2a]">Custom Amount</p>
                  {paymentMode === 'CUSTOM' && (
                    <input 
                      type="number"
                      placeholder="KES"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-32 px-2 py-1 text-sm rounded border border-[#c3c6d7] outline-none focus:ring-1 focus:ring-[#004ac6]"
                      onClick={(e) => e.stopPropagation()}
                      required
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-between pt-2 border-t border-[#e6eeff]">
              <button 
                type="button" 
                className="btn btn-secondary text-xs px-5 py-2.5 rounded-xl" 
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button 
                type="submit" 
                className="btn btn-primary text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">phone_iphone</span>
                Pay & Enroll
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

