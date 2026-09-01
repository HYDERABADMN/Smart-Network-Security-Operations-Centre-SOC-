import {
  PacketRecord,
  MLPrediction,
  AlertRecord,
  IncidentRecord,
  SecurityEventLog,
  SystemSettingsConfig,
  SOCReport,
  TopTalker,
  DashboardKPIs,
  ThreatType,
  SeverityLevel
} from '../src/types/soc.js';
import { createSyntheticPacket } from './packetAnalyzer.js';
import { predictThreatFromFeatures } from './mlEngine.js';

// In-Memory persistent MongoDB Collection simulation
class SOCDatabase {
  packets: PacketRecord[] = [];
  threats: MLPrediction[] = [];
  alerts: AlertRecord[] = [];
  incidents: IncidentRecord[] = [];
  system_logs: SecurityEventLog[] = [];
  reports: SOCReport[] = [];
  blocked_ips: Set<string> = new Set(['185.220.101.5', '45.33.32.156']);

  settings: SystemSettingsConfig = {
    monitoringActive: true,
    packetCaptureActive: true,
    realtimeMonitoring: true,
    refreshIntervalSec: 2,
    mlModelStatus: 'Online',
    detectionSensitivity: 85,
    confidenceThreshold: 0.75,
    alertThreshold: 'Medium+',
    criticalNotificationSound: true,
    autoIncidentCreation: true,
    demoMode: true,
  };

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    // 1. Seed initial packets
    const sampleThreats: ThreatType[] = [
      'Normal Traffic', 'Normal Traffic', 'Port Scanning', 'Normal Traffic',
      'Brute Force', 'Suspicious DNS', 'DDoS', 'Normal Traffic', 'Malware Traffic', 'Normal Traffic'
    ];

    for (let i = 0; i < 40; i++) {
      const threat = sampleThreats[i % sampleThreats.length];
      const pkt = createSyntheticPacket(undefined, undefined, undefined, threat);
      this.packets.unshift(pkt);
    }

    // 2. Seed initial ML threats
    const attackerIPs = ['198.51.100.24', '185.220.101.5', '203.0.113.77', '45.33.32.156', '192.168.1.180'];
    const victimIPs = ['192.168.1.50', '192.168.1.20', '10.0.0.15', '10.0.4.88', '192.168.1.100'];

    attackerIPs.forEach((src, idx) => {
      const dst = victimIPs[idx % victimIPs.length];
      const threatTypes: ThreatType[] = ['Port Scanning', 'Brute Force', 'DDoS', 'Suspicious DNS', 'Data Exfiltration'];
      const pred = predictThreatFromFeatures(src, dst, {
        packetCount: (idx + 1) * 80,
        bytesTransferred: (idx + 1) * 150000,
        connectionFrequency: 60,
        tcpSynRatio: 0.85,
        dstPort: [22, 80, 53, 443, 8080][idx],
      });
      this.threats.unshift(pred);

      // Create matching alert
      const alertId = `ALT-${1000 + idx}`;
      const alert: AlertRecord = {
        id: alertId,
        timestamp: new Date(Date.now() - idx * 3600000).toISOString(),
        threatType: threatTypes[idx],
        srcIp: src,
        dstIp: dst,
        srcPort: 45000 + idx,
        dstPort: [22, 80, 53, 443, 8080][idx],
        protocol: idx === 2 ? 'UDP' : idx === 3 ? 'DNS' : 'TCP',
        severity: ['High', 'High', 'Critical', 'Medium', 'Critical'][idx] as SeverityLevel,
        mlConfidence: Number((0.89 + idx * 0.02).toFixed(2)),
        description: `ML detected ${threatTypes[idx]} pattern targeting host ${dst} with elevated risk index.`,
        status: idx === 0 ? 'Investigating' : idx === 1 ? 'Acknowledged' : idx === 2 ? 'New' : 'Resolved',
        notes: [
          `Auto-triaged by ML Model at ${new Date(Date.now() - idx * 3600000).toLocaleTimeString()}`,
          idx === 0 ? 'SOC Analyst reviewing flow capture logs and firewall drops.' : 'Initial baseline matched known signature.'
        ],
        packetRef: this.packets[idx]?.id,
      };
      this.alerts.unshift(alert);

      // Add security log
      this.system_logs.unshift({
        id: `LOG-${Date.now()}-${idx}`,
        timestamp: new Date(Date.now() - idx * 1800000).toISOString(),
        severity: alert.severity,
        message: `${alert.threatType} detected from ${alert.srcIp} targeting ${alert.dstIp}:${alert.dstPort}`,
        sourceIp: alert.srcIp,
        threatType: alert.threatType,
      });
    });

