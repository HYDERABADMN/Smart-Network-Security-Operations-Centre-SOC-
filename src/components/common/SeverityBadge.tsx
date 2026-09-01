import React from 'react';
import { SeverityLevel } from '../../types/soc';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  showIcon = true,
}) => {
  const styles: Record<SeverityLevel, { bg: string; text: string; border: string; dot: string; icon: React.ReactNode }> = {
    Critical: {
      bg: 'bg-red-950/60',
      text: 'text-red-400',
      border: 'border-red-600/40',
      dot: 'bg-red-500 animate-pulse',
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
    },
    High: {
      bg: 'bg-orange-950/60',
      text: 'text-orange-400',
      border: 'border-orange-600/40',
      dot: 'bg-orange-500',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    Medium: {
      bg: 'bg-yellow-950/50',
      text: 'text-yellow-400',
      border: 'border-yellow-600/40',
      dot: 'bg-yellow-500',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    Low: {
      bg: 'bg-emerald-950/50',
      text: 'text-emerald-400',
      border: 'border-emerald-600/40',
      dot: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    Informational: {
      bg: 'bg-blue-950/50',
      text: 'text-blue-400',
      border: 'border-blue-600/40',
      dot: 'bg-blue-500',
      icon: <Info className="w-3.5 h-3.5" />,
    },
  };

  const current = styles[severity] || styles.Informational;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${current.bg} ${current.text} ${current.border} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {showIcon && current.icon}
      <span>{severity}</span>
    </span>
  );
};
