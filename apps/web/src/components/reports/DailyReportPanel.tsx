import React, { useEffect, useState } from 'react';
import { DailyReportData, downloadDailyReportPdf, fetchDailyReport, todayISO } from './dailyReport';

interface DailyReportPanelProps {
  /** School view: list of tutors to filter by. Tutor view: omit. */
  tutors?: { id: string; name?: string | null; email: string }[];
  title?: string;
  subtitle?: string;
}

const healthCls = (h: string) =>
  h === 'WELL' ? 'bg-[#dcfce7] text-[#166534]' : h === 'UNWELL' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#fee2e2] text-[#b91c1c]';

export const DailyReportPanel: React.FC<DailyReportPanelProps> = ({
  tutors,
  title = 'Daily Reports',
  subtitle = 'Attendance, wellbeing, milestones and assessments — download as PDF',
}) => {
  const [date, setDate] = useState(todayISO());
  const [tutorId, setTutorId] = useState('');
  const [report, setReport] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchDailyReport(date, tutorId || undefined));
    } catch (e: any) {
      setError(e.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, tutorId]);

  const s = report?.summary;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-[#e6eeff] rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#121c2a] font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004ac6]">summarize</span>
              {title}
            </h2>
            <p className="text-xs text-[#737686]">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-[10px] font-bold text-[#737686] uppercase tracking-wider mb-1">Date</label>
              <input
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] outline-none focus:ring-2 focus:ring-[#004ac6]"
              />
            </div>
            {tutors && (
              <div>
                <label className="block text-[10px] font-bold text-[#737686] uppercase tracking-wider mb-1">Report for</label>
                <select
                  value={tutorId}
                  onChange={(e) => setTutorId(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] outline-none focus:ring-2 focus:ring-[#004ac6] min-w-[180px]"
                >
                  <option value="">All children</option>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      Tutor: {t.name || t.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={() => report && downloadDailyReportPdf(report)}
              disabled={!report || loading}
              className="btn btn-primary text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
              Download PDF
            </button>
          </div>
        </div>

        {error && <p className="text-xs font-bold text-[#ba1a1a]">{error}</p>}

        {s && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              ['Children', s.totalChildren, 'text-[#004ac6]'],
              ['Present', s.present, 'text-[#166534]'],
              ['Absent', s.absent, 'text-[#c2410c]'],
              ['Not logged', s.notLogged, 'text-[#737686]'],
              ['Pickups', s.pickups, 'text-[#c2410c]'],
              ['Health issues', s.healthIncidents, s.healthIncidents ? 'text-[#ba1a1a]' : 'text-[#166534]'],
              ['Milestones', s.milestonesToday, 'text-[#006c49]'],
              ['Assessments', s.assessmentsToday, 'text-[#004ac6]'],
            ].map(([label, val, cls]) => (
              <div key={label as string} className="bg-[#f8f9ff] border border-[#e6eeff] rounded-2xl p-3 text-center">
                <p className={`text-xl font-extrabold font-display ${cls}`}>{val as number}</p>
                <p className="text-[10px] font-bold text-[#737686] uppercase tracking-wider">{label as string}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && !report && <p className="text-sm text-[#737686] text-center py-6">Loading report...</p>}

      {report && report.children.length === 0 && (
        <div className="bg-white border border-dashed border-[#c3c6d7] rounded-3xl p-8 text-center text-sm text-[#737686]">
          {report.scope === 'TUTOR' ? 'No children were logged by this tutor on this day.' : 'No actively enrolled children yet.'}
        </div>
      )}

      {report && report.children.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {report.children.map((c) => {
            const open = expanded === c.childId;
            const p = c.progress;
            return (
              <div key={c.childId} className="bg-white border border-[#e6eeff] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-extrabold text-[#121c2a]">{c.name}</h4>
                    <p className="text-[11px] text-[#737686]">
                      {c.age} • {c.programs.join(', ')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {!c.log ? (
                      <span className="badge badge-gray">Not logged</span>
                    ) : (
                      <>
                        <span className={`badge ${c.log.isPresent ? 'badge-green' : 'badge-orange'}`}>{c.log.isPresent ? 'Present' : 'Absent'}</span>
                        {c.log.isPresent && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${healthCls(c.log.healthStatus)}`}>
                            {c.log.healthStatus.charAt(0) + c.log.healthStatus.slice(1).toLowerCase()}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* 30-day progress bars */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#f8f9ff] rounded-xl p-2">
                    <p className="text-sm font-extrabold text-[#004ac6]">{p.attendanceRate30d != null ? `${p.attendanceRate30d}%` : '—'}</p>
                    <p className="text-[9px] font-bold text-[#737686] uppercase">Attendance 30d</p>
                    {p.attendanceRate30d != null && (
                      <div className="h-1.5 bg-[#e6eeff] rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-[#004ac6]" style={{ width: `${p.attendanceRate30d}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="bg-[#f8f9ff] rounded-xl p-2">
                    <p className="text-sm font-extrabold text-[#006c49]">{p.milestoneCount30d}</p>
                    <p className="text-[9px] font-bold text-[#737686] uppercase">Milestones 30d</p>
                  </div>
                  <div className="bg-[#f8f9ff] rounded-xl p-2">
                    <p className="text-sm font-extrabold text-[#7c3aed]">{p.assessmentAverage30d != null ? `${p.assessmentAverage30d}%` : '—'}</p>
                    <p className="text-[9px] font-bold text-[#737686] uppercase">Assessment avg</p>
                  </div>
                </div>

                {c.log?.isPresent && (c.log.milestones.length > 0 || c.log.achievements.length > 0) && (
                  <div className="text-xs text-[#434655] space-y-0.5">
                    {c.log.milestones.map((m, i) => (
                      <p key={'m' + i}>
                        <span className="text-[#006c49] font-bold">★ Milestone:</span> {m}
                      </p>
                    ))}
                    {c.log.achievements.map((a, i) => (
                      <p key={'a' + i}>• {a}</p>
                    ))}
                  </div>
                )}

                <button onClick={() => setExpanded(open ? null : c.childId)} className="text-xs font-bold text-[#004ac6]">
                  {open ? 'Hide details' : 'Show details & progress'}
                </button>

                {open && (
                  <div className="text-xs text-[#434655] space-y-2 border-t border-[#e6eeff] pt-2">
                    {c.log?.isPresent && (
                      <>
                        {c.log.mood && <p><strong>Mood:</strong> {c.log.mood.charAt(0) + c.log.mood.slice(1).toLowerCase()}</p>}
                        {c.log.behavior && <p><strong>Behaviour:</strong> {c.log.behavior}</p>}
                        {c.log.healthNotes && <p><strong>Health notes:</strong> {c.log.healthNotes}</p>}
                        {c.log.assignments && <p><strong>Homework:</strong> {c.log.assignments}</p>}
                        {c.log.requiresPickup && (
                          <p className="text-[#c2410c] font-bold">Pickup {c.log.pickedUpAt ? 'completed' : 'requested'}</p>
                        )}
                        {c.log.tutorName && <p className="text-[#737686]">Logged by {c.log.tutorName}</p>}
                      </>
                    )}
                    {c.assessmentsToday.length > 0 && (
                      <div>
                        <p className="font-bold">Assessments today</p>
                        {c.assessmentsToday.map((a, i) => (
                          <p key={i}>
                            {a.title}
                            {a.subject ? ` (${a.subject})` : ''}: {a.score != null ? `${a.score}${a.maxScore ? `/${a.maxScore}` : ''}` : ''} {a.grade || ''}
                          </p>
                        ))}
                      </div>
                    )}
                    <div>
                      <p className="font-bold">Milestones in the last 30 days</p>
                      {p.milestones30d.length === 0 ? (
                        <p className="text-[#737686]">None recorded yet.</p>
                      ) : (
                        p.milestones30d.map((m, i) => (
                          <p key={i}>
                            <span className="text-[#737686]">{new Date(m.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}:</span> {m.text}
                          </p>
                        ))
                      )}
                    </div>
                    {p.recentAssessments.length > 0 && (
                      <div>
                        <p className="font-bold">Recent assessments</p>
                        {p.recentAssessments.map((a, i) => (
                          <p key={i}>
                            <span className="text-[#737686]">{new Date(a.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}:</span> {a.title} —{' '}
                            {a.score != null ? `${a.score}${a.maxScore ? `/${a.maxScore}` : ''}` : ''} {a.grade || ''}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
