import React from 'react';
import { AlertStatus, IncidentStatus } from '../../types/soc';

interface StatusBadgeProps {
  status: AlertStatus | IncidentStatus | 'Normal' | 'Suspicious' | 'Malicious' | string;
  type?: 'alert' | 'incident' | 'packet';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let colorClass = 'bg-slate-800 text-slate-300 border-slate-700';

  switch (status) {
    case 'New':
    case 'Open':
      colorClass = 'bg-rose-950/50 text-rose-300 border-rose-700/50';
      break;
    case 'Investigating':
      colorClass = 'bg-amber-950/50 text-amber-300 border-amber-700/50';
      break;
    case 'Acknowledged':
    case 'Contained':
      colorClass = 'bg-cyan-950/50 text-cyan-300 border-cyan-700/50';
      break;
    case 'Resolved':
    case 'Closed':
    case 'Normal':
      colorClass = 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50';
      break;
    case 'False Positive':
      colorClass = 'bg-slate-900 text-slate-400 border-slate-700';
      break;
    case 'Suspicious':
      colorClass = 'bg-yellow-950/50 text-yellow-300 border-yellow-700/50';
      break;
    case 'Malicious':
      colorClass = 'bg-red-950/60 text-red-300 border-red-700/50';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${colorClass}`}>
      {status}
    </span>
  );
};
