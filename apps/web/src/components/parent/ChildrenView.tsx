import React from 'react';
import { ChildDto } from '@daycare/shared-types';

interface ChildrenViewProps {
  myChildren: ChildDto[];
  onAddChildClick: () => void;
  onEditChildClick: (child: ChildDto) => void;
  onDeleteChildClick: (childId: string) => void;
}

export const ChildrenView: React.FC<ChildrenViewProps> = ({ 
  myChildren, 
  onAddChildClick,
  onEditChildClick,
  onDeleteChildClick
}) => {
  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Registered Children List */}
      <div className="space-y-6">
        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#e6eeff] pb-4">
            <div>
              <h3 className="text-xl font-bold text-[#121c2a] font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004ac6]">family_restroom</span>
                My Children ({myChildren.length})
              </h3>
              <p className="text-xs text-[#737686]">Managed children profiles for daycare enrollments</p>
            </div>
            <button 
              onClick={onAddChildClick}
              className="btn btn-primary text-xs py-2 px-4 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Add Child
            </button>
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
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEditChildClick(child)}
                      className="w-8 h-8 rounded-full bg-[#f8f9ff] text-[#004ac6] border border-[#e6eeff] hover:bg-[#e6eeff] flex items-center justify-center transition-colors shadow-xs"
                      title="Edit Child"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button 
                      onClick={() => onDeleteChildClick(child.id)}
                      className="w-8 h-8 rounded-full bg-[#fff5f5] text-[#dc2626] border border-[#ffe6e6] hover:bg-[#ffe6e6] flex items-center justify-center transition-colors shadow-xs"
                      title="Delete Child"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
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
    </div>
  );
};