    // 3. Seed initial Incidents
    const inc1: IncidentRecord = {
      id: 'INC-2026-001',
      title: 'Coordinated SYN Flood DDoS against Web DMZ Gateway',
      description: 'Distributed denial of service anomaly originating from multiple external IPs exceeding 14,000 packets/sec baseline.',
      severity: 'Critical',
      source: 'Automated ML Ingestion / Ingress Sensor 01',
      detectedTime: new Date(Date.now() - 7200000).toISOString(),
      status: 'Investigating',
      associatedAlerts: ['ALT-1002'],
      investigationNotes: [
        'Ingress traffic spiked 450% above rolling 24h standard deviation.',
        'Edge rate-limiting rule applied via upstream Cloudflare / Edge ACL.',
        'Traffic scrubbing verified effective; dropped 98.4% illegitimate SYN packets.'
      ],
      evidence: [
        { type: 'IP', value: '203.0.113.77', description: 'Primary Botnet command sender' },
        { type: 'Port', value: '80 / TCP', description: 'Targeted HTTP listener port' },
        { type: 'Packet', value: 'SYN Flood Payload (64B)', description: 'Uniform payload length signature' }
      ],
      responseActions: [
        { id: 'ACT-1', action: 'Activate Edge Anti-DDoS Scrubbing', completed: true, completedAt: new Date(Date.now() - 6000000).toISOString() },
        { id: 'ACT-2', action: 'Block Source Subnet 203.0.113.0/24 on Firewall', completed: true, completedAt: new Date(Date.now() - 5400000).toISOString() },
        { id: 'ACT-3', action: 'Review Web Server Resource Consumption', completed: false },
        { id: 'ACT-4', action: 'Draft Post-Incident Incident Response Report', completed: false }
      ],
      timeline: [
        { id: 'EV-1', timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'ML Anomaly Engine', action: 'Incident Created', details: 'Threshold breached: SYN flood confidence 0.97' },
        { id: 'EV-2', timestamp: new Date(Date.now() - 6000000).toISOString(), user: 'SOC Lead (Auto-Playbook)', action: 'Containment Action', details: 'Scrubbing rules applied' },
        { id: 'EV-3', timestamp: new Date(Date.now() - 5400000).toISOString(), user: 'SOC Lead', action: 'Firewall Policy Update', details: 'Subnet blacklisted' }
      ]
    };

    const inc2: IncidentRecord = {
      id: 'INC-2026-002',
      title: 'SSH Lateral Movement & Credential Stuffing',
      description: 'Host 198.51.100.24 generated over 850 authentication failures across internal management port 22 within 3 minutes.',
      severity: 'High',
      source: 'HIDS / ML Threat Classifier',
      detectedTime: new Date(Date.now() - 18000000).toISOString(),
      status: 'Contained',
      associatedAlerts: ['ALT-1000', 'ALT-1001'],
      investigationNotes: [
        'Source attempted dictionary wordlist attack against admin, root, ubuntu accounts.',
        'Host isolated from VLAN 10 management subnet.',
        'Zero successful authentications recorded before lockout triggered.'
      ],
      evidence: [
        { type: 'IP', value: '198.51.100.24', description: 'Originating brute-force attacker IP' },
        { type: 'Port', value: '22 / SSH', description: 'Target SSH service' }
      ],
      responseActions: [
        { id: 'ACT-1', action: 'Isolate Host IP on Core Switch', completed: true, completedAt: new Date(Date.now() - 17000000).toISOString() },
        { id: 'ACT-2', action: 'Rotate SSH Keys for Service Accounts', completed: true, completedAt: new Date(Date.now() - 15000000).toISOString() },
        { id: 'ACT-3', action: 'Verify Fail2ban & PAM Lockout Logs', completed: true, completedAt: new Date(Date.now() - 14000000).toISOString() }
      ],
      timeline: [
        { id: 'EV-1', timestamp: new Date(Date.now() - 18000000).toISOString(), user: 'System', action: 'Threat Triaged', details: 'Brute force alert escalated to Incident INC-2026-002' },
        { id: 'EV-2', timestamp: new Date(Date.now() - 17000000).toISOString(), user: 'Analyst Sarah Chen', action: 'Quarantine Host', details: 'VLAN port disabled' }
      ]
    };

