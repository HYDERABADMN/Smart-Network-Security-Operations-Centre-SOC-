import {
  PacketRecord,
  MLPrediction,
  AlertRecord,
  IncidentRecord,
  DashboardKPIs,
  TopTalker,
  ProtocolStat,
  ThreatStat,
  SecurityEventLog,
  SystemSettingsConfig,
  SOCReport,
  ThreatType
} from '../types/soc';

export interface DashboardData {
  kpis: DashboardKPIs;
  topTalkers: TopTalker[];
  protocolDistribution: ProtocolStat[];
  threatDistribution: ThreatStat[];
  recentLogs: SecurityEventLog[];
  recentAlerts: AlertRecord[];
}

export interface PacketsResponse {
  total: number;
  packets: PacketRecord[];
}

// In-Memory client state for static hosting (GitHub Pages)
let clientPackets: PacketRecord[] = generateInitialMockPackets();
let clientAlerts: AlertRecord[] = generateInitialMockAlerts();
let clientIncidents: IncidentRecord[] = generateInitialMockIncidents();
let clientSettings: SystemSettingsConfig = {
  monitoringActive: true,
  packetCaptureActive: true,
  realtimeMonitoring: true,
  refreshIntervalSec: 5,
  mlModelStatus: 'Online',
  detectionSensitivity: 85,
  confidenceThreshold: 0.75,
  alertThreshold: 'Medium+',
  criticalNotificationSound: true,
  autoIncidentCreation: true,
  demoMode: false,
};

