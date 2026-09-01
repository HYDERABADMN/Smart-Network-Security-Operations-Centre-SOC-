import React, { useState } from 'react';
import { AlertRecord, SeverityLevel, IncidentRecord } from '../../types/soc';
import { api } from '../../services/api';
import { X, ShieldCheck, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAlert?: AlertRecord | null;
  onIncidentCreated: (inc: IncidentRecord) => void;
}

export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isOpen,
  onClose,
  initialAlert,
  onIncidentCreated,
}) => {
  const [title, setTitle] = useState(
    initialAlert ? `Investigate ${initialAlert.threatType} on ${initialAlert.dstIp}` : ''
  );
  const [description, setDescription] = useState(
    initialAlert ? initialAlert.description : ''
  );
  const [severity, setSeverity] = useState<SeverityLevel>(
    initialAlert ? initialAlert.severity : 'High'
  );
  const [source, setSource] = useState('Manual Escalation / SOC Analyst');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.createIncident({
        title,
        description,
        severity,
        source,
        associatedAlerts: initialAlert ? [initialAlert.id] : [],
        evidence: initialAlert
          ? [
              { type: 'IP', value: initialAlert.srcIp, description: 'Attacking host source' },
              { type: 'Port', value: `${initialAlert.dstPort} / ${initialAlert.protocol}`, description: 'Targeted network service' },
            ]
          : [],
        investigationNotes: [
          `Escalated from SOC operations dashboard on ${new Date().toLocaleString()}`
        ]
      });

      if (res && res.incident) {
        onIncidentCreated(res.incident);
      }
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Failed to create incident', err);
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="create-incident-modal"
        className="relative w-full max-w-xl flex flex-col bg-slate-900 border border-slate-700/70 rounded-xl shadow-2xl overflow-hidden text-slate-100"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/60 border border-red-700/40 text-red-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {initialAlert ? 'Promote Alert to Formal Incident' : 'Create Security Incident'}
              </h2>
              <p className="text-xs text-slate-400">
                {initialAlert ? `Linked to Alert ${initialAlert.id}` : 'Log an untracked threat into the incident workflow'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Incident Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Critical Ransomware Lateral Movement Detected"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Critical">Critical (Immediate Containment)</option>
                <option value="High">High (Elevated Risk)</option>
                <option value="Medium">Medium (Standard Triage)</option>
                <option value="Low">Low (Informational Monitoring)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Detection Source</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Incident Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context regarding the anomalous activity, scope of impacted assets, and observed vectors..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {initialAlert && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-300">Attached Alert Evidence:</span>
              <div className="grid grid-cols-2 gap-2 text-slate-400 font-mono text-[11px] pt-1">
                <div>Source: <span className="text-rose-400 font-semibold">{initialAlert.srcIp}</span></div>
                <div>Target: <span className="text-cyan-400 font-semibold">{initialAlert.dstIp}:{initialAlert.dstPort}</span></div>
                <div>Protocol: <span className="text-slate-200">{initialAlert.protocol}</span></div>
                <div>ML Confidence: <span className="text-emerald-400">{(initialAlert.mlConfidence * 100).toFixed(0)}%</span></div>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Log & Initiate Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
