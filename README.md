# Diwan Hackathon — Full Project

This repository contains the **complete Diwan Hackathon project** for the Board of Grievances (BOG). It is a digital judicial services ecosystem: Moeen digital platform, court sessions (multi-party video/audio), hackathon website, Diwan platform page, and structured data for chatbots and AI.

The project is **not only** multi-party video calls; it includes portals, case submission flows, AI-assisted forms, session rules and validation, and data for training or integrating AI.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Components](#components)
4. [Moeen Digital Platform](#moeen-digital-platform-moenhtml)
5. [Diwan Platform Page](#diwan-platform-page-diwan-platformhtml)
6. [Court Sessions App](#court-sessions-app-webrtc-meeting-app)
7. [Hackathon Website](#hackathon-website)
8. [BOG Chatbot Data](#bog-chatbot-data)
9. [Prerequisites & Setup](#prerequisites--setup)
10. [Tech Stack](#tech-stack)
11. [License & Support](#license--support)

---

## Project Overview

The Diwan Hackathon project delivers:

- **Moeen digital platform** — A single-page portal for Moeen judicial services: hero, main gates, filterable services list, **submit case** flow with court choice, split-screen form (parties data + case details with AI analysis), add-plaintiff modal, and AI Voice Agent panel.
- **Diwan platform page** — A dedicated Diwan platform HTML page (design and content for the broader BOG digital presence).
- **Court sessions app** — Multi-party video/audio sessions over WebRTC. Participants join by a **6-digit session code** only (no ID or session name required); everyone with the same code is placed in the same session. Includes session rules, camera-on enforcement, and end-and-analyze flow.
- **Hackathon website** — Static site (home, about, services, contact, Moeen sessions) with RTL/Arabic and BOG-aligned design.
- **BOG chatbot data** — Structured JSON (FAQs, regulations) for chatbot or LLM integration and training.

Together these form one **full project** for the hackathon: portals, forms, AI features, real-time sessions, and data.

---

## Repository Structure

```
Diwan-Hackathon/
├── README.md                   # This file (full project, English)
├── moen.html                   # Moeen digital platform
├── diwan-platform.html         # Diwan platform page
├── Moeen.svg                   # Moeen logo
├── agent.PNG                   # AI agent image (Moeen)
├── webrtc-meeting-app/         # Court sessions (WebRTC)
│   ├── backend/                # Node.js + Express + Socket.IO
│   │   ├── server.js
│   │   ├── session-rules.js    # Court session rules (validation / AI)
│   │   └── SESSION_RULES_README.md
│   └── frontend/               # React + Vite + WebRTC
│       ├── src/
│       │   ├── App.jsx         # Lobby: session code join
│       │   └── WebRTC.jsx      # Meeting UI & WebRTC
│       └── public/
├── hackathon-site/             # Static hackathon website
│   ├── index.html, about.html, contact.html, services.html
│   ├── maeen-sessions.html
│   └── assets/, data/, styles.css, script.js
└── bog_chatbot_data/           # Chatbot / LLM data
    └── complete_bog_data.json
```

---

## Components

| Component           | Path                      | Role in full project |
|--------------------|---------------------------|----------------------|
| Moeen Platform     | `/moen.html`              | Judicial services portal: submit case, services, AI agent, forms |
| Diwan Platform     | `/diwan-platform.html`    | BOG Diwan platform page |
| Court Sessions     | `/webrtc-meeting-app/`    | Multi-party court sessions (join by code); one part of the ecosystem |
| Hackathon Website  | `/hackathon-site/`        | Public hackathon site |
| BOG Chatbot Data   | `/bog_chatbot_data/`      | Data for chatbots and AI |

---

## Moeen Digital Platform (`moen.html`)

Single-page portal for **Moeen** digital judicial services (BOG).

### Features

- **Hero & main gates:** Entry to “Registered users services” and “Government entities gateway.”
- **Services section:** Filters (All / Registered only / Unregistered only), search, and service cards with links to official Moeen services.
- **Submit case flow:**
  1. **Court choice modal:** User selects court (e.g. Administrative Digital Court), accepts declaration, then confirms.
  2. **Split-screen form** (shown only after choosing the Administrative Digital Court):
     - **Right:** Green panel with AI Voice Agent and “Enable Voice Agent.”
     - **Left:** Multi-step form.
- **Form steps:**
  - **Step 1 — Parties data:** Plaintiff data, representatives, defendant, authentication. “Next” goes to step 2.
  - **Step 2 — Case details:** Description textarea and “AI analysis” button (mock: situation, concerned parties, expected parties for next step). “Previous” / “Next.”
- **Add plaintiff modal:** “Add plaintiff” opens a modal to choose plaintiff type (individual, association, government entity, company, etc.). Confirm adds the plaintiff (demo).
- **Analytics & footer:** Links to indicators/dashboards and footer.

### How to run

- Open `moen.html` in a browser (file or static server). Ensure `Moeen.svg` and `agent.PNG` are in the same directory.

### Tech

- HTML5, Tailwind CSS (CDN), GSAP (ScrollTrigger), Tajawal font. No build step.

---

## Diwan Platform Page (`diwan-platform.html`)

Dedicated page for the Diwan (BOG) platform: structure, content, and design for the broader BOG digital presence. Open in a browser like `moen.html`.

---

## Court Sessions App (`webrtc-meeting-app`)

**One part of the full project:** multi-party court sessions over WebRTC. Participants join using **only a 6-digit session code**; no ID or session name. Same code = same room.

### Features

- **Lobby:** Single screen: “Session code (6 digits)” and optional “Display name.” Button “Join session.”
- **Linking by code:** Everyone entering the same 6-digit code joins the same session (room ID = code).
- **In-session:** Video/audio (WebRTC), camera/mic controls, “End session & analyze” (recordings/analysis). Camera-on reminder; session rules supported on backend.
- **Backend:** Session rules API (`GET /session-rules`), room limit 10, optional validation and mock SMS endpoints for future use.

### Run instructions

**Backend (Terminal 1):**

```bash
cd webrtc-meeting-app/backend
npm install
npm start
```

Server: `http://localhost:3001`.

**Frontend (Terminal 2):**

```bash
cd webrtc-meeting-app/frontend
npm install
npm run dev
```

App: `http://localhost:5173/` (and network URL from Vite).

**Usage:** Open the app in one or more tabs/devices; enter the **same** 6-digit code to join the same session.

### Backend endpoints

| Method | Path             | Description                    |
|--------|------------------|--------------------------------|
| GET    | `/health`        | Health check                  |
| GET    | `/session-rules` | Court session rules (UI / AI) |
| GET    | `/rooms`         | Active rooms (debug)          |
| POST   | `/upload-audio`  | Upload audio                  |
| POST   | `/analyze`       | Analyze meeting               |

Session rules and validation: `backend/session-rules.js`. AI/model use: `backend/SESSION_RULES_README.md`.

### Tech

- Frontend: React 18, Vite, Socket.IO client, Axios. Backend: Node.js, Express, Socket.IO, Multer. Media: WebRTC, STUN.

---

## Hackathon Website

**Path:** `hackathon-site/`

Static site: homepage, about, services, contact, Moeen sessions page. RTL/Arabic, BOG-aligned design. Open `index.html` or serve the folder with any static server.

---

## BOG Chatbot Data

**Path:** `bog_chatbot_data/`

- `complete_bog_data.json`: Structured FAQs, regulations, and content for chatbot or LLM integration and training.

---

## Prerequisites & Setup

### Prerequisites

- **Node.js** 18+ (for the court sessions app only).
- Modern browser (Chrome/Firefox/Edge) for WebRTC and HTML pages.
- Git (optional).

### Clone

```bash
git clone <repo-url>
cd Diwan-Hackathon
```

### Run court sessions app

```bash
# Terminal 1 — backend
cd webrtc-meeting-app/backend
npm install
npm start

# Terminal 2 — frontend
cd webrtc-meeting-app/frontend
npm install
npm run dev
```

Then open **http://localhost:5173/** and join with a 6-digit session code.

### Run Moeen, Diwan platform, hackathon site

- **Moeen:** Open `moen.html` in the browser.
- **Diwan platform:** Open `diwan-platform.html` in the browser.
- **Hackathon site:** Open `hackathon-site/index.html` or serve the folder.

---

## Tech Stack

| Layer           | Technologies |
|-----------------|--------------|
| Moeen / Diwan   | HTML5, Tailwind CSS (CDN), GSAP, Tajawal |
| Court sessions  | React, Vite, Socket.IO, WebRTC, Axios |
| Backend         | Node.js, Express, Socket.IO, Multer |
| Data            | JSON (chatbot, session rules) |
| Languages       | JavaScript; Arabic (UI); English (this README and code comments) |

---

## License & Support

- **License:** MIT — use for hackathon and education.
- **Support:** See this README for the full project; see `webrtc-meeting-app/backend/SESSION_RULES_README.md` for session rules and AI usage.

Built for **Board of Grievances (BOG) Hackathon**.
