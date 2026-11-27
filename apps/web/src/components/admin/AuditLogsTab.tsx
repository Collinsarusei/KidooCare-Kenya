import React from 'react';
import { AuditLogDto } from '@daycare/shared-types';

interface AuditLogsTabProps {
  auditLogs: AuditLogDto[];
  onRefresh: () => void;
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ auditLogs, onRefresh }) => {
  return (
    <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-[#e6eeff] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#004ac6] font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">history</span>
            Immutable System Audit Trail ({auditLogs.length})
          </h3>
          <p className="text-xs text-[#737686]">Security event logs & transaction state audit</p>
        </div>

        <button 
          className="btn btn-secondary text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5" 
          onClick={onRefresh}
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Refresh Logs
        </button>
      </div>

      <div className="overflow-x-auto border border-[#e6eeff] rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f8f9ff] border-b border-[#e6eeff] text-[#737686] font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Entity Type</th>
              <th className="p-3.5">Action</th>
              <th className="p-3.5">Actor ID</th>
              <th className="p-3.5">State Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e6eeff]">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-[#f8f9ff] transition-colors">
                <td className="p-3.5 text-[#737686] whitespace-nowrap font-mono">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="p-3.5 font-bold text-[#121c2a] uppercase tracking-wider">{log.entityType}</td>
                <td className="p-3.5">
                  <span className="badge badge-blue">{log.action}</span>
                </td>
                <td className="p-3.5 text-[#737686] font-mono">{log.actorId}</td>
                <td className="p-3.5">
                  <details className="cursor-pointer">
                    <summary className="text-[#2563eb] font-semibold hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">code</span>
                      View JSON Diff
                    </summary>
                    <pre className="bg-[#f8f9ff] p-3 rounded-xl border border-[#e6eeff] text-[11px] font-mono text-[#434655] mt-2 overflow-x-auto">
                      {JSON.stringify(log.afterState || log.beforeState || {}, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

