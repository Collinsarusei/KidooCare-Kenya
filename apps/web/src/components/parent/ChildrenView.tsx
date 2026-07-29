import React, { useState } from 'react';
import { ChildDto } from '@daycare/shared-types';

interface ChildrenViewProps {
  myChildren: ChildDto[];
  onRegisterChild: (name: string, dob: string, notes: string) => void;
}

export const ChildrenView: React.FC<ChildrenViewProps> = ({ myChildren, onRegisterChild }) => {
  const [childName, setChildName] = useState('');
  const [childDob, setChildDob] = useState('2023-05-10');
  const [childNotes, setChildNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegisterChild(childName, childDob, childNotes);
    setChildName('');
    setChildNotes('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Registered Children List (Screen 04) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#e6eeff] pb-4">
            <div>
              <h3 className="text-xl font-bold text-[#121c2a] font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004ac6]">family_restroom</span>
                My Children ({myChildren.length})
              </h3>
              <p className="text-xs text-[#737686]">Managed children profiles for daycare enrollments</p>
            </div>
            <span className="badge badge-blue">
              <span className="material-symbols-outlined text-xs">verified_user</span>
              Parent Account
            </span>
          </div>

          {myChildren.length === 0 ? (
            <div className="text-center py-10 bg-[#f8f9ff] rounded-2xl border border-dashed border-[#c3c6d7] space-y-2">
              <span className="material-symbols-outlined text-4xl text-[#737686]">child_care</span>
              <p className="text-sm font-semibold text-[#121c2a]">No Children Profiles Registered Yet</p>
              <p className="text-xs text-[#737686] max-w-sm mx-auto">
                Fill out the Child Intake Form to register your child and begin enrolling in daycare programs.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myChildren.map((child) => (
                <div 
                  key={child.id} 
                  className="bg-white border border-[#e6eeff] rounded-2xl p-5 shadow-sm hover:border-[#b4c5ff] transition-all space-y-3 relative group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e6eeff] text-[#004ac6] flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-xl">child_care</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#004ac6] text-base font-display">
                        {child.name}
                      </h4>
                      <p className="text-xs text-[#737686]">
                        DOB: {new Date(child.dob).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {child.notes && (
                    <div className="bg-[#fff7ed] border border-[#fdba74] p-3 rounded-xl text-xs space-y-0.5">
                      <span className="font-bold text-[#c2410c] uppercase text-[10px] tracking-wider block">
                        Care & Medical Notes
                      </span>
                      <p className="text-[#434655] italic">{child.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Child Intake Form Card */}
      <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-md space-y-5 h-fit">
        <div className="border-b border-[#e6eeff] pb-4">
          <h4 className="text-lg font-bold text-[#004ac6] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006c49]">person_add</span>
            Child Intake Form
          </h4>
          <p className="text-xs text-[#737686]">Add child profile for instant daycare booking</p>
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
              value={childName} 
              onChange={(e) => setChildName(e.target.value)} 
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1">
              Date of Birth *
            </label>
            <input 
              type="date" 
              required 
              value={childDob} 
              onChange={(e) => setChildDob(e.target.value)} 
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1">
              Medical / Dietary / Care Notes
            </label>
            <textarea 
              rows={3} 
              placeholder="Allergies, emergency contacts, special care needs..." 
              value={childNotes} 
              onChange={(e) => setChildNotes(e.target.value)} 
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
            />
          </div>

          <button 
            type="submit" 
            className="w-full btn btn-primary py-3 rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            Register Child Profile
          </button>
        </form>
      </div>
    </div>
  );
};

