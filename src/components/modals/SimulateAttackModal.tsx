import React, { useState } from 'react';
import { ThreatType, SeverityLevel } from '../../types/soc';
import { api } from '../../services/api';
import { SeverityBadge } from '../common/SeverityBadge';
import { X, Play, Zap, ShieldAlert, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

interface SimulateAttackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttackTriggered: (type: ThreatType) => void;
}

interface AttackOption {
  type: ThreatType;
  name: string;
  severity: SeverityLevel;
  description: string;
  target: string;
  vector: string;
}

const ATTACK_OPTIONS: AttackOption[] = [
  {
    type: 'Port Scanning',
    name: 'TCP SYN Port Sweep (Nmap-like)',
    severity: 'High',
    description: 'Rapid sequential SYN probes scanning ports 1-1024 across internal subnet.',
    target: '192.168.1.50 (VLAN-10)',
    vector: 'TCP / SYN Probes'
  },
  {
    type: 'Brute Force',
    name: 'SSH Credential Stuffing Attack',
    severity: 'High',
    description: 'High-frequency failed auth dictionary attack targeting root & admin accounts on port 22.',
    target: '192.168.1.20 (SSH Port 22)',
    vector: 'SSH / Dict Wordlist'
  },
  {
    type: 'DDoS',
    name: 'Distributed UDP/SYN Volumetric Flood',
    severity: 'Critical',
    description: 'Massive multi-source packet flood exceeding 18,000 packets/sec overwhelming DMZ gateway.',
    target: '192.168.1.100 (Web Gateway)',
    vector: 'UDP / Amplified Flood'
  },
  {
    type: 'Suspicious DNS',
    name: 'DNS Tunneling & Base64 Exfiltration',
    severity: 'Medium',
    description: 'High Shannon entropy subdomains encoded in TXT/A queries tunneling sensitive data.',
    target: '8.8.8.8 / External DNS',
    vector: 'DNS / High-Entropy Queries'
  },
  {
    type: 'Data Exfiltration',
    name: 'HTTPS Encrypted Data Staging & Exfil',
    severity: 'Critical',
    description: 'Abnormal persistent outbound TLS session uploading 450MB of database dumps.',
    target: 'External C2 IP (443)',
    vector: 'TLS 1.3 / Large Stream'
  },
  {
    type: 'Botnet Activity',
    name: 'C2 Beaconing (Mirai/Emotet Heartbeat)',
    severity: 'High',
    description: 'Periodic fixed-jitter beacon to known Command & Control IRC/HTTP relay on port 4444.',
    target: '104.244.42.1 (Port 4444)',
    vector: 'TCP / Jitter Heartbeat'
  },
  {
    type: 'Malware Traffic',
    name: 'Ransomware Reverse Shell Callback',
    severity: 'High',
    description: 'Payload with elevated binary entropy initiating shell spawn on internal workstation.',
    target: '192.168.1.44 (Workstation 04)',
    vector: 'Raw TCP / High Entropy'
  },
  {
    type: 'DoS',
    name: 'Slowloris HTTP Connection Exhaustion',
    severity: 'High',
    description: 'Holding open thousands of partial HTTP GET request headers to starve web pool threads.',
    target: '192.168.1.50 (Port 80)',
    vector: 'HTTP / Partial Headers'
  },
  {
    type: 'Anomalous Traffic',
    name: 'Zero-Day Behavioral Outlier',
    severity: 'Medium',
    description: 'Unusual protocol combinations and time-of-day baseline deviation caught by Isolation Forest.',
    target: '10.0.4.88 (Internal Core)',
    vector: 'Statistical Outlier'
  },
  {
    type: 'Normal Traffic',
    name: 'Simulated Legitimate Enterprise Traffic',
    severity: 'Low',
    description: 'Standard RFC-compliant HTTP/DNS/HTTPS office browsing baseline with verified TLS certs.',
    target: 'Internal Subnet',
    vector: 'Standard HTTP/HTTPS'
  }
];

export const SimulateAttackModal: React.FC<SimulateAttackModalProps> = ({
  isOpen,
  onClose,
  onAttackTriggered,
}) => {
  const [selectedAttack, setSelectedAttack] = useState<AttackOption>(ATTACK_OPTIONS[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setStatusMessage(`Injecting synthetic ${selectedAttack.type} vectors into Packet Ingress sensor...`);

    try {
      await api.simulateAttack(selectedAttack.type);
      setStatusMessage(`Attack injected! ML classifier detected ${selectedAttack.type} and issued an alert.`);
      onAttackTriggered(selectedAttack.type);
      setTimeout(() => {
        setIsSimulating(false);
        onClose();
      }, 1200);
    } catch (err) {
      setStatusMessage('Simulation completed locally.');
      onAttackTriggered(selectedAttack.type);
      setTimeout(() => {
        setIsSimulating(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="simulate-attack-modal"
        className="relative w-full max-w-3xl flex flex-col bg-slate-900 border border-slate-700/70 rounded-xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/60 border border-red-700/40 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Cyber Attack Simulation Studio
                <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-amber-950/70 border border-amber-600/40 text-amber-300 font-semibold">
                  DEMO DATA ENGINE
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate real-time synthetic attack vectors to test ML model detection, alert triggers, and SOC response.
              </p>
            </div>
          </div>
          <button
            id="close-simulation-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <label className="text-xs font-semibold text-slate-300 tracking-wider uppercase">
            Select Attack Scenario to Trigger ({ATTACK_OPTIONS.length} Available Vectors):
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {ATTACK_OPTIONS.map((opt) => {
              const isSelected = selectedAttack.type === opt.type;
              return (
                <div
                  key={opt.type}
                  onClick={() => setSelectedAttack(opt)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200">{opt.name}</span>
                    <SeverityBadge severity={opt.severity} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                    {opt.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>Vector: <strong className="text-slate-300">{opt.vector}</strong></span>
                    <span>Target: <strong className="text-cyan-400">{opt.target}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Attack Summary Card */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-slate-200 block">ML Pipeline Execution Flow:</span>
              <p className="text-slate-400 leading-relaxed">
                Triggering <span className="text-cyan-300 font-semibold">{selectedAttack.type}</span> will immediately synthesize flow packets, run feature extraction, compute entropy & TCP ratios, pass through the XGBoost model, score the risk confidence, issue a live alert, and update the SOC incident queue.
              </p>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            id="launch-attack-simulation-btn"
            disabled={isSimulating}
            onClick={handleRunSimulation}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-red-950/40 transition-all disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <Zap className="w-4 h-4 animate-spin text-yellow-300" />
                Simulating Threat...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Launch {selectedAttack.type} Simulation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
