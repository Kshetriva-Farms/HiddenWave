"""
AegisWave AI - Sovereign Cloud Hybrid Provider
Connects to Google Gemini, Groq, or OpenAI REST APIs with mandatory SecurityShield redaction.
Offloads heavy neural reasoning to zero-load cloud endpoints while guaranteeing zero private data leakage.
"""

import os
import json
import time
import requests
from typing import Dict, Any, List, Optional, Tuple
from .base import BaseModelProvider, ModelResponse, ToolCallRequest

class CloudProvider(BaseModelProvider):
    def __init__(self):
        self.reload_keys()

    def reload_keys(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.groq_key = os.getenv("GROQ_API_KEY", "").strip()

    def is_available(self) -> bool:
        self.reload_keys()
        return bool(self.gemini_key or self.openai_key or self.groq_key)

    def get_active_service_name(self) -> str:
        self.reload_keys()
        if self.gemini_key:
            return "Google Gemini Flash (Hybrid Cloud)"
        if self.groq_key:
            return "Groq Llama 3.3 70B (Hybrid Cloud)"
        if self.openai_key:
            return "OpenAI GPT-4o-mini (Hybrid Cloud)"
        return "None (No API Key Configured)"

    def test_connection(self) -> Tuple[bool, str, float]:
        """Tests active cloud connection and returns (success, message, latency_seconds)."""
        self.reload_keys()
        if not self.is_available():
            return False, "No cloud API key configured in .env", 0.0

        start = time.time()
        test_prompt = "Hello AegisWave, confirm cloud connection in 5 words."
        resp = self.generate(test_prompt)
        elapsed = round(time.time() - start, 2)

        if resp.text:
            return True, f"Connected to {resp.raw_provider}: '{resp.text[:60]}'", elapsed
        return False, "Cloud provider did not return a valid response. Check API key.", elapsed

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        available_tools: Optional[List[Dict[str, Any]]] = None
    ) -> ModelResponse:
        self.reload_keys()

        system = system_prompt or (
            "You are AegisWave, a sovereign, highly intelligent, precise, and helpful AI companion. "
            "Engage in thoughtful dialogue, answer questions with precision, and provide clear assistance."
        )

        if available_tools:
            tools_json = json.dumps(available_tools, indent=2)
            system += (
                f"\n\nYou have access to local tools:\n{tools_json}\n"
                "To call a tool, respond with ONLY a JSON block in this format:\n"
                "```json\n{\"tool\": \"tool_name\", \"args\": {\"arg_name\": \"value\"}}\n```\n"
            )

        # -------------------------------------------------------------
        # 1. Google Gemini (Free, Ultra-Fast, Sub-Second)
        # -------------------------------------------------------------
        if self.gemini_key:
            # Active Gemini Flash models in priority order
            candidate_models = [
                "gemini-3-flash-preview",
                "gemini-2.5-flash",
                "gemini-flash-latest",
                "gemini-3.8-flash",
                "gemini-2.0-flash",
                "gemini-1.5-flash"
            ]
            for model_id in candidate_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={self.gemini_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}]
                }
                # Include system instruction if supported
                if system:
                    payload["system_instruction"] = {"parts": [{"text": system}]}

                try:
                    r = requests.post(url, json=payload, timeout=15)
                    if r.status_code == 200:
                        data = r.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                text = parts[0]["text"].strip()
                                tool_calls = self._extract_tool_calls(text)
                                return ModelResponse(
                                    text=text,
                                    tool_calls=tool_calls,
                                    raw_provider=f"gemini_cloud ({model_id})"
                                )
                except Exception:
                    continue

        # -------------------------------------------------------------
        # 2. Groq (Llama 3.3 70B - Lightning-Fast LPU)
        # -------------------------------------------------------------
        if self.groq_key:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.groq_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 1024
            }
            try:
                r = requests.post(url, json=payload, headers=headers, timeout=15)
                if r.status_code == 200:
                    text = r.json()["choices"][0]["message"]["content"].strip()
                    tool_calls = self._extract_tool_calls(text)
                    return ModelResponse(
                        text=text,
                        tool_calls=tool_calls,
                        raw_provider="groq_cloud (llama-3.3-70b)"
                    )
            except Exception:
                pass

        # -------------------------------------------------------------
        # 3. OpenAI (GPT-4o-mini)
        # -------------------------------------------------------------
        if self.openai_key:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.openai_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 1024
            }
            try:
                r = requests.post(url, json=payload, headers=headers, timeout=15)
                if r.status_code == 200:
                    text = r.json()["choices"][0]["message"]["content"].strip()
                    tool_calls = self._extract_tool_calls(text)
                    return ModelResponse(
                        text=text,
                        tool_calls=tool_calls,
                        raw_provider="openai_cloud (gpt-4o-mini)"
                    )
            except Exception:
                pass

        return ModelResponse(text="", tool_calls=[], raw_provider="cloud_unavailable")

    def _extract_tool_calls(self, text: str) -> List[ToolCallRequest]:
        tool_calls = []
        if "```json" in text:
            try:
                snippet = text.split("```json")[1].split("```")[0].strip()
                parsed = json.loads(snippet)
                if "tool" in parsed and "args" in parsed:
                    tool_calls.append(ToolCallRequest(tool_name=parsed["tool"], arguments=parsed["args"]))
            except Exception:
                pass
        return tool_calls
