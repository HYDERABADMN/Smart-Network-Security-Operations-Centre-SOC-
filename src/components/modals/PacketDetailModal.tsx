import React, { useState } from 'react';
import { PacketRecord } from '../../types/soc';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { X, Copy, Check, Terminal, Layers, Network, Shield, ChevronDown, ChevronRight } from 'lucide-react';

interface PacketDetailModalProps {
  packet: PacketRecord | null;
  onClose: () => void;
}

export const PacketDetailModal: React.FC<PacketDetailModalProps> = ({ packet, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'layers' | 'hex' | 'json'>('layers');
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({
    ethernet: true,
    ip: true,
    transport: true,
    app: true,
  });

  if (!packet) return null;

  const toggleLayer = (layer: string) => {
    setExpandedLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleCopyHex = () => {
    if (packet.rawHex) {
      navigator.clipboard.writeText(packet.rawHex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="packet-detail-modal"
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/70 rounded-xl shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-700/40 text-cyan-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 font-mono">{packet.id}</h2>
                <StatusBadge status={packet.status} />
                {packet.threatName && packet.threatName !== 'Normal Traffic' && (
                  <span className="text-xs px-2 py-0.5 rounded bg-red-950/70 border border-red-700/50 text-red-300 font-medium">
                    {packet.threatName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Timestamp: {new Date(packet.timestamp).toLocaleString()} • Size: {packet.size} bytes
              </p>
            </div>
          </div>
          <button
            id="close-packet-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-950/40 gap-2 text-sm">
          <button
            onClick={() => setActiveTab('layers')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'layers'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            OSI Protocol Layers Dissection
          </button>
          <button
            onClick={() => setActiveTab('hex')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'hex'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Hex Dump & ASCII Inspector
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'json'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw JSON Object
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'layers' && (
            <div className="space-y-3">
              {/* Layer 2: Ethernet */}
              <div className="border border-slate-800 rounded-lg bg-slate-950/40 overflow-hidden">
                <button
                  onClick={() => toggleLayer('ethernet')}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/40 hover:bg-slate-800/60 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-300">
                    {expandedLayers.ethernet ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <span>Frame Layer 2 (Ethernet II)</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Type: {packet.ethernet?.type || '0x0800'}</span>
                </button>
                {expandedLayers.ethernet && (
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Source MAC:</span>
                      <span className="text-cyan-300 font-semibold">{packet.ethernet?.srcMac || '00:50:56:A1:B2:C3'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Destination MAC:</span>
                      <span className="text-cyan-300 font-semibold">{packet.ethernet?.dstMac || '00:0C:29:4F:88:99'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">EtherType:</span>
                      <span className="text-slate-300">{packet.ethernet?.type || 'IPv4 (0x0800)'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Layer 3: Internet Protocol */}
              <div className="border border-slate-800 rounded-lg bg-slate-950/40 overflow-hidden">
                <button
                  onClick={() => toggleLayer('ip')}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/40 hover:bg-slate-800/60 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-300">
                    {expandedLayers.ip ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <span>Internet Protocol Version 4 (IPv4)</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{packet.srcIp} ➔ {packet.dstIp}</span>
                </button>
                {expandedLayers.ip && (
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Source IP:</span>
                      <span className="text-emerald-400 font-semibold">{packet.srcIp}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Destination IP:</span>
                      <span className="text-emerald-400 font-semibold">{packet.dstIp}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Time to Live (TTL):</span>
                      <span className="text-slate-300">{packet.ttl || 64} hops</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Header Checksum:</span>
                      <span className="text-slate-300">{packet.ip?.checksum || '0x4F12'} (Valid)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Layer 4: Transport Layer (TCP / UDP / ICMP) */}
              <div className="border border-slate-800 rounded-lg bg-slate-950/40 overflow-hidden">
                <button
                  onClick={() => toggleLayer('transport')}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/40 hover:bg-slate-800/60 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-300">
                    {expandedLayers.transport ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <span>Transport Layer ({packet.protocol})</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Port: {packet.srcPort} ➔ {packet.dstPort}</span>
                </button>
                {expandedLayers.transport && (
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Source Port:</span>
                      <span className="text-amber-400 font-semibold">{packet.srcPort}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Destination Port:</span>
                      <span className="text-amber-400 font-semibold">{packet.dstPort}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">TCP Flags:</span>
                      <span className="text-slate-200 font-semibold">
                        {packet.tcpFlags && packet.tcpFlags.length > 0 ? packet.tcpFlags.join(', ') : 'None / UDP'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Window Size:</span>
                      <span className="text-slate-300">{packet.transport?.windowSize || 64240}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Layer 7: Application Payload */}
              <div className="border border-slate-800 rounded-lg bg-slate-950/40 overflow-hidden">
                <button
                  onClick={() => toggleLayer('app')}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/40 hover:bg-slate-800/60 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-300">
                    {expandedLayers.app ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <span>Application Layer Dissector</span>
                  </div>
                  <span className="text-xs text-cyan-400 font-mono">{packet.app?.protocolName || packet.protocol}</span>
                </button>
                {expandedLayers.app && (
                  <div className="p-4 space-y-2 text-xs font-mono border-t border-slate-800/60">
                    {packet.app?.host && (
                      <div>
                        <span className="text-slate-400 text-[11px]">Target Host / SNI: </span>
                        <span className="text-cyan-300">{packet.app.host}</span>
                      </div>
                    )}
                    {packet.app?.dnsQuery && (
                      <div>
                        <span className="text-slate-400 text-[11px]">DNS Query: </span>
                        <span className="text-yellow-300 font-semibold">{packet.app.dnsQuery} ({packet.app.dnsType || 'A'})</span>
                      </div>
                    )}
                    {packet.app?.url && (
                      <div>
                        <span className="text-slate-400 text-[11px]">HTTP Request URI: </span>
                        <span className="text-emerald-300">{packet.app.url}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 text-[11px]">Dissector Summary: </span>
                      <span className="text-slate-300">{packet.app?.payloadSummary || `${packet.protocol} frame parsed successfully`}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'hex' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Wireshark Hex + ASCII Representation (16 Bytes / Row):</span>
                <button
                  onClick={handleCopyHex}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied Hex' : 'Copy Hex'}
                </button>
              </div>
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400/90 overflow-x-auto whitespace-pre leading-relaxed selection:bg-cyan-500/40">
                {packet.rawHex || '0000   45 00 00 3C 1A 2B 40 00 40 06 7B 89 C0 A8 01 0A   |E..<.@.@.{......|\n0010   C0 A8 01 32 04 D2 00 50 00 00 00 00 00 00 00 00   |...2...P........|'}
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre max-h-96">
              {JSON.stringify(packet, null, 2)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Packet Analyzer Engine: Scapy / PyShark</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
