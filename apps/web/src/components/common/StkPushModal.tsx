import React from 'react';

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
  onSimulateCallback: () => void;
  onClose: () => void;
}

export const StkPushModal: React.FC<StkPushModalProps> = ({
  stkInstallment,
  stkPhone,
  stkResult,
  setStkPhone,
  onInitiate,
  onSimulateCallback,
  onClose,
}) => {
  const [customAmount, setCustomAmount] = React.useState<number>(stkInstallment.amount);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', width: '500px', maxWidth: '100%', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ color: 'var(--color-green-success)', fontSize: '1.4rem' }}>📱 M-Pesa Express Payment</h3>
          <button className="btn btn-secondary" onClick={onClose}>✕ Close</button>
        </div>

        <p style={{ fontSize: '0.95rem', color: 'var(--color-gray-600)', marginBottom: '16px' }}>
          Paying <strong>Week {stkInstallment.weekNumber}</strong> installment of <strong>KES {stkInstallment.amount.toLocaleString()}</strong> for <strong>{stkInstallment.childName}</strong> at <strong>{stkInstallment.schoolName}</strong>.
        </p>

        {stkResult ? (
          <div style={{ background: 'var(--color-green-light)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-green-border)' }}>
            <h4 style={{ color: 'var(--color-green-success)', marginBottom: '8px' }}>STK Push Prompt Dispatched!</h4>
            <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>{stkResult.customerMessage}</p>

            <div style={{ background: 'white', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-gray-200)', marginBottom: '16px' }}>
              <p style={{ fontSize: '0.85rem' }}><strong>CheckoutRequestID:</strong> {stkResult.checkoutRequestId}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)', marginTop: '4px' }}>Status: {stkResult.status}</p>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', background: 'var(--color-green-success)' }} onClick={onSimulateCallback}>
              ⚡ Simulate M-Pesa Daraja Success Callback (Dev Test)
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); onInitiate(stkPhone, customAmount); }} style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>M-Pesa Phone Number *</label>
              <input
                type="text"
                required
                placeholder="254712345678"
                value={stkPhone}
                onChange={(e) => setStkPhone(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-gray-200)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Amount to Pay (KES) *</label>
              <input
                type="number"
                required
                min={1}
                value={customAmount}
                onChange={(e) => setCustomAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-gray-200)' }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', marginTop: '4px' }}>
                You can pay the full arrears or a custom amount.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: 'var(--color-green-success)' }}>
                Send STK Push (KES {customAmount.toLocaleString()})
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
