import React, { useState } from 'react';

interface ChangePasswordModalProps {
  userEmail: string;
  onChangePassword: (newPassword: string) => Promise<void>;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  userEmail,
  onChangePassword,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await onChangePassword(newPassword);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-3xl w-[480px] max-w-full p-6 md:p-8 shadow-2xl space-y-6 border border-[#e6eeff] animate-fadeIn">
        <div className="flex items-center gap-3 border-b border-[#e6eeff] pb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#c2410c] text-white flex items-center justify-center font-bold shrink-0 shadow-md">
            <span className="material-symbols-outlined text-2xl">lock_reset</span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#121c2a] font-display">
              Change Your Password
            </h3>
            <p className="text-xs text-[#737686] mt-0.5">
              First Login Security Check for <strong className="text-[#004ac6]">{userEmail}</strong>
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-700 text-xl shrink-0 mt-0.5">shield</span>
          <p className="text-xs text-amber-900 leading-relaxed">
            You are logging in with a temporary onboarding password. To secure your account, please set a new personal password before proceeding.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
              New Password *
            </label>
            <input
              type="password"
              required
              placeholder="Enter new password (min. 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 text-xs rounded-xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 text-xs rounded-xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn bg-[#004ac6] hover:bg-[#003ea8] text-white text-sm font-extrabold py-3.5 px-6 rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              {submitting ? 'Updating Password...' : 'Save & Continue to Profile Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
