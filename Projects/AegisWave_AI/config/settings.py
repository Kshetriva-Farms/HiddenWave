"""
AegisWave AI - Configuration & Settings
Loads hardware limits, manages directory paths, and sets default security policies.
"""

import json
from pathlib import Path
from typing import Dict, Any

try:
    from dotenv import load_dotenv
    HAS_DOTENV = True
except ImportError:
    HAS_DOTENV = False

# Root Paths
PROJECT_ROOT = Path(__file__).parent.parent.resolve()
CONFIG_DIR = PROJECT_ROOT / "config"
DATA_DIR = PROJECT_ROOT / "data"
VAULT_DB_PATH = DATA_DIR / "vault.db"
MODELS_DIR = DATA_DIR / "models"
KNOWLEDGE_DIR = PROJECT_ROOT / "knowledge"

if HAS_DOTENV:
    load_dotenv(PROJECT_ROOT / ".env")

# Ensure runtime directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)

# Hardware Profile
HARDWARE_PROFILE_PATH = CONFIG_DIR / "hardware_profile.json"

def load_hardware_profile() -> Dict[str, Any]:
    if HARDWARE_PROFILE_PATH.exists():
        try:
            with open(HARDWARE_PROFILE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "device": {"model": "Generic PC"},
        "runtime_optimization": {
            "default_engine": "mock_or_local",
            "recommended_models": {
                "general": "llama3.2:3b",
                "coding": "qwen2.5-coder:3b"
            }
        }
    }

HARDWARE_CONFIG = load_hardware_profile()

# Security & Sandbox Policies
SANDBOX_ALLOW_PATHS = [
    PROJECT_ROOT,
]

MAX_TOOL_OUTPUT_BYTES = 50_000
MAX_REACT_STEPS = 6
DEFAULT_MODEL_NAME = HARDWARE_CONFIG.get("runtime_optimization", {}).get("recommended_models", {}).get("general", "llama3.2:3b")
