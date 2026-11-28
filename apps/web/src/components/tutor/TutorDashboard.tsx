import React, { useEffect, useMemo, useState } from 'react';
import { ChildHealthStatus, EnrollmentDto, DailyLogMood, DailyLogDto } from '@daycare/shared-types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { DailyReportPanel } from '../reports/DailyReportPanel';
import toast from 'react-hot-toast';

export interface TutorLogInput {
  childId: string;
  isPresent: boolean;
  mood?: DailyLogMood;
  achievements?: string[];
  milestones?: string[];
  allergiesSpotted?: string;
  assignments?: string;
  behavior?: string;
  healthStatus?: ChildHealthStatus;
  healthNotes?: string;
  requiresPickup?: boolean;
  hospitalName?: string;
  hospitalNotes?: string;
  attendanceOnly?: boolean;
}

interface TutorDashboardProps {
  tutorName?: string | null;
  schoolRoster: EnrollmentDto[];
  todayLogs: DailyLogDto[];
  onLogActivity: (data: TutorLogInput, opts?: { silent?: boolean }) => Promise<boolean>;
  onMarkPickedUp: (logId: string) => Promise<void>;
  onRefresh: () => void;
  submittingLog: boolean;
}

interface AssessmentRow {
  id: string;
  childId: string;
  tutorId: string;
  title: string;
  subject: string | null;
  score: number | null;
  maxScore: number | null;
  grade: string | null;
  remarks: string | null;
  assessedOn: string;
  child?: { id: string; name: string };
  tutor?: { id: string; name: string | null; email: string };
}

type Tab = 'today' | 'log' | 'assessments' | 'reports';
type Attendance = 'PRESENT' | 'ABSENT';

const inputCls =
  'w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-white focus:ring-2 focus:ring-[#004ac6] outline-none';
const labelCls = 'block text-[11px] font-bold text-[#434655] uppercase tracking-wider mb-1.5';
const cardCls = 'bg-white border border-[#e6eeff] rounded-3xl p-5 md:p-6 shadow-sm';

