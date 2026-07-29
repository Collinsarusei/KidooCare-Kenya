import React from 'react';

export interface ReceiptData {
  reference: string;
  childName: string;
  schoolName: string;
  serviceName: string;
  weekNumber: number;
  amountPaid: number;
  mpesaReceipt?: string;
  date: string;
}

interface ReceiptModalProps {
  receiptData: ReceiptData;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receiptData, onClose }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 130, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', width: '520px', maxWidth: '100%', padding: '32px', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed var(--color-gray-200)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ color: 'var(--color-blue-primary)', fontSize: '1.4rem' }}>🧾 Official Payment Receipt</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-600)' }}>Ref: {receiptData.reference}</p>
          </div>
          <span className="badge badge-green" style={{ fontSize: '0.9rem' }}>✓ PAID FULL</span>
        </div>

        <div style={{ display: 'grid', gap: '12px', fontSize: '0.95rem', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-gray-100)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--color-gray-600)' }}>Daycare Center:</span>
            <span style={{ fontWeight: 600, color: 'var(--color-blue-primary)' }}>{receiptData.schoolName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-gray-100)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--color-gray-600)' }}>Child Name:</span>
            <span style={{ fontWeight: 600 }}>👶 {receiptData.childName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-gray-100)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--color-gray-600)' }}>Program Service:</span>
            <span>{receiptData.serviceName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-gray-100)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--color-gray-600)' }}>Installment Paid:</span>
            <span style={{ fontWeight: 600 }}>Week {receiptData.weekNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-gray-100)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--color-gray-600)' }}>Payment Method:</span>
            <span className="badge badge-blue">M-PESA EXPRESS</span>
          </div>
          {receiptData.mpesaReceipt && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-gray-100)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--color-gray-600)' }}>M-Pesa Receipt Code:</span>
              <span style={{ fontWeight: 700, color: 'var(--color-green-success)' }}>{receiptData.mpesaReceipt}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-gray-100)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--color-gray-600)' }}>Date Paid:</span>
            <span>{receiptData.date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', fontSize: '1.2rem' }}>
            <span style={{ fontWeight: 700 }}>Total Amount Paid:</span>
            <span style={{ fontWeight: 700, color: 'var(--color-green-success)' }}>KES {receiptData.amountPaid.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>✕ Close</button>
          <button className="btn btn-primary" style={{ background: 'var(--color-blue-secondary)' }} onClick={() => window.print()}>
            🖨️ Print / Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
