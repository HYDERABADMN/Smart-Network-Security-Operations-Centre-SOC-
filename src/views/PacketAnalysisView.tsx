import React, { useState, useEffect } from 'react';
import { PacketRecord, NetworkProtocol, ThreatType } from '../types/soc';
import { api, PacketsResponse } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  UploadCloud,
  FileCode2,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Layers,
  ArrowUpDown,
  Download,
  FileText,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface PacketAnalysisViewProps {
  onInspectPacket: (packet: PacketRecord) => void;
  livePackets: PacketRecord[];
}

export const PacketAnalysisView: React.FC<PacketAnalysisViewProps> = ({
  onInspectPacket,
  livePackets,
}) => {
  const [packets, setPackets] = useState<PacketRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Filter States
  const [protocolFilter, setProtocolFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [srcIpFilter, setSrcIpFilter] = useState('');
  const [dstIpFilter, setDstIpFilter] = useState('');
  const [portFilter, setPortFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPackets = async () => {
    setIsLoading(true);
    try {
      const res = await api.getPackets({
        protocol: protocolFilter,
        status: statusFilter,
        srcIp: srcIpFilter,
        dstIp: dstIpFilter,
        port: portFilter,
        search: searchQuery,
        limit: 100,
      });
      setPackets(res.packets);
      setTotalCount(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPackets();
  }, [protocolFilter, statusFilter, srcIpFilter, dstIpFilter, portFilter]);

  // Merge live packets into current list if viewing unfiltered
  useEffect(() => {
    if (livePackets.length > 0 && protocolFilter === 'All' && statusFilter === 'All' && !searchQuery) {
      setPackets(prev => {
        const ids = new Set(prev.map(p => p.id));
        const newUniques = livePackets.filter(p => !ids.has(p.id));
        return [...newUniques, ...prev].slice(0, 100);
      });
      setTotalCount(prev => prev + 1);
    }
  }, [livePackets]);

  // Handle PCAP File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(`Parsing ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`);
    try {
      const res = await api.uploadPcap({
        fileName: file.name,
        fileSize: file.size,
      });
      setUploadStatus(`Success: Ingested ${res.totalPackets} packets (${res.threatsFound} threats detected)`);
      loadPackets();
      setTimeout(() => setUploadStatus(null), 4000);
    } catch (err) {
      setUploadStatus('Upload analysis failed');
    }
  };

  const handleLoadSamplePcap = async (name: string, size: number) => {
    setUploadStatus(`Loading sample ${name}...`);
    try {
      const res = await api.uploadPcap({ fileName: name, fileSize: size });
      setUploadStatus(`Analyzed sample capture: ${res.totalPackets} frames decoded`);
      loadPackets();
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      setUploadStatus('Failed to load sample');
    }
  };

  // Compute protocol distribution from current packets
  const protocolCounts: Record<string, number> = {};
  const topSrcIps: Record<string, number> = {};
  const topDstIps: Record<string, number> = {};
  const topPorts: Record<string, number> = {};

  packets.forEach(p => {
    protocolCounts[p.protocol] = (protocolCounts[p.protocol] || 0) + 1;
    topSrcIps[p.srcIp] = (topSrcIps[p.srcIp] || 0) + 1;
    topDstIps[p.dstIp] = (topDstIps[p.dstIp] || 0) + 1;
    topPorts[`${p.dstPort}`] = (topPorts[`${p.dstPort}`] || 0) + 1;
  });

  const protocolData = Object.entries(protocolCounts).map(([name, count]) => ({
    name,
    count,
    color: name === 'TCP' ? '#3b82f6' : name === 'UDP' ? '#06b6d4' : name === 'HTTPS' ? '#8b5cf6' : name === 'DNS' ? '#eab308' : '#ec4899',
  }));

  const topSrcData = Object.entries(topSrcIps)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));

  const topPortData = Object.entries(topPorts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([port, count]) => ({ port: `Port ${port}`, count }));

  return (
    <div className="space-y-6 pb-12">
      {/* Upload and Sample PCAP Banner */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Upload Drop Area */}
        <div className="lg:col-span-2 flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg bg-slate-950/60 border border-dashed border-slate-700 hover:border-cyan-500/50 transition-colors">
          <div className="p-3 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 shrink-0">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-xs font-bold text-slate-200">Upload PCAP / PCAPNG Network Capture</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Supports Wireshark, tcpdump, and PyShark raw captures. Automatic packet decoding and ML threat classification.
            </p>
          </div>
          <label className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer shrink-0 transition-colors shadow-sm">
            Select PCAP File
            <input
              type="file"
              accept=".pcap,.pcapng,.cap"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Quick Sample PCAPs */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Load Pre-Captured Attack Traces:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLoadSamplePcap('SYN-Flood-DDoS.pcap', 6400)}
              className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-cyan-300 text-left truncate transition-colors"
            >
              🌊 DDoS-Flood.pcap
            </button>
            <button
              onClick={() => handleLoadSamplePcap('DNS-Tunnel-Exfil.pcap', 4200)}
              className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-yellow-300 text-left truncate transition-colors"
            >
              📡 DNS-Exfil.pcap
            </button>
            <button
              onClick={() => handleLoadSamplePcap('SSH-BruteForce-Auth.pcap', 5100)}
              className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-orange-300 text-left truncate transition-colors"
            >
              🔑 SSH-Brute.pcap
            </button>
            <button
              onClick={() => handleLoadSamplePcap('PortScan-Nmap-Sweep.pcap', 3800)}
              className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-purple-300 text-left truncate transition-colors"
            >
              🔍 PortScan.pcap
            </button>
          </div>
        </div>
      </div>

      {uploadStatus && (
        <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* Packet Visualizations: Protocol Distribution, Top Sources, Top Ports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Protocol Breakdown */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Protocol Breakdown</h4>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={protocolData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="count">
                  {protocolData.map((e, idx) => (
                    <Cell key={`proto-${idx}`} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            {protocolData.map(p => (
              <span key={p.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}: {p.count}
              </span>
            ))}
          </div>
        </div>

        {/* Top Source IPs */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Top Source IPs</h4>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSrcData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <XAxis type="number" stroke="#475569" fontSize={9} />
                <YAxis dataKey="ip" type="category" stroke="#94a3b8" fontSize={9} width={90} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[10px] text-slate-400 font-mono pt-1">Ranked by transmitted packet density</span>
        </div>

        {/* Top Targeted Ports */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Top Destination Ports</h4>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPortData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <XAxis type="number" stroke="#475569" fontSize={9} />
                <YAxis dataKey="port" type="category" stroke="#94a3b8" fontSize={9} width={70} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[10px] text-slate-400 font-mono pt-1">Identified protocol destination sockets</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Packet Capture Filters</h4>
          </div>
          <button
            onClick={loadPackets}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Apply Filters
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Protocol Filter */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Protocol</label>
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Protocols</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
              <option value="DNS">DNS</option>
              <option value="HTTP">HTTP</option>
              <option value="HTTPS">HTTPS</option>
              <option value="TLS">TLS</option>
              <option value="SSH">SSH</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Statuses</option>
              <option value="Normal">Normal</option>
              <option value="Suspicious">Suspicious</option>
              <option value="Malicious">Malicious</option>
            </select>
          </div>

          {/* Source IP */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Source IP</label>
            <input
              type="text"
              placeholder="e.g. 198.51"
              value={srcIpFilter}
              onChange={(e) => setSrcIpFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Dest IP */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Destination IP</label>
            <input
              type="text"
              placeholder="e.g. 192.168"
              value={dstIpFilter}
              onChange={(e) => setDstIpFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Port */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Port</label>
            <input
              type="text"
              placeholder="e.g. 80, 22, 53"
              value={portFilter}
              onChange={(e) => setPortFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Keyword Search */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Full-Text Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ID, threat name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadPackets()}
                className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Packet Table */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 overflow-hidden">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-slate-400 font-mono">
            Showing <strong className="text-cyan-400">{packets.length}</strong> packets (Total in buffer: {totalCount})
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            Click any row to inspect OSI protocol layers & Hex dump
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="py-2.5 px-3 font-medium">Time</th>
                <th className="py-2.5 px-3 font-medium">Source IP</th>
                <th className="py-2.5 px-3 font-medium">Destination IP</th>
                <th className="py-2.5 px-3 font-medium">Protocol</th>
                <th className="py-2.5 px-3 font-medium text-right">Src Port</th>
                <th className="py-2.5 px-3 font-medium text-right">Dst Port</th>
                <th className="py-2.5 px-3 font-medium text-right">Size (B)</th>
                <th className="py-2.5 px-3 font-medium text-center">Status / Threat</th>
                <th className="py-2.5 px-3 font-medium text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {packets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No packets found matching current filters
                  </td>
                </tr>
              ) : (
                packets.map((pkt) => (
                  <tr
                    key={pkt.id}
                    onClick={() => onInspectPacket(pkt)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(pkt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 font-semibold">{pkt.srcIp}</td>
                    <td className="py-2.5 px-3 text-slate-200">{pkt.dstIp}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold text-[10px]">
                        {pkt.protocol}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{pkt.srcPort}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300 font-semibold">{pkt.dstPort}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{pkt.size}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <StatusBadge status={pkt.status} />
                        {pkt.threatName && pkt.threatName !== 'Normal Traffic' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 font-bold border border-red-800/50">
                            {pkt.threatName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectPacket(pkt);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-cyan-900 text-slate-300 hover:text-cyan-300 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