export const api = {
  // 1. Dashboard
  async getDashboard(): Promise<DashboardData> {
    return this.getDashboardStats();
  },

  async getDashboardStats(): Promise<DashboardData> {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      return data;
    } catch (err) {
      return getFallbackDashboardData();
    }
  },

  // 2. Packets
  async getPackets(params: {
    protocol?: string;
    srcIp?: string;
    dstIp?: string;
    port?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<PacketsResponse> {
    try {
      const query = new URLSearchParams();
      if (params.protocol) query.set('protocol', params.protocol);
      if (params.srcIp) query.set('srcIp', params.srcIp);
      if (params.dstIp) query.set('dstIp', params.dstIp);
      if (params.port) query.set('port', params.port);
      if (params.status) query.set('status', params.status);
      if (params.search) query.set('search', params.search);
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));

      const res = await fetch(`/api/packets?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch packets');
      return await res.json();
    } catch (err) {
      let filtered = [...clientPackets];
      if (params.protocol) filtered = filtered.filter(p => p.protocol.toLowerCase() === params.protocol?.toLowerCase());
      if (params.status) filtered = filtered.filter(p => p.status.toLowerCase() === params.status?.toLowerCase());
      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(p => p.srcIp.includes(s) || p.dstIp.includes(s) || p.protocol.toLowerCase().includes(s) || (p.threatName && p.threatName.toLowerCase().includes(s)));
      }
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      return { total: filtered.length, packets: filtered.slice(offset, offset + limit) };
    }
  },

  async uploadPcap(payload: { fileName: string; fileSize: number; customPackets?: PacketRecord[] }) {
    try {
      const res = await fetch('/api/packets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('PCAP Upload failed');
      return await res.json();
    } catch (err) {
      const newPkts = payload.customPackets || generateInitialMockPackets().slice(0, 15);
      clientPackets = [...newPkts, ...clientPackets];
      return {
        success: true,
        fileName: payload.fileName,
        fileSize: payload.fileSize,
        packetsParsed: newPkts.length,
        threatsIdentified: newPkts.filter(p => p.status === 'Malicious').length,
        packets: newPkts,
      };
    }
  },

  // 3. ML Threats
  async getThreats(): Promise<{ threats: MLPrediction[] }> {
    try {
      const res = await fetch('/api/threats');
      if (!res.ok) throw new Error('Failed to fetch threats');
      return await res.json();
    } catch (err) {
      return {
        threats: [
          {
            id: 'ML-001',
            timestamp: new Date().toISOString(),
            srcIp: '198.51.100.24',
            dstIp: '192.168.1.50',
            threat: 'DDoS',
            confidence: 0.98,
            riskScore: 95,
            severity: 'Critical',
            status: 'Active',
            features: {
              packetCount: 42000,
              packetSize: 512,
              flowDurationMs: 4500,
              bytesTransferred: 21504000,
              connectionFrequency: 450,
              requestFrequency: 920,
              tcpSynRatio: 0.96,
              failedAuthCount: 0,
              entropy: 2.14,
            },
            explainability: [
              { feature: 'TCP SYN Ratio', impact: 0.42 },
              { feature: 'Packet Frequency', impact: 0.38 },
            ],
          },
          {
            id: 'ML-002',
            timestamp: new Date(Date.now() - 120000).toISOString(),
            srcIp: '185.220.101.5',
            dstIp: '192.168.1.20',
            threat: 'Brute Force',
            confidence: 0.94,
            riskScore: 88,
            severity: 'High',
            status: 'Active',
            features: {
              packetCount: 850,
              packetSize: 128,
              flowDurationMs: 68000,
              bytesTransferred: 108800,
              connectionFrequency: 45,
              requestFrequency: 18,
              tcpSynRatio: 0.12,
              failedAuthCount: 16,
              entropy: 6.82,
            },
            explainability: [
              { feature: 'Failed Authentication Rate', impact: 0.52 },
              { feature: 'Connection Frequency', impact: 0.28 },
            ],
          }
        ]
      };
    }
  },

  async predictThreat(srcIp: string, dstIp: string, features: any): Promise<{ prediction: MLPrediction }> {
    try {
      const res = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ srcIp, dstIp, features }),
      });
      if (!res.ok) throw new Error('Prediction API failed');
      return await res.json();
    } catch (err) {
      let riskScore = 20;
      let threat: ThreatType = 'Normal Traffic';
      let confidence = 0.92;
      let severity: any = 'Low';

      if (features.packetCount > 1000 || features.tcpSynRatio > 0.8) {
        riskScore = 88;
        threat = 'DDoS';
        severity = 'Critical';
        confidence = 0.97;
      } else if (features.failedAuthCount > 5) {
        riskScore = 78;
        threat = 'Brute Force';
        severity = 'High';
        confidence = 0.93;
      } else if (features.entropy > 5.5) {
        riskScore = 82;
        threat = 'Suspicious DNS';
        severity = 'High';
        confidence = 0.89;
      }

      return {
        prediction: {
          id: `ML-${Date.now()}`,
          timestamp: new Date().toISOString(),
          srcIp,
          dstIp,
          threat,
          confidence,
          riskScore,
          severity,
          status: 'Active',
          features: {
            packetCount: features.packetCount || 100,
            packetSize: features.packetSize || 512,
            flowDurationMs: features.flowDurationMs || 5000,
            bytesTransferred: features.bytesTransferred || 51200,
            connectionFrequency: features.connectionFrequency || 20,
            requestFrequency: features.requestFrequency || 15,
            tcpSynRatio: features.tcpSynRatio || 0.1,
            failedAuthCount: features.failedAuthCount || 0,
            entropy: features.entropy || 3.5,
          },
          explainability: [
            { feature: 'Entropy', impact: 0.35 },
            { feature: 'Packet Rate', impact: 0.25 },
          ],
        }
      };
    }
  },

  async getMLStatus() {
    try {
      const res = await fetch('/api/ml/status');
      if (!res.ok) throw new Error('ML Status failed');
      return await res.json();
    } catch (err) {
      return {
        success: true,
        modelName: 'IntrusionDetector-XGBoost-v2.4',
        status: 'Active',
        accuracy: '98.6%',
        f1Score: '0.979',
        featuresCount: 14,
        lastTrained: '2026-08-28T14:00:00Z',
      };
    }
  },

  // 4. Alerts
  async getAlerts(params: { severity?: string; status?: string; search?: string } = {}): Promise<{ alerts: AlertRecord[] }> {
    try {
      const query = new URLSearchParams();
      if (params.severity) query.set('severity', params.severity);
      if (params.status) query.set('status', params.status);
      if (params.search) query.set('search', params.search);

      const res = await fetch(`/api/alerts?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch alerts');
      return await res.json();
    } catch (err) {
      let filtered = [...clientAlerts];
      if (params.severity) filtered = filtered.filter(a => a.severity.toLowerCase() === params.severity?.toLowerCase());
      if (params.status) filtered = filtered.filter(a => a.status.toLowerCase() === params.status?.toLowerCase());
      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(a => a.srcIp.includes(s) || a.threatType.toLowerCase().includes(s) || a.id.toLowerCase().includes(s));
      }
      return { alerts: filtered };
    }
  },

  async updateAlert(id: string, updates: { status?: string; severity?: string; note?: string }) {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Alert update failed');
      return await res.json();
    } catch (err) {
      const alert = clientAlerts.find(a => a.id === id);
      if (alert) {
        if (updates.status) alert.status = updates.status as any;
        if (updates.severity) alert.severity = updates.severity as any;
        if (updates.note) alert.notes.push(updates.note);
      }
      return { success: true, alert };
    }
  },

  // 5. Incidents
  async getIncidents(params: { status?: string; severity?: string } = {}): Promise<{ incidents: IncidentRecord[] }> {
    try {
      const query = new URLSearchParams();
      if (params.status) query.set('status', params.status);
      if (params.severity) query.set('severity', params.severity);

      const res = await fetch(`/api/incidents?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch incidents');
      return await res.json();
    } catch (err) {
      let filtered = [...clientIncidents];
      if (params.status) filtered = filtered.filter(i => i.status.toLowerCase() === params.status?.toLowerCase());
      if (params.severity) filtered = filtered.filter(i => i.severity.toLowerCase() === params.severity?.toLowerCase());
      return { incidents: filtered };
    }
  },

  async createIncident(incidentData: Partial<IncidentRecord>) {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData),
      });
      if (!res.ok) throw new Error('Create incident failed');
      return await res.json();
    } catch (err) {
      const newInc: IncidentRecord = {
        id: `INC-${8820 + clientIncidents.length + 1}`,
        title: incidentData.title || 'New Security Incident',
        severity: incidentData.severity || 'High',
        status: 'Open',
        source: 'Automated ML Ingress Heuristics',
        detectedTime: new Date().toISOString(),
        description: incidentData.description || 'Incident created by SOC operator triage.',
        associatedAlerts: incidentData.associatedAlerts || ['ALT-1001'],
        investigationNotes: ['Assigned to Tier-2 SOC Lead for root-cause analysis'],
        evidence: [
          { type: 'IP', value: '198.51.100.24', description: 'Hostile ingress source' },
        ],
        responseActions: [
          { id: 'act-1', action: 'Enforce perimeter edge firewall IP drop rule', completed: false },
          { id: 'act-2', action: 'Isolate affected subnet and capture live memory dump', completed: false },
          { id: 'act-3', action: 'Revoke and rotate compromised user session credentials', completed: false },
          { id: 'act-4', action: 'Submit forensic audit report to security management', completed: false },
        ],
        timeline: [
          { id: `EV-${Date.now()}`, timestamp: new Date().toISOString(), user: 'SOC Lead', action: 'Escalated', details: 'Incident escalated to Tier-2 SOC Investigation' }
        ],
      };
      clientIncidents = [newInc, ...clientIncidents];
      return { success: true, incident: newInc };
    }
  },

  async updateIncident(id: string, updates: { status?: string; resolution?: string; note?: string; toggleActionId?: string }) {
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Update incident failed');
      return await res.json();
    } catch (err) {
      const inc = clientIncidents.find(i => i.id === id);
      if (inc) {
        if (updates.status) inc.status = updates.status as any;
        if (updates.resolution) inc.resolution = updates.resolution;
        if (updates.note) inc.timeline.push({ id: `EV-${Date.now()}`, timestamp: new Date().toISOString(), user: 'Analyst', action: 'Note Added', details: updates.note });
        if (updates.toggleActionId) {
          const act = inc.responseActions.find(a => a.id === updates.toggleActionId);
          if (act) act.completed = !act.completed;
        }
      }
      return { success: true, incident: inc };
    }
  },

  // 6. Analytics
  async getAnalytics(range: string = '7d') {
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      if (!res.ok) throw new Error('Analytics failed');
      return await res.json();
    } catch (err) {
      return {
        success: true,
        range,
        trend: [
          { time: '00:00', totalPackets: 18000, threats: 4, bandwidth: 45 },
          { time: '04:00', totalPackets: 12000, threats: 2, bandwidth: 28 },
          { time: '08:00', totalPackets: 45000, threats: 14, bandwidth: 110 },
          { time: '12:00', totalPackets: 82000, threats: 28, bandwidth: 185 },
          { time: '16:00', totalPackets: 68000, threats: 18, bandwidth: 150 },
          { time: '20:00', totalPackets: 34000, threats: 8, bandwidth: 75 },
        ],
        attackVectors: [
          { name: 'SYN Flood DDoS', count: 1840, share: 33.7 },
          { name: 'Port Sweeps / Recon', count: 1230, share: 22.5 },
          { name: 'SSH Brute-Force', count: 950, share: 17.4 },
          { name: 'DNS Tunneling', count: 640, share: 11.7 },
          { name: 'Malware C2 Beaconing', count: 480, share: 8.8 },
        ],
        geoHeatmap: [
          { country: 'United States', code: 'US', threats: 1420, percentage: 38 },
          { country: 'Russia', code: 'RU', threats: 980, percentage: 26 },
          { country: 'China', code: 'CN', threats: 620, percentage: 17 },
          { country: 'Germany', code: 'DE', threats: 380, percentage: 10 },
          { country: 'Other', code: 'XX', threats: 340, percentage: 9 },
        ]
      };
    }
  },

  // 7. Reports
  async getReports(): Promise<{ reports: SOCReport[] }> {
    try {
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error('Reports failed');
      return await res.json();
    } catch (err) {
      return {
        reports: [
          {
            id: 'REP-2026-0831',
            generatedAt: new Date(Date.now() - 86400000).toISOString(),
            period: 'Last 7 Days',
            totalPackets: 8450000,
            threatsIdentified: 342,
            alertsGenerated: 48,
            incidentsResolved: 14,
            topAttackerIp: '198.51.100.24',
            mostTargetedPort: 80,
            executiveSummary: 'Automated perimeter telemetry observed 342 anomaly triggers, with 14 hostile endpoints isolated at edge firewalls.',
          }
        ]
      };
    }
  },

  async createReport(period: string = 'Last 24 Hours'): Promise<{ report: SOCReport }> {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      });
      if (!res.ok) throw new Error('Create report failed');
      return await res.json();
    } catch (err) {
      const newRep: SOCReport = {
        id: `REP-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        period,
        totalPackets: 1248000,
        threatsIdentified: 42,
        alertsGenerated: 8,
        incidentsResolved: 4,
        topAttackerIp: '198.51.100.24',
        mostTargetedPort: 80,
        executiveSummary: 'Automated SOC defense platform inspected 1,248,000 ingress packets with 18 hostile endpoints automatically dropped at the border firewall.',
      };
      return { report: newRep };
    }
  },

  // 8. Attack Simulator & IP Block
  async simulateAttack(params: { threatType: ThreatType; severity?: string; srcIp?: string; dstIp?: string; targetPort?: number; packetCount?: number } | ThreatType) {
    try {
      const payload = typeof params === 'string' ? { type: params } : { type: params.threatType, ...params };
      const res = await fetch('/api/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Simulate attack failed');
      return await res.json();
    } catch (err) {
      const threatType = typeof params === 'string' ? params : params.threatType;
      const count = typeof params === 'object' && params.packetCount ? params.packetCount : 50;
      return {
        success: true,
        threatType,
        packetsGenerated: count,
        message: `Simulation injected: ${count} frames for vector ${threatType}`,
      };
    }
  },

  async blockIp(ip: string) {
    return this.toggleBlockIP(ip);
  },

  async toggleBlockIP(ip: string) {
    try {
      const res = await fetch('/api/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      if (!res.ok) throw new Error('Block IP failed');
      return await res.json();
    } catch (err) {
      return {
        success: true,
        ip,
        action: 'blocked',
        message: `Edge firewall rule updated: ${ip} added to Drop List.`,
      };
    }
  },

  // 9. System Settings & Status
  async getSettings(): Promise<{ settings: SystemSettingsConfig }> {
    try {
      const res = await fetch('/api/system/settings');
      if (!res.ok) throw new Error('Settings failed');
      return await res.json();
    } catch (err) {
      return { settings: clientSettings };
    }
  },

  async updateSettings(settings: Partial<SystemSettingsConfig>) {
    try {
      const res = await fetch('/api/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Update settings failed');
      return await res.json();
    } catch (err) {
      clientSettings = { ...clientSettings, ...settings };
      return { success: true, settings: clientSettings };
    }
  },

  async getSystemStatus() {
    try {
      const res = await fetch('/api/system/status');
      if (!res.ok) throw new Error('Status failed');
      return await res.json();
    } catch (err) {
      return {
        success: true,
        services: {
          backend: { name: 'Node.js Express REST API', status: 'Online', uptime: '99.99%', latency: '2ms' },
          database: { name: 'In-Memory Telemetry Database', status: 'Online', collections: 8, docsCount: 1450 },
          mlService: { name: 'ML Classifier Engine (XGBoost)', status: 'Active', confidence: '98.4%', model: 'IntrusionDetector-v2.4' },
          packetAnalyzer: { name: 'Multi-Layer Packet Dissector', status: 'Capturing', parsedPackets: 1248000 },
          websocket: { name: 'Real-Time Telemetry Stream', status: 'Active', activeSubscribers: 1 },
        }
      };
    }
  },
};

