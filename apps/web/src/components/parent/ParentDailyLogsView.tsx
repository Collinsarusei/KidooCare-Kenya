import React from 'react';
import { DailyLogDto, ChildDto } from '@daycare/shared-types';

interface ParentDailyLogsViewProps {
  myChildren: ChildDto[];
  dailyLogs: DailyLogDto[];
  loading: boolean;
  selectedChildId: string;
  setSelectedChildId: (id: string) => void;
  fetchDailyLogs: (childId: string) => void;
  onAcknowledgePickup: (logId: string) => void;
}

export const ParentDailyLogsView: React.FC<ParentDailyLogsViewProps> = ({
  myChildren,
  dailyLogs,
  loading,
  selectedChildId,
  setSelectedChildId,
  fetchDailyLogs,
  onAcknowledgePickup,
}) => {
  
  // Fetch logs when child changes
  React.useEffect(() => {
    if (selectedChildId) {
      fetchDailyLogs(selectedChildId);
    }
  }, [selectedChildId]);

  // Assessments are recorded separately by tutors (tests, evaluations)
  const [assessments, setAssessments] = React.useState<any[]>([]);
  React.useEffect(() => {
    setAssessments([]);
    if (!selectedChildId) return;
    const token = localStorage.getItem('token');
    fetch(`/api/assessments/child/${selectedChildId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAssessments(Array.isArray(d) ? d : []))
      .catch(() => setAssessments([]));
  }, [selectedChildId]);

  const presentDays = dailyLogs.filter((l) => l.isPresent).length;
  const allMilestones = dailyLogs.flatMap((l) => (l.milestones || []).map((m) => ({ m, d: l.createdAt })));

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
      ) : loading ? (
        <div className="text-center py-10 text-sm text-[#737686]" role="status">
          Loading daily activity...
        </div>
      ) : (
        <>
          {/* Progress summary + assessments */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#f8f9ff] border border-[#e6eeff] rounded-2xl p-3 text-center">
                <p className="text-xl font-extrabold text-[#004ac6]">{dailyLogs.length ? Math.round((presentDays / dailyLogs.length) * 100) : 0}%</p>
                <p className="text-[10px] font-bold text-[#737686] uppercase">Attendance</p>
              </div>
              <div className="bg-[#f8f9ff] border border-[#e6eeff] rounded-2xl p-3 text-center">
                <p className="text-xl font-extrabold text-[#006c49]">{allMilestones.length}</p>
                <p className="text-[10px] font-bold text-[#737686] uppercase">Milestones</p>
              </div>
              <div className="bg-[#f8f9ff] border border-[#e6eeff] rounded-2xl p-3 text-center">
                <p className="text-xl font-extrabold text-[#7c3aed]">{assessments.length}</p>
                <p className="text-[10px] font-bold text-[#737686] uppercase">Assessments</p>
              </div>
            </div>
            <div className="border border-[#e6eeff] rounded-2xl p-3">
              <h4 className="text-sm font-extrabold text-[#121c2a] flex items-center gap-1 mb-2">
                <span className="material-symbols-outlined text-base text-[#7c3aed]">quiz</span> Assessments
              </h4>
              {assessments.length === 0 ? (
                <p className="text-xs text-[#737686]">No assessments recorded yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {assessments.map((a) => (
                    <div key={a.id} className="flex justify-between gap-2 text-xs border-b border-[#f1f5f9] pb-1.5">
                      <div className="min-w-0">
                        <p className="font-bold text-[#121c2a] truncate">{a.title}{a.subject ? ` • ${a.subject}` : ''}</p>
                        <p className="text-[10px] text-[#737686]">{new Date(a.assessedOn).toLocaleDateString()}{a.remarks ? ` — ${a.remarks}` : ''}</p>
                      </div>
                      <p className="font-extrabold text-[#004ac6] shrink-0">
                        {a.score != null ? `${a.score}${a.maxScore ? `/${a.maxScore}` : ''}` : ''} {a.grade || ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      {dailyLogs.length === 0 ? (
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
                  <h4 className="text-[#004ac6] font-bold text-sm">
                    Logged by {log.tutor?.name || log.tutor?.email || 'tutor'}
                    {log.updatedAt ? ` • ${new Date(log.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </h4>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`badge ${log.isPresent ? 'badge-green' : 'badge-orange'}`}>
                    {log.isPresent ? 'Present' : 'Absent'}
                  </span>
                  {log.isPresent && log.mood && (
                    <span className={`badge ${log.mood === 'HAPPY' ? 'badge-blue' : log.mood === 'SAD' ? 'badge-orange' : 'badge-gray'}`}>
                      {log.mood.charAt(0) + log.mood.slice(1).toLowerCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Pickup request — shown whether or not a health issue was logged */}
              {log.requiresPickup && (
                <div
                  className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    log.pickedUpAt ? 'border-[#bbf7d0] bg-[#f0fdf4]' : 'border-[#fdba74] bg-[#fff7ed]'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-bold flex items-center gap-1 ${log.pickedUpAt ? 'text-[#166534]' : 'text-[#9a3412]'}`}>
                      <span className="material-symbols-outlined text-base">directions_walk</span>
                      {log.pickedUpAt
                        ? `Picked up at ${new Date(log.pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'The daycare has asked you to pick up your child'}
                    </p>
                    {log.healthNotes && <p className="text-xs text-[#434655] mt-0.5">Reason: {log.healthNotes}</p>}
                  </div>
                  {!log.pickedUpAt &&
                    (log.pickupAcknowledgedAt ? (
                      <span className="text-xs font-bold text-[#166534]">✓ You confirmed you're on the way</span>
                    ) : (
                      <button onClick={() => onAcknowledgePickup(log.id)} className="btn btn-primary text-xs py-1.5 px-4 rounded-xl shrink-0">
                        I'm on my way
                      </button>
                    ))}
                </div>
              )}

              {!log.isPresent && <p className="text-xs text-[#737686]">Your child was marked absent on this day.</p>}
              
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
                {log.assessmentType && (
                  <div>
                    <h4 className="font-bold text-[#121c2a] flex items-center gap-1"><span className="material-symbols-outlined text-sm">quiz</span> Assessment</h4>
                    <p className="text-xs text-[#434655]">{log.assessmentType}: {log.assessmentResult || 'Feedback pending'}</p>
                  </div>
                )}
                {log.behavior && (
                  <div>
                    <h4 className="font-bold text-[#121c2a] flex items-center gap-1"><span className="material-symbols-outlined text-sm">groups</span> Behaviour</h4>
                    <p className="text-xs text-[#434655]">{log.behavior}</p>
                  </div>
                )}
                {log.healthStatus !== 'WELL' && (
                  <div className="md:col-span-2 border border-orange-200 bg-orange-50 rounded-xl p-3">
                    <h4 className="font-bold text-orange-900 flex items-center gap-1"><span className="material-symbols-outlined text-sm">health_and_safety</span> Health: {log.healthStatus}</h4>
                    {log.healthNotes && <p className="text-xs text-orange-900 mt-1">{log.healthNotes}</p>}
                    {log.hospitalName && <p className="text-xs text-orange-900 mt-1">Hospital: {log.hospitalName}{log.hospitalNotes ? ` - ${log.hospitalNotes}` : ''}</p>}
                    {log.parentSmsSentAt && <p className="text-[11px] text-green-700 mt-2">SMS alert sent to your phone.</p>}
                  </div>
                )}
              </div>
              

            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
};
