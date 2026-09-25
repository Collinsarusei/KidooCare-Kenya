import React, { useState } from 'react';

interface TutorInvitationAcceptProps {
  token: string;
  onAccepted: (data: { accessToken: string; refreshToken: string; user: any }) => void;
}

export const TutorInvitationAccept: React.FC<TutorInvitationAcceptProps> = ({ token, onAccepted }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/auth/tutor-invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'This invitation is invalid or expired.');
      onAccepted(data);
    } catch (err: any) {
      setError(err.message || 'Unable to accept invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-[#c3c6d7] rounded-3xl shadow-sm p-8 space-y-5">
        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-5xl text-[#004ac6]">mark_email_read</span>
          <h1 className="text-2xl font-bold text-[#121c2a]">Accept Tutor Invitation</h1>
          <p className="text-sm text-[#737686]">Create your password to join the daycare team.</p>
        </div>
        {error && <p className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</p>}
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" className="w-full px-4 py-3 rounded-xl border border-[#c3c6d7]" />
        <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="w-full px-4 py-3 rounded-xl border border-[#c3c6d7]" />
        <button type="submit" disabled={submitting} className="w-full btn btn-primary py-3 rounded-xl disabled:opacity-50">
          {submitting ? 'Accepting invitation...' : 'Accept Invitation'}
        </button>
      </form>
    </div>
  );
};
