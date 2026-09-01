import React, { useState, useEffect } from 'react';
import { NavTab } from './Sidebar';
import {
  ShieldAlert,
  Clock,
  Zap,
  Search,
  RefreshCw,
  Bell,
  Cpu,
  Wifi,
  ShieldCheck,
  Flame
} from 'lucide-react';

interface HeaderProps {
  activeTab: NavTab;
  onOpenSimulation: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  criticalAlertsCount: number;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  'dashboard': { title: 'Security Operations Dashboard', subtitle: 'Real-time telemetry, network bandwidth, threat vectors & security logs' },
  'packets': { title: 'Packet Capture & Deep Inspection', subtitle: 'Upload PCAP/PCAPNG, dissect multi-layer protocols & inspect payload hex dumps' },
  'ml': { title: 'Machine Learning Threat Detection', subtitle: 'Real-time XGBoost/Random Forest feature extraction, confidence matrix & risk scores' },
  'live-traffic': { title: 'Live Network Traffic Monitor', subtitle: 'Real-time packet oscilloscope, active connections, and dynamic topology flows' },
  'alerts': { title: 'Alert Management & Triage', subtitle: 'Automated threat alert queues, severity ranking, and false-positive filtering' },
  'incidents': { title: 'Incident Response & Playbooks', subtitle: 'End-to-end incident lifecycle: Open, Investigating, Contained, Resolved, Closed' },
  'analytics': { title: 'Security Analytics & Trends', subtitle: 'Historical traffic trends, top attacking actors, and targeted port breakdowns' },
  'reports': { title: 'Executive Security Intelligence Reports', subtitle: 'Generate automated SOC summaries, export structured CSV & PDF briefings' },
  'settings': { title: 'SOC System & Sensor Settings', subtitle: 'Configure ML sensitivity thresholds, packet capture taps, and view engine health' },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenSimulation,
  onRefresh,
  isRefreshing = false,
  criticalAlertsCount = 0,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const meta = TAB_TITLES[activeTab] || { title: 'Security Operations Centre', subtitle: 'Smart Network Security Operations Centre' };

  return (
    <header 
      id="soc-header"
      className="h-16 bg-slate-950/90 border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 z-20"
    >
      {/* Title & Subtitle */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-bold text-slate-100 tracking-tight">{meta.title}</h1>
          {criticalAlertsCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950 border border-red-700/60 text-red-400 text-[11px] font-mono font-semibold animate-pulse">
              <Flame className="w-3 h-3 text-red-400" />
              {criticalAlertsCount} Critical Threats
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 font-normal truncate max-w-xl">
          {meta.subtitle}
        </p>
      </div>

      {/* Right Controls & Clock */}
      <div className="flex items-center gap-3">
        {/* Clock Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentTime}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">{utcTime}</span>
        </div>

        {/* Demo Mode Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-600/40 text-amber-300 text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-bold">DEMO MODE</span>
          <span className="hidden sm:inline text-amber-400/70 text-[11px]">• Simulated network telemetry</span>
        </div>

        {/* Simulate Threat Fast Launcher */}
        <button
          id="header-simulate-attack-btn"
          onClick={onOpenSimulation}
          className="px-3.5 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
          <span>Simulate Attack</span>
        </button>

        {/* Refresh button */}
        <button
          id="header-refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Telemetry"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
