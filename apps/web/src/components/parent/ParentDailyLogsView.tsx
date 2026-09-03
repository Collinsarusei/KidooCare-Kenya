import React from 'react';
import { DailyLogDto, ChildDto } from '@daycare/shared-types';

interface ParentDailyLogsViewProps {
  myChildren: ChildDto[];
  dailyLogs: DailyLogDto[];
  selectedChildId: string;
  setSelectedChildId: (id: string) => void;
  fetchDailyLogs: (childId: string) => void;
}

export const ParentDailyLogsView: React.FC<ParentDailyLogsViewProps> = ({
  myChildren,
  dailyLogs,
  selectedChildId,
  setSelectedChildId,
  fetchDailyLogs,
}) => {
  
  // Fetch logs when child changes
  React.useEffect(() => {
    if (selectedChildId) {
      fetchDailyLogs(selectedChildId);
    }
  }, [selectedChildId]);

  return (
    <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-[#e6eeff] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#004ac6] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">history_edu</span>
            Daily Activity Logs
          </h3>
          <p className="text-xs text-[#737686]">View reports from your child's tutors</p>
        </div>
        
        {myChildren.length > 0 && (
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="px-4 py-2 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none font-semibold"
          >
            <option value="" disabled>Select Child</option>
            {myChildren.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {myChildren.length === 0 ? (
        <div className="text-center py-10 bg-[#f8f9ff] rounded-2xl border border-dashed border-[#c3c6d7] space-y-2">
          <span className="material-symbols-outlined text-4xl text-[#737686]">no_accounts</span>
          <p className="text-sm font-semibold text-[#121c2a]">No Children Registered</p>
          <p className="text-xs text-[#737686]">Register your children to view their daily logs.</p>
        </div>
      ) : !selectedChildId ? (
        <div className="text-center py-10 bg-[#f8f9ff] rounded-2xl border border-dashed border-[#c3c6d7] space-y-2">
          <span className="material-symbols-outlined text-4xl text-[#737686]">touch_app</span>
          <p className="text-sm font-semibold text-[#121c2a]">Select a Child</p>
          <p className="text-xs text-[#737686]">Please select a child from the dropdown to view logs.</p>
        </div>
      ) : dailyLogs.length === 0 ? (
        <div className="text-center py-10 bg-[#f8f9ff] rounded-2xl border border-dashed border-[#c3c6d7] space-y-2">
          <span className="material-symbols-outlined text-4xl text-[#737686]">history</span>
          <p className="text-sm font-semibold text-[#121c2a]">No Logs Found</p>
          <p className="text-xs text-[#737686]">Tutors have not logged any activity for this child yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dailyLogs.map(log => (
            <div key={log.id} className="border border-[#e6eeff] bg-[#f8f9ff] rounded-2xl p-5 hover:border-[#b4c5ff] transition-all space-y-3">
              <div className="flex justify-between items-start border-b border-[#e6eeff] pb-3 mb-3">
                <div>
                  <span className="text-xs font-bold text-[#737686] uppercase tracking-wider block mb-1">
                    {new Date(log.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <h4 className="text-[#004ac6] font-bold text-sm">Logged by Tutor ID: {log.tutorId}</h4>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`badge ${log.isPresent ? 'badge-green' : 'badge-orange'}`}>
                    {log.isPresent ? 'Present' : 'Absent'}
                  </span>
                  <span className={`badge ${log.mood === 'HAPPY' ? 'badge-blue' : log.mood === 'SAD' ? 'badge-orange' : 'badge-gray'}`}>
                    {log.mood}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {log.achievements && log.achievements.length > 0 && (
                  <div>
                    <h4 className="font-bold text-[#121c2a] flex items-center gap-1"><span className="material-symbols-outlined text-sm">star</span> Achievements</h4>
                    <ul className="list-disc pl-5 text-[#434655] text-xs space-y-1 mt-1">
                      {log.achievements.map((ach, idx) => <li key={idx}>{ach}</li>)}
                    </ul>
                  </div>
                )}
                {log.milestones && log.milestones.length > 0 && (
                  <div>
                    <h4 className="font-bold text-[#121c2a] flex items-center gap-1"><span className="material-symbols-outlined text-sm">emoji_events</span> Milestones</h4>
                    <ul className="list-disc pl-5 text-[#434655] text-xs space-y-1 mt-1">
                      {log.milestones.map((mil, idx) => <li key={idx}>{mil}</li>)}
                    </ul>
                  </div>
                )}
                {log.allergiesSpotted && (
                  <div>
                    <h4 className="font-bold text-[#121c2a] flex items-center gap-1"><span className="material-symbols-outlined text-sm">medical_information</span> Allergies Spotted</h4>
                    <p className="text-xs text-[#c2410c]">{log.allergiesSpotted}</p>
                  </div>
                )}
                {log.assignments && (
                  <div>
                    <h4 className="font-bold text-[#121c2a] flex items-center gap-1"><span className="material-symbols-outlined text-sm">menu_book</span> Assignments</h4>
                    <p className="text-xs text-[#434655]">{log.assignments}</p>
                  </div>
                )}
              </div>
              

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
