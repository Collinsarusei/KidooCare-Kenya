/** Shared types + helpers for the admin analytics endpoint and the printable platform report. */

export interface PlatformAnalytics {
  generatedAt: string;
  kpis: {
    totalSchools: number;
    activeSchools: number;
    verifiedSchools: number;
    totalParents: number;
    totalTutors: number;
    totalChildren: number;
    totalUsers: number;
    activeEnrollments: number;
    pendingPaymentEnrollments: number;
    waitlistedEnrollments: number;
    totalRevenue: number;
    revenueThisMonth: number;
    outstandingArrears: number;
    pendingDocuments: number;
    totalDocuments: number;
    openDisputes: number;
  };
  monthly: { month: string; newSchools: number; newParents: number; schools: number; parents: number; revenue: number }[];
  schoolStatus: { name: string; value: number }[];
  servicePopularity: { name: string; value: number }[];
  paymentMethods: { name: string; value: number }[];
  topSchools: { name: string; revenue: number }[];
}

export const fetchPlatformAnalytics = async (): Promise<PlatformAnalytics> => {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/admin/analytics', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Failed to load analytics (HTTP ${res.status})`);
  return data;
};

export const kes = (n: number) => `KES ${Math.round(n || 0).toLocaleString()}`;

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/**
 * Opens a print-ready platform report in a new window. The browser's print
 * dialog lets the admin "Save as PDF".
 */
export const openPlatformReport = (a: PlatformAnalytics, schools: any[]) => {
  const k = a.kpis;
  const row = (cells: unknown[]) => `<tr>${cells.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>KiddoCare Platform Report</title>
<style>
  body{font-family:Segoe UI,Arial,sans-serif;color:#121c2a;margin:32px;font-size:13px}
  h1{color:#004ac6;margin:0} h2{color:#004ac6;font-size:16px;margin:28px 0 8px;border-bottom:2px solid #e6eeff;padding-bottom:4px}
  .muted{color:#737686} .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px}
  .kpi{border:1px solid #e6eeff;border-radius:10px;padding:10px;background:#f8f9ff}
  .kpi b{display:block;font-size:18px;margin-top:4px}
  table{width:100%;border-collapse:collapse;margin-top:6px} th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e6eeff}
  th{background:#eff4ff;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  .actions{margin:16px 0} button{background:#004ac6;color:#fff;border:0;padding:8px 16px;border-radius:999px;font-weight:600;cursor:pointer}
  @media print{.actions{display:none} body{margin:12mm}}
</style></head><body>
<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
<h1>KiddoCare Kenya — Platform Report</h1>
<p class="muted">Generated ${esc(new Date(a.generatedAt).toLocaleString())} from live platform data</p>

<div class="grid">
  <div class="kpi">Daycare centres<b>${k.totalSchools}</b><span class="muted">${k.activeSchools} active • ${k.verifiedSchools} verified</span></div>
  <div class="kpi">Parents<b>${k.totalParents}</b><span class="muted">${k.totalChildren} children registered</span></div>
  <div class="kpi">Tutors<b>${k.totalTutors}</b><span class="muted">${k.totalUsers} total users</span></div>
  <div class="kpi">Active enrollments<b>${k.activeEnrollments}</b><span class="muted">${k.pendingPaymentEnrollments} pending • ${k.waitlistedEnrollments} waitlisted</span></div>
  <div class="kpi">Total collected<b>${kes(k.totalRevenue)}</b></div>
  <div class="kpi">Collected this month<b>${kes(k.revenueThisMonth)}</b></div>
  <div class="kpi">Outstanding arrears<b>${kes(k.outstandingArrears)}</b></div>
  <div class="kpi">Open disputes<b>${k.openDisputes}</b><span class="muted">${k.pendingDocuments} docs awaiting review</span></div>
</div>

<h2>Monthly trend</h2>
<table><thead><tr><th>Month</th><th>New schools</th><th>New parents</th><th>Total schools</th><th>Total parents</th><th>Revenue</th></tr></thead><tbody>
${a.monthly.map((m) => row([m.month, m.newSchools, m.newParents, m.schools, m.parents, kes(m.revenue)])).join('')}
</tbody></table>

<h2>Top schools by revenue</h2>
${a.topSchools.length ? `<table><thead><tr><th>School</th><th>Revenue</th></tr></thead><tbody>${a.topSchools.map((s) => row([s.name, kes(s.revenue)])).join('')}</tbody></table>` : '<p class="muted">No completed payments yet.</p>'}

<h2>Service popularity (current enrollments)</h2>
${a.servicePopularity.length ? `<table><thead><tr><th>Service</th><th>Enrollments</th></tr></thead><tbody>${a.servicePopularity.map((s) => row([s.name, s.value])).join('')}</tbody></table>` : '<p class="muted">No enrollments yet.</p>'}

<h2>School directory (${schools.length})</h2>
<table><thead><tr><th>School</th><th>Location</th><th>Status</th><th>Verified</th><th>Children</th><th>Services</th><th>M-Pesa</th><th>Joined</th></tr></thead><tbody>
${schools
  .map((s) =>
    row([
      s.name,
      s.location || '—',
      s.status,
      s.verifiedBadge ? 'Yes' : 'No',
      s._count?.children ?? 0,
      s._count?.services ?? 0,
      s.credentialsStatus?.isConfigured ? 'Configured' : 'Missing',
      s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '',
    ]),
  )
  .join('')}
</tbody></table>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) {
    alert('Please allow pop-ups for this site to view the report.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
};
