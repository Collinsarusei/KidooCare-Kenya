import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface ArrearsRow {
  enrollmentId: string;
  childId: string;
  childName: string;
  serviceName: string;
  parent: { id: string; name: string | null; email: string; phone: string };
  isWalkInParent: boolean;
  arrears: number;
  unpaidWeeks: number;
  oldestDueDate: string | null;
  daysOverdue: number;
  oldestInstallmentBalance: number;
  lastReminder: { at: string; type: string } | null;
}

interface SchoolArrearsTabProps {
  schoolId: string;
}

const kes = (n: number) => `KES ${Math.round(n || 0).toLocaleString()}`;

export const SchoolArrearsTab: React.FC<SchoolArrearsTabProps> = ({ schoolId }) => {
  const [rows, setRows] = useState<ArrearsRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [prompting, setPrompting] = useState<ArrearsRow | null>(null);
  const [promptPhone, setPromptPhone] = useState('');

  const headers = (json = false): Record<string, string> => {
    const t = localStorage.getItem('token');
    return { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(t ? { Authorization: `Bearer ${t}` } : {}) };
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/arrears`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not load arrears');
      setRows(data.rows);
      setTotal(data.totalArrears);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const post = async (url: string, body: object, key: string) => {
    setBusy(key);
    try {
      const res = await fetch(url, { method: 'POST', headers: headers(true), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'Request failed');
      return data;
    } finally {
      setBusy(null);
    }
  };

  const emailOne = async (r: ArrearsRow) => {
    try {
      const data = await post(`/api/schools/${schoolId}/arrears/${r.enrollmentId}/email`, note.trim() ? { note: note.trim() } : {}, `email-${r.enrollmentId}`);
      toast.success(data.message);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const emailAll = async () => {
    if (!window.confirm(`Email a payment reminder to all ${rows.length} parent(s) with arrears?`)) return;
    try {
      const data = await post(`/api/schools/${schoolId}/arrears/email-all`, note.trim() ? { note: note.trim() } : {}, 'email-all');
      toast.success(data.message);
      if (data.failed?.length) toast.error(`Not emailed: ${data.failed.join(', ')}`, { duration: 8000 });
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const sendPrompt = async () => {
    if (!prompting) return;
    try {
      const data = await post(
        `/api/schools/${schoolId}/arrears/${prompting.enrollmentId}/stk`,
        promptPhone.trim() ? { phone: promptPhone.trim() } : {},
        `stk-${prompting.enrollmentId}`,
      );
      toast.success(data.customerMessage || 'M-Pesa prompt sent');
      setPrompting(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const shown = rows.filter((r) =>
    !search ? true : `${r.childName} ${r.parent.name || ''} ${r.parent.email} ${r.parent.phone}`.toLowerCase().includes(search.toLowerCase()),
  );
  const severe = rows.filter((r) => r.unpaidWeeks >= 3).length;

  return (
    <div className="space-y-6">
      {/* M-Pesa prompt modal */}
      {prompting && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-[#121c2a] font-display">Send M-Pesa prompt</h3>
            <p className="text-sm text-[#434655]">
              The parent of <strong>{prompting.childName}</strong> will get a pop-up on their phone asking them to pay{' '}
              <strong>{kes(prompting.oldestInstallmentBalance)}</strong> (the oldest unpaid week). They just enter their M-Pesa PIN.
            </p>
            <div>
              <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">Phone number</label>
              <input
                value={promptPhone}
                onChange={(e) => setPromptPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
              />
              <p className="text-[11px] text-[#737686] mt-1">Pre-filled with the parent's number on file. Change it if they asked you to use another line.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPrompting(null)} className="btn btn-secondary text-xs px-4 py-2 rounded-xl">
                Cancel
              </button>
              <button onClick={sendPrompt} disabled={!!busy} className="btn btn-success text-xs px-4 py-2 rounded-xl disabled:opacity-50 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">phone_iphone</span>
                {busy ? 'Sending...' : 'Send prompt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white border border-[#e6eeff] rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-[#121c2a] font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-[#c2410c]">account_balance_wallet</span>
              Arrears & Payment Reminders
            </h2>
            <p className="text-xs text-[#737686]">Children with unpaid weeks that are already due. Remind parents by email or send an M-Pesa prompt straight to their phone.</p>
          </div>
          <button onClick={load} className="btn btn-secondary text-xs px-4 py-2 rounded-xl flex items-center gap-1 self-start">
            <span className="material-symbols-outlined text-base">refresh</span> Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-2xl p-4">
            <p className="text-2xl font-extrabold text-[#c2410c] font-display">{kes(total)}</p>
            <p className="text-[11px] font-bold text-[#9a3412] uppercase tracking-wider">Total outstanding</p>
          </div>
          <div className="bg-[#f8f9ff] border border-[#e6eeff] rounded-2xl p-4">
            <p className="text-2xl font-extrabold text-[#121c2a] font-display">{rows.length}</p>
            <p className="text-[11px] font-bold text-[#737686] uppercase tracking-wider">Children in arrears</p>
          </div>
          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-4">
            <p className="text-2xl font-extrabold text-[#b91c1c] font-display">{severe}</p>
            <p className="text-[11px] font-bold text-[#b91c1c] uppercase tracking-wider">3+ weeks behind</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Optional message to include in reminder emails (e.g. Please clear by Friday)"
            className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] outline-none focus:ring-2 focus:ring-[#004ac6]"
          />
          <button onClick={emailAll} disabled={!rows.length || !!busy} className="btn btn-primary text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 disabled:opacity-50">
            <span className="material-symbols-outlined text-lg">forward_to_inbox</span>
            {busy === 'email-all' ? 'Sending...' : `Email all (${rows.length})`}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-[#e6eeff] rounded-3xl p-5 md:p-6 shadow-sm space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search child or parent..."
          className="w-full md:w-80 px-3.5 py-2 text-sm rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] outline-none focus:ring-2 focus:ring-[#004ac6]"
        />
        {loading ? (
          <p className="text-sm text-[#737686] text-center py-8">Loading...</p>
        ) : shown.length === 0 ? (
          <div className="text-center py-10 bg-[#f0fdf4] rounded-2xl border border-dashed border-[#86efac]">
            <span className="material-symbols-outlined text-4xl text-[#16a34a]">task_alt</span>
            <p className="text-sm font-bold text-[#166534]">{rows.length ? 'No matches' : 'No arrears — all parents are up to date!'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {shown.map((r) => (
              <div
                key={r.enrollmentId}
                className={`border rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                  r.unpaidWeeks >= 3 ? 'border-[#fecaca] bg-[#fffafa]' : 'border-[#e6eeff]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-extrabold text-[#121c2a]">{r.childName}</h4>
                    <span className="text-xs text-[#737686]">{r.serviceName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.unpaidWeeks >= 3 ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                      {r.unpaidWeeks} week{r.unpaidWeeks === 1 ? '' : 's'} unpaid
                      {r.daysOverdue > 0 ? ` • ${r.daysOverdue} days overdue` : ''}
                    </span>
                  </div>
                  <p className="text-xs text-[#434655] mt-1">
                    {r.parent.name || 'Parent'} • {r.isWalkInParent ? 'no email (walk-in)' : r.parent.email} • {r.parent.phone}
                  </p>
                  {r.lastReminder && (
                    <p className="text-[11px] text-[#737686] mt-0.5">
                      Last reminder: {r.lastReminder.type}, {new Date(r.lastReminder.at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-lg font-extrabold text-[#c2410c] mr-2">{kes(r.arrears)}</p>
                  <button
                    onClick={() => emailOne(r)}
                    disabled={r.isWalkInParent || !!busy}
                    title={r.isWalkInParent ? 'Walk-in parent has no email' : 'Email a link to pay'}
                    className="btn btn-secondary text-xs py-2 px-3 rounded-xl flex items-center gap-1 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-base">mail</span>
                    {busy === `email-${r.enrollmentId}` ? 'Sending...' : 'Email link'}
                  </button>
                  <button
                    onClick={() => {
                      setPrompting(r);
                      setPromptPhone(r.parent.phone || '');
                    }}
                    disabled={!!busy}
                    className="btn btn-success text-xs py-2 px-3 rounded-xl flex items-center gap-1 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-base">phone_iphone</span>
                    M-Pesa prompt
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
