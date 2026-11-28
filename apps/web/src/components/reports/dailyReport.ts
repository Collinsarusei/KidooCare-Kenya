import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface DailyReportChild {
  childId: string;
  name: string;
  age: string;
  programs: string[];
  log: null | {
    isPresent: boolean;
    mood: string | null;
    achievements: string[];
    milestones: string[];
    behavior: string | null;
    assignments: string | null;
    allergiesSpotted: string | null;
    healthStatus: string;
    healthNotes: string | null;
    requiresPickup: boolean;
    pickedUpAt: string | null;
    tutorName: string | null;
    loggedAt: string;
  };
  assessmentsToday: { title: string; subject: string | null; score: number | null; maxScore: number | null; grade: string | null; remarks: string | null }[];
  progress: {
    daysLogged30d: number;
    presentDays30d: number;
    attendanceRate30d: number | null;
    achievements30d: number;
    milestones30d: { date: string; text: string }[];
    milestoneCount30d: number;
    assessmentAverage30d: number | null;
    recentAssessments: { date: string; title: string; subject: string | null; score: number | null; maxScore: number | null; grade: string | null }[];
  };
}

export interface DailyReportData {
  date: string;
  dateLabel: string;
  generatedAt: string;
  school: { id: string; name: string; location: string | null } | null;
  tutor: { id: string; name: string | null; email: string } | null;
  scope: 'TUTOR' | 'ALL';
  summary: {
    totalChildren: number;
    present: number;
    absent: number;
    notLogged: number;
    pickups: number;
    healthIncidents: number;
    milestonesToday: number;
    assessmentsToday: number;
  };
  children: DailyReportChild[];
}

export const fetchDailyReport = async (date: string, tutorId?: string): Promise<DailyReportData> => {
  const token = localStorage.getItem('token');
  const qs = new URLSearchParams({ date, ...(tutorId ? { tutorId } : {}) });
  const res = await fetch(`/api/reports/daily?${qs}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Could not load report (HTTP ${res.status})`);
  return data;
};

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const cap = (s?: string | null) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : '—');
const health = (h: string) => ({ WELL: 'Well', UNWELL: 'Unwell', EMERGENCY: 'Emergency', HOSPITALIZED: 'Hospital' }[h] || h);
const score = (a: { score: number | null; maxScore: number | null; grade: string | null }) =>
  [a.score != null ? `${a.score}${a.maxScore ? `/${a.maxScore}` : ''}` : null, a.grade].filter(Boolean).join(' • ') || '—';

const BLUE: [number, number, number] = [0, 74, 198];
const GREEN: [number, number, number] = [0, 108, 73];
const INK: [number, number, number] = [18, 28, 42];
const MUTED: [number, number, number] = [115, 118, 134];

