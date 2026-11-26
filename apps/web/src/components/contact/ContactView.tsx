import React, { useEffect, useState } from 'react';

export type ContactTopic = 'PARENT' | 'DAYCARE' | 'PAYMENTS' | 'TECHNICAL' | 'PARTNERSHIP' | 'OTHER';

interface ContactViewProps {
  currentUser?: { name?: string | null; email?: string; phone?: string } | null;
  initialTopic?: ContactTopic;
  onBack?: () => void;
}

const TOPICS: { id: ContactTopic; label: string; icon: string; hint: string }[] = [
  { id: 'PARENT', label: 'I am a parent', icon: 'family_restroom', hint: 'Finding a daycare, enrolling, reviews' },
  { id: 'DAYCARE', label: 'List my daycare', icon: 'domain_add', hint: 'Get onboarded and verified' },
  { id: 'PAYMENTS', label: 'Payments', icon: 'payments', hint: 'M-Pesa, Lipa Mdogo Mdogo, refunds' },
  { id: 'TECHNICAL', label: 'Technical help', icon: 'build', hint: 'Login, uploads, app issues' },
  { id: 'PARTNERSHIP', label: 'Partnership', icon: 'handshake', hint: 'Work with KiddoCare' },
  { id: 'OTHER', label: 'Something else', icon: 'chat', hint: 'Any other question' },
];

const FAQS = [
  {
    q: 'How do I enroll my child?',
    a: 'Browse daycares, pick a program and pay the first installment. The daycare then reviews and approves the admission.',
  },
  {
    q: 'What if the daycare does not approve my child?',
    a: 'You are notified straight away and told how much to collect as a refund from the daycare.',
  },
  {
    q: 'How do I list my daycare?',
    a: 'Send us a message with the "List my daycare" topic. We verify your licence and send you login details.',
  },
  {
    q: 'Can I pay in small amounts?',
    a: 'Yes. With Lipa Mdogo Mdogo the monthly fee is split into weekly M-Pesa installments.',
  },
];

const inputCls =
  'w-full px-4 py-3 text-sm rounded-xl border border-[#c3c6d7] bg-white focus:ring-2 focus:ring-[#004ac6] focus:border-transparent outline-none transition-all';
const labelCls = 'block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5';

