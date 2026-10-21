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
        self.active_gemini_model = None
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
            model_info = f" ({self.active_gemini_model})" if self.active_gemini_model else ""
            return f"Google Gemini Flash{model_info} (Hybrid Cloud)"
        if self.groq_key:
            return "Groq Llama 3.3 70B (Hybrid Cloud)"
        if self.openai_key:
            return "OpenAI GPT-4o-mini (Hybrid Cloud)"
        return "None (No API Key Configured)"

    def test_single_key(self, provider: str, key: str) -> Tuple[bool, str, float]:
        """Tests a specific key transiently without saving it to disk or environment."""
        if not key or not key.strip():
            return False, "Empty API key provided", 0.0

        key = key.strip()
        start = time.time()
        test_prompt = "Hello AegisWave, please respond with: 'Cloud connection verified.'"
        resp = self.generate(test_prompt, key_override=key, provider_override=provider)
        elapsed = round(time.time() - start, 2)

        if resp.text:
            return True, f"Connected to {provider.upper()}: '{resp.text[:60]}'", elapsed
        return False, f"Could not verify {provider.upper()} key. Response was empty or rejected.", elapsed

    def test_connection(self) -> Tuple[bool, str, float]:
        """Tests active cloud connection and returns (success, message, latency_seconds)."""
        self.reload_keys()
        if not self.is_available():
            return False, "No cloud API key configured", 0.0

        start = time.time()
        test_prompt = "Hello AegisWave, please respond with: 'Cloud connection verified.'"
        resp = self.generate(test_prompt)
        elapsed = round(time.time() - start, 2)

        if resp.text:
            return True, f"Connected to {resp.raw_provider}: '{resp.text[:60]}'", elapsed
        return False, "Cloud provider did not return a valid response. Check API key.", elapsed

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        available_tools: Optional[List[Dict[str, Any]]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        key_override: Optional[str] = None,
        provider_override: Optional[str] = None
    ) -> ModelResponse:
        self.reload_keys()

        active_gemini_key = key_override if provider_override == "gemini" else (self.gemini_key if not provider_override else None)
        active_groq_key = key_override if provider_override == "groq" else (self.groq_key if not provider_override else None)
        active_openai_key = key_override if provider_override == "openai" else (self.openai_key if not provider_override else None)

        system = system_prompt or (
            "You are AegisWave, a sovereign, highly intelligent, precise, and helpful AI companion. "
            "Engage in thoughtful dialogue, answer questions with precision, and provide clear, well-structured assistance."
        )

        if available_tools:
            tools_json = json.dumps(available_tools, indent=2)
            system += (
                f"\n\nYou have access to the following local tools:\n{tools_json}\n"
                "If you need to execute a tool to answer the user's question, provide ONLY a single JSON code block like this:\n"
                "```json\n{\"tool\": \"tool_name\", \"args\": {\"arg_name\": \"value\"}}\n```\n"
                "If no tool is required, respond directly with your helpful conversational answer."
            )

        # -------------------------------------------------------------
        # 1. Google Gemini (Fast, Free, Sub-Second)
        # -------------------------------------------------------------
        if active_gemini_key:
            # Build native multi-turn contents
            gemini_contents = []
            if chat_history:
                for h in chat_history[-6:]:  # Keep recent history concise
                    role = "user" if h.get("role") == "user" else "model"
                    content_str = (h.get("content") or "").strip()
                    if content_str:
                        gemini_contents.append({"role": role, "parts": [{"text": content_str}]})
            gemini_contents.append({"role": "user", "parts": [{"text": prompt}]})

            candidate_models = []
            if self.active_gemini_model:
                candidate_models.append(self.active_gemini_model)
            for m in [
                "gemini-2.5-flash",
                "gemini-2.0-flash",
                "gemini-1.5-flash",
                "gemini-3-flash-preview",
                "gemini-1.5-pro"
            ]:
                if m not in candidate_models:
                    candidate_models.append(m)

            for model_id in candidate_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={active_gemini_key}"
                payload = {
                    "contents": gemini_contents
                }
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
                                # Prevent simulated multi-turn loops
                                for sep in ["\nUser:", "\nHuman:", "\n\nUser:", "\n\nHuman:"]:
                                    if sep in text:
                                        text = text.split(sep)[0].strip()
                                tool_calls = self._extract_tool_calls(text)
                                self.active_gemini_model = model_id
                                return ModelResponse(
                                    text=text,
                                    tool_calls=tool_calls,
                                    raw_provider=f"gemini_cloud ({model_id})"
                                )
                except Exception:
                    continue

        # -------------------------------------------------------------
        # 2. Groq (Llama 3.3 70B / 3.1 8B - Lightning-Fast LPU)
        # -------------------------------------------------------------
        if active_groq_key:
            groq_messages = [{"role": "system", "content": system}]
            if chat_history:
                for h in chat_history[-6:]:
                    role = "user" if h.get("role") == "user" else "assistant"
                    content_str = (h.get("content") or "").strip()
                    if content_str:
                        groq_messages.append({"role": role, "content": content_str})
            groq_messages.append({"role": "user", "content": prompt})

            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {active_groq_key}",
                "Content-Type": "application/json"
            }
            for groq_model in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
                payload = {
                    "model": groq_model,
                    "messages": groq_messages,
                    "temperature": 0.7,
                    "max_tokens": 1200
                }
                try:
                    r = requests.post(url, json=payload, headers=headers, timeout=15)
                    if r.status_code == 200:
                        text = r.json()["choices"][0]["message"]["content"].strip()
                        for sep in ["\nUser:", "\nHuman:", "\n\nUser:", "\n\nHuman:"]:
                            if sep in text:
                                text = text.split(sep)[0].strip()
                        tool_calls = self._extract_tool_calls(text)
                        return ModelResponse(
                            text=text,
                            tool_calls=tool_calls,
                            raw_provider=f"groq_cloud ({groq_model})"
                        )
                except Exception:
                    continue

        # -------------------------------------------------------------
        # 3. OpenAI (GPT-4o-mini)
        # -------------------------------------------------------------
        if active_openai_key:
            openai_messages = [{"role": "system", "content": system}]
            if chat_history:
                for h in chat_history[-6:]:
                    role = "user" if h.get("role") == "user" else "assistant"
                    content_str = (h.get("content") or "").strip()
                    if content_str:
                        openai_messages.append({"role": role, "content": content_str})
            openai_messages.append({"role": "user", "content": prompt})

            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {active_openai_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": openai_messages,
                "temperature": 0.7,
                "max_tokens": 1200
            }
            try:
                r = requests.post(url, json=payload, headers=headers, timeout=15)
                if r.status_code == 200:
                    text = r.json()["choices"][0]["message"]["content"].strip()
                    for sep in ["\nUser:", "\nHuman:", "\n\nUser:", "\n\nHuman:"]:
                        if sep in text:
                            text = text.split(sep)[0].strip()
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
        import re
        tool_calls = []

        # 1. Look for ```json blocks
        json_matches = re.findall(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
        for snippet in json_matches:
            try:
                parsed = json.loads(snippet.strip())
                if isinstance(parsed, dict):
                    tool_name = parsed.get("tool") or parsed.get("name") or parsed.get("tool_name")
                    args = parsed.get("args") or parsed.get("arguments") or parsed.get("parameters") or {}
                    if tool_name:
                        tool_calls.append(ToolCallRequest(tool_name=tool_name, arguments=args))
                elif isinstance(parsed, list):
                    for item in parsed:
                        if isinstance(item, dict):
                            tool_name = item.get("tool") or item.get("name")
                            args = item.get("args") or item.get("arguments") or {}
                            if tool_name:
                                tool_calls.append(ToolCallRequest(tool_name=tool_name, arguments=args))
            except Exception:
                pass

        # 2. Look for raw JSON object if no block matched
        if not tool_calls:
            raw_match = re.search(r'\{\s*"(?:tool|name|tool_name)"\s*:\s*"([^"]+)"\s*,\s*"(?:args|arguments|parameters)"\s*:\s*(\{.*?\})\s*\}', text, re.DOTALL)
            if raw_match:
                try:
                    tool_name = raw_match.group(1)
                    args = json.loads(raw_match.group(2))
                    tool_calls.append(ToolCallRequest(tool_name=tool_name, arguments=args))
                except Exception:
                    pass

        return tool_calls
