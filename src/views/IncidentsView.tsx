import React, { useState, useEffect } from 'react';
import { IncidentRecord, IncidentStatus, SeverityLevel } from '../types/soc';
import { api } from '../services/api';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  FileCheck,
  ShieldBan,
  ArrowRight,
  ListOrdered,
  Layers,
  Sparkles,
  MessageSquare,
  Lock
} from 'lucide-react';

interface IncidentsViewProps {
  onOpenCreateIncident: () => void;
  onBlockIp: (ip: string) => void;
}

const LIFECYCLE_STAGES: IncidentStatus[] = [
  'Open',
  'Investigating',
  'Contained',
  'Resolved',
  'Closed'
];

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  onOpenCreateIncident,
  onBlockIp,
}) => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [resolutionText, setResolutionText] = useState('');

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getIncidents();
      setIncidents(res.incidents);
      if (res.incidents.length > 0 && !selectedIncident) {
        setSelectedIncident(res.incidents[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleUpdateStatus = async (status: IncidentStatus) => {
    if (!selectedIncident) return;
    try {
      const res = await api.updateIncident(selectedIncident.id, { status });
      if (res && res.incident) {
        setIncidents(prev => prev.map(i => (i.id === selectedIncident.id ? res.incident : i)));
        setSelectedIncident(res.incident);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAction = async (actionId: string) => {
    if (!selectedIncident) return;
    try {
      const res = await api.updateIncident(selectedIncident.id, { toggleActionId: actionId });
      if (res && res.incident) {
        setIncidents(prev => prev.map(i => (i.id === selectedIncident.id ? res.incident : i)));
        setSelectedIncident(res.incident);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async () => {
    if (!selectedIncident || !newNote.trim()) return;
    try {
      const res = await api.updateIncident(selectedIncident.id, { note: newNote.trim() });
      if (res && res.incident) {
        setIncidents(prev => prev.map(i => (i.id === selectedIncident.id ? res.incident : i)));
        setSelectedIncident(res.incident);
        setNewNote('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveResolution = async () => {
    if (!selectedIncident || !resolutionText.trim()) return;
    try {
      const res = await api.updateIncident(selectedIncident.id, {
        resolution: resolutionText.trim(),
        status: 'Resolved'
      });
      if (res && res.incident) {
        setIncidents(prev => prev.map(i => (i.id === selectedIncident.id ? res.incident : i)));
        setSelectedIncident(res.incident);
        setResolutionText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Workflow Header Banner */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            Security Incident Response Framework
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Standardized NIST/SANS Incident Response Playbooks & Containment Workflows
          </p>
        </div>
        <button
          onClick={onOpenCreateIncident}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Security Incident</span>
        </button>
      </div>

      {/* Incident Kanban / Lifecycle Stage Status Indicator */}
      {selectedIncident && (
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Active Incident Progression ({selectedIncident.id}):
          </span>

          <div className="grid grid-cols-5 gap-2">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const currentIdx = LIFECYCLE_STAGES.indexOf(selectedIncident.status);
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={stage}
                  onClick={() => handleUpdateStatus(stage)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isCurrent
                      ? 'bg-red-950/80 border-red-600/80 ring-1 ring-red-500 shadow-md'
                      : isPast
                      ? 'bg-slate-950 border-slate-700/60 text-slate-400'
                      : 'bg-slate-950/40 border-slate-800 text-slate-600 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-400">Phase 0{idx + 1}</span>
                    {isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    ) : isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : null}
                  </div>
                  <span className={`text-xs font-bold block ${isCurrent ? 'text-red-300' : 'text-slate-200'}`}>
                    {stage}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Split: Incidents Master List & Deep Dive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List (1 Col) */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Incident Registry ({incidents.length})
            </h4>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold font-mono text-cyan-300">{inc.id}</span>
                    <SeverityBadge severity={inc.severity} size="sm" />
                  </div>
                  <h5 className="text-xs font-semibold text-slate-100 line-clamp-1">{inc.title}</h5>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{inc.description}</p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
                    <span>{new Date(inc.detectedTime).toLocaleDateString()}</span>
                    <StatusBadge status={inc.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident Workspace: Details, Evidence, Playbooks, Timeline (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-6">
          {selectedIncident ? (
            <>
              {/* Header Title */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-800/50">
                      {selectedIncident.id}
                    </span>
                    <SeverityBadge severity={selectedIncident.severity} />
                    <StatusBadge status={selectedIncident.status} />
                  </div>
                  <h2 className="text-base font-bold text-slate-100">{selectedIncident.title}</h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Source: {selectedIncident.source} • Detected: {new Date(selectedIncident.detectedTime).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedIncident.evidence.find(e => e.type === 'IP') && (
                    <button
                      onClick={() => onBlockIp(selectedIncident.evidence.find(e => e.type === 'IP')!.value)}
                      className="px-3 py-1.5 rounded bg-rose-950 hover:bg-rose-900 border border-rose-700/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Block Host on Edge</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                {selectedIncident.description}
              </div>

              {/* Evidence Locker */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono block">
                  Evidence Locker ({selectedIncident.evidence.length} Artifacts):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedIncident.evidence.map((ev, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono">
                      <span className="text-[10px] text-cyan-400 uppercase font-bold block">{ev.type} Artifact</span>
                      <span className="text-rose-300 font-bold text-xs mt-0.5 block truncate">{ev.value}</span>
                      <span className="text-[10px] text-slate-500 block truncate mt-0.5">{ev.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Playbook Checklist */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono block">
                  Incident Response Playbook & Action Matrix:
                </span>
                <div className="space-y-2">
                  {selectedIncident.responseActions.map((action) => (
                    <div
                      key={action.id}
                      onClick={() => handleToggleAction(action.id)}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                        action.completed
                          ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <input
                          type="checkbox"
                          checked={action.completed}
                          onChange={() => {}} // handled by parent onClick
                          className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                        />
                        <span className={action.completed ? 'line-through text-slate-400' : 'text-slate-200 font-medium'}>
                          {action.action}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {action.completed ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incident Timeline */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono block">
                  Investigation Audit Timeline:
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedIncident.timeline.map((event) => (
                    <div
                      key={event.id}
                      className="p-2.5 rounded bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-xs font-mono"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <strong className="text-slate-200">{event.action}</strong>
                          <span className="text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] font-sans">{event.details}</p>
                        <span className="text-[10px] text-cyan-400">By: {event.user}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Note & Resolution Section */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Append investigation notes to audit trail..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    Log Note
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-slate-500 font-mono text-xs">
              Select an incident from the registry to open the response workspace
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
