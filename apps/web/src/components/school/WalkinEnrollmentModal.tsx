import React, { useState } from 'react';
import { ServiceDto } from '@daycare/shared-types';

interface WalkinEnrollmentModalProps {
  schoolId: string;
  services: ServiceDto[];
  onConfirm: (data: { childName: string; childDob: string; parentName?: string; parentEmail?: string; parentPhone?: string; serviceId: string }) => void;
  onClose: () => void;
}

export const WalkinEnrollmentModal: React.FC<WalkinEnrollmentModalProps> = ({
  schoolId,
  services,
  onConfirm,
  onClose,
}) => {
  const [childName, setChildName] = useState('');
  const [childDob, setChildDob] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [serviceId, setServiceId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) {
      alert('Please select a program.');
      return;
    }
    onConfirm({ childName, childDob, parentName, parentEmail, parentPhone, serviceId });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-[500px] max-w-full p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex justify-between items-start border-b border-[#e6eeff] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#004ac6] text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">person_add</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#004ac6] font-display">
                Walk-in Enrollment
              </h3>
              <p className="text-xs text-[#737686]">Enroll a child manually into a program</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f8f9ff] text-[#737686] hover:bg-[#e6eeff] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
              Child's Name *
            </label>
            <input
              type="text"
              required
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
              placeholder="Full Name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
              Date of Birth *
            </label>
            <input
              type="date"
              required
              value={childDob}
              onChange={(e) => setChildDob(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
            />
          </div>

          <div className="border-t border-[#e6eeff] pt-4">
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
              Parent Details (Optional - for account creation)
            </label>
            <div className="space-y-3">
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                placeholder="Parent Name"
              />
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                placeholder="Parent Email"
              />
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                placeholder="Phone (e.g. +254700...)"
              />
            </div>
          </div>

          <div className="border-t border-[#e6eeff] pt-4">
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
              Select Program *
            </label>
            <select
              required
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
            >
              <option value="" disabled>Choose a program...</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} - KES {s.price.toLocaleString()}/mo</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button 
              type="button" 
              className="btn btn-secondary text-xs px-5 py-2.5 rounded-xl" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary text-xs px-6 py-2.5 rounded-xl shadow-md"
            >
              Enroll Walk-in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
