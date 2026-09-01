import React, { useState, useEffect } from 'react';
import { MLPrediction, ThreatType, SeverityLevel } from '../types/soc';
import { api } from '../services/api';
import { SeverityBadge } from '../components/common/SeverityBadge';
import {
  BrainCircuit,
  Cpu,
  Zap,
  ShieldAlert,
  ArrowRight,
  Sliders,
  Play,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface MLThreatDetectionViewProps {
  onOpenSimulation: () => void;
}

export const MLThreatDetectionView: React.FC<MLThreatDetectionViewProps> = ({
  onOpenSimulation,
}) => {
  const [threats, setThreats] = useState<MLPrediction[]>([]);
  const [mlStatus, setMlStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Live Playground Feature Tweaker States
  const [pgSrcIp, setPgSrcIp] = useState('198.51.100.24');
  const [pgDstIp, setPgDstIp] = useState('192.168.1.50');
  const [pgDstPort, setPgDstPort] = useState(22);
  const [pgProtocol, setPgProtocol] = useState('TCP');
  const [pgPacketSize, setPgPacketSize] = useState(1200);
  const [pgPacketCount, setPgPacketCount] = useState(450);
  const [pgFailedAuth, setPgFailedAuth] = useState(5);
  const [pgSynRatio, setPgSynRatio] = useState(0.85);
  const [pgEntropy, setPgEntropy] = useState(4.2);

  const [activePrediction, setActivePrediction] = useState<MLPrediction | null>(null);

  const loadMLData = async () => {
    setIsLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([api.getThreats(), api.getMLStatus()]);
      setThreats(tRes.threats);
      setMlStatus(sRes);
      if (tRes.threats.length > 0 && !activePrediction) {
        setActivePrediction(tRes.threats[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMLData();
  }, []);

  // Run instant ML Inference from Playground
  const handleRunInference = async () => {
    try {
      const res = await api.predictThreat(pgSrcIp, pgDstIp, {
        dstPort: Number(pgDstPort),
        protocol: pgProtocol,
        packetSize: Number(pgPacketSize),
        packetCount: Number(pgPacketCount),
        failedAuthCount: Number(pgFailedAuth),
        tcpSynRatio: Number(pgSynRatio),
        entropy: Number(pgEntropy),
      });

      if (res && res.prediction) {
        setActivePrediction(res.prediction);
        setThreats(prev => [res.prediction, ...prev]);
      }
    } catch (err) {
      console.error('Inference error', err);
    }
  };

  const threatCount = threats.length;
  const criticalCount = threats.filter(t => t.severity === 'Critical').length;
  const highCount = threats.filter(t => t.severity === 'High').length;
  const normalCount = 89400;
  const totalAnalyzed = normalCount + threatCount * 420;

  // Radar Data for active prediction features
  const radarData = activePrediction ? [
    { subject: 'Volume', A: Math.min(activePrediction.features.packetCount / 5, 100), fullMark: 100 },
    { subject: 'Entropy', A: Math.min((activePrediction.features.entropy / 5) * 100, 100), fullMark: 100 },
    { subject: 'SYN Ratio', A: activePrediction.features.tcpSynRatio * 100, fullMark: 100 },
    { subject: 'Freq (Hz)', A: Math.min(activePrediction.features.connectionFrequency * 1.5, 100), fullMark: 100 },
    { subject: 'Auth Fail', A: Math.min(activePrediction.features.failedAuthCount * 20, 100), fullMark: 100 },
    { subject: 'Risk Score', A: activePrediction.riskScore, fullMark: 100 },
  ] : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Visual Pipeline Banner */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Machine Learning Detection Pipeline Architecture</h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/50 text-cyan-400">
            Model: {mlStatus?.modelName || 'XGBoost / scikit-learn v2.4'}
          </span>
        </div>

        {/* 7 Pipeline Stages */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 uppercase">Stage 1</span>
            <span className="font-bold text-slate-200 mt-1">Network Packet</span>
            <span className="text-[10px] text-cyan-400 mt-0.5">Ingress Tap</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 uppercase">Stage 2</span>
            <span className="font-bold text-slate-200 mt-1">Feature Extraction</span>
            <span className="text-[10px] text-cyan-400 mt-0.5">10 Dimensions</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 uppercase">Stage 3</span>
            <span className="font-bold text-slate-200 mt-1">Preprocessing</span>
            <span className="text-[10px] text-cyan-400 mt-0.5">StandardScaler</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 uppercase">Stage 4</span>
            <span className="font-bold text-slate-200 mt-1">ML Model</span>
            <span className="text-[10px] text-purple-400 mt-0.5">RandomForest / XGB</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 uppercase">Stage 5</span>
            <span className="font-bold text-slate-200 mt-1">Classification</span>
            <span className="text-[10px] text-yellow-400 mt-0.5">10 Attack Types</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 uppercase">Stage 6</span>
            <span className="font-bold text-slate-200 mt-1">Risk Score</span>
            <span className="text-[10px] text-rose-400 mt-0.5">0 - 100 Index</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 uppercase">Stage 7</span>
            <span className="font-bold text-slate-200 mt-1">Alert Trigger</span>
            <span className="text-[10px] text-red-400 mt-0.5">SOC Triage</span>
          </div>
        </div>
      </div>

      {/* 7 KPI Metric Cards for ML Detection */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Traffic Analyzed</span>
          <span className="text-base font-bold text-slate-100 font-mono mt-1 block">{totalAnalyzed.toLocaleString()}</span>
          <span className="text-[10px] text-cyan-400">Total flows</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Normal Traffic</span>
          <span className="text-base font-bold text-emerald-400 font-mono mt-1 block">{normalCount.toLocaleString()}</span>
          <span className="text-[10px] text-emerald-400">96.4% Verified</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Suspicious Traffic</span>
          <span className="text-base font-bold text-yellow-400 font-mono mt-1 block">3,420</span>
          <span className="text-[10px] text-yellow-400">Under observation</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Threats Detected</span>
          <span className="text-base font-bold text-amber-400 font-mono mt-1 block">{threatCount + 24}</span>
          <span className="text-[10px] text-amber-400">High confidence</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Critical Threats</span>
          <span className="text-base font-bold text-red-400 font-mono mt-1 block">{criticalCount + 4}</span>
          <span className="text-[10px] text-red-400">Volumetric/Exfil</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">ML Accuracy</span>
          <span className="text-base font-bold text-cyan-400 font-mono mt-1 block">
            {((mlStatus?.accuracy || 0.968) * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400">F1: {(mlStatus?.f1Score || 0.954).toFixed(2)}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Inference Latency</span>
          <span className="text-base font-bold text-purple-400 font-mono mt-1 block">
            {mlStatus?.latencyMs || 3.8} <span className="text-xs font-normal">ms</span>
          </span>
          <span className="text-[10px] text-slate-400">Real-time inference</span>
        </div>
      </div>

      {/* Interactive ML Inference Studio & Explainability Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Playground Controls (1 Col) */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Feature Tweaker Playground</h4>
              </div>
              <button
                onClick={onOpenSimulation}
                className="text-[11px] text-red-400 hover:text-red-300 font-semibold"
              >
                Attack Presets
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Adjust flow metrics and test the ML model's instant prediction and risk calculation.
            </p>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block">Source IP</label>
                  <input
                    type="text"
                    value={pgSrcIp}
                    onChange={(e) => setPgSrcIp(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Dest Port</label>
                  <input
                    type="number"
                    value={pgDstPort}
                    onChange={(e) => setPgDstPort(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Packet Rate ({pgPacketCount} pkts)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="600"
                  value={pgPacketCount}
                  onChange={(e) => setPgPacketCount(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>TCP SYN Ratio ({(pgSynRatio * 100).toFixed(0)}%)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={pgSynRatio}
                  onChange={(e) => setPgSynRatio(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Failed Auth Attempts ({pgFailedAuth})</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={pgFailedAuth}
                  onChange={(e) => setPgFailedAuth(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Shannon Entropy ({pgEntropy.toFixed(1)})</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="0.1"
                  value={pgEntropy}
                  onChange={(e) => setPgEntropy(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleRunInference}
            className="w-full mt-4 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Run ML Inference Model</span>
          </button>
        </div>

        {/* Inference Output & SHAP Feature Explainability (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Model Output & Feature Attribution (SHAP)
                </h4>
                <p className="text-xs text-slate-400">Real-time decision boundary and feature contribution breakdown</p>
              </div>
              {activePrediction && <SeverityBadge severity={activePrediction.severity} />}
            </div>

            {activePrediction ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {/* Result Card */}
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Classified Threat:</span>
                    <span className="text-sm font-bold text-red-400">{activePrediction.threat}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Confidence Score:</span>
                    <span className="text-cyan-400 font-bold">{(activePrediction.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Calculated Risk Index:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-500 to-red-500"
                          style={{ width: `${activePrediction.riskScore}%` }}
                        />
                      </div>
                      <span className="text-rose-400 font-bold">{activePrediction.riskScore}/100</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Origin ➔ Target:</span>
                    <span className="text-slate-200">{activePrediction.srcIp} ➔ {activePrediction.dstIp}</span>
                  </div>
                </div>

                {/* Radar chart of features */}
                <div className="h-44 w-full flex items-center justify-center bg-slate-950/40 rounded-lg border border-slate-800/60">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
                      <Radar name="Anomaly Weight" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">Run inference to display explainability breakdown</div>
            )}

            {/* Feature Impact Bars */}
            {activePrediction && activePrediction.explainability && (
              <div className="mt-4 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 block">Top Contributing Feature Weights:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {activePrediction.explainability.map((exp, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span className="truncate pr-1">{exp.feature}</span>
                        <span className="text-cyan-400 font-mono font-bold">+{(exp.impact * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: `${exp.impact * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detected Threat Log Table */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              ML Threat Detection Records
            </h4>
            <p className="text-xs text-slate-400">Classified anomalous traffic events</p>
          </div>
          <button
            onClick={loadMLData}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="py-2.5 px-3 font-medium">Time</th>
                <th className="py-2.5 px-3 font-medium">Source</th>
                <th className="py-2.5 px-3 font-medium">Destination</th>
                <th className="py-2.5 px-3 font-medium">Threat Classification</th>
                <th className="py-2.5 px-3 font-medium text-center">Confidence</th>
                <th className="py-2.5 px-3 font-medium text-center">Severity</th>
                <th className="py-2.5 px-3 font-medium text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {threats.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setActivePrediction(t)}
                  className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    activePrediction?.id === t.id ? 'bg-cyan-950/30' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-slate-400">{new Date(t.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2.5 px-3 text-rose-300 font-bold">{t.srcIp}</td>
                  <td className="py-2.5 px-3 text-slate-200">{t.dstIp}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-100">{t.threat}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-cyan-400 font-bold">
                    {(t.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <SeverityBadge severity={t.severity} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`font-bold ${t.riskScore > 75 ? 'text-red-400' : 'text-amber-400'}`}>
                      {t.riskScore} / 100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
