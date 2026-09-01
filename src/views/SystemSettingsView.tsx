import React, { useState } from 'react';
import {
  Sliders,
  Cpu,
  HardDrive,
  Activity,
  ShieldCheck,
  Bell,
  RefreshCw,
  Server,
  Zap,
  Save,
  CheckCircle2,
  Database,
  Radio
} from 'lucide-react';

export const SystemSettingsView: React.FC = () => {
  // Network monitoring state
  const [packetCaptureEnabled, setPacketCaptureEnabled] = useState(true);
  const [networkInterface, setNetworkInterface] = useState('eth0');
  const [bufferSize, setBufferSize] = useState(256);
  const [refreshInterval, setRefreshInterval] = useState('1s');

  // ML Settings state
  const [selectedModel, setSelectedModel] = useState('xgboost');
  const [sensitivity, setSensitivity] = useState('High');
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [autoRetrain, setAutoRetrain] = useState(true);

  // Alert Settings state
  const [alertThreshold, setAlertThreshold] = useState('Medium+');
  const [autoCreateIncidents, setAutoCreateIncidents] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://soc-webhook.internal/v1/alerts');
  const [soundAlerts, setSoundAlerts] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header & Save */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            SOC System Configuration & Sensor Parameters
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tune real-time capture taps, ML inference weights, triage heuristics, and infrastructure thresholds
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Parameters</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>System configuration updated and propagated to ingress sensor daemons.</span>
        </div>
      )}

      {/* System Health Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-mono">SOC Uptime</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-base font-bold text-emerald-400 font-mono">99.98%</span>
          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">14d 08h 32m</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-mono">Sensor CPU</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-base font-bold text-cyan-400 font-mono">18.4%</span>
          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">4 Cores Active</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-mono">Buffer Memory</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-base font-bold text-purple-400 font-mono">1.2 / 4 GB</span>
          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">30% Allocated</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-mono">DB Records</span>
            <Database className="w-4 h-4 text-yellow-400" />
          </div>
          <span className="text-base font-bold text-yellow-400 font-mono">1,248,000</span>
          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">In-Memory Engine</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Network Monitoring Settings */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Network Tap & Capture Settings
            </h4>
          </div>

          <div className="space-y-3 text-xs font-mono">
            {/* Packet Capture Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
              <div>
                <span className="text-slate-200 font-bold block">Live Promiscuous Tap</span>
                <span className="text-[10px] text-slate-400">Capture raw layer 2-4 ingress frames</span>
              </div>
              <button
                onClick={() => setPacketCaptureEnabled(!packetCaptureEnabled)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  packetCaptureEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {packetCaptureEnabled ? 'ENABLED' : 'PAUSED'}
              </button>
            </div>

            {/* Network Interface */}
            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">Active Network Interface</label>
              <select
                value={networkInterface}
                onChange={(e) => setNetworkInterface(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="eth0">eth0 - Primary Gigabit Ingress (192.168.1.10)</option>
                <option value="eth1">eth1 - Secondary DMZ Span Port</option>
                <option value="wlan0">wlan0 - Wireless Monitor Interface</option>
                <option value="any">any - Pseudo-device that captures on all interfaces</option>
              </select>
            </div>

            {/* Capture Buffer Size */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1 text-[11px]">
                <span>Ring Buffer Size:</span>
                <span className="text-cyan-400 font-bold">{bufferSize} MB</span>
              </div>
              <input
                type="range"
                min="64"
                max="1024"
                step="64"
                value={bufferSize}
                onChange={(e) => setBufferSize(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Polling Interval */}
            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">Telemetry Sample Rate</label>
              <div className="grid grid-cols-4 gap-2">
                {['500ms', '1s', '2s', '5s'].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setRefreshInterval(rate)}
                    className={`py-1.5 rounded text-xs transition-colors ${
                      refreshInterval === rate
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {rate}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Machine Learning Model Settings */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              ML Inference & Decision Boundaries
            </h4>
          </div>

          <div className="space-y-3 text-xs font-mono">
            {/* Model Architecture */}
            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">Active Classifier Engine</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="xgboost">XGBoost Classifier (Recommended - 96.8% Acc)</option>
                <option value="random_forest">Random Forest Ensemble (100 Trees)</option>
                <option value="svm">Support Vector Machine (RBF Kernel)</option>
                <option value="neural_net">Deep Feedforward Neural Network (128-64-32)</option>
              </select>
            </div>

            {/* Sensitivity */}
            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">Anomaly Sensitivity Bias</label>
              <div className="grid grid-cols-4 gap-2">
                {['Low', 'Medium', 'High', 'Paranoid'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSensitivity(lvl)}
                    className={`py-1.5 rounded text-xs transition-colors ${
                      sensitivity === lvl
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence Threshold */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1 text-[11px]">
                <span>Minimum Alert Confidence Cutoff:</span>
                <span className="text-purple-400 font-bold">{confidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Auto-Retrain Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
              <div>
                <span className="text-slate-200 font-bold block">Online Adaptive Retraining</span>
                <span className="text-[10px] text-slate-400">Update decision weights with verified traffic</span>
              </div>
              <button
                onClick={() => setAutoRetrain(!autoRetrain)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  autoRetrain ? 'bg-purple-950 text-purple-400 border border-purple-700' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {autoRetrain ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Escalation & Notification Settings */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Bell className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Alert Escalation & SIEM Webhook Integration
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">Auto-Triage Minimum Severity</label>
            <select
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
            >
              <option value="All">All Events (Informational & Above)</option>
              <option value="Medium+">Medium and Above</option>
              <option value="High+">High and Critical Only</option>
              <option value="Critical">Critical Only</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">SIEM Ingestion Webhook URL</label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-800 text-xs font-mono">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={autoCreateIncidents}
              onChange={(e) => setAutoCreateIncidents(e.target.checked)}
              className="w-4 h-4 rounded accent-cyan-500"
            />
            <span>Auto-escalate Critical alerts to Incidents</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={soundAlerts}
              onChange={(e) => setSoundAlerts(e.target.checked)}
              className="w-4 h-4 rounded accent-cyan-500"
            />
            <span>Audible DEFCON chime on Critical threat detection</span>
          </label>
        </div>
      </div>
    </div>
  );
};
