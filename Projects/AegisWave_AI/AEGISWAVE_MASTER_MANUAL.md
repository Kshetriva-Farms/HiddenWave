# AEGISWAVE AI — MASTER SYSTEM SPECIFICATION & ARCHITECTURE MANUAL
**Project Root:** `D:\HiddenWave\Projects\My_Bot`  
**Version:** 1.0.0 (Production Core)  
**Author:** Sovereign Architecture Team  
**System Target:** HP Victus Gaming Laptop (AMD Ryzen 5 5600H, NVIDIA GTX 1650 4GB VRAM, 8GB DDR4)

---

## TABLE OF CONTENTS
1. [Executive Summary & Core Philosophy](#1-executive-summary--core-philosophy)
2. [The Four Core Pillars](#2-the-four-core-pillars)
3. [Target Hardware Specifications & Optimization Strategy](#3-target-hardware-specifications--optimization-strategy)
4. [The 5-Stage Autonomous Execution Pipeline](#4-the-5-stage-autonomous-execution-pipeline)
5. [System Architecture & Module Reference](#5-system-architecture--module-reference)
6. [Tool Sandbox & Security Guardrails](#6-tool-sandbox--security-guardrails)
7. [Inference Engine Strategy (Local vs. Cloud vs. Hybrid)](#7-inference-engine-strategy-local-vs-cloud-vs-hybrid)
8. [Cross-Domain Capability Analysis (The 5 Domains)](#8-cross-domain-capability-analysis-the-5-domains)
9. [User Interfaces & Multi-Device Access (PC, Web, Mobile)](#9-user-interfaces--multi-device-access-pc-web-mobile)
10. [Repository File Tree & Directory Map](#10-repository-file-tree--directory-map)
11. [Operational Guide & Slash Commands](#11-operational-guide--slash-commands)

---

## 1. EXECUTIVE SUMMARY & CORE PHILOSOPHY

### 1.1 Project Mission
AegisWave AI is an autonomous, multipurpose personal artificial intelligence engineered from first principles to prioritize **Data Sovereignty**, **Factual Accuracy**, **System Reliability**, and **Portability**.

Unlike mainstream commercial AI assistants that stream sensitive prompts and documents to third-party corporate servers for model training, AegisWave AI operates as a **local-first, self-contained intelligence**. It enforces zero data leakage, runs inside an isolated workspace sandbox, grounds every factual or mathematical assertion in verified code execution, and travels with the user inside a single portable directory.

### 1.2 Brand Identity & Theme
* **Project Name:** AegisWave AI
* **Thematic Identity:** The Sovereign Sentinel
* **Core Motto:** *"Your intelligence. Your hardware. Zero compromise."*
* **Operational Mode:** Air-Gapped Local-First with Optional Redacted Cloud Supercharger

---

## 2. THE FOUR CORE PILLARS

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AEGISWAVE FOUNDATIONAL PILLARS                  │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. DATA SECURE    │ 2. ACCURATE       │ 3. RELIABLE    │ 4. PORTABLE   │
├───────────────────┼───────────────────┼────────────────┼───────────────┤
│ Zero telemetry    │ Empirical fact-   │ Sandbox jail   │ Single-folder │
│ Reversible PII    │ checking via      │ Path isolation │ Self-contained│
│ token masking     │ Accuracy Verifier │ Crash-resilient│ Zero global   │
│ Encrypted storage │ Zero hallucinated │ SQLite WAL     │ dependency    │
│ at rest (SQLite)  │ math or claims    │ state machine  │ pollution     │
└───────────────────┴───────────────────┴────────────────┴───────────────┘
```

### Pillar 1: Data Security (Zero-Leakage Sovereignty)
* **Real-Time PII & Secret Scrubbing:** Every user input passes through the `SecurityShield` before reaching any model reasoning layer.
* **Redaction Categories:** API keys (Stripe, GitHub, OpenAI, AWS), email addresses, IPv4 addresses, and Authorization Bearer headers.
* **Cryptographic Surrogate Tokens:** Sensitive strings are mapped into temporary surrogate identifiers (`<SECRET_KEY_1>`, `<EMAIL_2>`). Original secrets remain in local volatile memory and are restored only when rendering outputs back to the local user.
* **Local-Only Storage:** All session logs, audit trails, and learned facts are persisted strictly to `data/vault.db` on your local SSD.

### Pillar 2: Accuracy (Hallucination Elimination)
* **Empirical Verification Engine:** The `AccuracyVerifier` module intercepts proposed responses and compares every numerical and factual assertion against raw tool execution evidence.
* **AST-Restricted Math:** Mathematical operations are evaluated through safe Abstract Syntax Tree (AST) parsers rather than stochastic model guesses.
* **Ground Truth Auditing:** If the model claims an event count that contradicts raw file contents, the response is flagged or corrected before delivery.

### Pillar 3: Reliability (Execution Safety & Self-Healing)
* **Workspace Path Jailing:** The `SecuritySandbox` strictly restricts file reads, writes, and directory inspections to authorized project boundaries (`D:\HiddenWave\Projects\My_Bot`). Traversal attempts (such as accessing `C:\Windows\System32`) raise immediate security permission exceptions.
* **Persistent Checkpointing:** Multi-turn conversation sessions and audit trails are preserved in SQLite Write-Ahead Logging (WAL) mode, surviving unexpected power losses or system reboots.

### Pillar 4: Portability (Run Anywhere)
* **Self-Contained Root:** All code, configuration, databases, and local neural weights reside inside `D:\HiddenWave\Projects\My_Bot`.
* **Zero Path Hardcoding:** Relative path resolution allows the entire project directory to be cloned to an external SSD or moved to another PC without breaking imports.

---

## 3. TARGET HARDWARE SPECIFICATIONS & OPTIMIZATION STRATEGY

### 3.1 Hardware Profile (HP Victus 15/16 Gaming Laptop)
* **Processor (CPU):** AMD Ryzen 5 5600H (6 Cores / 12 Threads, 3.3 GHz Base up to 4.2 GHz Boost, Zen 3, 16MB L3 Cache)
* **Dedicated GPU:** NVIDIA GeForce GTX 1650 Laptop GPU (4 GB GDDR6 Dedicated VRAM, Turing Architecture, Compute Capability 7.5, 50W TGP)
* **Integrated GPU:** AMD Radeon Graphics (~496 MB shared memory)
* **System RAM:** 8 GB DDR4 (Single 1x8GB Stick @ 3200 MHz, SODIMM upgradeable to 32 GB)
* **Storage:** 512 GB NVMe PCIe M.2 SSD (+ 1 Secondary M.2 Expansion Slot)
* **Operating System:** Microsoft Windows 11 (build 26300+)

### 3.2 Hardware Optimization Strategy
1. **GPU VRAM Safe Budgeting (3.2 GB Limit):** Windows allocates ~600-800 MB VRAM for desktop display composition. To ensure zero CUDA Out-Of-Memory (OOM) errors, local neural models are restricted to **Q4_K_M quantized 1B to 3.8B parameter architectures** (e.g., `Llama-3.2-3B-Instruct`), requiring ~1.9 to 2.2 GB VRAM.
2. **System RAM Protection:** With 8 GB total system RAM and Windows 11 idling at ~3.5 to 4.5 GB, inference is prioritized on the dedicated GTX 1650 GPU. This keeps system RAM available for background applications, compilers, and browser sessions.
3. **Thread Parallelism:** Data processing, scraping, and embedding tasks are allocated up to 8 worker threads on the Ryzen 5 5600H without starving core OS scheduling.

---

## 4. THE 5-STAGE AUTONOMOUS EXECUTION PIPELINE

```
 [User Input Prompt]
         │
         ▼
 ┌────────────────────────────────────────────────────────┐
 │ STAGE 1: SECURITY SHIELD                               │
 │ • Scans for API tokens, passwords, emails, IPs         │
 │ • Replaces sensitive items with surrogate tokens       │
 │ • Writes timestamped audit log to vault.db             │
 └───────────────────────┬────────────────────────────────┘
                         ▼
 ┌────────────────────────────────────────────────────────┐
 │ STAGE 2: REASONING & INTENT ROUTER                     │
 │ • Pulls multi-turn conversational context from SQLite  │
 │ • Evaluates intent: Conversational vs. Tool Action     │
 │ • Selects optimal engine (Local GGUF ↔ Cloud ↔ Core)  │
 └───────────────────────┬────────────────────────────────┘
                         ▼
 ┌────────────────────────────────────────────────────────┐
 │ STAGE 3: SANDBOXED TOOL RUNNER                         │
 │ • Resolves paths through SecuritySandbox (Path Jail)   │
 │ • Executes safe operations: Files, Math, Telemetry, Web│
 │ • Captures raw stdout & observation evidence           │
 └───────────────────────┬────────────────────────────────┘
                         ▼
 ┌────────────────────────────────────────────────────────┐
 │ STAGE 4: ACCURACY VERIFIER (THE CRITIC)                │
 │ • Audits proposed claims against tool observations     │
 │ • Checks mathematical congruence and file evidence     │
 │ • Flags or rejects hallucinations                      │
 └───────────────────────┬────────────────────────────────┘
                         ▼
 ┌────────────────────────────────────────────────────────┐
 │ STAGE 5: LOCAL VAULT PERSISTENCE & USER DELIVERY       │
 │ • Restores surrogate tokens back to original values    │
 │ • Commits session messages & audit trail to SQLite WAL │
 │ • Displays rich formatted response to user             │
 └────────────────────────────────────────────────────────┘
```

---

## 5. SYSTEM ARCHITECTURE & MODULE REFERENCE

### 5.1 Configuration Subsystem (`config/`)
* **`settings.py`:** Centralized environment paths, sandbox allowlists, max output byte thresholds, and default model identifiers.
* **`hardware_profile.json`:** Formal machine profile specifying Ryzen 5 core counts, GTX 1650 VRAM limits, and layer-offloading guidelines.

### 5.2 Security Subsystem (`bot/security/`)
* **`shield.py` (`SecurityShield`):** High-speed regex and entropy sanitizer. Maintains bidirectional token mapping tables (`redaction_map` and `reverse_map`).
* **`sandbox.py` (`SecuritySandbox`):** Enforces path jailing via strict `relative_to` validation against authorized project root directories.

### 5.3 Memory & Storage Subsystem (`bot/memory/`)
* **`vault.py` (`LocalVault`):** Manages SQLite connection with `PRAGMA journal_mode=WAL;` and `PRAGMA synchronous=NORMAL;`.
  * **Table `memory`:** Key-value store for long-term user preferences, project notes, and learned facts.
  * **Table `conversation`:** Chronological session message store with metadata tagging.
  * **Table `audit_logs`:** Forensic action ledger recording timestamps, action names, parameters, and success/blocked statuses.

### 5.4 Tool Subsystem (`bot/tools/`)
* **`registry.py` (`ToolRegistry`):** Dynamic registration decorator mapping tool names, JSON schemas, documentation, and risk levels (`SAFE`, `CONFIRMATION_REQUIRED`, `RESTRICTED`).
* **`files.py`:** Sandbox-bounded file reading, writing, and directory listing.
* **`system.py`:** Real-time hardware telemetry querying CPU utilization, RAM usage, battery charge/plug state, and NVMe disk availability via `psutil`.
* **`math_tool.py`:** Recursive AST-based mathematical evaluation engine supporting arithmetic, powers, square roots, trigonometric functions, and logarithms.
* **`web.py`:** Headless HTTP GET scraper using `BeautifulSoup` to strip navigational boilerplate, scripts, and styling to return clean plain text.

### 5.5 Inference & Provider Subsystem (`bot/models/`)
* **`base.py`:** Defines `BaseModelProvider`, `ModelResponse`, and `ToolCallRequest` dataclasses.
* **`router.py` (`ModelRouter`):** Automated provider discovery engine prioritizing Local In-Process GGUF (`GPT4All`) → Local Daemon (`Ollama`) → Sovereign Cloud (`Gemini/Groq/OpenAI`) → Conversational Core Fallback.
* **`gpt4all_provider.py` (`GPT4AllProvider`):** Direct in-process neural execution of GGUF model weights on CPU/CUDA.
* **`cloud_provider.py` (`CloudProvider`):** REST API client for Google Gemini 2.0 Flash, Groq Llama 3.3 70B, and OpenAI GPT-4o-mini with pre-scrubbed prompts.
* **`rule_engine.py` (`RuleEngineProvider`):** Zero-dependency offline conversational core providing warm interactive persona, identity explanation, and deterministic tool dispatching.

### 5.6 Orchestration Subsystem (`bot/core/`)
* **`agent.py` (`AegisAgent`):** Main autonomous reasoning loop coordinating stages 1 through 5, multi-turn history contextualization, and step tracking.
* **`verifier.py` (`AccuracyVerifier`):** Empirical fact-checking engine auditing numerical claims and verifying tool exit codes.

---

## 6. TOOL SANDBOX & SECURITY GUARDRAILS

### 6.1 Path Jailing Rules
All file operations must pass through `SecuritySandbox.resolve_safe_path()`. If a path resolves outside `D:\HiddenWave\Projects\My_Bot`, a `PermissionError` is immediately raised, logged to `audit_logs`, and returned as a blocked action.

### 6.2 Data Scrubbing Specification
| Entity Type | Regex Pattern Sample | Surrogate Identifier |
| :--- | :--- | :--- |
| Secret API Keys | `(?:sk_|key-|secret_|ghp_)[a-zA-Z0-9_\-]{14,}` | `<SECRET_KEY_N>` |
| Email Addresses | `[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+` | `<EMAIL_N>` |
| IPv4 Addresses | `\b(?:\d{1,3}\.){3}\d{1,3}\b` | `<IPV4_N>` |
| Authorization Bearer | `(?i)bearer\s+[a-zA-Z0-9\-\._~\+\/]+=*` | `<AUTH_BEARER_N>` |

---

## 7. INFERENCE ENGINE STRATEGY (LOCAL VS. CLOUD VS. HYBRID)

### 7.1 Option A: 100% Offline Local Neural Engine
* **Model:** `Llama-3.2-3B-Instruct-Q4_0.gguf` (~1.92 GB)
* **Execution:** Direct in-process via `gpt4all` with CUDA GPU acceleration.
* **VRAM Footprint:** ~2.1 GB VRAM (fits 100% inside your 4GB GTX 1650).
* **Speed:** ~35–50 tokens/sec.
* **Privacy:** Air-gapped. Zero bytes leave your laptop.

### 7.2 Option B: Sovereign Cloud Engine
* **Model:** Google Gemini 2.0 Flash / Groq Llama 3.3 70B.
* **Execution:** Encrypted HTTPS REST calls.
* **Privacy:** SecurityShield scrubs credentials and PII prior to outbound transmission.
* **Advantage:** 1M+ token context window, native multimodal image and audio comprehension.

### 7.3 The Hybrid Recommendation
The bot dynamically switches between both engines:
1. **Local Neural Brain (Option A)** handles daily chat, private document Q&A, confidential code audits, and offline terminal assistance.
2. **Sovereign Cloud Engine (Option B)** activates when analyzing giant 200-page books, reading high-resolution images, or solving complex multi-file architectural refactors.

---

## 8. CROSS-DOMAIN CAPABILITY ANALYSIS (THE 5 DOMAINS)

| Domain | Option A (Local Llama 3.2 3B) | Option B (Sovereign Cloud) | Technical Implementation |
| :--- | :---: | :---: | :--- |
| **1. Text & Language** | High (Up to 8k context) | Massive (1M+ context) | Multilingual translation, summarization, email composition |
| **2. Creativity** | Good (Daily copy, outlines) | Master (Poetry, scripts, humor) | Narrative drafting, tone calibration, brainstorming |
| **3. Data & Logic** | Verified (AST Math + Python) | Advanced (Multi-step logic) | Code debugging, SQL formulation, algorithmic analysis |
| **4. Vision & Sound** | Requires local Whisper/Moondream | Native Multimodal (Gemini) | Image OCR, UI diagram inspection, audio transcription |
| **5. Automation** | Sandboxed Local Execution | Sandboxed Local Execution | Path-jailed file I/O, live telemetry, web scraping |

---

## 9. USER INTERFACES & MULTI-DEVICE ACCESS

### 9.1 Rich Terminal CLI (`bot/main.py`)
* Interactive terminal with ANSI colors, live spinners, step trace badges (`[SHIELD]`, `[TOOL]`, `[VERIFY]`), and formatted markdown panels.
* Built-in UTF-8 console reconfiguring preventing Windows CP1252 charmap encoding crashes.

### 9.2 Mobile & Web Gateway Server (`web/server.py`)
* Lightweight REST API running on port `5000` via Flask and CORS.
* Endpoints:
  * `POST /api/chat` — Accepts JSON prompt, executes agent pipeline, returns structured steps and verified response.
  * `GET /api/telemetry` — Live hardware diagnostic metrics.
  * `GET /api/audit` — Recent security shield ledger.
  * `GET /api/memories` — Stored long-term knowledge keys.

### 9.3 Mobile Phone Access (PWA & LAN)
1. Ensure laptop and mobile phone are on the same local Wi-Fi (or connected over Tailscale VPN).
2. On your phone's browser, navigate to: `http://<your-laptop-ip>:5000`.
3. In Chrome/Safari, tap **"Add to Home Screen"** to install as a native, zero-latency mobile web app.

---

## 10. REPOSITORY FILE TREE & DIRECTORY MAP

```text
D:\HiddenWave\Projects\My_Bot\
│
├── start_bot.py                   # Universal Interactive Entrypoint Menu
├── download_model.py              # Automated 1.9GB Local Neural Model Downloader
├── launch_gui.py                  # Standalone GUI HTTP Server Launcher (Port 8765)
├── prototype.py                   # Standard Library Architectural Proof of Concept
├── README.md                      # Quickstart & Repository Overview
├── AEGISWAVE_MASTER_MANUAL.md     # Comprehensive Engineering Specification (This File)
│
├── config/                        # Hardware & Security Policy Configuration
│   ├── hardware_profile.json      # HP Victus GPU/CPU memory specifications
│   └── settings.py                # Environment paths, sandbox boundaries, limits
│
├── bot/                           # Primary Application Package
│   ├── __init__.py                # Package version metadata
│   ├── main.py                    # Rich Interactive Terminal CLI Client
│   │
│   ├── core/                      # Autonomous Reasoning & Fact-Checking
│   │   ├── __init__.py
│   │   ├── agent.py               # 5-Stage ReAct Autonomous Execution Loop
│   │   └── verifier.py            # Accuracy & Hallucination Auditor (The Critic)
│   │
│   ├── security/                  # Cryptographic & Sandbox Guardrails
│   │   ├── __init__.py
│   │   ├── shield.py              # Real-Time PII & Secret Redaction Engine
│   │   └── sandbox.py             # Filesystem Path Jailing Validator
│   │
│   ├── memory/                    # Persistent Storage Subsystem
│   │   ├── __init__.py
│   │   └── vault.py               # SQLite WAL Storage (Memory, Chat, Audit Logs)
│   │
│   ├── tools/                     # Sandboxed Execution Tool Ecosystem
│   │   ├── __init__.py            # Default Tool Registry Assembly
│   │   ├── registry.py            # Dynamic Tool Decorator & Parameter Schemas
│   │   ├── files.py               # Safe Read, Write, and Directory Listing
│   │   ├── system.py              # Live Ryzen CPU, RAM, Disk, Battery Telemetry
│   │   ├── math_tool.py           # AST-Safe Mathematical Evaluator
│   │   └── web.py                 # Ad-Free Web Page Text Extraction Tool
│   │
│   └── models/                    # Model Inference & Provider Abstractions
│       ├── __init__.py
│       ├── base.py                # Abstract Base Provider Interface
│       ├── router.py              # Automated Engine Discovery & Failover Router
│       ├── gpt4all_provider.py    # Direct In-Process GGUF Neural Engine
│       ├── ollama_provider.py     # Local Ollama HTTP Daemon Connector
│       ├── cloud_provider.py      # Sovereign Cloud REST Client (Gemini/Groq/OpenAI)
│       └── rule_engine.py         # Conversational Persona Core & Fallback
│
├── web/                           # Gateway & Remote Networking Layer
│   └── server.py                  # Flask REST API & Web Server (Port 5000)
│
├── gui_demo/                      # Visual Architecture Interactive Dashboard
│   └── index.html                 # Modern Responsive UI with Live API Connectors
│
├── knowledge/                     # [Drop Files Here] Offline Document Indexing Folder
│
└── data/                          # [Git-Ignored] Local Runtime Storage
    ├── vault.db                   # SQLite WAL Database (Audit Logs & Memories)
    └── models/                    # Storage Directory for GGUF Neural Model Weights
```

---

## 11. OPERATIONAL GUIDE & SLASH COMMANDS

### 11.1 Launching the Bot
```powershell
# Open Universal Launcher Menu:
python start_bot.py

# Launch Rich Terminal CLI directly:
python bot/main.py

# Launch Web & Mobile Server directly:
python web/server.py

# Run Hardware Diagnostics directly:
python -c "from bot.tools.system import get_system_telemetry; print(get_system_telemetry())"
```

### 11.2 Terminal Slash Commands
* `/telemetry` — Displays live CPU utilization, system RAM usage, and battery state.
* `/vault` — Lists all long-term facts, preferences, and keys stored in local SQLite memory.
* `/audit` — Renders a table of recent security shield and tool execution audit records.
* `/clear` — Resets conversational history context for the current thread.
* `/help` — Displays command table.
* `/exit` — Shuts down session cleanly.

---
*End of Master System Specification.*
