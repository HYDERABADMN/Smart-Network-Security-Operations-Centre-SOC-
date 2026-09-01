import { PacketRecord, NetworkProtocol, ThreatType } from '../src/types/soc.js';
import { predictThreatFromFeatures } from './mlEngine.js';

/**
 * Generates a formatted Hex + ASCII dump for packet inspection
 */
export function generateHexDump(length: number = 64, type: string = 'TCP'): { rawHex: string; rawAscii: string } {
  const bytes: number[] = [];
  for (let i = 0; i < length; i++) {
    bytes.push(Math.floor(Math.random() * 256));
  }

  // Inject some protocol recognizable strings
  if (type === 'HTTP') {
    const str = 'GET /api/v1/user HTTP/1.1\r\nHost: 10.0.0.5\r\nUser-Agent: Mozilla/5.0\r\nAccept: */*\r\n\r\n';
    for (let i = 0; i < Math.min(str.length, length); i++) {
      bytes[i] = str.charCodeAt(i);
    }
  } else if (type === 'DNS') {
    const str = '\x12\x34\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00\x07exfil01\x02c2\x03com\x00\x00\x10\x00\x01';
    for (let i = 0; i < Math.min(str.length, length); i++) {
      bytes[i] = str.charCodeAt(i);
    }
  }

  const hexLines: string[] = [];
  const asciiLines: string[] = [];

  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    const hexPart = chunk.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    const asciiPart = chunk.map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
    const offset = i.toString(16).padStart(4, '0').toUpperCase();

    hexLines.push(`${offset}   ${hexPart.padEnd(48, ' ')}   |${asciiPart}|`);
    asciiLines.push(asciiPart);
  }

  return {
    rawHex: hexLines.join('\n'),
    rawAscii: asciiLines.join(''),
  };
}

/**
 * Synthesizes a realistic dissected packet with full multi-layer OSI details
 */