function generateInitialMockPackets(): PacketRecord[] {
  return [
    {
      id: 'PKT-9481',
      timestamp: new Date().toISOString(),
      srcIp: '198.51.100.24',
      dstIp: '192.168.1.50',
      srcPort: 49152,
      dstPort: 80,
      protocol: 'TCP',
      size: 64,
      ttl: 48,
      tcpFlags: ['SYN'],
      status: 'Malicious',
      threatName: 'DDoS',
      rawHex: '0000   47 45 54 20 2F 20 48 54 54 50 2F 31 2E 31 0D 0A   |GET / HTTP/1.1..|\n0010   48 6F 73 74 3A 20 74 61 72 67 65 74 2E 6C 61 6E   |Host: target.lan|',
      rawAscii: 'GET / HTTP/1.1..Host: target.lan',
    },
    {
      id: 'PKT-9482',
      timestamp: new Date(Date.now() - 1000).toISOString(),
      srcIp: '185.220.101.5',
      dstIp: '192.168.1.20',
      srcPort: 41299,
      dstPort: 22,
      protocol: 'SSH',
      size: 128,
      ttl: 52,
      tcpFlags: ['PSH', 'ACK'],
      status: 'Malicious',
      threatName: 'Brute Force',
      rawHex: '0000   53 53 48 2D 32 2E 30 2D 4F 70 65 6E 53 53 48 5F   |SSH-2.0-OpenSSH_|\n0010   38 2E 32 70 31 20 55 62 75 6E 74 75 2D 34 75 62   |8.2p1 Ubuntu-4ub|',
      rawAscii: 'SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ub',
    },
    {
      id: 'PKT-9483',
      timestamp: new Date(Date.now() - 2000).toISOString(),
      srcIp: '192.168.1.25',
      dstIp: '10.0.0.15',
      srcPort: 52110,
      dstPort: 5432,
      protocol: 'TCP',
      size: 1420,
      ttl: 64,
      tcpFlags: ['ACK'],
      status: 'Normal',
      rawHex: '0000   51 00 00 00 24 53 45 4C 45 43 54 20 2A 20 46 52   |Q...$SELECT * FR|\n0010   4F 4D 20 61 63 63 6F 75 6E 74 73 20 4C 49 4D 49   |OM accounts LIMI|',
      rawAscii: 'Q...$SELECT * FROM accounts LIMI',
    },
    {
      id: 'PKT-9484',
      timestamp: new Date(Date.now() - 3000).toISOString(),
      srcIp: '192.168.1.44',
      dstIp: '8.8.8.8',
      srcPort: 58902,
      dstPort: 53,
      protocol: 'DNS',
      size: 84,
      ttl: 64,
      status: 'Suspicious',
      threatName: 'Suspicious DNS',
      rawHex: '0000   12 34 01 00 00 01 00 00 00 00 00 00 0B 78 79 7A   |.4...........xyz|\n0010   39 39 61 62 63 64 65 66 02 63 32 03 63 6F 6D 00   |99abcdef.c2.com.|',
      rawAscii: '.4...........xyz99abcdef.c2.com.',
    },
  ];
}

