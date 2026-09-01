import { ThreatType, SeverityLevel, MLPrediction } from '../src/types/soc.js';

export interface PacketFeatures {
  packetCount: number;
  packetSize: number;
  flowDurationMs: number;
  srcPort: number;
  dstPort: number;
  protocol: string;
  bytesTransferred: number;
  connectionFrequency: number;
  requestFrequency: number;
  tcpSynRatio: number;
  failedAuthCount: number;
  entropy: number;
}

/**
 * Machine Learning Threat Detection Engine (Simulates trained scikit-learn / XGBoost model)
 * Extracts multi-dimensional network features and applies multi-class decision trees & anomaly scoring
 */
export function predictThreatFromFeatures(
  srcIp: string,
  dstIp: string,
  features: Partial<PacketFeatures>
): MLPrediction {
  const feat: PacketFeatures = {
    packetCount: features.packetCount ?? Math.floor(Math.random() * 50 + 1),
    packetSize: features.packetSize ?? Math.floor(Math.random() * 1200 + 64),
    flowDurationMs: features.flowDurationMs ?? Math.floor(Math.random() * 5000 + 100),
    srcPort: features.srcPort ?? Math.floor(Math.random() * 60000 + 1024),
    dstPort: features.dstPort ?? 80,
    protocol: features.protocol ?? 'TCP',
    bytesTransferred: features.bytesTransferred ?? Math.floor(Math.random() * 50000 + 1000),
    connectionFrequency: features.connectionFrequency ?? 12,
    requestFrequency: features.requestFrequency ?? 5,
    tcpSynRatio: features.tcpSynRatio ?? 0.1,
    failedAuthCount: features.failedAuthCount ?? 0,
    entropy: features.entropy ?? 3.2,
  };

  let threat: ThreatType = 'Normal Traffic';
  let confidence = 0.85 + Math.random() * 0.14;
  let severity: SeverityLevel = 'Low';
  let riskScore = 15;

  const explainability: { feature: string; impact: number }[] = [];

  // ML Detection Heuristics
  if (feat.dstPort === 22 && feat.failedAuthCount >= 3) {
    threat = 'Brute Force';
    severity = 'High';
    confidence = 0.94 + Math.random() * 0.05;
    riskScore = 88;
    explainability.push(
      { feature: 'High Failed Auth Rate', impact: 0.45 },
      { feature: 'SSH Port (22) Burst', impact: 0.32 },
      { feature: 'Rapid Connection Frequency', impact: 0.23 }
    );
  } else if (feat.tcpSynRatio > 0.75 && feat.connectionFrequency > 50) {
    threat = 'Port Scanning';
    severity = 'High';
    confidence = 0.96 + Math.random() * 0.03;
    riskScore = 82;
    explainability.push(
      { feature: 'TCP SYN Flag Dominance', impact: 0.52 },
      { feature: 'Dispersed Port Target Spread', impact: 0.31 },
      { feature: 'Low Payload Entropy', impact: 0.17 }
    );
  } else if (feat.packetCount > 300 || (feat.bytesTransferred > 200000 && feat.flowDurationMs < 2000)) {
    threat = 'DDoS';
    severity = 'Critical';
    confidence = 0.97 + Math.random() * 0.02;
    riskScore = 96;
    explainability.push(
      { feature: 'Extreme Packet Rate / sec', impact: 0.58 },
      { feature: 'Bandwidth Volumetric Anomaly', impact: 0.28 },
      { feature: 'Short Inter-Arrival Times', impact: 0.14 }
    );
  } else if (feat.protocol === 'DNS' && (feat.entropy > 4.5 || feat.packetSize > 512)) {
    threat = 'Suspicious DNS';
    severity = 'Medium';
    confidence = 0.89 + Math.random() * 0.08;
    riskScore = 68;
    explainability.push(
      { feature: 'High Shannon Entropy in Subdomain', impact: 0.61 },
      { feature: 'Oversized TXT/Null Record Size', impact: 0.27 },
      { feature: 'Unusual External Resolver', impact: 0.12 }
    );
  } else if (feat.bytesTransferred > 500000 && feat.dstPort === 443 && feat.requestFrequency > 30) {
    threat = 'Data Exfiltration';
    severity = 'Critical';
    confidence = 0.93 + Math.random() * 0.05;
    riskScore = 94;
    explainability.push(
      { feature: 'Sustained Asymmetric Outbound Volume', impact: 0.54 },
      { feature: 'Encrypted Stream Duration', impact: 0.29 },
      { feature: 'Non-Standard TLS Handshake Attributes', impact: 0.17 }
    );
  } else if (feat.dstPort === 4444 || feat.dstPort === 6667 || feat.dstPort === 1337) {
    threat = 'Botnet Activity';
    severity = 'High';
    confidence = 0.91 + Math.random() * 0.06;
    riskScore = 85;
    explainability.push(
      { feature: 'Known C2 Beacon Port Signature', impact: 0.49 },
      { feature: 'Periodic Heartbeat Interval (Jitter < 5%)', impact: 0.36 },
      { feature: 'Direct IP Connection (No DNS)', impact: 0.15 }
    );
  } else if (feat.packetSize > 1400 && feat.entropy > 4.8) {
    threat = 'Malware Traffic';
    severity = 'High';
    confidence = 0.88 + Math.random() * 0.09;
    riskScore = 79;
    explainability.push(
      { feature: 'High Entropy Packed Payload', impact: 0.44 },
      { feature: 'Suspicious User-Agent Fingerprint', impact: 0.35 },
      { feature: 'Certificate Issuer Anomaly', impact: 0.21 }
    );
  } else if (feat.connectionFrequency > 40 && feat.packetCount > 100) {
    threat = 'DoS';
    severity = 'High';
    confidence = 0.90 + Math.random() * 0.05;
    riskScore = 76;
    explainability.push(
      { feature: 'Single Host Resource Depletion Flow', impact: 0.51 },
      { feature: 'Unacknowledged TCP Windows', impact: 0.33 },
      { feature: 'High Concurrency Rate', impact: 0.16 }
    );
  } else if (Math.random() < 0.08) {
    threat = 'Anomalous Traffic';
    severity = 'Medium';
    confidence = 0.76 + Math.random() * 0.12;
    riskScore = 52;
    explainability.push(
      { feature: 'Statistical Isolation Forest Outlier', impact: 0.42 },
      { feature: 'Protocol Header Inconsistency', impact: 0.38 },
      { feature: 'Time-of-day Baseline Deviation', impact: 0.20 }
    );
  } else {
    threat = 'Normal Traffic';
    severity = 'Low';
    confidence = 0.95 + Math.random() * 0.04;
    riskScore = Math.floor(Math.random() * 18 + 5);
    explainability.push(
      { feature: 'Standard RFC-compliant Headers', impact: 0.60 },
      { feature: 'Known Whitelisted IP / Port', impact: 0.25 },
      { feature: 'Balanced Bidirectional Flow', impact: 0.15 }
    );
  }

  return {
    id: 'ML-PRED-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    timestamp: new Date().toISOString(),
    srcIp,
    dstIp,
    threat,
    confidence: Number(confidence.toFixed(2)),
    severity,
    riskScore,
    status: 'Active',
    features: feat,
    explainability,
  };
}
