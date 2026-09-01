import React, { useState, useEffect } from 'react';
import { PacketRecord, ThreatType } from '../types/soc';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Activity,
  Wifi,
  Radio,
  Pause,
  Play,
  Cpu,
  Layers,
  Globe2,
  Server,
  Zap,
  ArrowRight,
  ShieldAlert,
  HardDrive
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface LiveTrafficViewProps {
  livePackets: PacketRecord[];
  onInspectPacket: (packet: PacketRecord) => void;
  onOpenSimulation: () => void;
}

export const LiveTrafficView: React.FC<LiveTrafficViewProps> = ({
  livePackets,
  onInspectPacket,
  onOpenSimulation,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [packetStream, setPacketStream] = useState<PacketRecord[]>([]);
  const [throughputHistory, setThroughputHistory] = useState<{ time: string; pps: number; kbps: number }[]>([]);

  // Active simulated socket sessions
  const [activeSessions, setActiveSessions] = useState([
    { id: 'SESS-101', src: '198.51.100.24:49152', dst: '192.168.1.50:80', proto: 'TCP', bytes: 842000, duration: '4m 12s', status: 'Suspicious' },
    { id: 'SESS-102', src: '192.168.1.25:52110', dst: '10.0.0.15:5432', proto: 'TCP', bytes: 1420000, duration: '12m 45s', status: 'Normal' },
    { id: 'SESS-103', src: '185.220.101.5:41299', dst: '192.168.1.20:22', proto: 'SSH', bytes: 94000, duration: '1m 08s', status: 'Malicious' },
    { id: 'SESS-104', src: '192.168.1.44:58902', dst: '8.8.8.8:53', proto: 'DNS', bytes: 12400, duration: '0m 34s', status: 'Normal' },
    { id: 'SESS-105', src: '203.0.113.77:60122', dst: '192.168.1.100:443', proto: 'HTTPS', bytes: 489000, duration: '2m 50s', status: 'Suspicious' },
  ]);

  // Append live incoming packets
  useEffect(() => {
    if (isPaused || livePackets.length === 0) return;
    setPacketStream(prev => [livePackets[0], ...prev.slice(0, 49)]);

    const now = new Date();
    setThroughputHistory(prev => {
      const newPt = {
        time: now.toLocaleTimeString(),
        pps: Math.floor(Math.random() * 300 + 1350),
        kbps: Math.floor(Math.random() * 50000 + 120000),
      };
      return [...prev.slice(prev.length > 20 ? 1 : 0), newPt];
    });
  }, [livePackets, isPaused]);

  // Topology node statuses
  const topologyNodes = [
    { name: 'Edge Gateway DMZ', ip: '192.168.1.1', type: 'Gateway', status: 'Healthy', load: '64%' },
    { name: 'Web Ingress Proxy', ip: '192.168.1.50', type: 'Load Balancer', status: 'Warning', load: '88%' },
    { name: 'Core DB Cluster', ip: '10.0.0.15', type: 'Database', status: 'Healthy', load: '42%' },
    { name: 'App Microservices', ip: '172.16.0.5', type: 'Kubernetes', status: 'Healthy', load: '55%' },
    { name: 'Auth & LDAP Server', ip: '192.168.1.20', type: 'Identity', status: 'Warning', load: '79%' },
    { name: 'Internal Workstations', ip: '192.168.1.0/24', type: 'LAN Subnet', status: 'Healthy', load: '28%' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Stream Controls & Live Oscilloscope */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-700/40 text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Live Network Traffic Oscilloscope</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                  {isPaused ? 'STREAM PAUSED' : 'REAL-TIME ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Ingress frame rate & throughput sampling at 1000ms intervals</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-yellow-400" />}
              <span>{isPaused ? 'Resume Capture' : 'Pause Stream'}</span>
            </button>
            <button
              onClick={onOpenSimulation}
              className="px-3.5 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Surge</span>
            </button>
          </div>
        </div>

        {/* Oscilloscope Chart */}
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={throughputHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="livePpsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#475569" fontSize={10} />
              <YAxis stroke="#475569" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              />
              <Area type="monotone" dataKey="pps" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#livePpsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Network Infrastructure Topology Health */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Internal Infrastructure & Node Topology
            </h4>
            <p className="text-xs text-slate-400">Current load & communication states across critical endpoints</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-semibold">6 Monitored Segments</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topologyNodes.map((node) => (
            <div
              key={node.name}
              className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">{node.name}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">{node.ip} • {node.type}</div>
              </div>
              <div className="text-right space-y-1">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  node.status === 'Healthy' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                }`}>
                  {node.status}
                </span>
                <span className="block text-[11px] font-mono text-slate-300">{node.load} CPU</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Flow Sessions & Live Incoming Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sessions Matrix */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Active Stateful Sessions</h4>
              <p className="text-xs text-slate-400">Ongoing bidirectional socket connections</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">5 Monitored Flows</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2">Session Flow</th>
                  <th className="pb-2">Proto</th>
                  <th className="pb-2 text-right">Bytes</th>
                  <th className="pb-2 text-right">Duration</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeSessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-800/40">
                    <td className="py-2 text-slate-300">
                      <div className="text-slate-200 font-semibold">{sess.src}</div>
                      <div className="text-slate-500 text-[10px]">➔ {sess.dst}</div>
                    </td>
                    <td className="py-2 text-cyan-400 font-bold">{sess.proto}</td>
                    <td className="py-2 text-right text-slate-300">{(sess.bytes / 1024).toFixed(0)} KB</td>
                    <td className="py-2 text-right text-slate-400">{sess.duration}</td>
                    <td className="py-2 text-right">
                      <StatusBadge status={sess.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Incoming Packet Stream */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Ingress Packet Stream</h4>
              <p className="text-xs text-slate-400">Live incoming frame inspections</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 animate-pulse">● Ingesting</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-xs pr-1">
            {packetStream.length === 0 ? (
              <div className="py-8 text-center text-slate-500">Awaiting live packet frames...</div>
            ) : (
              packetStream.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onInspectPacket(p)}
                  className="p-2 rounded bg-slate-950 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px]">{new Date(p.timestamp).toLocaleTimeString()}</span>
                    <span className="text-cyan-400 font-bold">{p.protocol}</span>
                    <span className="text-slate-300">{p.srcIp} ➔ {p.dstIp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">{p.size}B</span>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
