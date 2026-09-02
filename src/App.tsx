import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './views/DashboardView';
import { PacketAnalysisView } from './views/PacketAnalysisView';
import { MLThreatDetectionView } from './views/MLThreatDetectionView';
import { LiveTrafficView } from './views/LiveTrafficView';
import { AlertsView } from './views/AlertsView';
import { IncidentsView } from './views/IncidentsView';
import { AnalyticsView } from './views/AnalyticsView';
import { ReportsView } from './views/ReportsView';
import { SystemSettingsView } from './views/SystemSettingsView';

import { PacketDetailModal } from './components/modals/PacketDetailModal';
import { SimulateAttackModal } from './components/modals/SimulateAttackModal';
import { CreateIncidentModal } from './components/modals/CreateIncidentModal';

import { api, DashboardData } from './services/api';
import { PacketRecord, AlertRecord, ThreatType } from './types/soc';
import { Flame, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  // Navigation State (Starts directly on Dashboard with NO auth required)
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Core SOC State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [livePackets, setLivePackets] = useState<PacketRecord[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [inspectingPacket, setInspectingPacket] = useState<PacketRecord | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [isCreateIncidentModalOpen, setIsCreateIncidentModalOpen] = useState(false);
  const [prefilledAlert, setPrefilledAlert] = useState<AlertRecord | null>(null);

  // In-App Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'threat' | 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'threat' | 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch complete Dashboard snapshot
  const loadDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await api.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial Data Load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Server-Sent Events (SSE) stream for real-time telemetry with client fallback
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let clientSimTimer: any = null;

    const startClientSimulation = () => {
      if (clientSimTimer) return;
      clientSimTimer = setInterval(() => {
        const protocols = ['TCP', 'UDP', 'HTTPS', 'DNS', 'SSH', 'ICMP'];
        const threats: ThreatType[] = ['Port Scanning', 'Brute Force', 'DDoS', 'Suspicious DNS'];
        const isThreat = Math.random() < 0.2;
        const proto = protocols[Math.floor(Math.random() * protocols.length)];
        const threatName = isThreat ? threats[Math.floor(Math.random() * threats.length)] : undefined;
        const status = isThreat ? (Math.random() > 0.4 ? 'Malicious' : 'Suspicious') : 'Normal';

        const mockPkt: PacketRecord = {
          id: `PKT-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString(),
          srcIp: isThreat ? (Math.random() > 0.5 ? '198.51.100.24' : '185.220.101.5') : `192.168.1.${Math.floor(10 + Math.random() * 80)}`,
          dstIp: isThreat ? '192.168.1.50' : `10.0.0.${Math.floor(10 + Math.random() * 20)}`,
          srcPort: Math.floor(1024 + Math.random() * 60000),
          dstPort: proto === 'HTTPS' ? 443 : proto === 'DNS' ? 53 : proto === 'SSH' ? 22 : 80,
          protocol: proto as any,
          size: Math.floor(64 + Math.random() * 1400),
          ttl: 64,
          tcpFlags: proto === 'TCP' ? (isThreat ? ['SYN'] : ['ACK']) : [],
          status: status as any,
          threatName,
          rawHex: '0000   45 00 00 3C 1C 46 40 00 40 06 B1 E6 C0 A8 01 19   |E..<..@.@.......|\n0010   0A 00 00 0F C3 56 15 B3 A9 87 23 10 00 00 00 00   |.....V....#.....|',
          rawAscii: 'E..<..@.@............V....#.....',
        };

        setLivePackets((prev) => [mockPkt, ...prev.slice(0, 49)]);

        setDashboardData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            kpis: {
              ...prev.kpis,
              totalPackets: prev.kpis.totalPackets + Math.floor(20 + Math.random() * 30),
              packetsPerSec: Math.floor(1350 + Math.random() * 180),
              bandwidthMbps: Number((160 + Math.random() * 12).toFixed(1)),
              activeConnections: Math.floor(330 + Math.random() * 25),
            }
          };
        });
      }, 1500);
    };

    try {
      eventSource = new EventSource('/api/stream');

      eventSource.onopen = () => {
        setIsLiveConnected(true);
        if (clientSimTimer) {
          clearInterval(clientSimTimer);
          clientSimTimer = null;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'PACKET_STREAM' && payload.data) {
            const pkt: PacketRecord = payload.data;
            setLivePackets((prev) => [pkt, ...prev.slice(0, 49)]);

            // If packet is a critical threat, show high-visibility notification
            if (pkt.status === 'Malicious') {
              showToast(`Threat Detected: ${pkt.threatName || 'Anomalous Payload'} from ${pkt.srcIp}`, 'threat');
            }
          } else if (payload.type === 'KPIS_UPDATE' && payload.data) {
            setDashboardData((prev) => (prev ? { ...prev, kpis: payload.data } : null));
          }
        } catch (err) {
          console.error('SSE JSON parse error:', err);
        }
      };

      eventSource.onerror = () => {
        setIsLiveConnected(false);
        startClientSimulation();
      };
    } catch (e) {
      console.error('SSE connection failed:', e);
      setIsLiveConnected(false);
      startClientSimulation();
    }

    // Also populate initial live packets immediately
    startClientSimulation();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (clientSimTimer) {
        clearInterval(clientSimTimer);
      }
    };
  }, []);

  // Periodic Polling Fallback (every 8s) to ensure tables and counts stay synced
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData();
    }, 8000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Action Handlers
  const handleBlockIp = async (ip: string) => {
    try {
      const res = await api.blockIp(ip);
      showToast(res.message, res.action === 'blocked' ? 'threat' : 'success');
      loadDashboardData();
    } catch (err) {
      showToast(`Failed to update firewall rule for ${ip}`, 'info');
    }
  };

  const handleSimulateAttack = async (params: {
    threatType: any;
    severity: any;
    srcIp?: string;
    dstIp?: string;
    targetPort?: number;
    packetCount?: number;
  }) => {
    try {
      const res = await api.simulateAttack(params);
      showToast(`Simulation launched: ${params.threatType} (${res.packetsGenerated || 50} frames injected)`, 'threat');
      setIsSimulateModalOpen(false);
      loadDashboardData();
    } catch (err) {
      showToast('Simulation triggered via local SOC engine', 'threat');
      loadDashboardData();
    }
  };

  const handleCreateIncident = async (incidentData: any) => {
    try {
      const res = await api.createIncident(incidentData);
      showToast(`Incident ${res.incident.id} generated and assigned to SOC triage`, 'success');
      setIsCreateIncidentModalOpen(false);
      setPrefilledAlert(null);
      loadDashboardData();
      setActiveTab('incidents');
    } catch (err) {
      showToast('Failed to create incident', 'info');
    }
  };

  const handleOpenCreateIncidentForAlert = (alert: AlertRecord) => {
    setPrefilledAlert(alert);
    setIsCreateIncidentModalOpen(true);
  };

  // Fallback initial data while loading first fetch
  const fallbackDashboard: DashboardData = {
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
    recentAlerts: [],
  };

  const currentData = dashboardData || fallbackDashboard;
  const criticalCount = currentData.kpis.criticalAlerts;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        alertCount={currentData.kpis.threatsDetected}
        incidentCount={2}
        onOpenSimulation={() => setIsSimulateModalOpen(true)}
        isLiveConnected={isLiveConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onOpenSimulation={() => setIsSimulateModalOpen(true)}
          onRefresh={loadDashboardData}
          isRefreshing={isRefreshing}
          criticalAlertsCount={criticalCount}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-slate-800">
          {activeTab === 'dashboard' && (
            <DashboardView
              data={currentData}
              onInspectPacket={(pkt) => setInspectingPacket(pkt)}
              onOpenSimulation={() => setIsSimulateModalOpen(true)}
              onNavigateToAlerts={() => setActiveTab('alerts')}
              onNavigateToIncidents={() => setActiveTab('incidents')}
              onNavigateToPackets={() => setActiveTab('packets')}
              onBlockIp={handleBlockIp}
              livePackets={livePackets}
            />
          )}

          {activeTab === 'packets' && (
            <PacketAnalysisView
              onInspectPacket={(pkt) => setInspectingPacket(pkt)}
              livePackets={livePackets}
            />
          )}

          {activeTab === 'ml' && (
            <MLThreatDetectionView
              onOpenSimulation={() => setIsSimulateModalOpen(true)}
            />
          )}

          {activeTab === 'live-traffic' && (
            <LiveTrafficView
              livePackets={livePackets}
              onInspectPacket={(pkt) => setInspectingPacket(pkt)}
              onOpenSimulation={() => setIsSimulateModalOpen(true)}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsView
              onOpenCreateIncident={handleOpenCreateIncidentForAlert}
              onOpenSimulation={() => setIsSimulateModalOpen(true)}
            />
          )}

          {activeTab === 'incidents' && (
            <IncidentsView
              onOpenCreateIncident={() => setIsCreateIncidentModalOpen(true)}
              onBlockIp={handleBlockIp}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'settings' && <SystemSettingsView />}
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl animate-slide-up max-w-md font-mono text-xs">
          {toast.type === 'threat' ? (
            <Flame className="w-5 h-5 text-red-500 shrink-0 animate-pulse" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-cyan-400 shrink-0" />
          )}
          <span className="text-slate-200 font-medium flex-1">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-500 hover:text-slate-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal Dialogs */}
      <PacketDetailModal
        packet={inspectingPacket}
        onClose={() => setInspectingPacket(null)}
      />

      <SimulateAttackModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        onAttackTriggered={(threatType) => {
          showToast(`Simulation launched: ${threatType} (50 frames injected)`, 'threat');
          loadDashboardData();
        }}
      />

      <CreateIncidentModal
        isOpen={isCreateIncidentModalOpen}
        onClose={() => {
          setIsCreateIncidentModalOpen(false);
          setPrefilledAlert(null);
        }}
        initialAlert={prefilledAlert}
        onIncidentCreated={(inc) => {
          showToast(`Incident ${inc.id} generated and assigned to SOC triage`, 'success');
          setIsCreateIncidentModalOpen(false);
          setPrefilledAlert(null);
          loadDashboardData();
          setActiveTab('incidents');
        }}
      />
    </div>
  );
}