/** Builds the PDF and triggers the download. */
export const downloadDailyReportPdf = (r: DailyReportData) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 12;

  // ── Header band ───────────────────────────────────────────
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('KiddoCare Kenya — Daily Report', M, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${r.school?.name || ''}${r.school?.location ? ` • ${r.school.location}` : ''}`, M, 19);
  doc.text(
    r.scope === 'TUTOR' ? `Tutor: ${r.tutor?.name || r.tutor?.email || ''}` : 'All children',
    M,
    25,
  );
  doc.setFont('helvetica', 'bold');
  doc.text(r.dateLabel, W - M, 19, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generated ${new Date(r.generatedAt).toLocaleString()}`, W - M, 25, { align: 'right' });

  // ── Summary boxes ─────────────────────────────────────────
  const s = r.summary;
  const boxes: [string, number][] = [
    ['Children', s.totalChildren],
    ['Present', s.present],
    ['Absent', s.absent],
    ['Not logged', s.notLogged],
    ['Pickups', s.pickups],
    ['Health issues', s.healthIncidents],
    ['Milestones', s.milestonesToday],
    ['Assessments', s.assessmentsToday],
  ];
  const bw = (W - M * 2 - 7 * 2) / 8;
  boxes.forEach(([label, val], i) => {
    const x = M + i * (bw + 2);
    doc.setFillColor(248, 249, 255);
    doc.setDrawColor(230, 238, 255);
    doc.roundedRect(x, 35, bw, 16, 2, 2, 'FD');
    doc.setTextColor(...(label === 'Health issues' && val > 0 ? ([186, 26, 26] as [number, number, number]) : BLUE));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(String(val), x + bw / 2, 43, { align: 'center' });
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(label, x + bw / 2, 48, { align: 'center' });
  });

  if (r.children.length === 0) {
    doc.setTextColor(...MUTED);
    doc.setFontSize(11);
    doc.text('No children were logged for this day.', M, 62);
    doc.save(`KiddoCare-daily-report-${r.date}.pdf`);
    return;
  }

  // ── Overview table ────────────────────────────────────────
  autoTable(doc, {
    startY: 56,
    margin: { left: M, right: M },
    head: [['Child', 'Attendance', 'Mood', 'Health', "Today's milestones / achievements", '30-day attendance', 'Logged by']],
    body: r.children.map((c) => [
      `${c.name}\n${c.age}`,
      c.log ? (c.log.isPresent ? 'Present' : 'Absent') + (c.log.requiresPickup ? (c.log.pickedUpAt ? '\nPicked up' : '\nPickup requested') : '') : 'Not logged',
      c.log?.isPresent ? cap(c.log.mood) : '—',
      c.log?.isPresent ? health(c.log.healthStatus) : '—',
      c.log ? [...c.log.milestones.map((m) => `Milestone: ${m}`), ...c.log.achievements.map((a) => `• ${a}`)].join('\n') || '—' : '—',
      c.progress.attendanceRate30d != null ? `${c.progress.attendanceRate30d}% (${c.progress.presentDays30d}/${c.progress.daysLogged30d} days)` : 'No data',
      c.log?.tutorName || '—',
    ]),
    styles: { fontSize: 8, cellPadding: 2, textColor: INK, valign: 'top' },
    headStyles: { fillColor: BLUE, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 249, 255] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 28 }, 4: { cellWidth: 55 } },
    didParseCell: (d) => {
      if (d.section === 'body' && d.column.index === 3 && d.cell.raw && !['Well', '—'].includes(String(d.cell.raw))) {
        d.cell.styles.textColor = [186, 26, 26];
        d.cell.styles.fontStyle = 'bold';
      }
      if (d.section === 'body' && d.column.index === 1 && String(d.cell.raw).startsWith('Absent')) {
        d.cell.styles.textColor = [194, 65, 12];
      }
    },
  });

  // ── Per-child detail & progress ──────────────────────────
  doc.addPage();
  let y = 16;
  doc.setTextColor(...BLUE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Child details & 30-day progress', M, y);
  y += 4;

  r.children.forEach((c) => {
    const rows: [string, string][] = [];
    rows.push(['Programme', c.programs.join(', ')]);
    if (c.log) {
      rows.push(['Attendance', c.log.isPresent ? 'Present' : 'Absent']);
      if (c.log.isPresent) {
        rows.push(['Mood', cap(c.log.mood)]);
        if (c.log.milestones.length) rows.push(["Today's milestones", c.log.milestones.join('; ')]);
        if (c.log.achievements.length) rows.push(['Achievements', c.log.achievements.join('; ')]);
        if (c.log.behavior) rows.push(['Behaviour', c.log.behavior]);
        rows.push(['Health', health(c.log.healthStatus) + (c.log.healthNotes ? ` — ${c.log.healthNotes}` : '')]);
        if (c.log.allergiesSpotted) rows.push(['Allergies spotted', c.log.allergiesSpotted]);
        if (c.log.assignments) rows.push(['Homework', c.log.assignments]);
        if (c.log.requiresPickup) rows.push(['Pickup', c.log.pickedUpAt ? `Picked up ${new Date(c.log.pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Requested — not yet collected']);
      }
    } else {
      rows.push(['Attendance', 'Not logged this day']);
    }
    c.assessmentsToday.forEach((a) =>
      rows.push([`Assessment: ${a.title}`, `${a.subject ? `${a.subject} • ` : ''}${score(a)}${a.remarks ? ` — ${a.remarks}` : ''}`]),
    );
    const p = c.progress;
    rows.push([
      '30-day progress',
      `Attendance ${p.attendanceRate30d != null ? `${p.attendanceRate30d}%` : 'n/a'} • ${p.milestoneCount30d} milestone(s) • ${p.achievements30d} achievement(s)` +
        (p.assessmentAverage30d != null ? ` • assessment average ${p.assessmentAverage30d}%` : ''),
    ]);
    if (p.milestones30d.length) {
      rows.push([
        'Recent milestones',
        p.milestones30d.map((m) => `${new Date(m.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}: ${m.text}`).join('\n'),
      ]);
    }
    if (p.recentAssessments.length) {
      rows.push([
        'Recent assessments',
        p.recentAssessments
          .map((a) => `${new Date(a.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}: ${a.title} — ${score(a)}`)
          .join('\n'),
      ]);
    }

    autoTable(doc, {
      startY: y + 4,
      margin: { left: M, right: M },
      head: [[{ content: `${c.name}  •  ${c.age}`, colSpan: 2 }]],
      body: rows,
      styles: { fontSize: 8.5, cellPadding: 1.8, textColor: INK, valign: 'top' },
      headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', fontSize: 10 },
      columnStyles: { 0: { cellWidth: 38, fontStyle: 'bold', textColor: MUTED } },
      rowPageBreak: 'avoid',
    });
    y = (doc as any).lastAutoTable.finalY + 2;
  });

  // ── Footer on every page ─────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`${r.school?.name || 'KiddoCare'} • Daily report ${r.date}`, M, 290);
    doc.text(`Page ${i} of ${pages}`, W - M, 290, { align: 'right' });
  }

  const who = r.scope === 'TUTOR' ? `-${(r.tutor?.name || r.tutor?.email || 'tutor').replace(/[^a-z0-9]+/gi, '-')}` : '-all';
  doc.save(`KiddoCare-daily-report-${r.date}${who}.pdf`);
};
