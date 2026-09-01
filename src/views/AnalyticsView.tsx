import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Layers,
  ShieldAlert,
  Flame,
  Globe,
  HardDrive,
  Download,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'custom'>('7d');

  // Multi-day traffic volume trends data
  const volumeData = [
    { day: 'Mon', normal: 124000, threats: 3200, bandwidth: 420 },
    { day: 'Tue', normal: 138000, threats: 4100, bandwidth: 510 },
    { day: 'Wed', normal: 165000, threats: 8900, bandwidth: 740 },
    { day: 'Thu', normal: 142000, threats: 5200, bandwidth: 480 },
    { day: 'Fri', normal: 189000, threats: 12400, bandwidth: 890 },
    { day: 'Sat', normal: 98000, threats: 2800, bandwidth: 320 },
    { day: 'Sun', normal: 85000, threats: 1900, bandwidth: 290 },
  ];

  // Threat types breakdown
  const attackTypes = [
    { name: 'DDoS / SYN Flood', count: 1840, color: '#ef4444' },
    { name: 'Port Scan / Sweep', count: 1230, color: '#f97316' },
    { name: 'SSH/HTTP Brute Force', count: 950, color: '#eab308' },
    { name: 'DNS Tunneling / Exfil', count: 640, color: '#8b5cf6' },
    { name: 'Malware C2 Beaconing', count: 480, color: '#ec4899' },
    { name: 'Botnet Fast-Flux', count: 320, color: '#06b6d4' },
  ];

  // Top malicious IPs
  const topAttackers = [
    { ip: '185.220.101.5', country: 'Germany (Tor Exit)', attacks: 3420, bandwidth: '45.2 MB', risk: 'Critical' },
    { ip: '198.51.100.24', country: 'United States', attacks: 2840, bandwidth: '31.8 MB', risk: 'Critical' },
    { ip: '203.0.113.77', country: 'Singapore', attacks: 1950, bandwidth: '18.4 MB', risk: 'High' },
    { ip: '45.33.32.156', country: 'Netherlands', attacks: 1420, bandwidth: '12.1 MB', risk: 'High' },
    { ip: '194.26.29.112', country: 'Bulgaria', attacks: 980, bandwidth: '8.4 MB', risk: 'Medium' },
    { ip: '103.251.167.20', country: 'India', attacks: 740, bandwidth: '5.2 MB', risk: 'Medium' },
    { ip: '89.248.165.74', country: 'Seychelles', attacks: 610, bandwidth: '4.8 MB', risk: 'Medium' },
  ];

  // Targeted Ports
  const targetedPorts = [
    { port: 'Port 80 (HTTP)', count: 4200, service: 'Web Server' },
    { port: 'Port 443 (HTTPS)', count: 3800, service: 'TLS Gateway' },
    { port: 'Port 22 (SSH)', count: 2900, service: 'Management CLI' },
    { port: 'Port 53 (DNS)', count: 2100, service: 'Name Resolution' },
    { port: 'Port 3389 (RDP)', count: 1650, service: 'Remote Desktop' },
    { port: 'Port 5432 (Postgres)', count: 980, service: 'Database Core' },
    { port: 'Port 8080 (Alt-HTTP)', count: 720, service: 'Dev Services' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Controls & Time Range Filter */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Security Intelligence & Trend Analytics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated multi-sensor telemetry, attack distribution matrices & malicious endpoint rankings
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <Calendar className="w-4 h-4 text-cyan-400 ml-2 mr-1" />
          {(['today', '7d', '30d', 'custom'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                timeRange === r
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === 'today' ? 'Today' : r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Charts: Multi-day Volume & Threat Frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-day Traffic Volume Line (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Traffic Volume & Threat Ingress Over Time
              </h4>
              <p className="text-xs text-slate-400">Total packet throughput vs Classified threat spikes</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Normal Packets
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Threat Frames
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="normGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }} />
                <Area type="monotone" dataKey="normal" stroke="#06b6d4" strokeWidth={2} fill="url(#normGrad)" />
                <Area type="monotone" dataKey="threats" stroke="#ef4444" strokeWidth={2} fill="url(#threatGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attack Vector Donut (1 Col) */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="mb-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Attack Types & Vectors
            </h4>
            <p className="text-xs text-slate-400">Classified threat taxonomy</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attackTypes} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="count">
                  {attackTypes.map((entry, index) => (
                    <Cell key={`attack-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-800 text-[10px] font-mono">
            {attackTypes.slice(0, 4).map((a) => (
              <div key={a.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                  {a.name}
                </span>
                <span className="text-slate-400">{a.count} ({((a.count / 5460) * 100).toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 10 Malicious Threat Actors & Targeted Ports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Attacking IPs */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Top Malicious Threat Actors
              </h4>
              <p className="text-xs text-slate-400">Repeated hostile origin nodes</p>
            </div>
            <span className="text-xs font-mono text-rose-400 font-bold">Top 7 Ranked</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2">Attacker IP</th>
                  <th className="pb-2">Geo Origin</th>
                  <th className="pb-2 text-right">Attacks</th>
                  <th className="pb-2 text-right">Volume</th>
                  <th className="pb-2 text-right">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topAttackers.map((att) => (
                  <tr key={att.ip} className="hover:bg-slate-800/40">
                    <td className="py-2.5 text-rose-400 font-bold">{att.ip}</td>
                    <td className="py-2.5 text-slate-400 truncate max-w-[130px]">{att.country}</td>
                    <td className="py-2.5 text-right text-slate-200 font-semibold">{att.attacks}</td>
                    <td className="py-2.5 text-right text-slate-400">{att.bandwidth}</td>
                    <td className="py-2.5 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        att.risk === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {att.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Targeted Ports Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Targeted Ports & Services Breakdown
              </h4>
              <p className="text-xs text-slate-400">Probed transport endpoints</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold">Port Analysis</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={targetedPorts} layout="vertical" margin={{ top: 0, right: 15, left: 25, bottom: 0 }}>
                <XAxis type="number" stroke="#475569" fontSize={10} />
                <YAxis dataKey="port" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
