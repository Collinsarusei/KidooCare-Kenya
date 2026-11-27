import React, { useState } from 'react';

export interface StkInstallment {
  id: string;
  weekNumber: number;
  amount: number;
  childName: string;
  schoolName: string;
  paymentId?: string;
}

interface StkPushModalProps {
  stkInstallment: StkInstallment;
  stkPhone: string;
  stkResult: any;
  setStkPhone: (phone: string) => void;
  onInitiate: (phone: string, amount: number) => void;
  onCardPay?: (amount: number, cardNumber: string, expiry: string, cvv: string) => void;
  onSimulateCallback: () => void;
  onClose: () => void;
}

type PayMode = 'WEEK' | 'FULL' | 'CUSTOM';

export const StkPushModal: React.FC<StkPushModalProps> = ({
  stkInstallment,
  stkPhone,
  stkResult,
  setStkPhone,
  onInitiate,
  onSimulateCallback,
  onClose,
}) => {
  const [payMode, setPayMode] = useState<PayMode>('WEEK');
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);

  const weeklyAmount = stkInstallment.amount;
  const fullAmount = weeklyAmount * 4;
  const selectedAmount =
    payMode === 'WEEK' ? weeklyAmount :
    payMode === 'FULL' ? fullAmount :
    parseFloat(customInput) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payMode === 'CUSTOM' && (isNaN(selectedAmount) || selectedAmount < 1)) return;
    setLoading(true);
    try {
      await onInitiate(stkPhone, selectedAmount);
    } finally {
      setLoading(false);
    }
  };

  const isValidPhone = /^(07|01|254|2547|2541)\d+/.test(stkPhone.trim()) && stkPhone.trim().length >= 10;
  const isAmountValid = payMode !== 'CUSTOM' || (selectedAmount > 0 && !isNaN(selectedAmount));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-3xl w-[500px] max-w-full shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#00714d] to-[#004ac6] p-6 text-white relative">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">phone_iphone</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold font-display">M-Pesa Payment</h3>
              <p className="text-xs text-white/80">Powered by Safaricom Daraja</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Info card */}
          <div className="bg-[#f0fdf4] border border-[#86efac] rounded-2xl p-4 space-y-1">
            <p className="text-xs text-[#166534] font-bold uppercase tracking-wider">Paying for</p>
            <p className="font-bold text-[#121c2a]">{stkInstallment.childName}</p>
            <p className="text-xs text-[#737686]">Week {stkInstallment.weekNumber} — <span className="font-semibold text-[#121c2a]">{stkInstallment.schoolName}</span></p>
          </div>

          {stkResult ? (
            <div className="space-y-4">
              <div className="bg-[#eff4ff] border border-[#c3d7ff] rounded-2xl p-5 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#004ac6] text-white flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">phone_forwarded</span>
                </div>
                <p className="font-bold text-[#004ac6] text-base">STK Push Sent!</p>
                <p className="text-sm text-[#434655]">A payment prompt has been sent to <strong>{stkPhone}</strong>.</p>
                <p className="text-xs text-[#737686]">
                  Open <strong>M-Pesa</strong> on your phone and enter your <strong>PIN</strong> to pay{' '}
                  <strong className="text-[#00714d]">KES {selectedAmount.toLocaleString()}</strong>.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 py-2 text-sm text-[#737686]">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#004ac6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 bg-[#004ac6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 bg-[#004ac6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Waiting for payment confirmation...</span>
              </div>
              <p className="text-[10px] text-[#b0b3c0] text-center font-mono break-all">Ref: {stkResult.checkoutRequestId}</p>
              <div className="border-t border-[#e6eeff] pt-4">
                <p className="text-[10px] text-[#b0b3c0] text-center mb-2 uppercase tracking-wide font-bold">Sandbox Mode</p>
                <button type="button" onClick={onSimulateCallback} className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#c3d7ff] text-[#004ac6] text-xs font-bold hover:bg-[#eff4ff] transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-base">bolt</span>
                  Simulate Successful M-Pesa Callback
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Payment mode: 3 options */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#121c2a] uppercase tracking-wider">Choose Payment Amount</label>
                <div className="grid grid-cols-3 gap-2">

                  {/* Lipa Mdogo Mdogo */}
                  <div
                    role="button"
                    onClick={() => setPayMode('WEEK')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all space-y-1 ${payMode === 'WEEK' ? 'border-[#004ac6] bg-[#eff4ff]' : 'border-[#e6eeff] hover:border-[#c3c6d7]'}`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${payMode === 'WEEK' ? 'border-[#004ac6]' : 'border-[#c3c6d7]'}`}>
                      {payMode === 'WEEK' && <div className="w-2 h-2 rounded-full bg-[#004ac6]" />}
                    </div>
                    <p className="text-[11px] font-bold text-[#121c2a] leading-tight">Lipa Mdogo Mdogo</p>
                    <p className="text-[10px] text-[#737686]">1 week</p>
                    <p className="text-xs font-extrabold text-[#004ac6]">KES {weeklyAmount.toLocaleString()}</p>
                  </div>

                  {/* Full Month */}
                  <div
                    role="button"
                    onClick={() => setPayMode('FULL')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all space-y-1 ${payMode === 'FULL' ? 'border-[#006c49] bg-[#f0fdf4]' : 'border-[#e6eeff] hover:border-[#c3c6d7]'}`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${payMode === 'FULL' ? 'border-[#006c49]' : 'border-[#c3c6d7]'}`}>
                      {payMode === 'FULL' && <div className="w-2 h-2 rounded-full bg-[#006c49]" />}
                    </div>
                    <p className="text-[11px] font-bold text-[#121c2a] leading-tight">Full Month</p>
                    <p className="text-[10px] text-[#737686]">4 weeks</p>
                    <p className="text-xs font-extrabold text-[#006c49]">KES {fullAmount.toLocaleString()}</p>
                  </div>

                  {/* Custom */}
                  <div
                    role="button"
                    onClick={() => setPayMode('CUSTOM')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all space-y-1 ${payMode === 'CUSTOM' ? 'border-[#7c3aed] bg-[#f5f3ff]' : 'border-[#e6eeff] hover:border-[#c3c6d7]'}`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${payMode === 'CUSTOM' ? 'border-[#7c3aed]' : 'border-[#c3c6d7]'}`}>
                      {payMode === 'CUSTOM' && <div className="w-2 h-2 rounded-full bg-[#7c3aed]" />}
                    </div>
                    <p className="text-[11px] font-bold text-[#121c2a] leading-tight">Custom</p>
                    <p className="text-[10px] text-[#737686]">Any amount</p>
                    <p className="text-xs font-extrabold text-[#7c3aed]">KES ?</p>
                  </div>
                </div>

                {/* Custom amount input */}
                {payMode === 'CUSTOM' && (
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs font-bold text-[#737686]">KES</span>
                    <input
                      type="number"
                      min={1}
                      required
                      autoFocus
                      placeholder="Enter amount"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pl-12 pr-4 py-3 text-sm rounded-xl border border-[#7c3aed] bg-[#f5f3ff] focus:ring-2 focus:ring-[#7c3aed] outline-none font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Phone input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#121c2a] uppercase tracking-wider">M-Pesa Phone Number *</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#737686] text-lg select-none">smartphone</span>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0712345678"
                    value={stkPhone}
                    onChange={(e) => setStkPhone(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl border outline-none transition-all ${stkPhone && !isValidPhone ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300' : 'border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6]'}`}
                  />
                </div>
                {stkPhone && !isValidPhone ? (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    Enter a valid Kenyan number, e.g. 0712345678
                  </p>
                ) : (
                  <p className="text-[11px] text-[#737686]">Enter 07... or 01... — formatted to 254... for M-Pesa automatically.</p>
                )}
              </div>

              {/* Amount summary */}
              {isAmountValid && selectedAmount > 0 && (
                <div className="bg-[#f8f9ff] rounded-xl p-3.5 flex justify-between items-center border border-[#e6eeff]">
                  <span className="text-xs font-semibold text-[#737686]">Amount to be charged:</span>
                  <span className="font-extrabold text-[#121c2a] text-lg">KES {selectedAmount.toLocaleString()}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#cbd5e1] text-xs font-bold text-[#475569] hover:bg-[#f1f5f9] transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !isValidPhone || !stkPhone.trim() || !isAmountValid || selectedAmount < 1}
                  className="flex-1 py-3 rounded-xl bg-[#00714d] hover:bg-[#005a3c] text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                  ) : (
                    <><span className="material-symbols-outlined text-base">send_to_mobile</span>{selectedAmount > 0 ? `Pay KES ${selectedAmount.toLocaleString()}` : 'Send M-Pesa Prompt'}</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
