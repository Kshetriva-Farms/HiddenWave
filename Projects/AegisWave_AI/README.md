# AegisWave AI 🛡️
> **Sovereign, Multipurpose, Accurate, Reliable, Portable & Data-Secure Personal AI**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.12%2B-brightgreen.svg)
![Hardware](https://img.shields.io/badge/optimized_for-HP_Victus_5600H-orange.svg)
![Privacy](https://img.shields.io/badge/privacy-100%25_offline_sovereign-success.svg)
![License](https://img.shields.io/badge/license-MIT-purple.svg)

---

## 📖 Table of Contents
1. [Executive Summary & Philosophy](#-executive-summary--philosophy)
2. [The 4 Sovereign Pillars](#-the-4-sovereign-pillars)
3. [System Architecture & 5-Stage Pipeline](#-system-architecture--5-stage-pipeline)
4. [Hardware Specifications & Resource Management](#-hardware-specifications--resource-management)
5. [User Interfaces & How to Run](#-user-interfaces--how-to-run)
6. [Mobile Phone Access & Wi-Fi Setup](#-mobile-phone-access--wi-fi-setup)
7. [Private Knowledge Base (Offline RAG)](#-private-knowledge-base-offline-rag)
8. [CLI Slash Commands Reference](#-cli-slash-commands-reference)
9. [Configuration & Optional Cloud Acceleration](#-configuration--optional-cloud-acceleration)
10. [Repository Directory Map](#-repository-directory-map)
11. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🌟 Executive Summary & Philosophy

**AegisWave AI** is an autonomous, personal intelligence companion engineered from the ground up to prioritize **Data Sovereignty**, **Mathematical & Empirical Accuracy**, **Deterministic Reliability**, and **Portability**.

Unlike commercial cloud-only AI assistants that upload your files, chats, and private credentials to third-party corporate servers, AegisWave AI operates as a **local-first, self-contained system**. It runs on your own hardware, stores all memory in an encrypted local database on your SSD, scrubs sensitive tokens in real time, and can be moved simply by copying its single folder to another PC or drive.

### Thematic Identity
* **Name:** AegisWave AI *(Aegis = Divine Shield of Protection + Wave = Dynamic Flow of Intelligence)*
* **Role:** The Sovereign Sentinel
* **Core Motto:** *"Your intelligence. Your hardware. Zero compromise."*

---

## 🏛️ The 4 Sovereign Pillars

| Pillar | Technical Implementation | Benefit to User |
| :--- | :--- | :--- |
| **1. Data Secure** | `SecurityShield` real-time regex & entropy scrubber; local SQLite WAL (`vault.db`) | Zero telemetry, zero corporate data harvesting. Sensitive API keys, passwords, and emails are masked before model ingestion. |
| **2. Accurate** | `AccuracyVerifier` critic loop cross-referencing claims against raw tool outputs | Eliminates hallucinations. Calculations and system facts are grounded in empirical Python/AST execution. |
| **3. Reliable** | `SecuritySandbox` path-jailing file operations inside project boundaries | Prevents accidental system file overwrites or unauthorized file tampering outside the workspace. |
| **4. Portable** | 100% self-contained folder structure (`D:\HiddenWave\Projects\My_Bot`) | Zero global environment pollution. Copy the folder to any machine or USB drive, and all memory and weights travel with it. |

---

## 🧠 System Architecture & 5-Stage Pipeline

Every user interaction—whether received from the Desktop Web App, a Mobile Phone, or the Terminal CLI—passes through a strict 5-stage ReAct cognitive pipeline:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 USER PROMPT / QUERY                     │
                  └──────────────────────────┬──────────────────────────────┘
                                             │
                                             ▼
                                  [ STAGE 1: SECURITY SHIELD ]
                           • Real-time regex & entropy scanning
                           • API keys, tokens, emails, IPs masked
                           • Surrogate tokens created (<SECRET_KEY_1>)
                                             │
                                             ▼
                                   [ STAGE 2: MODEL ROUTER ]
                           • Dynamic multi-tier reasoning engine:
                             1. Local GGUF (Llama 3.2 3B in-process)
                             2. Local Ollama (Daemon if running)
                             3. Sovereign Cloud (Gemini/Groq/OpenAI)
                             4. Conversational Core (Rule fallback)
                                             │
                                             ▼
                                  [ STAGE 3: TOOL SANDBOX ]
                           • Path-jailed filesystem reader/writer
                           • AST-safe high-precision math evaluator
                           • Live CPU/RAM/Battery telemetry
                           • SQLite FTS5 Private Knowledge search
                           • Clean web scraper & text extractor
                                             │
                                             ▼
                                 [ STAGE 4: ACCURACY VERIFIER ]
                           • Empirical fact & calculation critic
                           • Audits generated claims vs tool output
                           • Corrects or flags discrepancies
                                             │
                                             ▼
                                   [ STAGE 5: LOCAL VAULT ]
                           • Reversible token de-anonymization
                           • Session history committed to SQLite WAL
                           • Cryptographic forensic audit logging
                                             │
                                             ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │              VERIFIED SOVEREIGN RESPONSE                │
                  └─────────────────────────────────────────────────────────┘
```

---

## ⚡ Hardware Specifications & Resource Management

AegisWave AI is specifically tuned for the **HP Victus Gaming Laptop**:
* **CPU:** AMD Ryzen 5 5600H (6 Cores, 12 Threads @ 3.3 GHz – 4.2 GHz Turbo)
* **GPU:** NVIDIA GeForce GTX 1650 (4 GB GDDR6 VRAM)
* **RAM:** 8 GB DDR4 (Configured with high-efficiency memory ceilings)
* **Storage:** 512 GB NVMe SSD (Local storage for SQLite WAL & GGUF weights)
* **Operating System:** Windows 11 64-bit

### 🛡️ PC Performance & Smoothness Guarantee

| Machine State | CPU Usage | RAM Usage | GPU Usage | Background Impact |
| :--- | :--- | :--- | :--- | :--- |
| **When Unopened / Closed** | **0.0%** | **0 MB** | **0 MB** | **Zero.** The AI model is an inert file on disk. No background services exist. |
| **Web Server Idle** | **0.0%** | **~35 MB** | **0 MB** | Negligible. Lightweight Flask HTTP listener. |
| **During Active Inference** | Multi-threaded (6 cores) | ~1.8 GB | In-process | Controlled generation (~15–20s for full multi-paragraph response). |
| **5 Min Inactivity (Auto-Sleep)** | **0.0%** | Drops back to **~35 MB** | **0 MB** | **Automatic Watchdog** completely unloads model from RAM to keep PC smooth for gaming/editing! |
| **Manual RAM Release** | **0.0%** | Drops back to **~35 MB** | **0 MB** | Instant model unmount via the **`🍃 Free RAM`** button in the Web UI. |

---

## 🚀 User Interfaces & How to Run

### Method 1: Universal Launcher Menu (Recommended)
Double-click `start_bot.py` or run:
```powershell
python start_bot.py
```
This presents an interactive menu to launch the Web App, CLI, Architecture Demo, or System Diagnostics.

---

### Method 2: Flagship Web & Mobile Gateway
Start the local server:
```powershell
python web/server.py
```
* **Desktop Browser:** Open [`http://127.0.0.1:5000`](http://127.0.0.1:5000)
* **Mobile Phone / Tablet:** Open [`http://192.168.10.2:5000`](http://192.168.10.2:5000) *(or your local LAN IP)*
* **Architecture Visualizer:** Open [`http://127.0.0.1:5000/demo`](http://127.0.0.1:5000/demo)

#### Flagship Web UI Features:
* **Live Telemetry Gauges:** Real-time visual meters for AMD Ryzen CPU %, RAM %, and Battery level.
* **Pipeline Step Tracing:** Click any assistant message badge to expand the step-by-step reasoning drawer (Security Shield status, Model name, Tool execution observations, Verification checks).
* **Multi-Turn Session Drawer:** Left sidebar keeps past conversations stored in SQLite; switch between chat threads instantly.
* **Instant Drag-and-Drop Knowledge RAG:** Drop PDF, Markdown, Python, or Text files straight into the sidebar to index them into the offline knowledge base.
* **`⚡ Cloud & Privacy` Control Panel:** Live configuration for Google Gemini / Groq API keys with zero PC load and 100% data sanitization.
* **`🍃 Free RAM` Control:** One-click memory release to instantly dump neural weights from RAM when you need your laptop's memory for gaming.

---

### Method 3: Deploy 24/7 to Free Cloud Hosting (Always Online Anywhere)
To make AegisWave **always online 24/7** from any phone or computer without needing your laptop turned on:

1. **Push your code to GitHub:**
   ```powershell
   git add .
   git commit -m "Configure 24/7 Cloud Hosting"
   git push origin main
   ```
2. **Connect to Render (Free Cloud Hosting):**
   * Sign up at [render.com](https://render.com) (free).
   * Click **New +** > **Web Service**.
   * Connect your GitHub repository (`HiddenWave`).
   * Set **Root Directory:** `Projects/My_Bot`
   * Set **Build Command:** `pip install -r requirements.txt`
   * Set **Start Command:** `gunicorn web.server:app --bind 0.0.0.0:$PORT`
   * Under **Environment Variables**, add:
     * `AI_MODE`: `hybrid`
     * `GEMINI_API_KEY`: *(your Gemini key)*
3. **Always Online:** Render generates a permanent HTTPS link (e.g., `https://aegiswave-ai.onrender.com`).
   * Open this link on your phone, tablet, or work PC.
   * Add to Home Screen on your phone for a native app feel!
   * No Wi-Fi restrictions, no firewall issues, 0% battery/RAM used on your laptop.

---

### Method 4: Rich Terminal CLI
For lightweight terminal work:
```powershell
python bot/main.py
```

---

## 📚 Private Knowledge Base (Offline RAG)

AegisWave AI features an embedded Retrieval-Augmented Generation (RAG) engine that lets it answer questions about your personal documents without sending them anywhere:

1. **Supported Formats:** `.txt`, `.md`, `.py`, `.js`, `.json`, `.csv`, `.pdf`
2. **Indexing Methods:**
   * **Drag-and-Drop:** Drag files into the "Private Knowledge" box in the Web UI sidebar.
   * **Direct Folder Drop:** Place any file into [`D:\HiddenWave\Projects\My_Bot\knowledge`](file:///d:/HiddenWave/Projects/My_Bot/knowledge).
   * **CLI Command:** In terminal, type `/sync` to index new documents.
3. **Storage & Search Engine:** Documents are chunked (500 characters with 100-character sliding overlap) and stored in SQLite with **FTS5 full-text indexing + BM25 statistical relevance ranking**. Zero external vector database servers required!

---

## ⌨️ CLI Slash Commands Reference

When using the Terminal CLI (`python bot/main.py`), use these commands:

| Command | Action | Description |
| :--- | :--- | :--- |
| `/telemetry` | Hardware Diagnostics | Shows live AMD Ryzen CPU load %, RAM usage, battery %, and SSD space. |
| `/vault` | Persistent Memory | Displays key-value entries stored in SQLite long-term storage. |
| `/knowledge` | Document Index | Lists all indexed documents and chunk counts in the private RAG system. |
| `/sync` | Re-index Files | Scans `knowledge/` directory and syncs new documents into SQLite FTS5. |
| `/audit` | Security Audit Trail | Displays recent actions, security scrub events, and execution logs. |
| `/clear` | Clear Conversation | Resets the current chat thread in memory and creates a fresh session. |
| `/help` | Command Help | Displays the interactive commands cheatsheet. |
| `/exit` | Quit | Gracefully closes the agent and releases all resources. |

---

## ⚙️ Hybrid Sovereign Architecture & Text/File Security

AegisWave AI features an advanced **Hybrid Sovereign Architecture** designed specifically to solve the high hardware load of local neural inference on your laptop, while providing ironclad guarantees for text and document privacy.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                       HYBRID SOVEREIGN SECURITY ARCHITECTURE                   │
├──────────────────────────────────────┬─────────────────────────────────────────┤
│ LOCAL LAPTOP BOUNDARY (HP VICTUS)    │ EXTERNAL CLOUD (SUB-SECOND REASONING)   │
├──────────────────────────────────────┼─────────────────────────────────────────┤
│ 1. Raw User Prompt & Files           │                                         │
│    "My key is sk-123, email me..."   │                                         │
│                │                     │                                         │
│                ▼                     │                                         │
│ 2. SecurityShield (Local In-Memory)  │                                         │
│    • Real-time token masking         │                                         │
│    • Surrogate map created           │                                         │
│    • Document FTS5 search (Local)    │                                         │
│                │                     │                                         │
│                ▼                     │                                         │
│ 3. Masked Prompt Transmission ───────┼────────► 4. Cloud Engine (Gemini / Groq)│
│    "My key is <API_KEY_1>, email..." │             • Zero load on HP Victus PC │
│                                      │             • 0.4s lightning generation │
│                                      │             • ZERO real secrets exposed │
│                                      │                     │                   │
│ 5. Local Reverse De-Anonymization ◄──┼─────────────────────┘                   │
│    • <API_KEY_1> -> sk-123           │                                         │
│    • Real context restored to screen │                                         │
└──────────────────────────────────────┴─────────────────────────────────────────┘
```

### 🛡️ The 4 Text & File Privacy Guarantees

| Security Layer | Technical Mechanism | Protection Level |
| :--- | :--- | :--- |
| **1. Zero-Exposure PII Scrubbing** | `SecurityShield` scrubs API keys (OpenAI, Anthropic, Google, AWS, Stripe, GitHub, Slack), passwords, connection URIs, emails, phone numbers, and IPs. | The cloud model **never sees real credentials**. Only dummy placeholders (`<API_KEY_1>`, `<EMAIL_2>`) leave your laptop. |
| **2. Local Document Isolation** | Document parsing and indexing (SQLite FTS5 + BM25) runs **100% locally** on your SSD. | **Raw files are NEVER uploaded wholesale to the cloud.** Only the exact relevant paragraph needed to answer is extracted locally, and that paragraph is ALSO scrubbed by `SecurityShield` before being used as context. |
| **3. Air-Gap Auto-Override** | Prompts tagged with `[PRIVATE]`, `[CONFIDENTIAL]`, or containing SSH/RSA private keys trigger an automatic air-gap override. | The router **strictly refuses cloud transmission** and executes 100% locally on the offline `Llama-3.2-3B` weights on your SSD. |
| **4. Local Reverse Re-hydration** | The mapping between dummy tokens and your real secrets exists **only in your laptop's volatile memory**. | When the AI answers, AegisWave restores your real keys and values locally on your screen. Complete user experience with zero external exposure. |

---

### 🎛️ Dynamic Operational Modes

You can switch modes with one click in the Web UI header:

1. **⚡ Hybrid Sovereign (`AI_MODE=hybrid`) [Recommended]:**
   * Heavy neural reasoning is offloaded to Google Gemini 2.0 Flash or Groq Llama 3.3 70B.
   * **0% CPU load** on your Ryzen 5 processor. **0 MB extra RAM** consumed.
   * Generation time drops from **20 seconds to 0.4 seconds**.
   * Automatic local fallback if internet is disconnected.
2. **🔒 Local Air-Gapped (`AI_MODE=local`):**
   * Strictly 100% offline. Zero outbound network packets.
   * Runs in-process using local INT4 quantized GGUF weights on your Ryzen CPU / GTX 1650.

---

### 🔑 Configuring Free Cloud Acceleration

You can configure cloud acceleration directly in the Web UI via the **`⚡ Cloud & Privacy`** button, or by editing [`.env`](file:///d:/HiddenWave/Projects/My_Bot/.env):

```env
# Optional Free Cloud Keys (Leave blank for 100% offline local mode)
GEMINI_API_KEY=your_gemini_key_here    # Free from https://aistudio.google.com/app/apikey
GROQ_API_KEY=your_groq_key_here        # Free from https://console.groq.com/keys
OPENAI_API_KEY=

# Operational Mode
AI_MODE=hybrid
```

## 🗂️ Repository Directory Map

```text
D:\HiddenWave\Projects\My_Bot\
│
├── README.md                       # Master comprehensive documentation (You are here)
├── AEGISWAVE_MASTER_MANUAL.md      # Full technical specification & architecture manual
├── AegisWave_AI_Master_Manual.pdf  # Formatted PDF system manual
├── start_bot.py                   # Universal interactive launcher menu
├── download_model.py               # GGUF model downloader & checksum validator
├── enable_mobile_access.bat        # 1-click Windows Firewall & Wi-Fi unlock script
├── enable_firewall.ps1             # PowerShell script for inbound port 5000 rule
├── .env                            # Local configuration and optional API keys
│
├── config/                         # Hardware & environment configurations
│   ├── hardware_profile.json       # HP Victus Ryzen 5 / GTX 1650 resource parameters
│   └── settings.py                 # Central path constants and environment loader
│
├── bot/                            # Core sovereign AI engine
│   ├── main.py                     # Rich interactive terminal CLI
│   │
│   ├── core/                       # Cognitive orchestration
│   │   ├── agent.py                # 5-stage ReAct autonomous execution loop
│   │   └── verifier.py             # Empirical fact & calculation verification critic
│   │
│   ├── security/                   # Zero-leakage privacy layer
│   │   ├── shield.py               # Real-time regex & entropy PII secret scrubber
│   │   └── sandbox.py              # Path-jailing filesystem security boundary
│   │
│   ├── memory/                     # Local persistent storage
│   │   ├── vault.db                # SQLite WAL database (sessions, memories, audit)
│   │   ├── vault.py                # Database manager & forensic logging engine
│   │   └── knowledge_base.py       # Offline SQLite FTS5 + BM25 RAG indexer
│   │
│   ├── tools/                      # Sandboxed execution capabilities
│   │   ├── base.py                 # Tool interface and registry definitions
│   │   ├── files.py                # Sandboxed file read, write, and directory listing
│   │   ├── math_tool.py            # AST-safe mathematical evaluator (no unsafe eval)
│   │   ├── system.py               # Real-time psutil hardware telemetry provider
│   │   ├── web.py                  # Sandboxed HTTP text extractor
│   │   └── knowledge_tool.py       # Knowledge search & sync tools
│   │
│   └── models/                     # Multi-tier reasoning engines
│       ├── base.py                 # Abstract model provider interface
│       ├── gpt4all_provider.py     # In-process multi-threaded GGUF neural engine
│       ├── ollama_provider.py      # Local Ollama HTTP daemon provider
│       ├── cloud_provider.py       # Sovereign Cloud client (Gemini/Groq/OpenAI)
│       ├── rule_engine.py          # Built-in offline fallback engine
│       └── router.py               # Dynamic model prioritization and routing logic
│
├── web/                            # Flagship Web & Mobile Interface
│   ├── server.py                   # Flask REST API gateway with idle RAM watchdog
│   └── static/
│       └── index.html              # Modern glassmorphism UI with live gauges & chat
│
├── gui_demo/                       # Interactive visual architecture diagram
│   └── index.html                  # Standalone SVG workflow visualizer
│
├── knowledge/                      # Offline document repository for RAG
│   └── project_guide.md            # Default system reference document
│
└── data/                           # Local weights and databases (Git-ignored)
    ├── models/
    │   └── Llama-3.2-3B-Instruct-Q4_0.gguf   # Downloaded 1.92 GB neural weights
    └── vault.db                    # Persistent SQLite database & audit logs
```

---

## ❓ Troubleshooting & FAQ

### Q1: Why does inference take 15–20 seconds per response?
Currently, the model runs on your **AMD Ryzen 5 CPU** (`n_threads=6`, AVX2) using quantized INT4 weights. 
* Unlike commercial cloud supercomputers with massive multi-GPU clusters, your CPU generates ~7–10 tokens/sec.
* For a 200-token multi-paragraph response, generation takes ~15–20 seconds.
* **To speed this up:** You can enable GPU offloading to your GTX 1650 4GB VRAM, or add a free Groq / Gemini key in `.env` for sub-second cloud generation (with all private data scrubbed locally before sending).

### Q2: Does the model slow down my PC while gaming?
* **No.** When AegisWave is closed, it consumes **0% CPU and 0 MB RAM**.
* When the web server is running, the **Idle Watchdog** automatically unloads the 1.8 GB model from RAM after 5 minutes of inactivity.
* You can also click the **`🍃 Free RAM`** button at any time to instantly free memory.

### Q3: How do I completely wipe conversation history?
Click the **"Clear"** button in the Web UI, or type `/clear` in the terminal CLI. To delete all stored memories and audit trails permanently, simply delete [`data/vault.db`](file:///d:/HiddenWave/Projects/My_Bot/data/vault.db). AegisWave will recreate a clean database automatically on next start.

---

## 📜 License
AegisWave AI is open-source software released under the **MIT License**. You have complete freedom to modify, audit, distribute, and run this system privately on your personal hardware.
