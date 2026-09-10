import React, { useState } from 'react';
import { UserDto } from '@daycare/shared-types';

interface SchoolTutorsTabProps {
  tutors: UserDto[];
  onAddTutor: (data: { name: string; email: string; phone: string }) => void;
  onUpdateTutor: (tutorId: string, data: { name: string; email: string; phone: string }) => void;
  onRemoveTutor: (tutorId: string) => void;
  onResendInvite: (tutorId: string) => void;
}

export const SchoolTutorsTab: React.FC<SchoolTutorsTabProps> = ({
  tutors,
  onAddTutor,
  onUpdateTutor,
  onRemoveTutor,
  onResendInvite,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTutorId, setEditingTutorId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTutorId) {
      onUpdateTutor(editingTutorId, { name, email, phone });
    } else {
      onAddTutor({ name, email, phone });
    }
    setIsAdding(false);
    setEditingTutorId(null);
    setName('');
    setEmail('');
    setPhone('');
  };

  const openAddForm = () => {
    setIsAdding(true);
    setEditingTutorId(null);
    setName('');
    setEmail('');
    setPhone('');
  };

  const openEditForm = (tutor: UserDto) => {
    setIsAdding(true);
    setEditingTutorId(tutor.id);
    setName((tutor as any).name || '');
    setEmail(tutor.email);
    setPhone(tutor.phone || '');
  };

  return (
    <div className="bg-white border border-[#e6eeff] rounded-3xl p-4 md:p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-[#e6eeff] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#004ac6] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">co_present</span>
            Tutors & Staff ({tutors.length})
          </h3>
          <p className="text-xs text-[#737686]">Manage caregivers who log daily activities</p>
        </div>
        <button 
          onClick={() => {
            if (isAdding) {
              setIsAdding(false);
              setEditingTutorId(null);
            } else {
              openAddForm();
            }
          }}
          className="btn btn-primary text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-md"
        >
          <span className="material-symbols-outlined text-[16px]">{isAdding ? 'close' : 'person_add'}</span>
          {isAdding ? 'Cancel' : 'Add Tutor'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="border border-[#c3c6d7] bg-[#f8f9ff] rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-[#121c2a] text-sm">{editingTutorId ? 'Edit Tutor' : 'Add New Tutor'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-[#c3c6d7] focus:ring-2 focus:ring-[#004ac6] outline-none"
              placeholder="Full Name"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-[#c3c6d7] focus:ring-2 focus:ring-[#004ac6] outline-none"
              placeholder="Email Address"
            />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-[#c3c6d7] focus:ring-2 focus:ring-[#004ac6] outline-none"
              placeholder="Phone Number"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary text-xs px-4 py-2 rounded-xl" onClick={() => { setIsAdding(false); setEditingTutorId(null); }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary text-xs px-5 py-2 rounded-xl">
              {editingTutorId ? 'Save Changes' : 'Send Invite'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {tutors.length === 0 ? (
          <div className="py-16 text-center bg-gradient-to-b from-[#f8f9ff] to-white rounded-2xl border border-dashed border-[#cbd5e1] flex flex-col items-center justify-center space-y-4 shadow-sm">
            <div className="w-24 h-24 rounded-full bg-blue-50 border-4 border-white shadow-lg text-blue-500 flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-5xl">diversity_3</span>
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#0f172a] font-display">Build Your Care Team</p>
              <p className="text-sm text-[#64748b] max-w-md mx-auto mt-2">
                Invite tutors and caregivers to your platform. They will be able to log daily activities, manage rosters, and communicate with parents.
              </p>
            </div>
            <button 
              onClick={openAddForm}
              className="mt-4 btn bg-[#004ac6] hover:bg-[#003ea8] text-white text-sm font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Invite Your First Tutor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tutors.map(tutor => (
              <div 
                key={tutor.id} 
                className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Profile Card Header with Gradient */}
                <div className="h-24 bg-gradient-to-r from-[#eff6ff] via-[#dbeafe] to-[#eff6ff] relative flex justify-center">
                  {/* Action Menu (Top Right) */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditForm(tutor)}
                      className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm text-[#334155] hover:bg-white hover:text-[#2563eb] shadow-sm flex items-center justify-center transition-all"
                      title="Edit Tutor"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button 
                      onClick={() => onRemoveTutor(tutor.id)}
                      className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm text-[#334155] hover:bg-white hover:text-red-500 shadow-sm flex items-center justify-center transition-all"
                      title="Remove Tutor"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_remove</span>
                    </button>
                  </div>
                </div>

                <div className="px-5 pb-5 flex-1 flex flex-col items-center text-center">
                  {/* Large Avatar */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white flex items-center justify-center font-extrabold text-2xl border-4 border-white shadow-lg -mt-10 mb-3 relative z-10">
                    {tutor.email.substring(0, 2).toUpperCase()}
                  </div>

                  <h4 className="font-extrabold text-[#0f172a] text-lg font-display mb-1 truncate w-full">
                    {(tutor as any).name || 'Staff Member'}
                  </h4>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#2563eb] bg-[#eff6ff] px-2.5 py-1 rounded-full mb-4">
                    Caregiver
                  </span>

                  <div className="space-y-2 w-full text-xs text-[#64748b] mb-6">
                    <a href={`mailto:${tutor.email}`} className="flex items-center justify-center gap-2 hover:text-[#2563eb] transition-colors truncate">
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                      {tutor.email}
                    </a>
                    <a href={`tel:${tutor.phone}`} className="flex items-center justify-center gap-2 hover:text-[#2563eb] transition-colors">
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      {tutor.phone || 'No phone provided'}
                    </a>
                  </div>

                  {/* Primary Action Button (Bottom) */}
                  <div className="mt-auto w-full pt-4 border-t border-[#f1f5f9]">
                    <button 
                      onClick={() => onResendInvite(tutor.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f8fafc] text-[#475569] hover:bg-[#eff6ff] hover:text-[#2563eb] font-semibold text-xs transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      Resend Credentials
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