export const ContactView: React.FC<ContactViewProps> = ({ currentUser, initialTopic = 'PARENT', onBack }) => {
  const [topic, setTopic] = useState<ContactTopic>(initialTopic);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ message: string } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => setTopic(initialTopic), [initialTopic]);
  useEffect(() => {
    if (currentUser) {
      setName((v) => v || currentUser.name || '');
      setEmail((v) => v || currentUser.email || '');
      setPhone((v) => v || currentUser.phone || '');
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (message.trim().length < 10) {
      setError('Please write a little more so we can help (at least 10 characters).');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          topic,
          subject: subject.trim() || TOPICS.find((t) => t.id === topic)!.label,
          message: message.trim(),
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'Could not send your message.');
      }
      setSent({ message: data.message });
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-fadeIn">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#004ac6] via-[#1d4ed8] to-[#006c49] text-white p-8 md:p-12">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute right-24 -bottom-20 w-48 h-48 rounded-full bg-white/10" />
        <div className="relative max-w-2xl space-y-3">
          {onBack && (
            <button onClick={onBack} className="text-xs font-bold text-blue-100 hover:text-white flex items-center gap-1 mb-2">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Back
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-sm">support_agent</span> We're here to help
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold font-display leading-tight">Get in touch with KiddoCare</h1>
          <p className="text-sm md:text-base text-blue-100 leading-relaxed">
            Questions about a daycare, a payment, or listing your centre? Send us a message and our team will reply within one working day.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
        {/* LEFT: contact info + FAQ */}
        <div className="space-y-4">
          {[
            { icon: 'mail', title: 'Email', value: 'admin@kiddocare.co.ke', note: 'Or use the form — it reaches the same inbox' },
            { icon: 'call', title: 'Phone / WhatsApp', value: '+254 700 000 000', note: 'Mon – Fri, 8:00 AM – 6:00 PM' },
            { icon: 'location_on', title: 'Office', value: 'Nairobi, Kenya', note: 'Serving daycares countrywide' },
          ].map((c) => (
            <div key={c.title} className="bg-white border border-[#e6eeff] rounded-2xl p-4 flex items-start gap-3 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-[#eff4ff] text-[#004ac6] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">{c.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#737686] uppercase tracking-wider">{c.title}</p>
                <p className="text-sm font-extrabold text-[#121c2a] select-all break-words">{c.value}</p>
                <p className="text-[11px] text-[#737686]">{c.note}</p>
              </div>
            </div>
          ))}

          <div className="bg-white border border-[#e6eeff] rounded-2xl p-4 shadow-xs">
            <h3 className="text-sm font-extrabold text-[#121c2a] mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#004ac6] text-lg">quiz</span> Quick answers
            </h3>
            <div className="divide-y divide-[#e6eeff]">
              {FAQS.map((f, i) => (
                <div key={f.q}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex justify-between items-center py-2.5 text-left text-xs font-bold text-[#121c2a]"
                  >
                    {f.q}
                    <span className="material-symbols-outlined text-base text-[#737686]">{openFaq === i ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  {openFaq === i && <p className="text-xs text-[#434655] pb-3 leading-relaxed">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: form */}
        <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-8 shadow-sm">
          {sent ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#dcfce7] text-[#166534] flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl">mark_email_read</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#121c2a] font-display">Message sent</h2>
              <p className="text-sm text-[#434655] max-w-sm mx-auto">{sent.message}</p>
              <button onClick={() => setSent(null)} className="btn btn-secondary text-sm px-5 py-2.5 rounded-full">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-[#121c2a] font-display">Send us a message</h2>
                <p className="text-xs text-[#737686] mt-0.5">Fields marked * are required.</p>
              </div>

              <div>
                <label className={labelCls}>What is this about? *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TOPICS.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setTopic(t.id)}
                      title={t.hint}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        topic === t.id
                          ? 'border-[#004ac6] bg-[#eff4ff] ring-2 ring-[#004ac6]/20'
                          : 'border-[#e2e8f0] hover:border-[#b4c5ff] bg-white'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-xl ${topic === t.id ? 'text-[#004ac6]' : 'text-[#737686]'}`}>{t.icon}</span>
                      <p className="text-xs font-bold text-[#121c2a] mt-1">{t.label}</p>
                      <p className="text-[10px] text-[#737686] leading-tight hidden sm:block">{t.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Full name *</label>
                  <input required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Wanjiku" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input required type="email" maxLength={150} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone (optional)</label>
                  <input type="tel" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Subject</label>
                  <input maxLength={150} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Message *</label>
                <textarea
                  required
                  rows={6}
                  maxLength={3000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    topic === 'DAYCARE'
                      ? 'Daycare name, location, number of children and the best time to reach you...'
                      : topic === 'PAYMENTS'
                      ? 'Child name, daycare, amount and M-Pesa code if you have it...'
                      : 'How can we help?'
                  }
                  className={`${inputCls} leading-relaxed`}
                />
                <p className="text-[10px] text-[#737686] text-right mt-1">{message.length}/3000</p>
              </div>

              {/* Honeypot (hidden from people, bots fill it) */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
                aria-hidden="true"
                name="website"
              />

              {error && (
                <div className="bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-xs font-semibold rounded-xl p-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full btn bg-[#004ac6] hover:bg-[#003ea8] text-white text-sm font-extrabold py-3.5 rounded-full shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-lg">{sending ? 'hourglass_top' : 'send'}</span>
                {sending ? 'Sending...' : 'Send message'}
              </button>
              <p className="text-[10px] text-[#737686] text-center">
                We only use your details to reply to this message.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
