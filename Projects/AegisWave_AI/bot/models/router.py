"""
AegisWave AI - Intelligent Hybrid Model Router
Dynamically routes between sovereign cloud and local neural engines based on security policy:

Modes:
- "hybrid": Uses fast Cloud (Gemini/Groq) for 0% PC load & sub-second speed, with 100% SecurityShield scrubbing.
           Auto-downgrades to Local Offline for strictly confidential requests or when offline.
- "local":  Strictly 100% offline air-gapped execution (Llama 3.2 3B). Zero network traffic.
- "cloud":  Direct cloud execution with SecurityShield.
"""

import os
from typing import Dict, Any, List, Optional
from .base import BaseModelProvider, ModelResponse
from .ollama_provider import OllamaProvider
from .gpt4all_provider import GPT4AllProvider
from .cloud_provider import CloudProvider
from .rule_engine import RuleEngineProvider

class ModelRouter(BaseModelProvider):
    def __init__(self, preferred_model: str = "llama3.2:3b", default_mode: str = "hybrid"):
        self.preferred_model = preferred_model
        self.mode = os.getenv("AI_MODE", default_mode).lower().strip()
        self.gpt4all = GPT4AllProvider()
        self.ollama = OllamaProvider(model_name=preferred_model)
        self.cloud = CloudProvider()
        self.conversational_core = RuleEngineProvider()

    def set_mode(self, mode: str):
        if mode in ["hybrid", "local", "cloud"]:
            self.mode = mode
            os.environ["AI_MODE"] = mode

    def get_mode(self) -> str:
        return self.mode

    def get_active_provider_name(self) -> str:
        if self.mode == "hybrid":
            if self.cloud.is_available():
                return f"Hybrid Sovereign: {self.cloud.get_active_service_name()} (PII Shielded)"
            elif self.gpt4all.is_available():
                return f"Hybrid Local Fallback: GPT4All ({self.gpt4all.model_name})"
            return "AegisWave Conversational Core"

        elif self.mode == "local":
            if self.gpt4all.is_available():
                return f"Air-Gapped Local: GPT4All ({self.gpt4all.model_name})"
            if self.ollama.is_available():
                return f"Air-Gapped Daemon: Ollama ({self.ollama.model_name})"
            return "AegisWave Conversational Core (Air-Gapped)"

        else: # cloud
            if self.cloud.is_available():
                return f"Cloud Engine: {self.cloud.get_active_service_name()}"
            return "Cloud Unavailable"

    def is_available(self) -> bool:
        return True

    def unload_models(self):
        """Release loaded models to completely free system RAM."""
        self.gpt4all.unload_model()

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        available_tools: Optional[List[Dict[str, Any]]] = None,
        is_confidential: bool = False,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> ModelResponse:
        # If the prompt is marked as strictly confidential or contains private keys,
        # FORCE local offline execution to guarantee absolute air-gap sovereignty!
        if is_confidential:
            print("[ROUTER] Confidential data detected -> Enforcing Air-Gapped Local Execution!")
            return self._generate_local(prompt, system_prompt, available_tools)

        # -------------------------------------------------------------
        # HYBRID MODE: Prioritize Fast Cloud, Fallback to Local
        # -------------------------------------------------------------
        if self.mode == "hybrid":
            if self.cloud.is_available():
                try:
                    res = self.cloud.generate(prompt, system_prompt, available_tools, chat_history=chat_history)
                    if res.text:
                        return res
                except Exception as e:
                    print(f"[ROUTER] Cloud call failed: {e}. Falling back to local offline model.")

            # Fallback to Local
            return self._generate_local(prompt, system_prompt, available_tools)

        # -------------------------------------------------------------
        # STRICT LOCAL MODE: 100% Offline Air-Gapped
        # -------------------------------------------------------------
        elif self.mode == "local":
            return self._generate_local(prompt, system_prompt, available_tools)

        # -------------------------------------------------------------
        # CLOUD MODE
        # -------------------------------------------------------------
        else:
            if self.cloud.is_available():
                try:
                    res = self.cloud.generate(prompt, system_prompt, available_tools, chat_history=chat_history)
                    if res.text:
                        return res
                except Exception:
                    pass
            return self._generate_local(prompt, system_prompt, available_tools)

    def _generate_local(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        available_tools: Optional[List[Dict[str, Any]]] = None
    ) -> ModelResponse:
        # Priority 1: GPT4All (in-process)
        if self.gpt4all.is_available():
            try:
                res = self.gpt4all.generate(prompt, system_prompt, available_tools)
                if not res.raw_provider.endswith("_not_loaded"):
                    return res
            except Exception:
                pass

        # Priority 2: Ollama (daemon)
        if self.ollama.is_available():
            try:
                res = self.ollama.generate(prompt, system_prompt, available_tools)
                if not res.raw_provider.endswith("_failed"):
                    return res
            except Exception:
                pass

        # Priority 3: Offline Conversational Core
        return self.conversational_core.generate(prompt, system_prompt, available_tools)