function generateInitialMockAlerts(): AlertRecord[] {
  return [
    {
      id: 'ALT-1001',
      timestamp: new Date().toISOString(),
      threatType: 'DDoS',
      srcIp: '198.51.100.24',
      dstIp: '192.168.1.50',
      srcPort: 49152,
      dstPort: 80,
      protocol: 'TCP',
      severity: 'Critical',
      mlConfidence: 0.98,
      description: 'Volumetric SYN flood saturating DMZ web cluster edge capacity.',
      status: 'New',
      notes: ['Automated ML threshold trigger exceeded 1,200 PPS'],
      packetRef: 'PKT-9481',
    },
    {
      id: 'ALT-1002',
      timestamp: new Date(Date.now() - 180000).toISOString(),
      threatType: 'Brute Force',
      srcIp: '185.220.101.5',
      dstIp: '192.168.1.20',
      srcPort: 41299,
      dstPort: 22,
      protocol: 'SSH',
      severity: 'High',
      mlConfidence: 0.94,
      description: 'Repeated authentication failures on internal bastion host.',
      status: 'Investigating',
      notes: ['Host isolated; analyst reviewing auth logs'],
      packetRef: 'PKT-9482',
    },
    {
      id: 'ALT-1003',
      timestamp: new Date(Date.now() - 450000).toISOString(),
      threatType: 'Suspicious DNS',
      srcIp: '192.168.1.44',
      dstIp: '8.8.8.8',
      srcPort: 58902,
      dstPort: 53,
      protocol: 'DNS',
      severity: 'High',
      mlConfidence: 0.89,
      description: 'High-entropy DNS subdomain queries consistent with tunneling exfiltration.',
      status: 'Acknowledged',
      notes: ['Subdomain pattern xyz99abcdef.c2.com flagged by entropy monitor'],
      packetRef: 'PKT-9484',
    },
  ];
}

