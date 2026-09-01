export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';

export type AlertStatus = 'New' | 'Investigating' | 'Acknowledged' | 'Resolved' | 'False Positive';

export type IncidentStatus = 'Open' | 'Investigating' | 'Contained' | 'Resolved' | 'Closed';

export type ThreatType = 
  | 'Port Scanning'
  | 'Brute Force'
  | 'DDoS'
  | 'DoS'
  | 'Malware Traffic'
  | 'Botnet Activity'
  | 'Suspicious DNS'
  | 'Data Exfiltration'
  | 'Anomalous Traffic'
  | 'Normal Traffic';

export type NetworkProtocol = 'TCP' | 'UDP' | 'ICMP' | 'DNS' | 'HTTP' | 'HTTPS' | 'ARP' | 'SSH' | 'TLS' | 'Other';

export interface PacketLayerEthernet {
  srcMac: string;
  dstMac: string;
  type: string;
}

export interface PacketLayerIP {
  version: number;
  headerLength: number;
  ttl: number;
  tos: number;
  srcIp: string;
  dstIp: string;
  checksum: string;
}

export interface PacketLayerTransport {
  srcPort?: number;
  dstPort?: number;
  flags?: string[];
  seq?: number;
  ack?: number;
  windowSize?: number;
  icmpType?: number;
  icmpCode?: number;
}

export interface PacketLayerApp {
  protocolName: string;
  method?: string;
  url?: string;
  host?: string;
  statusCode?: number;
  dnsQuery?: string;
  dnsType?: string;
  payloadSummary?: string;
}

export interface PacketRecord {
  id: string;
  timestamp: string;
  srcIp: string;
  dstIp: string;
  protocol: NetworkProtocol;
  srcPort: number;
  dstPort: number;
  size: number;
  status: 'Normal' | 'Suspicious' | 'Malicious';
  threatName?: ThreatType;
  tcpFlags?: string[];
  ttl?: number;
  rawHex?: string;
  rawAscii?: string;
  ethernet?: PacketLayerEthernet;
  ip?: PacketLayerIP;
  transport?: PacketLayerTransport;
  app?: PacketLayerApp;
}

export interface MLPrediction {
  id: string;
  timestamp: string;
  srcIp: string;
  dstIp: string;
  threat: ThreatType;
  confidence: number; // 0.00 - 1.00
  severity: SeverityLevel;
  riskScore: number; // 0 - 100
  status: 'Active' | 'Mitigated' | 'Ignored';
  features: {
    packetCount: number;
    packetSize: number;
    flowDurationMs: number;
    bytesTransferred: number;
    connectionFrequency: number;
    requestFrequency: number;
    tcpSynRatio: number;
    failedAuthCount: number;
    entropy: number;
  };
  explainability: {
    feature: string;
    impact: number;
  }[];
}

export interface AlertRecord {
  id: string;
  timestamp: string;
  threatType: ThreatType;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  protocol: NetworkProtocol;
  severity: SeverityLevel;
  mlConfidence: number;
  description: string;
  status: AlertStatus;
  notes: string[];
  packetRef?: string;
  assignedIncidentId?: string;
}

export interface IncidentEvent {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface IncidentRecord {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  source: string;
  detectedTime: string;
  status: IncidentStatus;
  associatedAlerts: string[];
  investigationNotes: string[];
  evidence: {
    type: 'IP' | 'Packet' | 'Port' | 'Domain' | 'Log';
    value: string;
    description: string;
  }[];
  responseActions: {
    id: string;
    action: string;
    completed: boolean;
    completedAt?: string;
  }[];
  resolution?: string;
  timeline: IncidentEvent[];
}

export interface DashboardKPIs {
  totalPackets: number;
  packetsPerSec: number;
  bandwidthMbps: number;
  activeConnections: number;
  threatsDetected: number;
  criticalAlerts: number;
  blockedIPs: number;
  systemHealth: number; // 0-100%
  normalTrafficCount: number;
  suspiciousTrafficCount: number;
  criticalThreatCount: number;
  averageConfidence: number;
  averageRiskScore: number;
}

export interface ProtocolStat {
  name: string;
  count: number;
  percentage: number;
  bytes: number;
  color: string;
}

export interface ThreatStat {
  severity: SeverityLevel;
  count: number;
  color: string;
}

export interface TopTalker {
  ip: string;
  domain?: string;
  packets: number;
  bytes: number;
  threatCount: number;
  country?: string;
  flag?: string;
  isBlocked?: boolean;
}

export interface PortStat {
  port: number;
  service: string;
  trafficCount: number;
  protocol: string;
}

export interface SecurityEventLog {
  id: string;
  timestamp: string;
  severity: SeverityLevel;
  message: string;
  sourceIp: string;
  threatType: ThreatType;
}

export interface SystemSettingsConfig {
  monitoringActive: boolean;
  packetCaptureActive: boolean;
  realtimeMonitoring: boolean;
  refreshIntervalSec: number;
  mlModelStatus: 'Online' | 'Degraded' | 'Offline';
  detectionSensitivity: number; // 1-100
  confidenceThreshold: number; // 0.1 - 1.0
  alertThreshold: 'All' | 'Medium+' | 'High+' | 'Critical Only';
  criticalNotificationSound: boolean;
  autoIncidentCreation: boolean;
  demoMode: boolean;
}

export interface SOCReport {
  id: string;
  generatedAt: string;
  period: string;
  totalPackets: number;
  threatsIdentified: number;
  alertsGenerated: number;
  incidentsResolved: number;
  topAttackerIp: string;
  mostTargetedPort: number;
  executiveSummary: string;
}
