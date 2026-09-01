import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { createSyntheticPacket, parsePcapContent } from './server/packetAnalyzer.js';
import { predictThreatFromFeatures } from './server/mlEngine.js';
import { ThreatType, SeverityLevel, AlertStatus, IncidentStatus, NetworkProtocol } from './src/types/soc.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsers with large limit for PCAP binary/payload uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // SSE client pool for real-time live events and packet streaming
  const sseClients = new Set<express.Response>();

  // Helper to broadcast SSE events to all connected SOC clients
  function broadcastSSE(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch (err) {
        sseClients.delete(client);
      }
    }
  }

  // Periodic background packet generator to simulate live network traffic when monitoring is active
  setInterval(() => {
    if (db.settings.monitoringActive && db.settings.realtimeMonitoring) {
      // 10% chance of threat, 90% normal traffic
      const isThreat = Math.random() < (db.settings.detectionSensitivity / 400);
      let threat: ThreatType = 'Normal Traffic';
      if (isThreat) {
        const threatPool: ThreatType[] = [
          'Port Scanning', 'Brute Force', 'Suspicious DNS', 'Malware Traffic', 'Anomalous Traffic'
        ];
        threat = threatPool[Math.floor(Math.random() * threatPool.length)];
      }

      const pkt = createSyntheticPacket(undefined, undefined, undefined, threat);
      db.packets.unshift(pkt);
      if (db.packets.length > 400) db.packets.pop();

      // If threat, create alert & log
      if (threat !== 'Normal Traffic') {
        const alertId = `ALT-${1000 + db.alerts.length + 1}`;
        const alert = {
          id: alertId,
          timestamp: new Date().toISOString(),
          threatType: threat,
          srcIp: pkt.srcIp,
          dstIp: pkt.dstIp,
          srcPort: pkt.srcPort,
          dstPort: pkt.dstPort,
          protocol: pkt.protocol,
          severity: (threat === 'Port Scanning' || threat === 'Brute Force' ? 'High' : 'Medium') as SeverityLevel,
          mlConfidence: Number((0.85 + Math.random() * 0.12).toFixed(2)),
          description: `Live heuristic trigger: ${threat} signature matched from ${pkt.srcIp}`,
          status: 'New' as AlertStatus,
          notes: [`Captured by Real-Time Ingress Monitor`],
          packetRef: pkt.id,
        };
        db.alerts.unshift(alert);

        const log = {
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toISOString(),
          severity: alert.severity,
          message: `${threat} detected from ${pkt.srcIp}`,
          sourceIp: pkt.srcIp,
          threatType: threat,
        };
        db.system_logs.unshift(log);

        broadcastSSE('alert', alert);
        broadcastSSE('security_event', log);
      }

      broadcastSSE('packet', pkt);
    }
  }, 1800);

  // -------------------------------------------------------------
  // REST API ROUTES
  // -------------------------------------------------------------

  // 1. Dashboard Stats
  app.get('/api/dashboard/stats', (req, res) => {
    const kpis = db.getDashboardKPIs();
    const topTalkers = db.getTopTalkers();
    const protocolCounts: Record<string, number> = {
      TCP: 42,
      UDP: 28,
      HTTPS: 18,
      DNS: 6,
      HTTP: 4,
      ICMP: 2,
      TLS: 3,
      SSH: 2,
      Other: 1,
    };

    // Calculate actual counts from current buffer
    db.packets.forEach(p => {
      protocolCounts[p.protocol] = (protocolCounts[p.protocol] || 0) + 1;
    });

    const totalPacketsCount = Object.values(protocolCounts).reduce((a, b) => a + b, 0);
    const protocolDistribution = Object.entries(protocolCounts).map(([name, count]) => ({
      name,
      count,
      percentage: Number(((count / (totalPacketsCount || 1)) * 100).toFixed(1)),
      color: name === 'TCP' ? '#3b82f6' : name === 'UDP' ? '#06b6d4' : name === 'HTTPS' ? '#8b5cf6' : name === 'DNS' ? '#eab308' : name === 'HTTP' ? '#ec4899' : '#64748b'
    }));

    const threatDistribution = [
      { severity: 'Critical', count: db.alerts.filter(a => a.severity === 'Critical').length + 4, color: '#ef4444' },
      { severity: 'High', count: db.alerts.filter(a => a.severity === 'High').length + 11, color: '#f97316' },
      { severity: 'Medium', count: db.alerts.filter(a => a.severity === 'Medium').length + 18, color: '#eab308' },
      { severity: 'Low', count: db.alerts.filter(a => a.severity === 'Low').length + 32, color: '#22c55e' },
      { severity: 'Informational', count: 15, color: '#3b82f6' },
    ];

    res.json({
      success: true,
      kpis,
      topTalkers,
      protocolDistribution,
      threatDistribution,
      recentLogs: db.system_logs.slice(0, 10),
      recentAlerts: db.alerts.slice(0, 5),
    });
  });

  // 2. Packets API
  app.get('/api/packets', (req, res) => {
    const { protocol, srcIp, dstIp, port, status, search, limit = 50, offset = 0 } = req.query;

    let filtered = [...db.packets];

    if (protocol && protocol !== 'All') {
      filtered = filtered.filter(p => p.protocol.toLowerCase() === String(protocol).toLowerCase());
    }
    if (srcIp) {
      filtered = filtered.filter(p => p.srcIp.includes(String(srcIp)));
    }
    if (dstIp) {
      filtered = filtered.filter(p => p.dstIp.includes(String(dstIp)));
    }
    if (port) {
      const portNum = Number(port);
      filtered = filtered.filter(p => p.srcPort === portNum || p.dstPort === portNum);
    }
    if (status && status !== 'All') {
      filtered = filtered.filter(p => p.status.toLowerCase() === String(status).toLowerCase());
    }
    if (search) {
      const query = String(search).toLowerCase();
      filtered = filtered.filter(p =>
        p.srcIp.includes(query) ||
        p.dstIp.includes(query) ||
        p.protocol.toLowerCase().includes(query) ||
        (p.threatName && p.threatName.toLowerCase().includes(query)) ||
        p.id.toLowerCase().includes(query)
      );
    }

    const start = Number(offset);
    const end = start + Number(limit);
    const paginated = filtered.slice(start, end);

    res.json({
      success: true,
      total: filtered.length,
      packets: paginated,
    });
  });

  // Upload PCAP/PCAPNG file parser
  app.post('/api/packets/upload', (req, res) => {
    const { fileName = 'capture.pcap', fileSize = 2048, customPackets } = req.body;

    let parsedPackets = parsePcapContent(fileName, fileSize);
    if (customPackets && Array.isArray(customPackets)) {
      parsedPackets = customPackets;
    }

    // Insert into DB
    for (const pkt of parsedPackets) {
      db.packets.unshift(pkt);
    }
    if (db.packets.length > 500) db.packets = db.packets.slice(0, 500);

    const threatsDetected = parsedPackets.filter(p => p.status !== 'Normal');

    res.json({
      success: true,
      message: `Successfully analyzed ${parsedPackets.length} packets from ${fileName}`,
      fileName,
      totalPackets: parsedPackets.length,
      threatsFound: threatsDetected.length,
      protocols: Array.from(new Set(parsedPackets.map(p => p.protocol))),
      samplePackets: parsedPackets.slice(0, 15),
    });
  });

  // 3. ML Threats & Predictions API
  app.get('/api/threats', (req, res) => {
    res.json({
      success: true,
      threats: db.threats,
    });
  });

  app.get('/api/threats/:id', (req, res) => {
    const threat = db.threats.find(t => t.id === req.params.id);
    if (!threat) return res.status(404).json({ error: 'Threat not found' });
    res.json({ success: true, threat });
  });

  app.post('/api/ml/predict', (req, res) => {
    const { srcIp = '198.51.100.24', dstIp = '192.168.1.50', features = {} } = req.body;
    const prediction = predictThreatFromFeatures(srcIp, dstIp, features);
    db.threats.unshift(prediction);
    res.json({ success: true, prediction });
  });

  app.get('/api/ml/status', (req, res) => {
    res.json({
      success: true,
      modelName: 'XGBoost-Intrusion-Detector-v2.4',
      framework: 'FastAPI / scikit-learn / NumPy / Pandas',
      status: db.settings.mlModelStatus,
      accuracy: 0.968,
      f1Score: 0.954,
      latencyMs: 3.8,
      featuresCount: 10,
      supportedThreats: [
        'Port Scanning', 'Brute Force', 'DDoS', 'DoS', 'Malware Traffic',
        'Botnet Activity', 'Suspicious DNS', 'Data Exfiltration', 'Anomalous Traffic', 'Normal Traffic'
      ],
      totalInferences: 124800 + db.threats.length * 15,
    });
  });

  // 4. Alerts API
  app.get('/api/alerts', (req, res) => {
    const { severity, status, search } = req.query;
    let list = [...db.alerts];

    if (severity && severity !== 'All') {
      list = list.filter(a => a.severity.toLowerCase() === String(severity).toLowerCase());
    }
    if (status && status !== 'All') {
      list = list.filter(a => a.status.toLowerCase() === String(status).toLowerCase());
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(a =>
        a.id.toLowerCase().includes(q) ||
        a.threatType.toLowerCase().includes(q) ||
        a.srcIp.includes(q) ||
        a.dstIp.includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      total: list.length,
      alerts: list,
    });
  });

  app.post('/api/alerts', (req, res) => {
    const newAlert = {
      id: `ALT-${1000 + db.alerts.length + 1}`,
      timestamp: new Date().toISOString(),
      notes: [],
      status: 'New' as AlertStatus,
      ...req.body,
    };
    db.alerts.unshift(newAlert);
    res.status(201).json({ success: true, alert: newAlert });
  });

  app.patch('/api/alerts/:id', (req, res) => {
    const alert = db.alerts.find(a => a.id === req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    const { status, severity, note } = req.body;
    if (status) alert.status = status;
    if (severity) alert.severity = severity;
    if (note) alert.notes.push(`${new Date().toLocaleTimeString()}: ${note}`);

    res.json({ success: true, alert });
  });

  // 5. Incidents API
  app.get('/api/incidents', (req, res) => {
    const { status, severity } = req.query;
    let list = [...db.incidents];

    if (status && status !== 'All') {
      list = list.filter(i => i.status.toLowerCase() === String(status).toLowerCase());
    }
    if (severity && severity !== 'All') {
      list = list.filter(i => i.severity.toLowerCase() === String(severity).toLowerCase());
    }

    res.json({ success: true, total: list.length, incidents: list });
  });

  app.post('/api/incidents', (req, res) => {
    const incId = `INC-2026-${String(db.incidents.length + 1).padStart(3, '0')}`;
    const newInc = {
      id: incId,
      detectedTime: new Date().toISOString(),
      status: 'Open' as IncidentStatus,
      associatedAlerts: [],
      investigationNotes: [],
      evidence: [],
      responseActions: [
        { id: 'ACT-1', action: 'Quarantine Host IP on Edge Gateway', completed: false },
        { id: 'ACT-2', action: 'Capture Forensic Flow Packets', completed: false },
        { id: 'ACT-3', action: 'Validate Security Boundary Isolation', completed: false }
      ],
      timeline: [
        { id: 'EV-1', timestamp: new Date().toISOString(), user: 'SOC Analyst', action: 'Incident Logged', details: 'Manual escalation' }
      ],
      ...req.body,
    };
    db.incidents.unshift(newInc);
    res.status(201).json({ success: true, incident: newInc });
  });

  app.patch('/api/incidents/:id', (req, res) => {
    const incident = db.incidents.find(i => i.id === req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const { status, resolution, note, toggleActionId } = req.body;
    if (status) {
      incident.status = status;
      incident.timeline.unshift({
        id: `EV-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'SOC Analyst',
        action: `Status Updated to ${status}`,
        details: `Lifecycle phase adjusted to ${status}`
      });
    }
    if (resolution) incident.resolution = resolution;
    if (note) {
      incident.investigationNotes.push(`${new Date().toLocaleTimeString()}: ${note}`);
      incident.timeline.unshift({
        id: `EV-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'SOC Analyst',
        action: 'Investigation Note Added',
        details: note
      });
    }
    if (toggleActionId) {
      const act = incident.responseActions.find(a => a.id === toggleActionId);
      if (act) {
        act.completed = !act.completed;
        act.completedAt = act.completed ? new Date().toISOString() : undefined;
        incident.timeline.unshift({
          id: `EV-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: 'SOC Analyst',
          action: 'Playbook Action Updated',
          details: `${act.action} -> ${act.completed ? 'COMPLETED' : 'PENDING'}`
        });
      }
    }

    res.json({ success: true, incident });
  });

  // 6. Analytics API
  app.get('/api/analytics', (req, res) => {
    const timeRange = req.query.range || '7d';

    // Generate trend timelines
    const trafficTrends = [
      { time: '00:00', packets: 4200, bandwidth: 48, threats: 2 },
      { time: '04:00', packets: 2100, bandwidth: 22, threats: 1 },
      { time: '08:00', packets: 9800, bandwidth: 110, threats: 5 },
      { time: '12:00', packets: 14200, bandwidth: 165, threats: 9 },
      { time: '16:00', packets: 18900, bandwidth: 210, threats: 14 },
      { time: '20:00', packets: 11500, bandwidth: 135, threats: 6 },
      { time: '23:59', packets: 6400, bandwidth: 72, threats: 3 },
    ];

    const attackVectorTrends = [
      { attack: 'Port Scanning', count: 48, percentage: 32 },
      { attack: 'Brute Force', count: 34, percentage: 22 },
      { attack: 'DDoS', count: 24, percentage: 16 },
      { attack: 'Suspicious DNS', count: 20, percentage: 13 },
      { attack: 'Malware Traffic', count: 14, percentage: 9 },
      { attack: 'Data Exfiltration', count: 12, percentage: 8 },
    ];

    const targetedPorts = [
      { port: 22, service: 'SSH', count: 340, attacks: 85 },
      { port: 80, service: 'HTTP', count: 820, attacks: 64 },
      { port: 443, service: 'HTTPS', count: 1450, attacks: 42 },
      { port: 53, service: 'DNS', count: 290, attacks: 38 },
      { port: 8080, service: 'HTTP-Alt', count: 190, attacks: 26 },
      { port: 3389, service: 'RDP', count: 140, attacks: 22 },
    ];

    res.json({
      success: true,
      timeRange,
      trafficTrends,
      attackVectorTrends,
      targetedPorts,
      topAttackingIps: [
        { ip: '198.51.100.24', count: 14, country: 'Russia', blocked: db.blocked_ips.has('198.51.100.24') },
        { ip: '185.220.101.5', count: 12, country: 'Germany', blocked: db.blocked_ips.has('185.220.101.5') },
        { ip: '203.0.113.77', count: 9, country: 'Romania', blocked: db.blocked_ips.has('203.0.113.77') },
        { ip: '45.33.32.156', count: 7, country: 'United States', blocked: db.blocked_ips.has('45.33.32.156') },
      ]
    });
  });

  // 7. Reports API
  app.get('/api/reports', (req, res) => {
    res.json({ success: true, reports: db.reports });
  });

  app.post('/api/reports', (req, res) => {
    const { period = 'Last 24 Hours' } = req.body;
    const newReport = {
      id: `REP-${Date.now().toString().slice(-6)}`,
      generatedAt: new Date().toISOString(),
      period,
      totalPackets: db.getDashboardKPIs().totalPackets,
      threatsIdentified: db.threats.length + 18,
      alertsGenerated: db.alerts.length,
      incidentsResolved: db.incidents.filter(i => i.status === 'Resolved' || i.status === 'Closed').length,
      topAttackerIp: '198.51.100.24',
      mostTargetedPort: 22,
      executiveSummary: `SOC Intelligence Report covering ${period}: Scanned network traffic across all sensor taps. Detected ${db.threats.length + 18} distinct anomalous flow signatures. High-confidence mitigation protocols contained active probes with zero confirmed data breaches.`,
    };
    db.reports.unshift(newReport);
    res.status(201).json({ success: true, report: newReport });
  });

  // 8. Attack Simulation API
  app.post('/api/simulate-attack', (req, res) => {
    const { type = 'Port Scanning' } = req.body;
    const result = db.simulateAttack(type as ThreatType);

    broadcastSSE('alert', result.alert);
    broadcastSSE('security_event', {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: result.alert.severity,
      message: `[SIMULATED] ${type} attack launched`,
      sourceIp: result.alert.srcIp,
      threatType: type,
    });

    res.json({
      success: true,
      message: `Simulated attack ${type} triggered successfully. Check Dashboard and Live Feeds.`,
      result,
    });
  });

  // 9. Firewall IP Block toggle
  app.post('/api/block-ip', (req, res) => {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ error: 'IP required' });

    let isBlocked = false;
    if (db.blocked_ips.has(ip)) {
      db.blocked_ips.delete(ip);
      isBlocked = false;
    } else {
      db.blocked_ips.add(ip);
      isBlocked = true;
    }

    res.json({
      success: true,
      ip,
      isBlocked,
      totalBlocked: db.blocked_ips.size,
    });
  });

  // 10. System Settings & Health Status API
  app.get('/api/system/settings', (req, res) => {
    res.json({ success: true, settings: db.settings });
  });

  app.post('/api/system/settings', (req, res) => {
    db.settings = { ...db.settings, ...req.body };
    res.json({ success: true, settings: db.settings });
  });

  app.get('/api/system/status', (req, res) => {
    res.json({
      success: true,
      services: {
        backend: { name: 'Node.js Express REST API', status: 'Online', uptime: '99.99%', latency: '2ms' },
        database: { name: 'MongoDB In-Memory Document Store', status: 'Online', collections: 8, docsCount: db.packets.length + db.alerts.length + db.incidents.length },
        mlService: { name: 'Python FastAPI ML Engine (XGBoost)', status: db.settings.mlModelStatus, confidence: '96.8%', model: 'IntrusionDetector-v2.4' },
        packetAnalyzer: { name: 'Scapy/PyShark Packet Dissector', status: db.settings.packetCaptureActive ? 'Capturing' : 'Idle', parsedPackets: db.packets.length },
        websocket: { name: 'Real-Time SSE Event Stream', status: 'Active', activeSubscribers: sseClients.size },
      }
    });
  });

  // 11. Real-Time Server-Sent Events (SSE) stream endpoint
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);

    // Initial hello handshake
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // -------------------------------------------------------------
  // Vite Integration (dev / prod static files)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use('/Smart-Network-Security-Operations-Centre-SOC', express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Network SOC Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