function generateInitialMockIncidents(): IncidentRecord[] {
  return [
    {
      id: 'INC-8821',
      title: 'Volumetric TCP SYN Flood on Web Ingress Gateway',
      severity: 'Critical',
      status: 'Investigating',
      source: 'External DMZ Sensor',
      detectedTime: new Date(Date.now() - 3600000).toISOString(),
      description: 'Severe DDoS attack from external IP pool targetting port 80/443 on DMZ Gateway (192.168.1.1).',
      associatedAlerts: ['ALT-1001'],
      investigationNotes: ['Edge firewall drop rules enacted for 198.51.100.0/24'],
      evidence: [
        { type: 'IP', value: '198.51.100.24', description: 'Primary volumetric flood origin' },
        { type: 'Packet', value: 'PKT-9481', description: 'SYN flood frame capture' },
      ],
      responseActions: [
        { id: 'act-1', action: 'Enact edge perimeter firewall rate-limiting and drop rules', completed: true },
        { id: 'act-2', action: 'Enable SYN Cookies defense on Linux kernel level', completed: true },
        { id: 'act-3', action: 'Coordinate with upstream CDN / ISP for volumetric scrubbing', completed: false },
        { id: 'act-4', action: 'Compile incident post-mortem and forensic packet archive', completed: false },
      ],
      timeline: [
        { id: 'EV-1', timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'System', action: 'Created', details: 'Incident created from Alert ALT-1001' },
        { id: 'EV-2', timestamp: new Date(Date.now() - 2400000).toISOString(), user: 'Tier-2 Analyst', action: 'Contained', details: 'Edge firewall drop rules enacted for 198.51.100.0/24' },
      ],
    },
    {
      id: 'INC-8822',
      title: 'Suspected DNS Tunneling Exfiltration on Database Segment',
      severity: 'High',
      status: 'Open',
      source: 'Internal Seg-01 Tap',
      detectedTime: new Date(Date.now() - 7200000).toISOString(),
      description: 'Persistent encoded TXT records queried against unknown external nameserver (c2.com).',
      associatedAlerts: ['ALT-1003'],
      investigationNotes: ['Anomalous high-entropy subdomains captured'],
      evidence: [
        { type: 'IP', value: '185.220.101.5', description: 'Exfiltration destination' },
        { type: 'Domain', value: 'c2.com', description: 'Unregistered C2 domain' },
      ],
      responseActions: [
        { id: 'act-1', action: 'Sinkhole suspicious domain at internal recursive resolver', completed: true },
        { id: 'act-2', action: 'Perform forensic memory capture on host 10.0.4.15', completed: false },
        { id: 'act-3', action: 'Inspect outgoing network flows for data loss estimation', completed: false },
      ],
      timeline: [
        { id: 'EV-3', timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'System', action: 'Logged', details: 'Incident logged from anomalous DNS entropy triggers' },
      ],
    },
  ];
}

