"""
AegisWave AI - Ollama Local Model Provider
Connects to local Ollama instance (default: http://127.0.0.1:11434).
"""

import json
import requests
from typing import Dict, Any, List, Optional
from .base import BaseModelProvider, ModelResponse, ToolCallRequest

class OllamaProvider(BaseModelProvider):
    def __init__(self, model_name: str = "llama3.2:3b", base_url: str = "http://127.0.0.1:11434"):
        self.model_name = model_name
        self.base_url = base_url.rstrip("/")

    def is_available(self) -> bool:
        try:
            r = requests.get(f"{self.base_url}/api/tags", timeout=1.5)
            return r.status_code == 200
        except Exception:
            return False

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        available_tools: Optional[List[Dict[str, Any]]] = None
    ) -> ModelResponse:
        endpoint = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "system": system_prompt or "You are AegisWave, a secure and accurate assistant.",
            "stream": False,
        }

        try:
            resp = requests.post(endpoint, json=payload, timeout=60)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data.get("response", "")

            # Look for JSON tool calls if embedded
            tool_calls = []
            if '```json' in raw_text:
                try:
                    json_str = raw_text.split('```json')[1].split('```')[0].strip()
                    parsed = json.loads(json_str)
                    if "tool" in parsed and "args" in parsed:
                        tool_calls.append(ToolCallRequest(tool_name=parsed["tool"], arguments=parsed["args"]))
                except Exception:
                    pass

            return ModelResponse(
                text=raw_text,
                tool_calls=tool_calls,
                raw_provider="ollama"
            )
        except Exception as e:
            return ModelResponse(
                text=f"Ollama Error: {e}",
                tool_calls=[],
                raw_provider="ollama_failed"
            )
