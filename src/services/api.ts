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
      console.warn('Using local fallback for dashboard stats', err);
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
      return { total: 0, packets: [] };
    }
  },

  async uploadPcap(payload: { fileName: string; fileSize: number; customPackets?: PacketRecord[] }) {
    const res = await fetch('/api/packets/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  // 3. ML Threats
  async getThreats(): Promise<{ threats: MLPrediction[] }> {
    const res = await fetch('/api/threats');
    return await res.json();
  },

  async predictThreat(srcIp: string, dstIp: string, features: any): Promise<{ prediction: MLPrediction }> {
    const res = await fetch('/api/ml/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ srcIp, dstIp, features }),
    });
    return await res.json();
  },

  async getMLStatus() {
    const res = await fetch('/api/ml/status');
    return await res.json();
  },

  // 4. Alerts
  async getAlerts(params: { severity?: string; status?: string; search?: string } = {}): Promise<{ alerts: AlertRecord[] }> {
    const query = new URLSearchParams();
    if (params.severity) query.set('severity', params.severity);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);

    const res = await fetch(`/api/alerts?${query.toString()}`);
    return await res.json();
  },

  async updateAlert(id: string, updates: { status?: string; severity?: string; note?: string }) {
    const res = await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return await res.json();
  },

  // 5. Incidents
  async getIncidents(params: { status?: string; severity?: string } = {}): Promise<{ incidents: IncidentRecord[] }> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.severity) query.set('severity', params.severity);

    const res = await fetch(`/api/incidents?${query.toString()}`);
    return await res.json();
  },

  async createIncident(incidentData: Partial<IncidentRecord>) {
    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidentData),
    });
    return await res.json();
  },

  async updateIncident(id: string, updates: { status?: string; resolution?: string; note?: string; toggleActionId?: string }) {
    const res = await fetch(`/api/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return await res.json();
  },

  // 6. Analytics
  async getAnalytics(range: string = '7d') {
    const res = await fetch(`/api/analytics?range=${range}`);
    return await res.json();
  },

  // 7. Reports
  async getReports(): Promise<{ reports: SOCReport[] }> {
    const res = await fetch('/api/reports');
    return await res.json();
  },

  async createReport(period: string = 'Last 24 Hours'): Promise<{ report: SOCReport }> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period }),
    });
    return await res.json();
  },

  // 8. Attack Simulator & IP Block
  async simulateAttack(params: { threatType: ThreatType; severity?: string; srcIp?: string; dstIp?: string; targetPort?: number; packetCount?: number } | ThreatType) {
    const payload = typeof params === 'string' ? { type: params } : { type: params.threatType, ...params };
    const res = await fetch('/api/simulate-attack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async blockIp(ip: string) {
    return this.toggleBlockIP(ip);
  },

  async toggleBlockIP(ip: string) {
    const res = await fetch('/api/block-ip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip }),
    });
    return await res.json();
  },

  // 9. System Settings & Status
  async getSettings(): Promise<{ settings: SystemSettingsConfig }> {
    const res = await fetch('/api/system/settings');
    return await res.json();
  },

  async updateSettings(settings: Partial<SystemSettingsConfig>) {
    const res = await fetch('/api/system/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return await res.json();
  },

  async getSystemStatus() {
    const res = await fetch('/api/system/status');
    return await res.json();
  },
};

function getFallbackDashboardData(): DashboardData {
  return {
    kpis: {
      totalPackets: 98450,
      packetsPerSec: 1420,
      bandwidthMbps: 168.4,
      activeConnections: 920,
      threatsDetected: 38,
      criticalAlerts: 4,
      blockedIPs: 2,
      systemHealth: 98.4,
      normalTrafficCount: 92000,
      suspiciousTrafficCount: 6450,
      criticalThreatCount: 4,
      averageConfidence: 0.94,
      averageRiskScore: 45,
    },
    topTalkers: [
      { ip: '192.168.1.50', domain: 'gateway.lan', packets: 34210, bytes: 48200000, threatCount: 2, country: 'Internal', flag: '🏢' },
      { ip: '198.51.100.24', domain: 'scanner.threat-node.org', packets: 18450, bytes: 24300000, threatCount: 14, country: 'Russia', flag: '🇷🇺' },
      { ip: '10.0.0.15', domain: 'db-cluster-01.local', packets: 16900, bytes: 32000000, threatCount: 0, country: 'Internal', flag: '🏢' },
    ],
    protocolDistribution: [
      { name: 'TCP', count: 450, percentage: 45, bytes: 5400000, color: '#3b82f6' },
      { name: 'UDP', count: 280, percentage: 28, bytes: 3100000, color: '#06b6d4' },
      { name: 'HTTPS', count: 180, percentage: 18, bytes: 8900000, color: '#8b5cf6' },
      { name: 'DNS', count: 60, percentage: 6, bytes: 340000, color: '#eab308' },
      { name: 'HTTP', count: 30, percentage: 3, bytes: 450000, color: '#ec4899' },
    ],
    threatDistribution: [
      { severity: 'Critical', count: 4, color: '#ef4444' },
      { severity: 'High', count: 12, color: '#f97316' },
      { severity: 'Medium', count: 19, color: '#eab308' },
      { severity: 'Low', count: 35, color: '#22c55e' },
      { severity: 'Informational', count: 15, color: '#3b82f6' },
    ],
    recentLogs: [],
    recentAlerts: [],
  };
}
