import React, { useState, useEffect } from 'react';
import { AlertRecord, SeverityLevel, AlertStatus, ThreatType } from '../types/soc';
import { api } from '../services/api';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  BellRing,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  PlusCircle,
  Clock,
  RefreshCw,
  MessageSquare,
  Flame,
  ArrowRight
} from 'lucide-react';

interface AlertsViewProps {
  onOpenCreateIncident: (alert: AlertRecord) => void;
  onOpenSimulation: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  onOpenCreateIncident,
  onOpenSimulation,
}) => {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState('');

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAlerts({
        severity: severityFilter,
        status: statusFilter,
        search: searchQuery,
      });
      setAlerts(res.alerts);
      if (res.alerts.length > 0 && !selectedAlert) {
        setSelectedAlert(res.alerts[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, statusFilter]);

  // Update alert status
  const handleUpdateStatus = async (id: string, newStatus: AlertStatus) => {
    try {
      const res = await api.updateAlert(id, { status: newStatus });
      if (res && res.alert) {
        setAlerts(prev => prev.map(a => (a.id === id ? res.alert : a)));
        if (selectedAlert?.id === id) setSelectedAlert(res.alert);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update alert severity
  const handleUpdateSeverity = async (id: string, newSeverity: SeverityLevel) => {
    try {
      const res = await api.updateAlert(id, { severity: newSeverity });
      if (res && res.alert) {
        setAlerts(prev => prev.map(a => (a.id === id ? res.alert : a)));
        if (selectedAlert?.id === id) setSelectedAlert(res.alert);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add investigation note
  const handleAddNote = async () => {
    if (!selectedAlert || !newNote.trim()) return;
    try {
      const res = await api.updateAlert(selectedAlert.id, { note: newNote.trim() });
      if (res && res.alert) {
        setAlerts(prev => prev.map(a => (a.id === selectedAlert.id ? res.alert : a)));
        setSelectedAlert(res.alert);
        setNewNote('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const criticalCount = alerts.filter(a => a.severity === 'Critical' && a.status !== 'Resolved').length;
  const newCount = alerts.filter(a => a.status === 'New').length;
  const investigatingCount = alerts.filter(a => a.status === 'Investigating').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Alert Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Alerts</span>
            <span className="text-xl font-bold text-slate-100 font-mono mt-0.5 block">{alerts.length}</span>
          </div>
          <BellRing className="w-5 h-5 text-cyan-400" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">New & Untriaged</span>
            <span className="text-xl font-bold text-rose-400 font-mono mt-0.5 block">{newCount}</span>
          </div>
          <AlertCircle className="w-5 h-5 text-rose-400" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Active Investigations</span>
            <span className="text-xl font-bold text-amber-400 font-mono mt-0.5 block">{investigatingCount}</span>
          </div>
          <Clock className="w-5 h-5 text-amber-400" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Critical Alerts</span>
            <span className="text-xl font-bold text-red-500 font-mono mt-0.5 block">{criticalCount}</span>
          </div>
          <Flame className="w-5 h-5 text-red-500" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>Filter Alerts:</span>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Investigating">Investigating</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Resolved">Resolved</option>
            <option value="False Positive">False Positive</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search alert, IP, threat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadAlerts()}
              className="pl-7 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
          </div>
          <button
            onClick={loadAlerts}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Alert List (Left) & Alert Detail Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Table (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between mb-3 text-xs">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider">Alert Queue</h4>
            <span className="font-mono text-slate-400">{alerts.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                  <th className="py-2.5 px-3">Alert ID</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Threat</th>
                  <th className="py-2.5 px-3">Source ➔ Target</th>
                  <th className="py-2.5 px-3 text-center">Severity</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No alerts match current filter criteria
                    </td>
                  </tr>
                ) : (
                  alerts.map((alt) => (
                    <tr
                      key={alt.id}
                      onClick={() => setSelectedAlert(alt)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        selectedAlert?.id === alt.id ? 'bg-cyan-950/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-cyan-400 font-bold">{alt.id}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(alt.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{alt.threatType}</td>
                      <td className="py-2.5 px-3 text-slate-300 truncate max-w-[150px]">
                        {alt.srcIp} ➔ {alt.dstIp}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <SeverityBadge severity={alt.severity} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={alt.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAlert(alt);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Alert Details & Action Panel (1 Col) */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          {selectedAlert ? (
            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">{selectedAlert.id}</h3>
                  <span className="text-[11px] text-slate-400">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </span>
                </div>
                <SeverityBadge severity={selectedAlert.severity} />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Threat Details</span>
                <p className="text-slate-300 leading-relaxed font-sans text-xs bg-slate-950 p-2.5 rounded border border-slate-800">
                  {selectedAlert.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-3 rounded border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Source IP:</span>
                  <span className="text-rose-400 font-bold">{selectedAlert.srcIp}:{selectedAlert.srcPort}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Destination IP:</span>
                  <span className="text-cyan-400 font-bold">{selectedAlert.dstIp}:{selectedAlert.dstPort}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Protocol:</span>
                  <span className="text-slate-200">{selectedAlert.protocol}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ML Confidence:</span>
                  <span className="text-emerald-400 font-bold">{(selectedAlert.mlConfidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Triage Actions</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'Acknowledged')}
                    className="px-2.5 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 text-[11px] font-semibold transition-colors"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'Investigating')}
                    className="px-2.5 py-1.5 rounded bg-amber-950 hover:bg-amber-900 border border-amber-700/50 text-amber-300 text-[11px] font-semibold transition-colors"
                  >
                    Set Investigating
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'Resolved')}
                    className="px-2.5 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-[11px] font-semibold transition-colors"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'False Positive')}
                    className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-400 text-[11px] transition-colors"
                  >
                    False Positive
                  </button>
                </div>
              </div>

              {/* Promote to Incident Button */}
              <button
                onClick={() => onOpenCreateIncident(selectedAlert)}
                className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-950/40 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Promote to Incident Response</span>
              </button>

              {/* Notes Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Analyst Notes</span>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {selectedAlert.notes && selectedAlert.notes.length > 0 ? (
                    selectedAlert.notes.map((note, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-slate-950 text-[11px] text-slate-300 border border-slate-800/80">
                        {note}
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-500 text-[11px]">No notes logged yet.</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add triage note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    className="flex-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 font-mono text-xs">
              Select an alert from the queue to view triage controls
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
