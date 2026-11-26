import React, { useEffect, useMemo, useState } from 'react';
import { ChildHealthStatus, EnrollmentDto, DailyLogMood, DailyLogDto } from '@daycare/shared-types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import toast from 'react-hot-toast';

export interface TutorLogInput {
  childId: string;
  isPresent: boolean;
  mood?: DailyLogMood;
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
  attendanceOnly?: boolean;
}

interface TutorDashboardProps {
  schoolRoster: EnrollmentDto[];
  todayLogs: DailyLogDto[];
  onLogActivity: (data: TutorLogInput, opts?: { silent?: boolean }) => Promise<boolean>;
  onMarkPickedUp: (logId: string) => Promise<void>;
  onRefresh: () => void;
  submittingLog: boolean;
}

type Attendance = 'PRESENT' | 'ABSENT';

const inputCls =
  'w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white focus:ring-2 focus:ring-[#0b6e99] outline-none';
const labelCls = 'block text-xs font-bold text-[#0b2a3c] uppercase tracking-wider mb-1.5';

export const TutorDashboard: React.FC<TutorDashboardProps> = ({
  schoolRoster,
  todayLogs,
  onLogActivity,
  onMarkPickedUp,
  onRefresh,
  submittingLog,
}) => {
  // One row per child (a child can have several active enrollments)
  const activeChildren = useMemo(() => {
    const seen = new Map<string, EnrollmentDto>();
    schoolRoster.filter((r) => r.status === 'ACTIVE').forEach((r) => {
      if (!seen.has(r.childId)) seen.set(r.childId, r);
    });
    return [...seen.values()];
  }, [schoolRoster]);

  const logByChild = useMemo(() => {
    const m = new Map<string, DailyLogDto>();
    todayLogs.forEach((l) => {
      if (!m.has(l.childId)) m.set(l.childId, l);
    });
    return m;
  }, [todayLogs]);

  // ── Single child log form ────────────────────────────────────────────────
  const [selectedChildId, setSelectedChildId] = useState('');
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

  // Pre-fill the form with what was already logged today for that child
  useEffect(() => {
    const log = selectedChildId ? logByChild.get(selectedChildId) : undefined;
    setIsPresent(log ? log.isPresent : true);
    setMood((log?.mood as DailyLogMood) || DailyLogMood.HAPPY);
    setAchievementsStr(log?.achievements?.join(', ') || '');
    setMilestonesStr(log?.milestones?.join(', ') || '');
    setAllergies(log?.allergiesSpotted || '');
    setAssignments(log?.assignments || '');
    setAssessmentType(log?.assessmentType || '');
    setAssessmentResult(log?.assessmentResult || '');
    setBehavior(log?.behavior || '');
    setHealthStatus((log?.healthStatus as ChildHealthStatus) || ChildHealthStatus.WELL);
    setHealthNotes(log?.healthNotes || '');
    setRequiresPickup(!!log?.requiresPickup && !log?.pickedUpAt);
    setHospitalName(log?.hospitalName || '');
    setHospitalNotes(log?.hospitalNotes || '');
  }, [selectedChildId, logByChild]);

  const splitList = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;
    if (isPresent && requiresPickup && !healthNotes.trim()) {
      toast.error('Please add a note telling the parent why they need to pick up their child.');
      return;
    }
    const ok = await onLogActivity(
      isPresent
        ? {
            childId: selectedChildId,
            isPresent: true,
            mood,
            achievements: splitList(achievementsStr),
            milestones: splitList(milestonesStr),
            allergiesSpotted: allergies.trim() || undefined,
            assignments: assignments.trim() || undefined,
            assessmentType: assessmentType.trim() || undefined,
            assessmentResult: assessmentResult.trim() || undefined,
            behavior: behavior.trim() || undefined,
            healthStatus,
            healthNotes: healthNotes.trim() || undefined,
            requiresPickup,
            hospitalName: healthStatus === ChildHealthStatus.HOSPITALIZED ? hospitalName.trim() || undefined : undefined,
            hospitalNotes: healthStatus === ChildHealthStatus.HOSPITALIZED ? hospitalNotes.trim() || undefined : undefined,
          }
        : { childId: selectedChildId, isPresent: false },
    );
    if (ok) {
      setAttendance((prev) => ({ ...prev, [selectedChildId]: isPresent ? 'PRESENT' : 'ABSENT' }));
      setSelectedChildId('');
    }
  };

  // ── Bulk attendance ──────────────────────────────────────────────────────
  const [attendance, setAttendance] = useState<Record<string, Attendance>>({});
  useEffect(() => {
    const init: Record<string, Attendance> = {};
    activeChildren.forEach((enr) => {
      const log = logByChild.get(enr.childId);
      init[enr.childId] = log ? (log.isPresent ? 'PRESENT' : 'ABSENT') : 'PRESENT';
    });
    setAttendance(init);
  }, [activeChildren, logByChild]);

  const presentCount = Object.values(attendance).filter((a) => a === 'PRESENT').length;
  const absentCount = activeChildren.length - presentCount;
  const markAll = (a: Attendance) =>
    setAttendance(Object.fromEntries(activeChildren.map((c) => [c.childId, a])));

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);

  const saveBulkAttendance = async () => {
    setConfirmOpen(false);
    setSavingBulk(true);
    let failed = 0;
    for (const enr of activeChildren) {
      const ok = await onLogActivity(
        { childId: enr.childId, isPresent: attendance[enr.childId] !== 'ABSENT', attendanceOnly: true },
        { silent: true },
      );
      if (!ok) failed++;
    }
    setSavingBulk(false);
    onRefresh();
    if (failed) toast.error(`${failed} attendance record(s) could not be saved. Please try again.`);
    else toast.success(`Attendance saved: ${presentCount} present, ${absentCount} absent.`);
  };

  // ── Pickup requests ──────────────────────────────────────────────────────
  const openPickups = todayLogs.filter((l) => l.requiresPickup && !l.pickedUpAt);
  const childName = (id: string) =>
    activeChildren.find((c) => c.childId === id)?.child?.name || todayLogs.find((l) => l.childId === id)?.child?.name || 'Child';

  return (
    <div className="space-y-6">
      {confirmOpen && (
        <ConfirmationModal
          title="Save today's attendance"
          message={`Mark ${presentCount} child(ren) present and ${absentCount} absent for today? Parents will see this in their Daily Logs.`}
          confirmText="Save attendance"
          onConfirm={saveBulkAttendance}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      <div className="bg-white border border-[#dcf0f8] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-[#dcf0f8] pb-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0b6e99] font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0b6e99]">edit_note</span>
              Tutor Dashboard
            </h2>
            <p className="text-xs text-[#737686]">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} • take attendance, log
              each child's day, and ask parents to pick up when needed
            </p>
          </div>
          <button onClick={onRefresh} className="btn btn-secondary text-xs px-3 py-2 rounded-xl flex items-center gap-1">
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </button>
        </div>

        {/* OPEN PICKUP REQUESTS */}
        {openPickups.length > 0 && (
          <div className="border border-[#fed7aa] bg-[#fff7ed] rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-[#9a3412] flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-lg">directions_walk</span>
              Waiting for parent pickup ({openPickups.length})
            </h3>
            {openPickups.map((l) => (
              <div key={l.id} className="bg-white rounded-xl border border-[#fed7aa] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-sm text-[#0b2a3c]">{childName(l.childId)}</p>
                  {l.healthNotes && <p className="text-xs text-[#9a3412]">{l.healthNotes}</p>}
                  <p className="text-[11px] mt-0.5 font-semibold">
                    {l.pickupAcknowledgedAt ? (
                      <span className="text-[#166534]">✓ Parent is on the way ({new Date(l.pickupAcknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                    ) : (
                      <span className="text-[#737686]">Parent has not responded yet</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => onMarkPickedUp(l.id)}
                  className="btn btn-success text-xs py-1.5 px-4 rounded-xl flex items-center gap-1 shrink-0"
                >
                  <span className="material-symbols-outlined text-base">how_to_reg</span>
                  Mark picked up
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LOG FORM */}
          <div>
            <h3 className="font-bold text-[#0b2a3c] mb-4">Log a Child's Day</h3>
            <form onSubmit={handleSubmit} className="space-y-4 border border-[#dcf0f8] bg-[#f3fafd] rounded-2xl p-5">
              <div>
                <label className={labelCls}>Select Child *</label>
                <select required value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)} className={inputCls}>
                  <option value="" disabled>Select a child...</option>
                  {activeChildren.map((enr) => (
                    <option key={enr.childId} value={enr.childId}>
                      {enr.child?.name}
                      {logByChild.has(enr.childId) ? ' (logged today)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Attendance *</label>
                <div className="grid grid-cols-2 gap-2">
                  {([true, false] as const).map((p) => (
                    <button
                      type="button"
                      key={String(p)}
                      onClick={() => setIsPresent(p)}
                      className={`py-2.5 rounded-xl text-sm font-bold border flex items-center justify-center gap-1 transition-all ${
                        isPresent === p
                          ? p
                            ? 'bg-[#dcfce7] text-[#166534] border-[#86efac]'
                            : 'bg-[#fee2e2] text-[#b91c1c] border-[#fca5a5]'
                          : 'bg-white text-[#475569] border-[#c3c6d7]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{p ? 'check_circle' : 'cancel'}</span>
                      {p ? 'Present' : 'Absent'}
                    </button>
                  ))}
                </div>
              </div>

              {!isPresent ? (
                <p className="text-xs text-[#737686] bg-white border border-[#dcf0f8] rounded-xl p-3">
                  The child will be recorded as <strong>absent</strong> today. The parent sees this in their Daily Logs.
                </p>
              ) : (
                <>
                  <div>
                    <label className={labelCls}>Mood *</label>
                    <select required value={mood} onChange={(e) => setMood(e.target.value as DailyLogMood)} className={inputCls}>
                      {Object.values(DailyLogMood).map((m) => (
                        <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Achievements (comma separated)</label>
                    <input type="text" value={achievementsStr} onChange={(e) => setAchievementsStr(e.target.value)} placeholder="e.g. Ate all veggies, Shared toys" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Milestones (comma separated)</label>
                    <input type="text" value={milestonesStr} onChange={(e) => setMilestonesStr(e.target.value)} placeholder="e.g. First steps, Spoke a new word" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Allergies Spotted</label>
                    <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. Rash after eating peanuts" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Assignments</label>
                    <textarea value={assignments} onChange={(e) => setAssignments(e.target.value)} placeholder="e.g. Read a book before bedtime" rows={2} className={inputCls} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Assessment / Exam</label>
                      <input value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)} placeholder="e.g. Mid-term maths" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Result / Feedback</label>
                      <input value={assessmentResult} onChange={(e) => setAssessmentResult(e.target.value)} placeholder="e.g. 8/10, needs practice" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Behaviour</label>
                    <textarea value={behavior} onChange={(e) => setBehavior(e.target.value)} placeholder="Describe behaviour or social interaction" rows={2} className={inputCls} />
                  </div>

                  <div className={`rounded-xl border p-3 space-y-3 ${requiresPickup || healthStatus !== ChildHealthStatus.WELL ? 'border-[#fdba74] bg-[#fff7ed]' : 'border-[#c3c6d7] bg-white'}`}>
                    <label className={labelCls}>Health and safety</label>
                    <select value={healthStatus} onChange={(e) => setHealthStatus(e.target.value as ChildHealthStatus)} className={inputCls}>
                      <option value={ChildHealthStatus.WELL}>Well</option>
                      <option value={ChildHealthStatus.UNWELL}>Unwell</option>
                      <option value={ChildHealthStatus.EMERGENCY}>Emergency</option>
                      <option value={ChildHealthStatus.HOSPITALIZED}>Taken to hospital</option>
                    </select>
                    <textarea value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)} placeholder="Symptoms, action taken, or reason for pickup" rows={2} className={inputCls} />
                    {healthStatus === ChildHealthStatus.HOSPITALIZED && (
                      <>
                        <input value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="Hospital name" className={inputCls} />
                        <input value={hospitalNotes} onChange={(e) => setHospitalNotes(e.target.value)} placeholder="Hospital / transport details" className={inputCls} />
                      </>
                    )}
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={requiresPickup} onChange={(e) => setRequiresPickup(e.target.checked)} className="w-4 h-4 mt-0.5" />
                      <span>
                        <span className="text-sm font-bold text-[#0b2a3c]">Parent should pick up the child</span>
                        <span className="block text-[11px] text-[#737686]">
                          The parent sees an alert at the top of their dashboard (and gets an SMS if SMS is configured), can reply
                          "I'm on my way", and you mark the child as picked up here.
                        </span>
                      </span>
                    </label>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submittingLog || !selectedChildId}
                className="w-full btn btn-primary text-sm px-6 py-3 rounded-xl shadow-md disabled:opacity-50"
              >
                {submittingLog ? 'Saving...' : logByChild.has(selectedChildId) ? "Update Today's Log" : 'Submit Daily Log'}
              </button>
            </form>
          </div>

          {/* ATTENDANCE ROSTER */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-[#0b2a3c]">Today's Attendance ({activeChildren.length})</h3>
              <div className="flex gap-1">
                <button onClick={() => markAll('PRESENT')} className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#86efac] text-[#166534] bg-[#f0fdf4]">All present</button>
                <button onClick={() => markAll('ABSENT')} className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#fca5a5] text-[#b91c1c] bg-[#fef2f2]">All absent</button>
              </div>
            </div>

            {activeChildren.length === 0 ? (
              <div className="text-center py-10 bg-[#f3fafd] rounded-2xl border border-dashed border-[#c3c6d7] text-xs text-[#737686]">
                No actively enrolled children at your school yet.
              </div>
            ) : (
              <div className="bg-white border border-[#dcf0f8] rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f3fafd] text-[#737686] font-bold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Child</th>
                      <th className="px-4 py-3 text-center">Attendance</th>
                      <th className="px-4 py-3 text-right">Saved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dcf0f8]">
                    {activeChildren.map((enr) => {
                      const status = attendance[enr.childId] || 'PRESENT';
                      const saved = logByChild.get(enr.childId);
                      return (
                        <tr key={enr.childId} className="hover:bg-[#f3fafd] transition-colors">
                          <td className="px-4 py-3 font-semibold text-[#0b2a3c]">{enr.child?.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1">
                              {(['PRESENT', 'ABSENT'] as const).map((a) => (
                                <button
                                  key={a}
                                  onClick={() => setAttendance((prev) => ({ ...prev, [enr.childId]: a }))}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                                    status === a
                                      ? a === 'PRESENT'
                                        ? 'bg-[#dcfce7] text-[#166534] border-[#86efac]'
                                        : 'bg-[#fee2e2] text-[#b91c1c] border-[#fca5a5]'
                                      : 'bg-white text-[#94a3b8] border-[#e2e8f0]'
                                  }`}
                                >
                                  {a === 'PRESENT' ? 'Present' : 'Absent'}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-[11px] font-bold">
                            {saved ? (
                              <span className={saved.isPresent ? 'text-[#166534]' : 'text-[#b91c1c]'}>
                                {saved.isPresent ? 'Present' : 'Absent'}
                                {saved.requiresPickup && !saved.pickedUpAt ? ' • Pickup' : ''}
                                {saved.pickedUpAt ? ' • Picked up' : ''}
                              </span>
                            ) : (
                              <span className="text-[#94a3b8]">Not yet</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="p-3 border-t border-[#dcf0f8] flex items-center justify-between gap-2 bg-[#f3fafd]">
                  <span className="text-xs text-[#737686]">
                    {presentCount} present • {absentCount} absent
                  </span>
                  <button
                    onClick={() => setConfirmOpen(true)}
                    disabled={savingBulk || submittingLog}
                    className="btn btn-primary text-xs py-2 px-4 rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {savingBulk ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