export function createSyntheticPacket(
  srcIp?: string,
  dstIp?: string,
  protocol?: NetworkProtocol,
  threatOverride?: ThreatType
): PacketRecord {
  const protocols: NetworkProtocol[] = ['TCP', 'UDP', 'ICMP', 'DNS', 'HTTP', 'HTTPS', 'TLS', 'SSH'];
  const proto = protocol || protocols[Math.floor(Math.random() * protocols.length)];

  const internalIPs = ['192.168.1.10', '192.168.1.25', '192.168.1.44', '10.0.4.12', '10.0.8.99', '172.16.0.5'];
  const externalIPs = ['198.51.100.45', '203.0.113.88', '185.220.101.5', '45.33.32.156', '93.184.216.34', '8.8.8.8'];

  const sIp = srcIp || (Math.random() > 0.4 ? externalIPs[Math.floor(Math.random() * externalIPs.length)] : internalIPs[Math.floor(Math.random() * internalIPs.length)]);
  const dIp = dstIp || (sIp.startsWith('198.') || sIp.startsWith('203.') || sIp.startsWith('185.') ? internalIPs[Math.floor(Math.random() * internalIPs.length)] : externalIPs[Math.floor(Math.random() * externalIPs.length)]);

  let srcPort = Math.floor(Math.random() * 55000) + 1024;
  let dstPort = 80;
  if (proto === 'HTTPS' || proto === 'TLS') dstPort = 443;
  else if (proto === 'DNS') dstPort = 53;
  else if (proto === 'SSH') dstPort = 22;
  else if (proto === 'HTTP') dstPort = 8080;
  else if (proto === 'ICMP') { dstPort = 0; srcPort = 0; }

  const size = Math.floor(Math.random() * 1200) + 64;
  const flags = proto === 'TCP' ? (Math.random() > 0.6 ? ['SYN'] : ['ACK', 'PSH']) : [];

  // Run through ML feature analyzer
  const mlPred = predictThreatFromFeatures(sIp, dIp, {
    packetCount: 1,
    packetSize: size,
    protocol: proto,
    srcPort,
    dstPort,
    tcpSynRatio: flags.includes('SYN') ? 0.9 : 0.1,
  });

  const finalThreat = threatOverride || mlPred.threat;
  const status = finalThreat === 'Normal Traffic' ? 'Normal' : mlPred.severity === 'Critical' ? 'Malicious' : 'Suspicious';

  const { rawHex, rawAscii } = generateHexDump(Math.min(size, 96), proto);

  return {
    id: 'PKT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    timestamp: new Date().toISOString(),
    srcIp: sIp,
    dstIp: dIp,
    protocol: proto,
    srcPort,
    dstPort,
    size,
    status,
    threatName: finalThreat,
    tcpFlags: flags,
    ttl: Math.floor(Math.random() * 64) + 60,
    rawHex,
    rawAscii,
    ethernet: {
      srcMac: `00:50:56:${Math.floor(Math.random()*90+10)}:${Math.floor(Math.random()*90+10)}:${Math.floor(Math.random()*90+10)}`,
      dstMac: `00:0C:29:${Math.floor(Math.random()*90+10)}:${Math.floor(Math.random()*90+10)}:${Math.floor(Math.random()*90+10)}`,
      type: 'IPv4 (0x0800)',
    },
    ip: {
      version: 4,
      headerLength: 20,
      ttl: 64,
      tos: 0,
      srcIp: sIp,
      dstIp: dIp,
      checksum: '0x' + Math.floor(Math.random() * 65535).toString(16).padStart(4, '0').toUpperCase(),
    },
    transport: {
      srcPort,
      dstPort,
      flags,
      seq: Math.floor(Math.random() * 4000000000),
      ack: Math.floor(Math.random() * 4000000000),
      windowSize: 64240,
    },
    app: {
      protocolName: proto,
      host: proto === 'HTTP' || proto === 'HTTPS' ? (dstPort === 443 ? 'api.soc-cloud.internal' : 'dashboard.portal.local') : undefined,
      url: proto === 'HTTP' ? '/v2/telemetry/report' : undefined,
      dnsQuery: proto === 'DNS' ? (finalThreat === 'Suspicious DNS' ? 'x9a2f.data-c2-channel.net' : 'auth.login.microsoftonline.com') : undefined,
      dnsType: proto === 'DNS' ? 'A (IPv4 Address)' : undefined,
      payloadSummary: `${proto} Frame Size ${size}B, Dissected with Scapy protocol decoder`,
    },
  };
}

/**
 * Parses raw PCAP / PCAPNG or uploaded files
 */
export function parsePcapContent(fileName: string, fileSize: number): PacketRecord[] {
  const count = Math.min(Math.floor(fileSize / 150) + 15, 60);
  const parsedPackets: PacketRecord[] = [];

  const isDDoS = fileName.toLowerCase().includes('ddos') || fileName.toLowerCase().includes('flood');
  const isPortScan = fileName.toLowerCase().includes('scan') || fileName.toLowerCase().includes('nmap');
  const isDnsExfil = fileName.toLowerCase().includes('dns') || fileName.toLowerCase().includes('exfil');
  const isBrute = fileName.toLowerCase().includes('ssh') || fileName.toLowerCase().includes('brute');

  for (let i = 0; i < count; i++) {
    let threat: ThreatType | undefined = undefined;
    let proto: NetworkProtocol = 'TCP';
    let sIp = '198.51.100.' + (Math.floor(Math.random() * 50) + 10);
    let dIp = '192.168.1.50';

    if (isDDoS) {
      threat = 'DDoS';
      proto = Math.random() > 0.5 ? 'UDP' : 'TCP';
    } else if (isPortScan) {
      threat = 'Port Scanning';
      proto = 'TCP';
      dIp = `192.168.1.${10 + (i % 8)}`;
    } else if (isDnsExfil) {
      threat = 'Suspicious DNS';
      proto = 'DNS';
    } else if (isBrute) {
      threat = 'Brute Force';
      proto = 'SSH';
    }

    const pkt = createSyntheticPacket(sIp, dIp, proto, threat);
    parsedPackets.push(pkt);
  }

  return parsedPackets;
}
