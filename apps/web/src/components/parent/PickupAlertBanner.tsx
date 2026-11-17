import React from 'react';
import { DailyLogDto } from '@daycare/shared-types';

interface PickupAlertBannerProps {
  requests: DailyLogDto[];
  onAcknowledge: (logId: string) => void;
  onViewLogs: (childId: string) => void;
}

/** Shown at the top of every parent page while a school is waiting for a pickup. */
export const PickupAlertBanner: React.FC<PickupAlertBannerProps> = ({ requests, onAcknowledge, onViewLogs }) => {
  if (!requests.length) return null;
  return (
    <div className="space-y-2">
      {requests.map((r) => (
        <div
          key={r.id}
          className="border-2 border-[#fb923c] bg-[#fff7ed] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#fed7aa] text-[#9a3412] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">notification_important</span>
            </div>
            <div>
              <p className="font-extrabold text-[#9a3412] text-sm">
                Please pick up {r.child?.name || 'your child'}
                {r.child?.school?.name ? ` from ${r.child.school.name}` : ''}
              </p>
              {r.healthNotes && <p className="text-xs text-[#434655] mt-0.5">Reason: {r.healthNotes}</p>}
              <p className="text-[11px] text-[#737686] mt-0.5">
                Requested {new Date(r.updatedAt || r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {r.tutor?.phone ? ` • Tutor phone: ${r.tutor.phone}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => onViewLogs(r.childId)} className="btn btn-secondary text-xs py-1.5 px-3 rounded-xl">
              View log
            </button>
            {r.pickupAcknowledgedAt ? (
              <span className="text-xs font-bold text-[#166534]">✓ School notified you're on the way</span>
            ) : (
              <button onClick={() => onAcknowledge(r.id)} className="btn btn-primary text-xs py-1.5 px-4 rounded-xl">
                I'm on my way
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
