import React, { useState, useEffect } from 'react';
import { ChildDto } from '@daycare/shared-types';

interface ChildModalProps {
  initialData?: ChildDto;
  onSave: (data: { id?: string; name: string; dob: string; notes: string }) => void;
  onClose: () => void;
}

export const ChildModal: React.FC<ChildModalProps> = ({ initialData, onSave, onClose }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [dob, setDob] = useState(initialData?.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDob(new Date(initialData.dob).toISOString().split('T')[0]);
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: initialData?.id, name, dob, notes });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl w-[480px] max-w-full p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex justify-between items-start border-b border-[#e6eeff] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#004ac6] text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">{initialData ? 'edit' : 'person_add'}</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#004ac6] font-display">
                {initialData ? 'Edit Child Profile' : 'Add Child Profile'}
              </h3>
              <p className="text-xs text-[#737686]">
                {initialData ? 'Update child details and notes' : 'Register a new child for enrollment'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f8f9ff] text-[#737686] hover:bg-[#e6eeff] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1">
              Child Full Name *
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Liam Mwangi" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1">
              Date of Birth *
            </label>
            <input 
              type="date" 
              required 
              value={dob} 
              onChange={(e) => setDob(e.target.value)} 
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1">
              Medical / Dietary / Care Notes
            </label>
            <textarea 
              rows={3} 
              placeholder="Allergies, emergency contacts, special care needs..." 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none transition-all"
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full btn btn-primary py-3 rounded-xl shadow-md flex items-center justify-center gap-2 hover:shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-base">save</span>
              {initialData ? 'Update Profile' : 'Save Child Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