function getFallbackDashboardData(): DashboardData {
  return {
    kpis: {
      totalPackets: 1248000,
      packetsPerSec: 1420,
      bandwidthMbps: 164.8,
      activeConnections: 342,
      threatsDetected: 42,
      criticalAlerts: 4,
      blockedIPs: 18,
      systemHealth: 99.9,
      normalTrafficCount: 1200000,
      suspiciousTrafficCount: 34000,
      criticalThreatCount: 4,
      averageConfidence: 0.964,
      averageRiskScore: 68.5,
    },
    protocolDistribution: [
      { name: 'TCP', count: 48, bytes: 480000, percentage: 48, color: '#3b82f6' },
      { name: 'UDP', count: 24, bytes: 240000, percentage: 24, color: '#06b6d4' },
      { name: 'HTTPS', count: 14, bytes: 140000, percentage: 14, color: '#8b5cf6' },
      { name: 'DNS', count: 8, bytes: 80000, percentage: 8, color: '#eab308' },
      { name: 'ICMP', count: 4, bytes: 40000, percentage: 4, color: '#ec4899' },
      { name: 'SSH', count: 2, bytes: 20000, percentage: 2, color: '#10b981' },
    ],
    threatDistribution: [
      { severity: 'Critical', count: 4, color: '#ef4444' },
      { severity: 'High', count: 12, color: '#f97316' },
      { severity: 'Medium', count: 18, color: '#eab308' },
      { severity: 'Low', count: 8, color: '#3b82f6' },
    ],
    topTalkers: [
      { ip: '198.51.100.24', domain: 'host-24.evil-threat.net', country: 'United States', packets: 42000, bytes: 48000000, threatCount: 6, isBlocked: false },
      { ip: '192.168.1.50', domain: 'web-lb-01.internal', country: 'Internal LAN', packets: 38000, bytes: 42000000, threatCount: 0, isBlocked: false },
      { ip: '185.220.101.5', domain: 'tor-exit-node.de', country: 'Germany', packets: 18000, bytes: 14000000, threatCount: 8, isBlocked: true },
      { ip: '203.0.113.77', domain: 'c2-proxy.sg', country: 'Singapore', packets: 12000, bytes: 9000000, threatCount: 3, isBlocked: false },
    ],
    recentLogs: [],
    recentAlerts: generateInitialMockAlerts(),
  };
}
