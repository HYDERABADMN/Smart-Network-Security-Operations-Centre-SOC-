import React, { useState, useEffect } from 'react';
import { DashboardData } from '../services/api';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { PacketRecord, ThreatType, SeverityLevel, AlertRecord } from '../types/soc';
import {
  Activity,
  ShieldAlert,
  Wifi,
  HardDrive,
  Cpu,
  Layers,
  AlertTriangle,
  Lock,
  ArrowUpRight,
  ShieldCheck,
  Pause,
  Play,
  Filter,
  ExternalLink,
  Flame,
  Radio,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

interface DashboardViewProps {
  data: DashboardData;
  onInspectPacket: (packet: PacketRecord) => void;
  onOpenSimulation: () => void;
  onNavigateToAlerts: () => void;
  onNavigateToIncidents: () => void;
  onNavigateToPackets: () => void;
  onBlockIp: (ip: string) => void;
  livePackets: PacketRecord[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onInspectPacket,
  onOpenSimulation,
  onNavigateToAlerts,
  onNavigateToIncidents,
  onNavigateToPackets,
  onBlockIp,
  livePackets,
}) => {
  const [trafficHistory, setTrafficHistory] = useState<
    { time: string; pps: number; bandwidth: number; threats: number }[]
  >([]);
  const [isFeedPaused, setIsFeedPaused] = useState(false);
  const [logFilter, setLogFilter] = useState<'All' | 'Critical' | 'High' | 'Medium'>('All');

  // Initialize and update real-time traffic line chart history
  useEffect(() => {
    // Generate initial 15 points
    const points = [];
    const now = Date.now();
    for (let i = 14; i >= 0; i--) {
      const t = new Date(now - i * 3000);
      points.push({
        time: t.toLocaleTimeString(),
        pps: Math.floor(Math.random() * 400 + 1200),
        bandwidth: Number((Math.random() * 40 + 140).toFixed(1)),
        threats: Math.random() > 0.7 ? Math.floor(Math.random() * 3 + 1) : 0,
      });
    }
    setTrafficHistory(points);
  }, []);

  // Update chart with live incoming packet stream
  useEffect(() => {
    if (livePackets.length === 0) return;
    const latest = livePackets[0];
    const newPoint = {
      time: new Date().toLocaleTimeString(),
      pps: data.kpis.packetsPerSec + Math.floor(Math.random() * 120 - 60),
      bandwidth: Number((data.kpis.bandwidthMbps + (Math.random() * 10 - 5)).toFixed(1)),
      threats: latest.status !== 'Normal' ? 1 : 0,
    };

    setTrafficHistory((prev) => {
      const updated = [...prev.slice(1), newPoint];
      return updated;
    });
  }, [livePackets, data.kpis.packetsPerSec, data.kpis.bandwidthMbps]);

  const kpis = data.kpis;
  const filteredLogs = isFeedPaused
    ? data.recentLogs
    : data.recentLogs.filter((l) =>
        logFilter === 'All' ? true : l.severity === logFilter
      );

  return (
    <div className="space-y-6 pb-12">
      {/* Active Threat Notification Banner */}
      {kpis.criticalAlerts > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/80 via-slate-950 to-slate-900 border border-red-600/40 shadow-lg shadow-red-950/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 animate-pulse">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-red-600 text-white">
                  DEFCON 2 CRITICAL
                </span>
                <h3 className="text-sm font-bold text-slate-100">
                  {kpis.criticalAlerts} Critical Threat Vectors Require Immediate Triage
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active volumetric flood and lateral movement attempts detected by ML engine on perimeter ingress sensors.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToIncidents}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              Open Incident Response
            </button>
            <button
              onClick={onNavigateToAlerts}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              Review Alerts
            </button>
          </div>
        </div>
      )}

      {/* 8 Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Packets */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Packets</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono tracking-tight">
            {kpis.totalPackets.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">+1.2k/min</span>
        </div>

        {/* Packets/sec */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Packets/Sec</span>
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-cyan-400 font-mono tracking-tight">
            {kpis.packetsPerSec.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Live ingress</span>
        </div>

        {/* Bandwidth */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Bandwidth</span>
            <Wifi className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono tracking-tight">
            {kpis.bandwidthMbps} <span className="text-xs font-normal text-slate-400">Mbps</span>
          </div>
          <span className="text-[10px] text-purple-400 font-mono">1Gbps link</span>
        </div>

        {/* Active Connections */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Active Conns</span>
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono tracking-tight">
            {kpis.activeConnections}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">TCP / UDP flows</span>
        </div>

        {/* Threats Detected */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Threats</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400 font-mono tracking-tight">
            {kpis.threatsDetected}
          </div>
          <span className="text-[10px] text-amber-400 font-mono">ML Classified</span>
        </div>

        {/* Critical Alerts */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Critical</span>
            <Flame className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-lg font-bold text-red-400 font-mono tracking-tight">
            {kpis.criticalAlerts}
          </div>
          <span className="text-[10px] text-red-400 font-mono">High priority</span>
        </div>

        {/* Blocked IPs */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Blocked IPs</span>
            <Lock className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono tracking-tight">
            {kpis.blockedIPs}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Firewall drop</span>
        </div>

        {/* System Health */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">SOC Health</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono tracking-tight">
            {kpis.systemHealth}%
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">All taps up</span>
        </div>
      </div>

      {/* Main Charts Row: Real-Time Network Traffic & Protocol Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Traffic Line Chart (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Real-Time Network Ingress Telemetry</h3>
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/50 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE STREAM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Packets per second vs Bandwidth throughput (Rolling 60s)</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-0.5 bg-cyan-400" /> Packets/sec
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2.5 h-0.5 bg-purple-400" /> Bandwidth (Mbps)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ppsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area type="monotone" dataKey="pps" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#ppsGrad)" />
                <Area type="monotone" dataKey="bandwidth" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#bwGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol Distribution Donut Chart (1 Col) */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Protocol Distribution</h3>
              <p className="text-xs text-slate-400">Captured protocol share</p>
            </div>
            <button
              onClick={onNavigateToPackets}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              Analyze <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.protocolDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {data.protocolDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
            {data.protocolDistribution.slice(0, 6).map((proto) => (
              <div key={proto.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: proto.color }} />
                <span className="text-slate-400">{proto.name}:</span>
                <span className="text-slate-200 font-semibold">{proto.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Threat Distribution & Top Talkers Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Distribution Bar Chart (1 Col) */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Threat Severity Spectrum</h3>
              <p className="text-xs text-slate-400">Classified active security threats</p>
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.threatDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <XAxis type="number" stroke="#475569" fontSize={10} />
                <YAxis dataKey="severity" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.threatDistribution.map((entry, index) => (
                    <Cell key={`threat-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Total Active Detections:</span>
            <span className="font-mono text-cyan-400 font-bold">{data.kpis.threatsDetected}</span>
          </div>
        </div>

        {/* Top Talkers (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Top Talkers & Traffic Generators</h3>
              <p className="text-xs text-slate-400">High bandwidth and suspect endpoints communicating with network</p>
            </div>
            <button
              onClick={onNavigateToPackets}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              View Full Flows <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2 font-medium">Node / IP</th>
                  <th className="pb-2 font-medium">Origin / Domain</th>
                  <th className="pb-2 font-medium text-right">Packets</th>
                  <th className="pb-2 font-medium text-right">Volume</th>
                  <th className="pb-2 font-medium text-center">Threats</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.topTalkers.slice(0, 5).map((node) => (
                  <tr key={node.ip} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 text-slate-200 font-bold flex items-center gap-1.5">
                      <span>{node.flag || '🌐'}</span>
                      <span className={node.isBlocked ? 'line-through text-rose-400' : 'text-slate-200'}>{node.ip}</span>
                    </td>
                    <td className="py-2.5 text-slate-400 truncate max-w-[140px]">{node.domain || node.country}</td>
                    <td className="py-2.5 text-right text-slate-300">{node.packets.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-cyan-400">{(node.bytes / 1000000).toFixed(1)} MB</td>
                    <td className="py-2.5 text-center">
                      {node.threatCount > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-950 border border-red-700/50 text-red-400 text-[10px] font-bold">
                          {node.threatCount} attacks
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[10px]">Clean</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onBlockIp(node.ip)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                          node.isBlocked
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900'
                            : 'bg-rose-950 text-rose-300 border border-rose-700/50 hover:bg-rose-900'
                        }`}
                      >
                        {node.isBlocked ? 'Unblock' : 'Drop IP'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Live Security Events Log Stream */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-700/40 text-cyan-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Live Security Event Feed</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  WebSocket Stream
                </span>
              </div>
              <p className="text-xs text-slate-400">Continuous intrusion triggers and firewall telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Buttons */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {(['All', 'Critical', 'High', 'Medium'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLogFilter(lvl)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    logFilter === lvl ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Pause/Resume Feed */}
            <button
              onClick={() => setIsFeedPaused(!isFeedPaused)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {isFeedPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-yellow-400" />}
              <span>{isFeedPaused ? 'Resume Stream' : 'Pause'}</span>
            </button>
          </div>
        </div>

        {/* Event Logs List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="py-6 text-center text-slate-500">No events matching current severity filter</div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <SeverityBadge severity={log.severity} size="sm" />
                  <span className="text-slate-200 font-semibold">{log.message}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[11px] shrink-0">
                  <span>Src: <strong className="text-cyan-400">{log.sourceIp}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
