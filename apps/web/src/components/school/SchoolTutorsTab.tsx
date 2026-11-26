import React, { useState } from 'react';
import { UserDto } from '@daycare/shared-types';

interface SchoolTutorsTabProps {
  tutors: UserDto[];
  onAddTutor: (data: { name: string; email: string; phone: string; password: string }) => void;
  onUpdateTutor: (tutorId: string, data: { name: string; email: string; phone: string }) => void;
  onRemoveTutor: (tutorId: string) => void;
  onResendInvite: (tutorId: string) => void;
  inviteNotice: { email: string; sent: boolean; message: string; url?: string } | null;
  onDismissInviteNotice: () => void;
}

export const SchoolTutorsTab: React.FC<SchoolTutorsTabProps> = ({
  tutors,
  onAddTutor,
  onUpdateTutor,
  onRemoveTutor,
  onResendInvite,
  inviteNotice,
  onDismissInviteNotice,
}) => {
  const [copied, setCopied] = useState(false);
  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this invitation link:', url);
    }
  };
  const [isAdding, setIsAdding] = useState(false);
  const [editingTutorId, setEditingTutorId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTutorId) {
      onUpdateTutor(editingTutorId, { name, email, phone });
    } else {
      onAddTutor({ name, email, phone, password });
    }
    setIsAdding(false);
    setEditingTutorId(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
  };

  const openAddForm = () => {
    setIsAdding(true);
    setEditingTutorId(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
  };

  const openEditForm = (tutor: UserDto) => {
    setIsAdding(true);
    setEditingTutorId(tutor.id);
    setName((tutor as any).name || '');
    setEmail(tutor.email);
    setPhone(tutor.phone || '');
    setPassword('');
  };

  return (
    <div className="bg-white border border-[#dcf0f8] rounded-3xl p-4 md:p-5 shadow-sm space-y-4">
      {inviteNotice && (
        <div
          className={`rounded-2xl border p-4 text-xs space-y-2 ${
            inviteNotice.sent ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]' : 'border-[#fdba74] bg-[#fff7ed] text-[#9a3412]'
          }`}
        >
          <div className="flex justify-between items-start gap-2">
            <p className="font-bold">
              {inviteNotice.sent
                ? `Invitation email sent to ${inviteNotice.email}.`
                : `The invitation email to ${inviteNotice.email} was NOT sent.`}
            </p>
            <button onClick={onDismissInviteNotice} className="font-bold opacity-70 hover:opacity-100">✕</button>
          </div>
          {!inviteNotice.sent && inviteNotice.message && <p>{inviteNotice.message}</p>}
          {inviteNotice.url && !inviteNotice.sent && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input readOnly value={inviteNotice.url} className="flex-1 px-3 py-2 rounded-lg border border-[#fdba74] bg-white text-[11px] font-mono" />
              <button onClick={() => copyLink(inviteNotice.url!)} className="btn btn-primary text-xs px-4 py-2 rounded-lg">
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          )}
          {!inviteNotice.sent && (
            <p className="text-[11px] opacity-80">Send this link to the tutor (WhatsApp/SMS). They can also log in with the temporary password you set.</p>
          )}
        </div>
      )}
      <div className="flex justify-between items-center border-b border-[#dcf0f8] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#0b6e99] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0b6e99]">co_present</span>
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
        <form onSubmit={handleSubmit} className="border border-[#c3c6d7] bg-[#f3fafd] rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-[#0b2a3c] text-sm">{editingTutorId ? 'Edit Tutor' : 'Add New Tutor'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-[#c3c6d7] focus:ring-2 focus:ring-[#0b6e99] outline-none"
              placeholder="Full Name"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-[#c3c6d7] focus:ring-2 focus:ring-[#0b6e99] outline-none"
              placeholder="Email Address"
            />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-[#c3c6d7] focus:ring-2 focus:ring-[#0b6e99] outline-none"
              placeholder="Phone Number"
            />
            {!editingTutorId && (
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-[#c3c6d7] focus:ring-2 focus:ring-[#0b6e99] outline-none"
                placeholder="Temporary Password (6+ chars)"
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary text-xs px-4 py-2 rounded-xl" onClick={() => { setIsAdding(false); setEditingTutorId(null); }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary text-xs px-5 py-2 rounded-xl">
              {editingTutorId ? 'Save Changes' : 'Add Tutor'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {tutors.length === 0 ? (
          <div className="py-16 text-center bg-gradient-to-b from-[#f3fafd] to-white rounded-2xl border border-dashed border-[#cbd5e1] flex flex-col items-center justify-center space-y-4 shadow-sm">
            <div className="w-24 h-24 rounded-full bg-sky-50 border-4 border-white shadow-lg text-sky-600 flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-5xl">diversity_3</span>
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#082233] font-display">Build Your Care Team</p>
              <p className="text-sm text-[#64748b] max-w-md mx-auto mt-2">
                Invite tutors and caregivers to your platform. They will be able to log daily activities, manage rosters, and communicate with parents.
              </p>
            </div>
            <button 
              onClick={openAddForm}
              className="mt-4 btn bg-[#0b6e99] hover:bg-[#085a7e] text-white text-sm font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
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
                <div className="h-24 bg-gradient-to-r from-[#e8f6fb] via-[#d2ecf7] to-[#e8f6fb] relative flex justify-center">
                  {/* Action Menu (Top Right) */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditForm(tutor)}
                      className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm text-[#334155] hover:bg-white hover:text-[#1188c2] shadow-sm flex items-center justify-center transition-all"
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
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1188c2] to-[#085a7e] text-white flex items-center justify-center font-extrabold text-2xl border-4 border-white shadow-lg -mt-10 mb-3 relative z-10">
                    {tutor.email.substring(0, 2).toUpperCase()}
                  </div>

                  <h4 className="font-extrabold text-[#082233] text-lg font-display mb-1 truncate w-full">
                    {(tutor as any).name || 'Staff Member'}
                  </h4>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#1188c2] bg-[#e8f6fb] px-2.5 py-1 rounded-full mb-4">
                    Caregiver
                  </span>

                  <div className="space-y-2 w-full text-xs text-[#64748b] mb-6">
                    <span className="flex items-center justify-center gap-2 truncate select-all">
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                      {tutor.email}
                    </span>
                    <a href={`tel:${tutor.phone}`} className="flex items-center justify-center gap-2 hover:text-[#1188c2] transition-colors">
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      {tutor.phone || 'No phone provided'}
                    </a>
                  </div>

                  {/* Invitation status + resend */}
                  <div className="mt-auto w-full pt-4 border-t border-[#f1f5f9] space-y-2">
                    {(() => {
                      const inv = (tutor as any).tutorInvitation as { acceptedAt?: string | null; expiresAt?: string } | null;
                      const active = (tutor as any).mustChangePassword === false || !!inv?.acceptedAt;
                      if (active) {
                        return <p className="text-center text-[11px] font-bold text-[#166534]">✓ Account active</p>;
                      }
                      const expired = inv?.expiresAt && new Date(inv.expiresAt) < new Date();
                      return (
                        <>
                          <p className={`text-center text-[11px] font-bold ${inv && !expired ? 'text-[#b45309]' : 'text-[#b91c1c]'}`}>
                            {!inv ? 'No invitation sent yet' : expired ? 'Invitation expired' : 'Invitation pending'}
                          </p>
                          <button
                            onClick={() => onResendInvite(tutor.id)}
                            className="w-full text-xs font-bold text-[#0b6e99] border border-[#c3c6d7] rounded-xl py-2 hover:bg-[#e8f6fb]"
                          >
                            {inv ? 'Resend invitation' : 'Send invitation'}
                          </button>
                        </>
                      );
                    })()}
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
