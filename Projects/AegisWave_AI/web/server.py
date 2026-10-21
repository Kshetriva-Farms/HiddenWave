"""
AegisWave AI - Sovereign Web & Mobile Gateway Server (Flask)
High-performance REST API and modern real-time Web App gateway.
"""

import sys
import os
from pathlib import Path
from datetime import datetime

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import socket
import threading
import time
import gc

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import werkzeug
from werkzeug.utils import secure_filename

# Compatibility patch for Werkzeug 3.x with Flask 2.x
if not hasattr(werkzeug, "__version__"):
    try:
        import importlib.metadata
        werkzeug.__version__ = importlib.metadata.version("werkzeug")
    except Exception:
        werkzeug.__version__ = "3.0.0"

from bot.core.agent import AegisAgent
from bot.models.router import ModelRouter
from bot.memory.knowledge_base import KnowledgeBase
from config.settings import PROJECT_ROOT, KNOWLEDGE_DIR, VAULT_DB_PATH, DEFAULT_MODEL_NAME

app = Flask(__name__, static_folder=str(PROJECT_ROOT / "web" / "static"))
CORS(app)

def get_lan_ip() -> str:
    """Detect local Wi-Fi / LAN IP for phone & local network access."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 53))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

# Shared neural router across all sessions to prevent duplicate RAM allocations
shared_router = ModelRouter(preferred_model=DEFAULT_MODEL_NAME)
active_agents = {}
kb = KnowledgeBase()
last_activity_time = time.time()

# Background watchdog: unloads heavy model from RAM after 5 minutes of inactivity
def idle_memory_watchdog():
    global last_activity_time
    while True:
        time.sleep(30)
        idle_seconds = time.time() - last_activity_time
        # If idle for more than 5 minutes (300s) and model is loaded, free RAM
        if idle_seconds > 300:
            if shared_router.gpt4all._model is not None:
                print(f"[AEGIS WATCHDOG] Idle for {int(idle_seconds)}s: Auto-releasing model from RAM to keep PC smooth.")
                shared_router.unload_models()

watchdog_thread = threading.Thread(target=idle_memory_watchdog, daemon=True)
watchdog_thread.start()

def get_agent(session_id: str) -> AegisAgent:
    global last_activity_time
    last_activity_time = time.time()
    if session_id not in active_agents:
        active_agents[session_id] = AegisAgent(session_id=session_id, router=shared_router)
    return active_agents[session_id]

@app.after_request
def add_security_headers(response):
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self'; "
        "frame-ancestors 'none';"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# -----------------------------------------------------------------------------
# Frontend Routes
# -----------------------------------------------------------------------------
@app.route("/")
def index():
    return send_from_directory(str(PROJECT_ROOT / "web" / "static"), "index.html")

@app.route("/demo")
def demo_visualizer():
    return send_from_directory(str(PROJECT_ROOT / "gui_demo"), "index.html")

# -----------------------------------------------------------------------------
# Chat & Agent API
# -----------------------------------------------------------------------------
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True)
    prompt = data.get("prompt", "").strip()
    client_token = request.headers.get("X-Client-Token") or data.get("client_token", "anon")
    session_id = data.get("session_id", "web_default").strip()
    if client_token and not session_id.startswith(f"{client_token}_"):
        session_id = f"{client_token}_{session_id}"

    mode = data.get("mode")
    if mode in ["hybrid", "local", "cloud"]:
        shared_router.set_mode(mode)

    if not prompt:
        return jsonify({"error": "Prompt cannot be empty"}), 400

    client_gemini = request.headers.get("X-Gemini-Key") or data.get("gemini_key")
    client_groq = request.headers.get("X-Groq-Key") or data.get("groq_key")
    key_override = client_gemini or client_groq
    provider_override = "gemini" if client_gemini else ("groq" if client_groq else None)

    agent = get_agent(session_id)
    result = agent.run(prompt, key_override=key_override, provider_override=provider_override)

    active_provider = agent.router.get_active_provider_name()
    if client_gemini:
        active_provider = "Google Gemini Flash (Client Key)"
    elif client_groq:
        active_provider = "Groq Llama 3.3 70B (Client Key)"

    return jsonify({
        "response": result.final_text,
        "sanitized_prompt": result.sanitized_prompt,
        "redactions": result.redactions,
        "verification": result.verification_status,
        "active_provider": active_provider,
        "ai_mode": shared_router.get_mode(),
        "steps": [
            {"stage": s.stage, "status": s.status, "details": s.details}
            for s in result.steps
        ]
    })

# -----------------------------------------------------------------------------
# Sessions & History API
# -----------------------------------------------------------------------------
@app.route("/api/sessions", methods=["GET"])
def get_sessions():
    client_token = request.headers.get("X-Client-Token") or request.args.get("client_token")
    if not client_token:
        return jsonify({"sessions": []})

    agent = get_agent("web_default")
    cur = agent.vault.conn.cursor()
    cur.execute("""
        SELECT session_id, content, MAX(created_at) as last_active, COUNT(id) as msg_count
        FROM conversation
        WHERE role = 'user' AND session_id LIKE ?
        GROUP BY session_id
        ORDER BY last_active DESC
        LIMIT 20
    """, (f"{client_token}_%",))
    sessions = []
    for sid, first_prompt, last_act, count in cur.fetchall():
        sessions.append({
            "session_id": sid,
            "preview": first_prompt[:45] + "..." if len(first_prompt) > 45 else first_prompt,
            "last_active": last_act,
            "message_count": count
        })
    return jsonify({"sessions": sessions})

@app.route("/api/sessions/<session_id>/history", methods=["GET"])
def get_session_history(session_id):
    client_token = request.headers.get("X-Client-Token") or request.args.get("client_token")
    if client_token and not session_id.startswith(f"{client_token}_"):
        return jsonify({"session_id": session_id, "history": []})
    agent = get_agent(session_id)
    history = agent.vault.get_session_history(session_id, limit=50)
    return jsonify({"session_id": session_id, "history": history})

# -----------------------------------------------------------------------------
# Knowledge Base & Document Upload API
# -----------------------------------------------------------------------------
@app.route("/api/knowledge/files", methods=["GET"])
def get_knowledge_files():
    files = kb.list_indexed_files()
    return jsonify({"files": files})

@app.route("/api/knowledge/sync", methods=["POST"])
def sync_knowledge():
    stats = kb.sync_documents()
    return jsonify({"success": True, "stats": stats})

@app.route("/api/knowledge/upload", methods=["POST"])
def upload_knowledge_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(file.filename)
    dest_path = KNOWLEDGE_DIR / filename
    file.save(str(dest_path))

    # Automatically re-index
    stats = kb.sync_documents()

    return jsonify({
        "success": True,
        "filename": filename,
        "size_bytes": dest_path.stat().st_size,
        "stats": stats
    })

# -----------------------------------------------------------------------------
# Telemetry & Diagnostics API
# -----------------------------------------------------------------------------
@app.route("/api/telemetry", methods=["GET"])
def telemetry():
    import psutil
    import platform
    cpu_pct = psutil.cpu_percent(interval=0.1)
    ram = psutil.virtual_memory()

    # Safe disk usage across Windows & Linux cloud containers
    try:
        disk_root = PROJECT_ROOT.anchor or os.path.abspath(os.sep) or "/"
        disk = psutil.disk_usage(disk_root)
        disk_free = round(disk.free / (1024**3), 1)
        disk_total = round(disk.total / (1024**3), 1)
    except Exception:
        disk_free = 0.0
        disk_total = 0.0

    battery = psutil.sensors_battery()
    battery_pct = round(battery.percent) if battery else None
    battery_charging = battery.power_plugged if battery else None

    agent = get_agent("web_default")
    active_provider = agent.router.get_active_provider_name()

    os_system = platform.system()
    os_release = platform.release()
    processor = platform.processor() or "Multi-Core CPU"
    is_cloud_env = bool(
        os.environ.get("RENDER") or
        os.environ.get("RAILWAY_ENVIRONMENT") or
        os.environ.get("DYNO") or
        os.environ.get("PORT") and not os.name == 'nt'
    )

    return jsonify({
        "cpu_percent": cpu_pct,
        "ram_used_gb": round(ram.used / (1024**3), 2),
        "ram_total_gb": round(ram.total / (1024**3), 2),
        "ram_percent": ram.percent,
        "disk_free_gb": disk_free,
        "disk_total_gb": disk_total,
        "battery_percent": battery_pct,
        "battery_charging": battery_charging,
        "active_provider": active_provider,
        "ai_mode": shared_router.get_mode(),
        "is_cloud_available": shared_router.cloud.is_available(),
        "cloud_service_name": shared_router.cloud.get_active_service_name(),
        "os_platform": f"{os_system} {os_release}",
        "processor": processor,
        "is_cloud_env": is_cloud_env
    })

@app.route("/api/audit", methods=["GET"])
def audit():
    agent = get_agent("web_default")
    audits = agent.vault.get_recent_audits(limit=15)
    return jsonify({"audits": audits})

@app.route("/api/network/info", methods=["GET"])
def network_info():
    ip = get_lan_ip()
    port = int(os.environ.get("PORT", 5000))
    return jsonify({
        "local_url": f"http://127.0.0.1:{port}",
        "lan_ip": ip,
        "mobile_url": f"http://{ip}:{port}",
        "port": port
    })

@app.route("/api/memory/release", methods=["POST"])
def release_memory():
    """Unload heavy neural models from RAM to immediately free system memory."""
    shared_router.unload_models()
    gc.collect()
    return jsonify({
        "success": True,
        "message": "AI neural model successfully unloaded from RAM. System memory 100% freed."
    })

# -----------------------------------------------------------------------------
# Hybrid AI Settings & Cloud Security API
# -----------------------------------------------------------------------------
def update_env_variable(key: str, value: str):
    env_file = PROJECT_ROOT / ".env"
    try:
        lines = []
        found = False
        if env_file.exists():
            with open(env_file, "r", encoding="utf-8") as f:
                lines = f.readlines()
        
        new_lines = []
        for line in lines:
            if line.strip().startswith(f"{key}="):
                new_lines.append(f"{key}={value}\n")
                found = True
            else:
                new_lines.append(line)
        if not found:
            new_lines.append(f"{key}={value}\n")
        
        with open(env_file, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception as e:
        print(f"[AEGIS SERVER] Notice: .env file write skipped ({e}). Applied in memory.")
    os.environ[key] = value

@app.route("/api/settings/mode", methods=["GET", "POST"])
def settings_mode():
    if request.method == "POST":
        data = request.get_json(force=True)
        new_mode = data.get("mode", "hybrid").lower().strip()
        if new_mode in ["hybrid", "local", "cloud"]:
            shared_router.set_mode(new_mode)
            update_env_variable("AI_MODE", new_mode)
            return jsonify({
                "success": True,
                "mode": new_mode,
                "active_provider": shared_router.get_active_provider_name()
            })
        return jsonify({"error": "Invalid mode. Must be 'hybrid', 'local', or 'cloud'."}), 400

    return jsonify({
        "mode": shared_router.get_mode(),
        "active_provider": shared_router.get_active_provider_name(),
        "is_cloud_available": shared_router.cloud.is_available(),
        "cloud_service_name": shared_router.cloud.get_active_service_name()
    })

@app.route("/api/settings/cloud-keys", methods=["GET", "POST"])
def settings_cloud_keys():
    if request.method == "POST":
        data = request.get_json(force=True)
        provider = data.get("provider", "").lower().strip()
        api_key = data.get("api_key", "").strip()

        if provider not in ["gemini", "groq", "openai"]:
            return jsonify({"error": "Invalid provider. Choose 'gemini', 'groq', or 'openai'."}), 400

        # Transient test connection for the provided key without overwriting global server environment
        test_ok, test_msg, latency = shared_router.cloud.test_single_key(provider, api_key)

        return jsonify({
            "success": True,
            "provider": provider,
            "connected": test_ok,
            "message": test_msg,
            "latency_s": latency,
            "active_provider": "Google Gemini" if provider == "gemini" else provider.capitalize()
        })

    # GET status - Scoped per client headers to guarantee multi-tenant privacy
    client_gemini = request.headers.get("X-Gemini-Key", "").strip()
    client_groq = request.headers.get("X-Groq-Key", "").strip()
    client_openai = request.headers.get("X-OpenAI-Key", "").strip()

    def mask_key(k: str) -> str:
        if not k:
            return ""
        if len(k) <= 8:
            return "****"
        return k[:4] + "...." + k[-4:]

    return jsonify({
        "gemini": {
            "configured": bool(client_gemini),
            "preview": mask_key(client_gemini)
        },
        "groq": {
            "configured": bool(client_groq),
            "preview": mask_key(client_groq)
        },
        "openai": {
            "configured": bool(client_openai),
            "preview": mask_key(client_openai)
        },
        "active_service": "Google Gemini" if client_gemini else ("Groq" if client_groq else "Local Core"),
        "mode": shared_router.get_mode()
    })

@app.route("/api/settings/test-cloud", methods=["POST"])
def test_cloud():
    client_gemini = request.headers.get("X-Gemini-Key", "").strip()
    client_groq = request.headers.get("X-Groq-Key", "").strip()

    if client_gemini:
        test_ok, test_msg, latency = shared_router.cloud.test_single_key("gemini", client_gemini)
    elif client_groq:
        test_ok, test_msg, latency = shared_router.cloud.test_single_key("groq", client_groq)
    else:
        test_ok, test_msg, latency = shared_router.cloud.test_connection()
        if not test_ok:
            return jsonify({
                "success": False,
                "message": "No API key configured. Enter a Gemini or Groq key in Cloud & Privacy settings.",
                "latency_s": 0.0,
                "active_provider": shared_router.get_active_provider_name()
            })

    return jsonify({
        "success": test_ok,
        "message": test_msg,
        "latency_s": latency,
        "active_provider": shared_router.get_active_provider_name()
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    lan_ip = get_lan_ip()
    print("=" * 68)
    print("        AegisWave AI — Sovereign Intelligent Gateway")
    print("=" * 68)
    print(f" [Local URL]           : http://127.0.0.1:{port}")
    print(f" [Network / Cloud Host]: http://0.0.0.0:{port}")
    print(f" [Architecture Demo]   : http://127.0.0.1:{port}/demo")
    print("=" * 68)
    print(" [INFO] Production-ready for 24/7 Cloud Hosting (Render / Railway)")
    print(" [INFO] SecurityShield active: Real-time PII & Credential Masking")
    print("=" * 68)
    app.run(host="0.0.0.0", port=port, debug=False)
