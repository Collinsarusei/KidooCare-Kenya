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
          <div className="text-center py-10 bg-[#f8f9ff] rounded-2xl border border-dashed border-[#c3c6d7] space-y-2">
            <span className="material-symbols-outlined text-4xl text-[#737686]">group_off</span>
            <p className="text-sm font-semibold text-[#121c2a]">No Tutors Added</p>
            <p className="text-xs text-[#737686]">Add tutors so they can log daily activities for children.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tutors.map(tutor => (
              <div key={tutor.id} className="border border-[#e6eeff] bg-[#f8f9ff] rounded-2xl p-4 flex justify-between items-center hover:border-[#b4c5ff] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#004ac6] text-white flex items-center justify-center font-bold">
                    {tutor.email.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                  <h4 className="font-bold text-[#121c2a] text-sm">{tutor.email}</h4>
                    <p className="text-xs text-[#737686]">{tutor.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => onResendInvite(tutor.id)}
                    className="w-8 h-8 rounded-full bg-white border border-[#c3c6d7] text-[#004ac6] hover:bg-[#eff4ff] flex items-center justify-center transition-all"
                    title="Resend Credentials Invite"
                  >
                    <span className="material-symbols-outlined text-sm">mail</span>
                  </button>
                  <button 
                    onClick={() => openEditForm(tutor)}
                    className="w-8 h-8 rounded-full bg-white border border-[#c3c6d7] text-[#434655] hover:bg-[#f1f5f9] flex items-center justify-center transition-all"
                    title="Edit Tutor"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button 
                    onClick={() => onRemoveTutor(tutor.id)}
                    className="w-8 h-8 rounded-full bg-white border border-[#c3c6d7] text-[#c2410c] hover:bg-[#fff7ed] flex items-center justify-center transition-all"
                    title="Remove Tutor"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
