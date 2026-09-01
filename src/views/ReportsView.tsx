import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  Calendar,
  Layers,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Share2,
  FileSpreadsheet
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [reportPeriod, setReportPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [reportTitle, setReportTitle] = useState('Weekly SOC Threat & Incident Intelligence Briefing');
  const [generatedDate] = useState(new Date().toUTCString());

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Trigger browser print dialog for native PDF printing
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csvContent = [
      'Report: ' + reportTitle,
      'Generated: ' + generatedDate,
      'Period: ' + reportPeriod,
      '',
      'Metric,Value',
      'Total Packets Analyzed,1248000',
      'Threats Detected,42',
      'Critical Alerts,4',
      'Active Incidents,2',
      'Blocked IPs,18',
      'Mean Time To Detect (MTTD),3.8 seconds',
      'Mean Time To Respond (MTTR),4.2 minutes',
      '',
      'Top Attack Vectors,Count,Percentage',
      'DDoS / SYN Flood,1840,33.7%',
      'Port Scan / Sweep,1230,22.5%',
      'SSH Brute Force,950,17.4%',
      'DNS Exfiltration,640,11.7%',
      'Malware C2,480,8.8%',
      'Botnet Activity,320,5.9%',
      '',
      'Top Malicious Endpoints,Country,Attacks',
      '185.220.101.5,Germany (Tor Exit),3420',
      '198.51.100.24,United States,2840',
      '203.0.113.77,Singapore,1950',
      '45.33.32.156,Netherlands,1420',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SOC-Security-Report-${reportPeriod}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess('CSV intelligence data exported successfully');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // Export to PDF using jsPDF
  const handleExportPDF = () => {
    setPdfGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Document Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 36, 'F');
      
      // Accent bar
      doc.setFillColor(6, 182, 212); // cyan-500
      doc.rect(0, 36, 210, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('SMART NETWORK SECURITY OPERATIONS CENTRE', 14, 16);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(6, 182, 212); // cyan-400
      doc.text('EXECUTIVE SECURITY INTELLIGENCE BRIEFING • RESTRICTED', 14, 25);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Generated: ${generatedDate}`, 130, 25);
      doc.text(`Reporting Window: ${reportPeriod.toUpperCase()}`, 130, 30);

      // Section 1: Executive Summary
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Executive Security Briefing', 14, 48);

      // Summary Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 52, 182, 24, 2, 2, 'FD');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const summaryText =
        'Over the selected evaluation timeframe, the automated SOC defense platform inspected 1,248,000 ingress packets across perimeter and internal core segments. A total of 42 high-confidence threats were classified by the machine learning heuristic engine, with 4 critical volumetric flood and DNS exfiltration incidents escalated for SOC containment. 18 hostile endpoints were automatically dropped at the border firewall.';
      doc.text(doc.splitTextToSize(summaryText, 174), 18, 59);

      // Section 2: Key Operational Metrics
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Operational Key Performance Indicators (KPIs)', 14, 86);

      // Metrics Grid (4 Boxes)
      const metrics = [
        { label: 'Packets Inspected', value: '1,248,000', color: [15, 23, 42] },
        { label: 'Threats Detected', value: '42 Events', color: [217, 119, 6] },
        { label: 'Firewall Drops', value: '18 Hosts', color: [225, 29, 72] },
        { label: 'Mean Time to Detect', value: '3.8 seconds', color: [13, 148, 136] },
      ];

      metrics.forEach((m, idx) => {
        const x = 14 + idx * 47;
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(x, 91, 44, 18, 2, 2, 'FD');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(m.label, x + 3, 96);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(m.color[0], m.color[1], m.color[2]);
        doc.text(m.value, x + 3, 104);
      });

      // Section 3: Attack Vectors Breakdown
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('3. Threat Vector Classification & Distribution', 14, 120);

      // Table Header
      doc.setFillColor(30, 41, 59);
      doc.rect(14, 124, 182, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Attack Vector', 18, 129);
      doc.text('Severity', 95, 129);
      doc.text('Event Count', 140, 129);
      doc.text('Share', 175, 129);

      // Table Rows
      const rows = [
        { name: 'Distributed Denial of Service (SYN Flood)', sev: 'CRITICAL', count: '1,840', share: '33.7%' },
        { name: 'Reconnaissance / Port Sweeps', sev: 'HIGH', count: '1,230', share: '22.5%' },
        { name: 'SSH / Remote Auth Brute Force', sev: 'HIGH', count: '950', share: '17.4%' },
        { name: 'DNS Tunneling / Data Exfiltration', sev: 'HIGH', count: '640', share: '11.7%' },
        { name: 'Malware Command & Control (C2)', sev: 'MEDIUM', count: '480', share: '8.8%' },
      ];

      rows.forEach((r, idx) => {
        const y = 135 + idx * 7;
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y - 4, 182, 7, 'F');
        }
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(r.name, 18, y);
        doc.setFont('helvetica', 'bold');
        if (r.sev === 'CRITICAL') doc.setTextColor(220, 38, 38);
        else if (r.sev === 'HIGH') doc.setTextColor(217, 119, 6);
        else doc.setTextColor(79, 70, 229);
        doc.text(r.sev, 95, y);
        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'normal');
        doc.text(r.count, 140, y);
        doc.setFont('helvetica', 'bold');
        doc.text(r.share, 175, y);
      });

      // Section 4: Critical Incident Escalations
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('4. Active Incident Response Cases', 14, 180);

      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(14, 184, 182, 20, 2, 2, 'FD');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(153, 27, 27);
      doc.text('• INC-8821: Distributed SYN Flood on DMZ Web Gateway (Contained)', 18, 191);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('  Mitigation: Border firewall rule #104 enacted; 12 hostile CIDR prefixes isolated.', 18, 196);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text('• INC-8822: DNS Tunneling Exfiltration on Database Segment (Under Active Triage)', 18, 201);

      // Section 5: Strategic Hardening Recommendations
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('5. Strategic Security Hardening Actions', 14, 216);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const recs = [
        '1. Automated Rate-Limiting: Deploy TCP SYN cookie defenses on DMZ Gateway (192.168.1.1) to absorb volumetric bursts.',
        '2. DNS Deep Inspection: Enforce strict byte entropy inspection on UDP 53 ingress to mitigate encoded data tunneling.',
        '3. Zero-Trust Authentication: Enforce MFA and automatic 10-minute bans for IPs exceeding 5 failed SSH attempts within 60s.',
      ];
      recs.forEach((rec, idx) => {
        doc.text(rec, 16, 224 + idx * 7);
      });

      // Footer
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 276, 196, 276);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Smart Network SOC Intelligence Engine v2.4 • Confidential Security Briefing', 14, 282);
      doc.text('Page 1 of 1', 180, 282);

      doc.save(`SOC-Executive-Security-Report-${reportPeriod}-${Date.now()}.pdf`);
      setDownloadSuccess('Executive PDF Briefing downloaded successfully');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Configuration & Action Bar */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Executive Security Intelligence Reports
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated compliance summaries, threat posture assessments, and exportable executive briefings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(['24h', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setReportPeriod(p)}
                className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                  reportPeriod === p
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p === '24h' ? 'Last 24 Hours' : p === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Print / Save PDF via native browser dialog */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Open browser print dialog to print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Print View</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            disabled={pdfGenerating}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{pdfGenerating ? 'Generating...' : 'Download Executive PDF'}</span>
          </button>
        </div>
      </div>

      {/* Download / Generation Alert Banner */}
      {downloadSuccess && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-mono flex items-center gap-2 max-w-4xl mx-auto">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Live Report Preview Canvas */}
      <div className="print-area p-8 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl max-w-4xl mx-auto space-y-8 font-sans">
        {/* Report Document Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Smart SOC • Cyber Intelligence Division</span>
            </div>
            <h1 className="text-xl font-bold text-slate-100">{reportTitle}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Reporting Window: <strong>{reportPeriod === '24h' ? 'Past 24 Hours' : reportPeriod === '7d' ? 'Past 7 Days' : 'Past 30 Days'}</strong> • Security Classification: <strong>RESTRICTED</strong>
            </p>
          </div>

          <div className="text-right text-xs font-mono text-slate-400 space-y-0.5">
            <div>Generated: {generatedDate}</div>
            <div>SOC Station ID: SOC-ALPHA-01</div>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            1. Executive Summary & Threat Posture
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-lg border border-slate-800">
            During this operational cycle, the SOC engine processed <strong>1,248,000 ingress network frames</strong>. The machine learning pipeline identified <strong>42 distinct malicious anomalies</strong> with an average classification confidence of <strong>96.4%</strong>. 18 hostile endpoints were automatically dropped at the border firewall, resulting in zero confirmed data exfiltrations or unmitigated service disruptions.
          </p>
        </div>

        {/* 2. Key Operational Metrics Matrix */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            2. Operational KPIs & Defense Response
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Packets Inspected</span>
              <span className="text-base font-bold text-slate-100 mt-0.5 block">1.25M</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Threats Detected</span>
              <span className="text-base font-bold text-amber-400 mt-0.5 block">42</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Mean Time Detect</span>
              <span className="text-base font-bold text-cyan-400 mt-0.5 block">3.8 sec</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Mean Time Respond</span>
              <span className="text-base font-bold text-emerald-400 mt-0.5 block">4.2 min</span>
            </div>
          </div>
        </div>

        {/* 3. Attack Vector Breakdown Table */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            3. Attack Vector & Threat Distribution
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2">Attack Vector</th>
                  <th className="pb-2">Classification Severity</th>
                  <th className="pb-2 text-right">Event Count</th>
                  <th className="pb-2 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-2 font-bold text-red-400">Distributed Denial of Service (DDoS)</td>
                  <td className="py-2 text-red-400">Critical</td>
                  <td className="py-2 text-right">1,840</td>
                  <td className="py-2 text-right font-bold">33.7%</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-orange-400">Reconnaissance / Port Scanning</td>
                  <td className="py-2 text-orange-400">High</td>
                  <td className="py-2 text-right">1,230</td>
                  <td className="py-2 text-right font-bold">22.5%</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-yellow-400">SSH / Auth Brute Force</td>
                  <td className="py-2 text-yellow-400">High</td>
                  <td className="py-2 text-right">950</td>
                  <td className="py-2 text-right font-bold">17.4%</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-purple-400">DNS Tunneling Exfiltration</td>
                  <td className="py-2 text-purple-400">High</td>
                  <td className="py-2 text-right">640</td>
                  <td className="py-2 text-right font-bold">11.7%</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-pink-400">Malware C2 Communication</td>
                  <td className="py-2 text-pink-400">Medium</td>
                  <td className="py-2 text-right">480</td>
                  <td className="py-2 text-right font-bold">8.8%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Strategic Recommendations */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            4. Hardening Recommendations & Next Actions
          </h2>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100 block">Deploy Automated Edge Rate Limiting</strong>
                <span className="text-slate-400 text-[11px]">
                  Configure TCP SYN cookie defenses on Gateway 192.168.1.1 to drop floods exceeding 500 PPS per IP.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100 block">Tighten DNS Ingress Policy</strong>
                <span className="text-slate-400 text-[11px]">
                  Enforce strict payload length inspection on UDP 53 to block base64 encoded TXT record data tunneling.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100 block">Enforce Multi-Factor Authentication on SSH/RDP</strong>
                <span className="text-slate-400 text-[11px]">
                  Isolate port 22 and 3389 behind zero-trust VPN bastions to thwart automated dictionary brute force scripts.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Footer */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Smart SOC Security Intelligence Platform v2.4</span>
          <span>End of Briefing</span>
        </div>
      </div>
    </div>
  );
};
