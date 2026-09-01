# 🛡️ Smart Network Security Operations Centre (SOC)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

An enterprise-grade, full-stack **Security Operations Centre (SOC)** and network telemetry monitoring platform. Engineered for security analysts, incident responders, and network administrators to monitor high-frequency packet ingress, analyze PCAP captures with deep packet dissection (hex/ASCII), detect anomalies using a machine learning inference pipeline, and execute active containment playbooks in real time.

---

## 📸 Key Features & Capabilities

- ⚡ **Real-Time Telemetry Streaming (SSE)**: Ingests and displays live network frames (TCP, UDP, HTTPS, DNS, SSH, ICMP) continuously via Server-Sent Events with rolling 60-second throughput waveforms.
- 🔬 **Deep Packet Inspection (DPI) & PCAP Ingestion**: Supports drag-and-drop `.pcap`/`.pcapng` parsing, multi-layer header decoding (Ethernet II, IPv4/IPv6, TCP flags, TTL, ports), and side-by-side **Hexadecimal + ASCII** payload inspection.
- 🤖 **Machine Learning Threat Detection Sandbox**: 7-stage ML inference pipeline scoring multi-dimensional feature vectors (entropy, PPS, SYN ratios, auth failure rate). Includes an interactive **Feature Tweaker** and SHAP-like feature importance attributions.
- 🎯 **Synthetic Attack Simulation Suite**: 1-click synthetic threat launcher to test detection rules against **SYN Flood DDoS**, **DNS Tunneling / Exfiltration**, **SSH Brute-Force**, and **Stealth TCP Port Scans**.
- 🚨 **Alert Triage & Edge Containment**: Multi-criteria alert triage with instantaneous **Block / Drop IP** edge firewall rule enactment.
- 📋 **Incident Response Playbooks**: SANS/NIST incident lifecycle management with interactive containment checklists (host isolation, credential revocation, sinkholing) and audit logs.
- 📊 **Intelligence Analytics & PDF Reports**: Dynamic trend graphs, geographic threat heatmaps, and 1-click generation of printable **Executive PDF Security Briefings** and raw CSV datasets.

---

## 🏗️ Architecture Overview

```
[ Ingress Network Frames / PCAP Upload / Attack Simulator ]
                           │
                           ▼
              [ Sensor Tap & Buffer Engine ]
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
[ Deep Packet Dissector ]     [ ML Feature Extractor ]
(Hex/ASCII, Flags, Layers)    (Entropy, Rates, SYN Ratios)
            │                             │
            │                             ▼
            │                 [ Threat Classifier Engine ]
            │                 (Risk Score, Confidence, SHAP)
            │                             │
            └──────────────┬──────────────┘
                           ▼
          [ Real-Time SSE Stream & Alert Triage ]
                           │
                           ▼
     [ Incident Response Playbook & Edge Firewall Drop ]
                           │
                           ▼
        [ Analytics Engine & Executive PDF/CSV Export ]
```

---

## 💻 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (animations), Recharts (data visualizations), Lucide React (icons), jsPDF (PDF export).
- **Backend**: Node.js, Express, Server-Sent Events (SSE), TypeScript (`tsx` in dev, `esbuild` for production bundle).
- **Tooling**: Vite 6, Tailwind CSS Vite Plugin.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/smart-network-soc.git
   cd smart-network-soc
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express server and Vite development middleware on port 3000 with real-time SSE |
| `npm run build` | Builds the client SPA via Vite and bundles the Node/Express server via `esbuild` into `dist/server.cjs` |
| `npm run start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npm run lint` | Runs TypeScript type checking across the entire codebase (`tsc --noEmit`) |
| `npm run preview` | Previews the Vite production build locally |

---

## 📂 Project Structure

```
├── server.ts                 # Full-stack Express server with SSE & REST API routes
├── index.html                # Application HTML entry point & metadata
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Primary layout, routing, and real-time state orchestration
│   ├── index.css             # Tailwind CSS global styles and print media rules
│   ├── types.ts              # Global TypeScript interfaces, enums, and data models
│   ├── services/
│   │   ├── api.ts            # API client for backend telemetry and REST endpoints
│   │   ├── pcapParser.ts     # Client-side PCAP & PCAPNG binary format parser
│   │   └── mlSimulator.ts    # ML feature extraction, inference, and SHAP model engine
│   ├── components/
│   │   ├── Navigation.tsx    # Left sidebar navigation & live status indicators
│   │   ├── TopHeader.tsx     # Top header with global search, simulation triggers, and DEFCON status
│   │   ├── AttackModal.tsx   # Attack simulation launcher modal
│   │   ├── ThreatToast.tsx   # Real-time pop-up notifications for high-priority threats
│   │   └── PacketModal.tsx   # Deep inspection modal for frame headers and byte offsets
│   └── views/
│       ├── DashboardView.tsx # Overview metrics, rolling waveforms, top talkers & donut charts
│       ├── LiveTrafficView.tsx# High-speed live SSE packet stream & network node topology
│       ├── PacketAnalysisView.tsx # PCAP upload, sample traces, protocol layer tree & Hex/ASCII viewer
│       ├── MLDetectionView.tsx   # 7-stage ML pipeline visualizer & interactive feature tweaker
│       ├── AlertsView.tsx    # Filterable alert triage table with 1-click IP firewall block
│       ├── IncidentsView.tsx # SANS/NIST Incident response cases, playbooks & audit history
│       ├── AnalyticsView.tsx # Multi-day trend comparisons & geographic threat heatmap
│       ├── ReportsView.tsx   # Executive intelligence briefings, printable view & PDF/CSV export
│       └── SettingsView.tsx  # Sensor configuration, classifier parameters & SIEM integration
└── package.json              # Project dependencies and build scripts
```

---

## 🔒 Security & Attack Vectors Handled

| Vector | Detection Heuristic / Indicator | Containment Playbook Action |
| :--- | :--- | :--- |
| **SYN Flood DDoS** | High PPS, High SYN/ACK ratio (>0.85), Low Byte Entropy | Border IP Drop, Syncookies Enforcement, Rate Limiting |
| **DNS Tunneling** | High Shannon Entropy on Subdomains (>4.5), High TXT/NULL Query Volume | DNS Sinkholing, Domain Blacklist, Port 53 Deep Inspection |
| **SSH Brute-Force** | Auth Failure Burst (>10 failed logins / 60s) on Port 22 | Host Isolation, Dynamic IP Blacklist, Enforce MFA |
| **Port Reconnaissance** | Sequential TCP SYN scanning across wide port spectrum | Edge Droplist, Honeypot Redirection, Rule Escalation |
| **Malware C2 Beaconing** | Low-frequency periodic beaconing to suspicious external ASNs | Process Termination, C2 IP Null-Routing, Forensic Capture |

---

## 📄 Exporting Reports

1. Navigate to the **Reports** tab.
2. Select your timeframe (**24h**, **7d**, **30d**).
3. Click **"Download Executive PDF"** to generate a vector-rendered intelligence report, or click **"Export CSV"** for raw SIEM ingestion.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
