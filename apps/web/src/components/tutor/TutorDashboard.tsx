import React, { useState, useEffect } from 'react';
import { ChildHealthStatus, EnrollmentDto, DailyLogMood } from '@daycare/shared-types';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface TutorDashboardProps {
  schoolRoster: EnrollmentDto[];
  onLogActivity: (data: {
    childId: string;
    isPresent: boolean;
    mood: DailyLogMood;
    achievements?: string[];
    milestones?: string[];
    allergiesSpotted?: string;
    assignments?: string;
    assessmentType?: string;
    assessmentResult?: string;
    behavior?: string;
    healthStatus?: ChildHealthStatus;
    healthNotes?: string;
    requiresPickup?: boolean;
    hospitalName?: string;
    hospitalNotes?: string;
  }) => Promise<void>;
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
  const [assessmentType, setAssessmentType] = useState('');
  const [assessmentResult, setAssessmentResult] = useState('');
  const [behavior, setBehavior] = useState('');
  const [healthStatus, setHealthStatus] = useState<ChildHealthStatus>(ChildHealthStatus.WELL);
  const [healthNotes, setHealthNotes] = useState('');
  const [requiresPickup, setRequiresPickup] = useState(false);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalNotes, setHospitalNotes] = useState('');

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
      assessmentType: assessmentType || undefined,
      assessmentResult: assessmentResult || undefined,
      behavior: behavior || undefined,
      healthStatus,
      healthNotes: healthNotes || undefined,
      requiresPickup,
      hospitalName: hospitalName || undefined,
      hospitalNotes: hospitalNotes || undefined,
    });

    setMood(DailyLogMood.HAPPY);
    setIsPresent(true);
    setAchievementsStr('');
    setMilestonesStr('');
    setAllergies('');
    setAssignments('');
    setAssessmentType('');
    setAssessmentResult('');
    setBehavior('');
    setHealthStatus(ChildHealthStatus.WELL);
    setHealthNotes('');
    setRequiresPickup(false);
    setHospitalName('');
    setHospitalNotes('');
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">Assessment / Exam</label>
                <input value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)} placeholder="e.g. Mid-term maths" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">Result / Feedback</label>
                <input value={assessmentResult} onChange={(e) => setAssessmentResult(e.target.value)} placeholder="e.g. 8/10, needs practice" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">Behaviour</label>
              <textarea value={behavior} onChange={(e) => setBehavior(e.target.value)} placeholder="Describe behaviour or social interaction" rows={2} className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white" />
            </div>

            <div className="border border-orange-200 bg-orange-50 rounded-xl p-3 space-y-3">
              <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider">Health and safety</label>
              <select value={healthStatus} onChange={(e) => setHealthStatus(e.target.value as ChildHealthStatus)} className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white">
                <option value={ChildHealthStatus.WELL}>Well</option>
                <option value={ChildHealthStatus.UNWELL}>Unwell</option>
                <option value={ChildHealthStatus.EMERGENCY}>Emergency</option>
                <option value={ChildHealthStatus.HOSPITALIZED}>Taken to hospital</option>
              </select>
              <textarea value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)} placeholder="Symptoms, action taken, or medical notes" rows={2} className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white" />
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121c2a]">
                <input type="checkbox" checked={requiresPickup} onChange={(e) => setRequiresPickup(e.target.checked)} className="w-4 h-4" />
                Parent should pick up the child
              </label>
              {healthStatus === ChildHealthStatus.HOSPITALIZED && (
                <>
                  <input value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="Hospital name" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white" />
                  <input value={hospitalNotes} onChange={(e) => setHospitalNotes(e.target.value)} placeholder="Hospital / transport details" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white" />
                </>
              )}
              {(requiresPickup || healthStatus === ChildHealthStatus.EMERGENCY || healthStatus === ChildHealthStatus.HOSPITALIZED) && <p className="text-xs font-semibold text-orange-800">The parent will receive an SMS when the log is submitted.</p>}
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
