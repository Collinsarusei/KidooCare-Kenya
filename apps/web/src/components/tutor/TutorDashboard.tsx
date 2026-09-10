import React, { useState, useEffect } from 'react';
import { EnrollmentDto, DailyLogMood } from '@daycare/shared-types';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface TutorDashboardProps {
  schoolRoster: EnrollmentDto[];
  onLogActivity: (data: { childId: string; isPresent: boolean; mood: DailyLogMood; achievements?: string[]; milestones?: string[]; allergiesSpotted?: string; assignments?: string }) => Promise<void>;
  submittingLog: boolean;
}

export const TutorDashboard: React.FC<TutorDashboardProps> = ({
  schoolRoster,
  onLogActivity,
  submittingLog,
}) => {
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [isPresent, setIsPresent] = useState(true);
  const [mood, setMood] = useState<DailyLogMood>(DailyLogMood.HAPPY);
  const [achievementsStr, setAchievementsStr] = useState('');
  const [milestonesStr, setMilestonesStr] = useState('');
  const [allergies, setAllergies] = useState('');
  const [assignments, setAssignments] = useState('');

  const activeChildren = schoolRoster.filter(r => r.status === 'ACTIVE');
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    const initialAttendance: Record<string, boolean> = {};
    activeChildren.forEach(enr => {
      initialAttendance[enr.childId] = true;
    });
    setAttendance(initialAttendance);
  }, [schoolRoster]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;

    await onLogActivity({
      childId: selectedChildId,
      isPresent,
      mood,
      achievements: achievementsStr ? achievementsStr.split(',').map(s => s.trim()) : undefined,
      milestones: milestonesStr ? milestonesStr.split(',').map(s => s.trim()) : undefined,
      allergiesSpotted: allergies || undefined,
      assignments: assignments || undefined,
    });

    setMood(DailyLogMood.HAPPY);
    setIsPresent(true);
    setAchievementsStr('');
    setMilestonesStr('');
    setAllergies('');
    setAssignments('');
    setSelectedChildId('');
  };

  const handleSaveBulkAttendance = async () => {
    setConfirmConfig({
      title: 'Bulk Attendance',
      message: 'Submit bulk attendance for all active children?',
      onConfirm: async () => {
        setConfirmConfig(null);
        for (const enr of activeChildren) {
          await onLogActivity({
            childId: enr.childId,
            isPresent: attendance[enr.childId] || false,
            mood: DailyLogMood.HAPPY,
          });
        }
      }
    });
  };

  return (
    <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      {confirmConfig && (
        <ConfirmationModal
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
      <div className="flex justify-between items-center border-b border-[#e6eeff] pb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#004ac6] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">edit_note</span>
            Tutor Dashboard
          </h2>
          <p className="text-xs text-[#737686]">Log daily activities for children</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold text-[#121c2a] mb-4">Log New Activity</h3>
          <form onSubmit={handleSubmit} className="space-y-4 border border-[#e6eeff] bg-[#f8f9ff] rounded-2xl p-5">
            <div>
              <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">Select Child *</label>
              <select
                required
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white focus:ring-2 focus:ring-[#004ac6] outline-none"
              >
                <option value="" disabled>Select a child...</option>
                {activeChildren.map(enr => (
                  <option key={enr.childId} value={enr.childId}>{enr.child?.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-[#c3c6d7]">
              <input 
                type="checkbox" 
                id="isPresentLog"
                checked={isPresent}
                onChange={(e) => setIsPresent(e.target.checked)}
                className="w-4 h-4 text-[#004ac6] focus:ring-[#004ac6] border-[#c3c6d7] rounded"
              />
              <label htmlFor="isPresentLog" className="text-sm font-bold text-[#121c2a]">Child is Present Today</label>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">Mood *</label>
              <select
                required
                value={mood}
                onChange={(e) => setMood(e.target.value as DailyLogMood)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white focus:ring-2 focus:ring-[#004ac6] outline-none"
              >
                {Object.values(DailyLogMood).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">Achievements (comma separated)</label>
              <input
                type="text"
                value={achievementsStr}
                onChange={(e) => setAchievementsStr(e.target.value)}
                placeholder="e.g. Ate all veggies, Shared toys"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white focus:ring-2 focus:ring-[#004ac6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">Milestones (comma separated)</label>
              <input
                type="text"
                value={milestonesStr}
                onChange={(e) => setMilestonesStr(e.target.value)}
                placeholder="e.g. First steps, Spoke a new word"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white focus:ring-2 focus:ring-[#004ac6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">Allergies Spotted</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Rash after eating peanuts"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white focus:ring-2 focus:ring-[#004ac6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">Assignments</label>
              <textarea
                value={assignments}
                onChange={(e) => setAssignments(e.target.value)}
                placeholder="e.g. Read a book before bedtime"
                rows={2}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white focus:ring-2 focus:ring-[#004ac6] outline-none"
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={submittingLog || !selectedChildId}
                className="w-full btn btn-primary text-sm px-6 py-3 rounded-xl shadow-md disabled:opacity-50"
              >
                {submittingLog ? 'Saving...' : 'Submit Daily Log'}
              </button>
            </div>
          </form>
        </div>

        <div>
          <h3 className="font-bold text-[#121c2a] mb-4 flex items-center justify-between">
            Master Roster ({activeChildren.length})
            <button 
              onClick={handleSaveBulkAttendance}
              disabled={submittingLog}
              className="btn btn-primary text-xs py-1.5 px-3 rounded-lg shadow-sm"
            >
              {submittingLog ? 'Saving...' : 'Submit Bulk Attendance'}
            </button>
          </h3>
          <div className="bg-white border border-[#e6eeff] rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8f9ff] text-[#737686] font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Child Name</th>
                  <th className="px-4 py-3 text-center">Present</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6eeff]">
                {activeChildren.map(enr => (
                  <tr key={enr.childId} className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#121c2a]">
                      {enr.child?.name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={attendance[enr.childId] || false}
                        onChange={(e) => setAttendance(prev => ({ ...prev, [enr.childId]: e.target.checked }))}
                        className="w-5 h-5 text-[#004ac6] focus:ring-[#004ac6] border-[#c3c6d7] rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
