import React from 'react';
import {
  LayoutDashboard,
  FileCode2,
  BrainCircuit,
  Activity,
  BellRing,
  ShieldAlert,
  BarChart3,
  FileText,
  Sliders,
  Shield,
  Radio,
  Zap,
  CheckCircle2,
  Server
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'packets'
  | 'ml'
  | 'live-traffic'
  | 'alerts'
  | 'incidents'
  | 'analytics'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  alertCount?: number;
  incidentCount?: number;
  onOpenSimulation: () => void;
  isLiveConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  alertCount = 0,
  incidentCount = 0,
  onOpenSimulation,
  isLiveConnected,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'packets', label: 'Packet Analysis', icon: <FileCode2 className="w-4 h-4" /> },
    { id: 'ml', label: 'ML Threat Detection', icon: <BrainCircuit className="w-4 h-4" /> },
    { id: 'live-traffic', label: 'Live Traffic', icon: <Activity className="w-4 h-4" /> },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <BellRing className="w-4 h-4" />,
      badge: alertCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'incidents',
      label: 'Incidents',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: incidentCount,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'System Settings', icon: <Sliders className="w-4 h-4" /> },
  ];

  return (
    <aside 
      id="soc-sidebar"
      className="w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col shrink-0 select-none z-30"
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="relative p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 text-slate-950 font-black">
            <Shield className="w-5 h-5 text-slate-950" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
              <span>Smart SOC</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700/50 text-cyan-400 font-mono">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight truncate">
              SecOps Defense Center
            </p>
          </div>
        </div>

        {/* Demo Mode Badge */}
        <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-600/30 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            DEMO DATA ACTIVE
          </div>
          <span className="text-[10px] text-amber-400/80">Live Sim</span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>
        {navItems.slice(0, 4).map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}

        <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Response & Intelligence
        </div>
        {navItems.slice(4).map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Simulator Launch Button & Health */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/60">
        <button
          id="sidebar-simulate-attack-btn"
          onClick={onOpenSimulation}
          className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-red-600/90 to-rose-600/90 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-red-950/50 transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
          <span>Simulate Cyber Threat</span>
        </button>

        <div className="px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Radio className={`w-3.5 h-3.5 ${isLiveConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>Ingress Stream</span>
          </div>
          <span className={`text-[10px] font-medium ${isLiveConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isLiveConnected ? 'REAL-TIME' : 'POLLING'}
          </span>
        </div>
      </div>
    </aside>
  );
};
