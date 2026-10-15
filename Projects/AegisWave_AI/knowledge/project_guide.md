# AegisWave AI — Project Knowledge Guide

## Core Architecture Principles
AegisWave is built on four sovereign principles:
1. **Data Security:** All private keys, client emails, and IP addresses are masked before model processing.
2. **Empirical Accuracy:** Mathematical results and factual statements must be grounded in raw execution evidence.
3. **Sandbox Reliability:** Tools cannot escape `D:\HiddenWave\Projects\My_Bot`.
4. **Portability:** Self-contained single-directory operation.

## Hardware Configuration (HP Victus)
- CPU: AMD Ryzen 5 5600H (6 Cores / 12 Threads)
- Dedicated GPU: NVIDIA GeForce GTX 1650 (4 GB GDDR6)
- System Memory: 8 GB DDR4 (3200 MHz)
- Storage: 512 GB NVMe SSD
- Local Neural Model: Llama-3.2-3B-Instruct-Q4_0.gguf

## Deployment & Ports
- Rich Terminal CLI: `python bot/main.py`
- Web & Mobile Gateway: Port 5000 (`python web/server.py`)
- Visual Architecture Guide: Port 8765 (`python launch_gui.py`)
- Local Database Vault: `data/vault.db` (SQLite Write-Ahead Logging mode)