    this.incidents = [inc1, inc2];

    // 4. Seed initial Reports
    this.reports.push({
      id: 'REP-2026-08',
      generatedAt: new Date(Date.now() - 86400000).toISOString(),
      period: 'Last 24 Hours',
      totalPackets: 124890,
      threatsIdentified: 34,
      alertsGenerated: 12,
      incidentsResolved: 3,
      topAttackerIp: '198.51.100.24',
      mostTargetedPort: 22,
      executiveSummary: 'During the reporting window, the ML Threat Detection system monitored 124,890 packets with 99.98% uptime. 34 malicious patterns were intercepted including 1 high-volume DDoS attempt and 2 credential brute-force probes. All affected assets were contained within an average MTTR of 14 minutes.'
    });
  }

  // Dashboard Stats Computation
  getDashboardKPIs(): DashboardKPIs {
    const totalPackets = 84520 + this.packets.length * 12;
    const threatsDetected = this.threats.length + 18;
    const criticalAlerts = this.alerts.filter(a => a.severity === 'Critical' && a.status !== 'Resolved').length;
    const normalCount = this.packets.filter(p => p.status === 'Normal').length;
    const suspCount = this.packets.filter(p => p.status !== 'Normal').length;

    return {
      totalPackets,
      packetsPerSec: Math.floor(Math.random() * 450) + 1280,
      bandwidthMbps: Number((Math.random() * 45 + 142.6).toFixed(1)),
      activeConnections: Math.floor(Math.random() * 120) + 840,
      threatsDetected,
      criticalAlerts,
      blockedIPs: this.blocked_ips.size,
      systemHealth: 98.6,
      normalTrafficCount: normalCount + 78000,
      suspiciousTrafficCount: suspCount + 6400,
      criticalThreatCount: criticalAlerts,
      averageConfidence: 0.93,
      averageRiskScore: 42,
    };
  }

  getTopTalkers(): TopTalker[] {
    return [
      { ip: '192.168.1.50', domain: 'gateway.lan', packets: 34210, bytes: 48200000, threatCount: 2, country: 'Internal', flag: '🏢' },
      { ip: '198.51.100.24', domain: 'scanner.threat-node.org', packets: 18450, bytes: 24300000, threatCount: 14, country: 'Russia', flag: '🇷🇺', isBlocked: this.blocked_ips.has('198.51.100.24') },
      { ip: '10.0.0.15', domain: 'db-cluster-01.local', packets: 16900, bytes: 32000000, threatCount: 0, country: 'Internal', flag: '🏢' },
      { ip: '203.0.113.77', domain: 'bot-c2.darknet-relay.io', packets: 14200, bytes: 19800000, threatCount: 9, country: 'Romania', flag: '🇷🇴', isBlocked: this.blocked_ips.has('203.0.113.77') },
      { ip: '185.220.101.5', domain: 'tor-exit-relay-04.net', packets: 11300, bytes: 14600000, threatCount: 12, country: 'Germany', flag: '🇩🇪', isBlocked: true },
      { ip: '8.8.8.8', domain: 'dns.google', packets: 9800, bytes: 4100000, threatCount: 0, country: 'United States', flag: '🇺🇸' },
      { ip: '172.16.0.5', domain: 'k8s-ingress.infra', packets: 8700, bytes: 11200000, threatCount: 1, country: 'Internal', flag: '🏢' },
    ];
  }

  // Simulate an active cyber attack
  simulateAttack(type: ThreatType) {
    const attackers: Record<string, string> = {
      'Port Scanning': '198.51.100.99',
      'Brute Force': '185.220.101.44',
      'DDoS': '203.0.113.120',
      'Suspicious DNS': '45.33.32.88',
      'Data Exfiltration': '192.168.1.180',
      'Botnet Activity': '104.244.42.1',
      'Malware Traffic': '91.240.118.67',
      'DoS': '178.62.204.11',
      'Anomalous Traffic': '162.243.10.89',
      'Normal Traffic': '192.168.1.15'
    };

    const src = attackers[type] || '198.51.100.77';
    const dst = '192.168.1.50';

    const count = type === 'DDoS' ? 25 : type === 'Port Scanning' ? 15 : 6;
    const newPackets: PacketRecord[] = [];

    for (let i = 0; i < count; i++) {
      const proto = type === 'Suspicious DNS' ? 'DNS' : type === 'Brute Force' ? 'SSH' : type === 'DDoS' ? (i % 2 === 0 ? 'UDP' : 'TCP') : 'TCP';
      const pkt = createSyntheticPacket(src, dst, proto, type);
      newPackets.push(pkt);
      this.packets.unshift(pkt);
    }

    // Keep packet buffer clean (max 500 packets)
    if (this.packets.length > 500) {
      this.packets = this.packets.slice(0, 500);
    }

    // Generate ML prediction
    const mlPred = predictThreatFromFeatures(src, dst, {
      packetCount: count * 20,
      packetSize: 850,
      bytesTransferred: count * 12000,
      connectionFrequency: 85,
      tcpSynRatio: type === 'Port Scanning' ? 0.95 : 0.4,
      failedAuthCount: type === 'Brute Force' ? 8 : 0,
      entropy: type === 'Suspicious DNS' ? 4.9 : 3.5,
    });
    this.threats.unshift(mlPred);

    // Create Alert
    const alertId = `ALT-${1000 + this.alerts.length + 1}`;
    const alert: AlertRecord = {
      id: alertId,
      timestamp: new Date().toISOString(),
      threatType: type,
      srcIp: src,
      dstIp: dst,
      srcPort: newPackets[0]?.srcPort || 45000,
      dstPort: newPackets[0]?.dstPort || 80,
      protocol: newPackets[0]?.protocol || 'TCP',
      severity: mlPred.severity,
      mlConfidence: mlPred.confidence,
      description: `[SIMULATED ATTACK] Real-time ${type} detected targeting ${dst} from ${src}.`,
      status: 'New',
      notes: [`Generated by Attack Simulation Engine at ${new Date().toLocaleTimeString()}`],
      packetRef: newPackets[0]?.id,
    };
    this.alerts.unshift(alert);

    // Create Log
    const log: SecurityEventLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: alert.severity,
      message: `${type} attack pattern detected from ${src} targeting ${dst}`,
      sourceIp: src,
      threatType: type,
    };
    this.system_logs.unshift(log);

    // Auto-create incident if critical and setting enabled
    if (this.settings.autoIncidentCreation && (alert.severity === 'Critical' || alert.severity === 'High')) {
      const incId = `INC-2026-${String(this.incidents.length + 1).padStart(3, '0')}`;
      const newInc: IncidentRecord = {
        id: incId,
        title: `Active Threat: ${type} from ${src}`,
        description: `Automated incident triggered by high-confidence ML detection (${(mlPred.confidence * 100).toFixed(0)}% confidence).`,
        severity: alert.severity,
        source: 'ML Auto-Triage Engine',
        detectedTime: new Date().toISOString(),
        status: 'Open',
        associatedAlerts: [alertId],
        investigationNotes: [
          `Incident automatically escalated due to critical threshold breach.`,
          `Observed flow rate: ${count * 20} pkts, payload signature: ${type}.`
        ],
        evidence: [
          { type: 'IP', value: src, description: 'Threat actor source address' },
          { type: 'Packet', value: newPackets[0]?.id || 'PKT-REF', description: 'Sample frame capture' }
        ],
        responseActions: [
          { id: 'ACT-1', action: `Block Host ${src} on Perimeter Edge`, completed: false },
          { id: 'ACT-2', action: 'Inspect Internal Node Logs', completed: false },
          { id: 'ACT-3', action: 'Notify SOC Incident Lead', completed: false }
        ],
        timeline: [
          { id: 'EV-1', timestamp: new Date().toISOString(), user: 'System (ML Auto-Rule)', action: 'Incident Escalated', details: `Created from Alert ${alertId}` }
        ]
      };
      this.incidents.unshift(newInc);
      alert.assignedIncidentId = incId;
    }

    return {
      prediction: mlPred,
      alert,
      packets: newPackets,
    };
  }
}

export const db = new SOCDatabase();