const MOODS: { value: DailyLogMood; emoji: string; label: string }[] = [
  { value: DailyLogMood.HAPPY, emoji: '😊', label: 'Happy' },
  { value: DailyLogMood.ENERGETIC, emoji: '⚡', label: 'Energetic' },
  { value: DailyLogMood.TIRED, emoji: '😴', label: 'Tired' },
  { value: DailyLogMood.SAD, emoji: '😢', label: 'Sad' },
  { value: DailyLogMood.CRANKY, emoji: '😠', label: 'Cranky' },
];

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Small chip-list input: type, press Enter (or Add), remove with ✕ */
const TagInput: React.FC<{ value: string[]; onChange: (v: string[]) => void; placeholder: string; tone: 'green' | 'blue' }> = ({
  value,
  onChange,
  placeholder,
  tone,
}) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft('');
  };
  const chip = tone === 'green' ? 'bg-[#e6f7ef] text-[#006c49] border-[#a7f3d0]' : 'bg-[#eff4ff] text-[#004ac6] border-[#b4c5ff]';
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button type="button" onClick={add} className="btn btn-secondary text-xs px-4 rounded-xl shrink-0">
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span key={v} className={`text-xs font-semibold border rounded-full px-2.5 py-1 flex items-center gap-1 ${chip}`}>
              {v}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} className="opacity-60 hover:opacity-100">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const TutorDashboard: React.FC<TutorDashboardProps> = ({
  tutorName,
  schoolRoster,
  todayLogs,
  onLogActivity,
  onMarkPickedUp,
  onRefresh,
  submittingLog,
}) => {
  const [tab, setTab] = useState<Tab>('today');

  // One row per child (a child can have several active enrollments)
  const activeChildren = useMemo(() => {
    const seen = new Map<string, EnrollmentDto>();
    schoolRoster
      .filter((r) => r.status === 'ACTIVE')
      .forEach((r) => {
        if (!seen.has(r.childId)) seen.set(r.childId, r);
      });
    return [...seen.values()].sort((a, b) => (a.child?.name || '').localeCompare(b.child?.name || ''));
  }, [schoolRoster]);

  const logByChild = useMemo(() => {
    const m = new Map<string, DailyLogDto>();
    todayLogs.forEach((l) => {
      if (!m.has(l.childId)) m.set(l.childId, l);
    });
    return m;
  }, [todayLogs]);

  const childName = (id: string) =>
    activeChildren.find((c) => c.childId === id)?.child?.name || todayLogs.find((l) => l.childId === id)?.child?.name || 'Child';

  // ── Stats ──────────────────────────────────────────────────────────────
  const presentToday = todayLogs.filter((l) => l.isPresent).length;
  const absentToday = todayLogs.filter((l) => !l.isPresent).length;
  const notMarked = activeChildren.filter((c) => !logByChild.has(c.childId)).length;
  const openPickups = todayLogs.filter((l) => l.requiresPickup && !l.pickedUpAt);
  const needsFullLog = activeChildren.filter((c) => {
    const l = logByChild.get(c.childId);
    return l && l.isPresent && !l.achievements?.length && !l.milestones?.length && !l.behavior;
  });

  // ── Attendance board ───────────────────────────────────────────────────
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

  // ── Daily log form ─────────────────────────────────────────────────────
  const [selectedChildId, setSelectedChildId] = useState('');
  const [isPresent, setIsPresent] = useState(true);
  const [mood, setMood] = useState<DailyLogMood>(DailyLogMood.HAPPY);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<string[]>([]);
  const [behavior, setBehavior] = useState('');
  const [assignments, setAssignments] = useState('');
  const [allergies, setAllergies] = useState('');
  const [healthStatus, setHealthStatus] = useState<ChildHealthStatus>(ChildHealthStatus.WELL);
  const [healthNotes, setHealthNotes] = useState('');
  const [requiresPickup, setRequiresPickup] = useState(false);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalNotes, setHospitalNotes] = useState('');

  useEffect(() => {
    const log = selectedChildId ? logByChild.get(selectedChildId) : undefined;
    setIsPresent(log ? log.isPresent : true);
    setMood((log?.mood as DailyLogMood) || DailyLogMood.HAPPY);
    setAchievements(log?.achievements || []);
    setMilestones(log?.milestones || []);
    setBehavior(log?.behavior || '');
    setAssignments(log?.assignments || '');
    setAllergies(log?.allergiesSpotted || '');
    setHealthStatus((log?.healthStatus as ChildHealthStatus) || ChildHealthStatus.WELL);
    setHealthNotes(log?.healthNotes || '');
    setRequiresPickup(!!log?.requiresPickup && !log?.pickedUpAt);
    setHospitalName(log?.hospitalName || '');
    setHospitalNotes(log?.hospitalNotes || '');
  }, [selectedChildId, logByChild]);

  const openLogFor = (childId: string) => {
    setSelectedChildId(childId);
    setTab('log');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;
    if (isPresent && requiresPickup && !healthNotes.trim()) {
      toast.error('Add a note telling the parent why they need to pick up their child.');
      return;
    }
    const ok = await onLogActivity(
      isPresent
        ? {
            childId: selectedChildId,
            isPresent: true,
            mood,
            achievements,
            milestones,
            behavior: behavior.trim() || undefined,
            assignments: assignments.trim() || undefined,
            allergiesSpotted: allergies.trim() || undefined,
            healthStatus,
            healthNotes: healthNotes.trim() || undefined,
            requiresPickup,
            hospitalName: healthStatus === ChildHealthStatus.HOSPITALIZED ? hospitalName.trim() || undefined : undefined,
            hospitalNotes: healthStatus === ChildHealthStatus.HOSPITALIZED ? hospitalNotes.trim() || undefined : undefined,
          }
        : { childId: selectedChildId, isPresent: false },
    );
    if (ok) {
      // move to the next child that still needs a log
      const next = activeChildren.find((c) => c.childId !== selectedChildId && !logByChild.has(c.childId));
      setSelectedChildId(next ? next.childId : '');
    }
  };

  // ── Assessments ────────────────────────────────────────────────────────
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [aChild, setAChild] = useState('');
  const [aTitle, setATitle] = useState('');
  const [aSubject, setASubject] = useState('');
  const [aDate, setADate] = useState(todayISO());
  const [aScore, setAScore] = useState('');
  const [aMax, setAMax] = useState('');
  const [aGrade, setAGrade] = useState('');
  const [aRemarks, setARemarks] = useState('');
  const [aFilter, setAFilter] = useState('');
  const [savingA, setSavingA] = useState(false);

  const authHeaders = (): Record<string, string> => {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const loadAssessments = async () => {
    try {
      const res = await fetch('/api/assessments/mine', { headers: authHeaders() });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setAssessments(data);
    } catch {
      // ignore
    }
  };
  useEffect(() => {
    if (tab === 'assessments') loadAssessments();
  }, [tab]);

  const saveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aChild || !aTitle.trim()) return;
    if (!aScore && !aGrade.trim() && !aRemarks.trim()) {
      toast.error('Enter a score, a grade or remarks.');
      return;
    }
    setSavingA(true);
    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          childId: aChild,
          title: aTitle.trim(),
          subject: aSubject.trim() || undefined,
          assessedOn: aDate,
          score: aScore !== '' ? Number(aScore) : undefined,
          maxScore: aMax !== '' ? Number(aMax) : undefined,
          grade: aGrade.trim() || undefined,
          remarks: aRemarks.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'Could not save assessment');
      toast.success(`Assessment saved for ${data.child?.name || 'child'}`);
      setAScore('');
      setAGrade('');
      setARemarks('');
      loadAssessments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingA(false);
    }
  };

  const deleteAssessment = async (id: string) => {
    if (!window.confirm('Delete this assessment?')) return;
    const res = await fetch(`/api/assessments/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) {
      toast.success('Assessment deleted');
      loadAssessments();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.message || 'Could not delete');
    }
  };

  const shownAssessments = aFilter ? assessments.filter((a) => a.childId === aFilter) : assessments;

  // ── Render ─────────────────────────────────────────────────────────────
  const TABS: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: 'today', icon: 'today', label: 'Today', badge: notMarked || undefined },
    { id: 'log', icon: 'edit_note', label: 'Daily Log', badge: needsFullLog.length || undefined },
    { id: 'assessments', icon: 'quiz', label: 'Assessments' },
    { id: 'reports', icon: 'summarize', label: 'Reports' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {confirmOpen && (
        <ConfirmationModal
          title="Save today's attendance"
          message={`Mark ${presentCount} child(ren) present and ${absentCount} absent for today? Parents see this in their Daily Logs.`}
          confirmText="Save attendance"
          onConfirm={saveBulkAttendance}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004ac6] to-[#2563eb] text-white p-6 md:p-8 shadow-lg">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute right-24 -bottom-16 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-blue-100 uppercase tracking-wider">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold font-display mt-1">
              Hello{tutorName ? `, ${tutorName.split(' ')[0]}` : ''} 👋
            </h1>
            <p className="text-sm text-blue-100 mt-1">
              {notMarked > 0
                ? `${notMarked} child${notMarked === 1 ? '' : 'ren'} still need attendance today.`
                : activeChildren.length
                ? 'Attendance is done for today — great job!'
                : 'No children are enrolled in your daycare yet.'}
            </p>
          </div>
          <button onClick={onRefresh} className="self-start md:self-auto bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1">
            <span className="material-symbols-outlined text-base">refresh</span> Refresh
          </button>
        </div>
        <div className="relative grid grid-cols-2 md:grid-cols-5 gap-2 mt-5">
          {[
            ['Children', activeChildren.length, 'groups'],
            ['Present', presentToday, 'check_circle'],
            ['Absent', absentToday, 'cancel'],
            ['Not marked', notMarked, 'pending'],
            ['Pickups waiting', openPickups.length, 'directions_walk'],
          ].map(([label, val, icon]) => (
            <div key={label as string} className="bg-white/15 rounded-2xl px-3 py-2.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-blue-100">{icon as string}</span>
              <div>
                <p className="text-lg font-extrabold leading-none">{val as number}</p>
                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">{label as string}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-white border border-[#e6eeff] rounded-2xl p-1.5 shadow-xs overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t.id ? 'bg-[#004ac6] text-white shadow-md' : 'text-[#434655] hover:bg-[#f8f9ff]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{t.icon}</span>
            {t.label}
            {t.badge ? (
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white text-[#004ac6]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ═══ TODAY ═══ */}
      {tab === 'today' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
          <div className={cardCls}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-extrabold text-[#121c2a] font-display text-lg">Attendance</h3>
                <p className="text-xs text-[#737686]">Mark everyone, then save. Tap a name to write their daily log.</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setAttendance(Object.fromEntries(activeChildren.map((c) => [c.childId, 'PRESENT'])))} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-[#86efac] text-[#166534] bg-[#f0fdf4]">
                  All present
                </button>
                <button onClick={() => setAttendance(Object.fromEntries(activeChildren.map((c) => [c.childId, 'ABSENT'])))} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-[#fca5a5] text-[#b91c1c] bg-[#fef2f2]">
                  All absent
                </button>
              </div>
            </div>

            {activeChildren.length === 0 ? (
              <p className="text-center py-10 text-sm text-[#737686] bg-[#f8f9ff] rounded-2xl border border-dashed border-[#c3c6d7]">
                No actively enrolled children yet.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {activeChildren.map((enr) => {
                    const status = attendance[enr.childId] || 'PRESENT';
                    const saved = logByChild.get(enr.childId);
                    return (
                      <div key={enr.childId} className="flex items-center justify-between gap-3 border border-[#e6eeff] rounded-2xl px-3 py-2.5 hover:border-[#b4c5ff] transition-all">
                        <button onClick={() => openLogFor(enr.childId)} className="flex items-center gap-3 text-left min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#eff4ff] text-[#004ac6] flex items-center justify-center font-extrabold shrink-0">
                            {(enr.child?.name || '?').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-[#121c2a] truncate">{enr.child?.name}</p>
                            <p className="text-[11px] text-[#737686] truncate">
                              {saved
                                ? `${saved.isPresent ? 'Present' : 'Absent'} saved${saved.mood && saved.isPresent ? ` • ${saved.mood.toLowerCase()}` : ''}${
                                    saved.milestones?.length ? ` • ${saved.milestones.length} milestone(s)` : ''
                                  }`
                                : 'Not marked yet'}
                            </p>
                          </div>
                        </button>
                        <div className="flex gap-1 shrink-0">
                          {(['PRESENT', 'ABSENT'] as const).map((a) => (
                            <button
                              key={a}
                              onClick={() => setAttendance((prev) => ({ ...prev, [enr.childId]: a }))}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${
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
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-[#e6eeff]">
                  <span className="text-xs text-[#737686]">
                    {presentCount} present • {absentCount} absent
                  </span>
                  <button onClick={() => setConfirmOpen(true)} disabled={savingBulk || submittingLog} className="btn btn-primary text-sm py-2.5 px-5 rounded-xl disabled:opacity-50">
                    {savingBulk ? 'Saving...' : 'Save attendance'}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className={cardCls}>
              <h3 className="font-extrabold text-[#121c2a] font-display text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[#c2410c]">directions_walk</span>
                Waiting for pickup ({openPickups.length})
              </h3>
              {openPickups.length === 0 ? (
                <p className="text-xs text-[#737686] mt-2">No pickups requested today.</p>
              ) : (
                <div className="space-y-2 mt-3">
                  {openPickups.map((l) => (
                    <div key={l.id} className="rounded-2xl border border-[#fed7aa] bg-[#fff7ed] p-3 space-y-2">
                      <div>
                        <p className="font-bold text-sm text-[#121c2a]">{childName(l.childId)}</p>
                        {l.healthNotes && <p className="text-xs text-[#9a3412]">{l.healthNotes}</p>}
                        <p className="text-[11px] font-semibold mt-0.5">
                          {l.pickupAcknowledgedAt ? (
                            <span className="text-[#166534]">✓ Parent is on the way</span>
                          ) : (
                            <span className="text-[#737686]">Parent has not responded yet</span>
                          )}
                        </p>
                      </div>
                      <button onClick={() => onMarkPickedUp(l.id)} className="btn btn-success text-xs py-1.5 px-3 rounded-xl w-full">
                        Mark picked up
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={cardCls}>
              <h3 className="font-extrabold text-[#121c2a] font-display text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004ac6]">checklist</span>
                Still to log today
              </h3>
              {(() => {
                const todo = activeChildren.filter((c) => {
                  const l = logByChild.get(c.childId);
                  return !l || (l.isPresent && !l.achievements?.length && !l.milestones?.length && !l.behavior);
                });
                if (!todo.length) return <p className="text-xs text-[#166534] mt-2 font-semibold">Everyone has a full log for today ✓</p>;
                return (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {todo.map((c) => (
                      <button key={c.childId} onClick={() => openLogFor(c.childId)} className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#eff4ff] text-[#004ac6] hover:bg-[#dbeafe]">
                        {c.child?.name}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ═══ DAILY LOG ═══ */}
      {tab === 'log' && (
        <form onSubmit={handleSubmitLog} className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* child picker */}
          <div className={`${cardCls} lg:sticky lg:top-24 self-start`}>
            <h3 className="font-extrabold text-[#121c2a] font-display mb-3">Choose a child</h3>
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {activeChildren.map((c) => {
                const l = logByChild.get(c.childId);
                const done = l && (!l.isPresent || l.achievements?.length || l.milestones?.length || l.behavior);
                return (
                  <button
                    type="button"
                    key={c.childId}
                    onClick={() => setSelectedChildId(c.childId)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm font-semibold transition-all ${
                      selectedChildId === c.childId ? 'bg-[#004ac6] text-white' : 'hover:bg-[#f8f9ff] text-[#121c2a]'
                    }`}
                  >
                    <span className="truncate">{c.child?.name}</span>
                    <span className={`material-symbols-outlined text-base ${selectedChildId === c.childId ? 'text-white' : done ? 'text-[#16a34a]' : 'text-[#c3c6d7]'}`}>
                      {done ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>
                );
              })}
              {activeChildren.length === 0 && <p className="text-xs text-[#737686]">No children enrolled yet.</p>}
            </div>
          </div>

          {!selectedChildId ? (
            <div className={`${cardCls} flex flex-col items-center justify-center text-center py-16`}>
              <span className="material-symbols-outlined text-5xl text-[#c3c6d7]">edit_note</span>
              <p className="font-bold text-[#121c2a] mt-2">Select a child to write today's log</p>
              <p className="text-xs text-[#737686]">Attendance, mood, milestones, behaviour and health — all in one place.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. attendance */}
              <div className={cardCls}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-extrabold text-[#121c2a] font-display text-lg">{childName(selectedChildId)}</h3>
                  {logByChild.has(selectedChildId) && <span className="badge badge-blue">Updating today's log</span>}
                </div>
                <label className={labelCls}>1 • Attendance</label>
                <div className="grid grid-cols-2 gap-2">
                  {([true, false] as const).map((p) => (
                    <button
                      type="button"
                      key={String(p)}
                      onClick={() => setIsPresent(p)}
                      className={`py-3 rounded-2xl text-sm font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        isPresent === p
                          ? p
                            ? 'bg-[#dcfce7] text-[#166534] border-[#86efac]'
                            : 'bg-[#fee2e2] text-[#b91c1c] border-[#fca5a5]'
                          : 'bg-white text-[#475569] border-[#c3c6d7]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{p ? 'check_circle' : 'cancel'}</span>
                      {p ? 'Present' : 'Absent'}
                    </button>
                  ))}
                </div>
                {!isPresent && <p className="text-xs text-[#737686] mt-3">Nothing else is needed — the parent will see the child was absent.</p>}
              </div>

              {isPresent && (
                <>
                  {/* 2. day & milestones */}
                  <div className={`${cardCls} space-y-4`}>
                    <label className={labelCls}>2 • Mood & progress</label>
                    <div className="grid grid-cols-5 gap-2">
                      {MOODS.map((m) => (
                        <button
                          type="button"
                          key={m.value}
                          onClick={() => setMood(m.value)}
                          className={`py-2.5 rounded-2xl border text-center transition-all ${
                            mood === m.value ? 'border-[#004ac6] bg-[#eff4ff] ring-2 ring-[#004ac6]/20' : 'border-[#e2e8f0] bg-white hover:border-[#b4c5ff]'
                          }`}
                        >
                          <span className="text-2xl block">{m.emoji}</span>
                          <span className="text-[11px] font-bold text-[#434655]">{m.label}</span>
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className={labelCls}>Milestones reached ★</label>
                      <TagInput value={milestones} onChange={setMilestones} tone="green" placeholder="e.g. Counted to 10 alone, first full sentence" />
                    </div>
                    <div>
                      <label className={labelCls}>Achievements / activities</label>
                      <TagInput value={achievements} onChange={setAchievements} tone="blue" placeholder="e.g. Painted a picture, shared toys" />
                    </div>
                  </div>

                  {/* 3. behaviour & homework */}
                  <div className={`${cardCls} grid grid-cols-1 md:grid-cols-2 gap-4`}>
                    <div className="md:col-span-2">
                      <label className={labelCls}>3 • Behaviour & learning</label>
                    </div>
                    <div>
                      <label className={labelCls}>Behaviour / social</label>
                      <textarea rows={3} value={behavior} onChange={(e) => setBehavior(e.target.value)} placeholder="How did they get along with others?" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Homework / note to parent</label>
                      <textarea rows={3} value={assignments} onChange={(e) => setAssignments(e.target.value)} placeholder="e.g. Read a story before bed" className={inputCls} />
                    </div>
                  </div>

                  {/* 4. health & safety */}
                  <div className={`${cardCls} space-y-3 ${requiresPickup || healthStatus !== ChildHealthStatus.WELL ? 'border-[#fdba74] bg-[#fffaf5]' : ''}`}>
                    <label className={labelCls}>4 • Health & safety</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        [ChildHealthStatus.WELL, 'Well', 'sentiment_satisfied', 'bg-[#dcfce7] text-[#166534] border-[#86efac]'],
                        [ChildHealthStatus.UNWELL, 'Unwell', 'sick', 'bg-[#fef3c7] text-[#92400e] border-[#fcd34d]'],
                        [ChildHealthStatus.EMERGENCY, 'Emergency', 'emergency', 'bg-[#fee2e2] text-[#b91c1c] border-[#fca5a5]'],
                        [ChildHealthStatus.HOSPITALIZED, 'Hospital', 'local_hospital', 'bg-[#fee2e2] text-[#b91c1c] border-[#fca5a5]'],
                      ].map(([val, label, icon, active]) => (
                        <button
                          type="button"
                          key={val}
                          onClick={() => setHealthStatus(val as ChildHealthStatus)}
                          className={`py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1 ${
                            healthStatus === val ? active : 'bg-white text-[#475569] border-[#e2e8f0]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">{icon}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <textarea rows={2} value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)} placeholder="Symptoms, action taken, or reason for pickup" className={inputCls} />
                      <textarea rows={2} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Allergies spotted (if any)" className={inputCls} />
                    </div>
                    {healthStatus === ChildHealthStatus.HOSPITALIZED && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="Hospital name" className={inputCls} />
                        <input value={hospitalNotes} onChange={(e) => setHospitalNotes(e.target.value)} placeholder="Transport / hospital details" className={inputCls} />
                      </div>
                    )}
                    <label className="flex items-start gap-2 cursor-pointer bg-white border border-[#e2e8f0] rounded-2xl p-3">
                      <input type="checkbox" checked={requiresPickup} onChange={(e) => setRequiresPickup(e.target.checked)} className="w-4 h-4 mt-0.5" />
                      <span>
                        <span className="text-sm font-bold text-[#121c2a]">Parent should pick up the child</span>
                        <span className="block text-[11px] text-[#737686]">The parent gets an alert (and SMS if configured) and can reply "I'm on my way".</span>
                      </span>
                    </label>
                  </div>
                </>
              )}

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setSelectedChildId('')} className="btn btn-secondary text-sm px-5 py-3 rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={submittingLog} className="btn btn-primary text-sm px-8 py-3 rounded-xl disabled:opacity-50">
                  {submittingLog ? 'Saving...' : logByChild.has(selectedChildId) ? 'Update log & next child' : 'Save log & next child'}
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* ═══ ASSESSMENTS ═══ */}
      {tab === 'assessments' && (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <form onSubmit={saveAssessment} className={`${cardCls} space-y-3 self-start`}>
            <div>
              <h3 className="font-extrabold text-[#121c2a] font-display text-lg">Record an assessment</h3>
              <p className="text-xs text-[#737686]">For tests, evaluations or skill checks — whenever they happen.</p>
            </div>
            <div>
              <label className={labelCls}>Child *</label>
              <select required value={aChild} onChange={(e) => setAChild(e.target.value)} className={inputCls}>
                <option value="">Select a child...</option>
                {activeChildren.map((c) => (
                  <option key={c.childId} value={c.childId}>
                    {c.child?.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Assessment *</label>
              <input required value={aTitle} onChange={(e) => setATitle(e.target.value)} placeholder="e.g. End of term evaluation" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Subject / area</label>
                <input value={aSubject} onChange={(e) => setASubject(e.target.value)} placeholder="e.g. Numbers" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={aDate} max={todayISO()} onChange={(e) => setADate(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelCls}>Score</label>
                <input type="number" min={0} step="0.5" value={aScore} onChange={(e) => setAScore(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Out of</label>
                <input type="number" min={1} step="0.5" value={aMax} onChange={(e) => setAMax(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Grade</label>
                <input value={aGrade} onChange={(e) => setAGrade(e.target.value)} placeholder="e.g. EE" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Remarks</label>
              <textarea rows={3} value={aRemarks} onChange={(e) => setARemarks(e.target.value)} placeholder="Strengths and what to practise" className={inputCls} />
            </div>
            <button type="submit" disabled={savingA} className="w-full btn btn-primary text-sm py-3 rounded-xl disabled:opacity-50">
              {savingA ? 'Saving...' : 'Save assessment'}
            </button>
          </form>

          <div className={cardCls}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="font-extrabold text-[#121c2a] font-display text-lg">Assessment history</h3>
              <select value={aFilter} onChange={(e) => setAFilter(e.target.value)} className="px-3 py-2 text-xs rounded-xl border border-[#c3c6d7] bg-[#f8f9ff]">
                <option value="">All children</option>
                {activeChildren.map((c) => (
                  <option key={c.childId} value={c.childId}>
                    {c.child?.name}
                  </option>
                ))}
              </select>
            </div>
            {shownAssessments.length === 0 ? (
              <p className="text-center py-10 text-sm text-[#737686] bg-[#f8f9ff] rounded-2xl border border-dashed border-[#c3c6d7]">No assessments recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {shownAssessments.map((a) => {
                  const pct = a.score != null && a.maxScore ? Math.round((a.score / a.maxScore) * 100) : null;
                  return (
                    <div key={a.id} className="border border-[#e6eeff] rounded-2xl p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#121c2a]">
                          {a.child?.name} — {a.title}
                        </p>
                        <p className="text-[11px] text-[#737686]">
                          {new Date(a.assessedOn).toLocaleDateString()} {a.subject ? `• ${a.subject}` : ''} {a.tutor ? `• by ${a.tutor.name || a.tutor.email}` : ''}
                        </p>
                        {a.remarks && <p className="text-xs text-[#434655] mt-1">{a.remarks}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        {a.score != null && (
                          <p className="text-sm font-extrabold text-[#004ac6]">
                            {a.score}
                            {a.maxScore ? `/${a.maxScore}` : ''}
                          </p>
                        )}
                        {pct != null && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pct >= 70 ? 'bg-[#dcfce7] text-[#166534]' : pct >= 50 ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#fee2e2] text-[#b91c1c]'}`}>
                            {pct}%
                          </span>
                        )}
                        {a.grade && <p className="text-xs font-bold text-[#006c49]">{a.grade}</p>}
                        <button onClick={() => deleteAssessment(a.id)} className="text-[10px] text-[#94a3b8] hover:text-[#ba1a1a] mt-1">
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ REPORTS ═══ */}
      {tab === 'reports' && <DailyReportPanel title="My daily report" subtitle="Everything you logged for the day, with each child's 30-day progress — download as PDF" />}
    </div>
  );
};
