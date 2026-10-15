"""
AegisWave AI - GPT4All Local Neural Model Provider
Runs open-source GGUF models (e.g. Llama 3.2 3B, Phi-3 mini) in-process using CPU/GPU.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import json

from .base import BaseModelProvider, ModelResponse, ToolCallRequest
from config.settings import MODELS_DIR

try:
    from gpt4all import GPT4All
    HAS_GPT4ALL = True
except ImportError:
    HAS_GPT4ALL = False

class GPT4AllProvider(BaseModelProvider):
    def __init__(self, model_name: str = "Llama-3.2-3B-Instruct-Q4_0.gguf"):
        self.model_name = model_name
        self.model_path = MODELS_DIR / model_name
        self._model: Optional[GPT4All] = None

    def is_available(self) -> bool:
        if not HAS_GPT4ALL:
            return False
        # Available if the model file is present or already loaded
        return self._model is not None or self.model_path.exists()

    def load_model(self, allow_download: bool = False):
        if not HAS_GPT4ALL:
            raise RuntimeError("gpt4all package is not installed.")
        if self._model is None:
            # Use high-speed multi-threaded AVX2 CPU execution on all 6 physical Ryzen cores
            self._model = GPT4All(
                model_name=self.model_name,
                model_path=str(MODELS_DIR),
                allow_download=allow_download,
                n_threads=6,
                device="cpu"
            )

    def unload_model(self):
        """Releases the neural model weights from system RAM and frees resources."""
        import gc
        if self._model is not None:
            del self._model
            self._model = None
            gc.collect()

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        available_tools: Optional[List[Dict[str, Any]]] = None
    ) -> ModelResponse:
        if not self.is_available() and self._model is None:
            return ModelResponse(
                text="Local neural weights not loaded yet.",
                tool_calls=[],
                raw_provider="gpt4all_not_loaded"
            )

        if self._model is None:
            self.load_model(allow_download=False)

        full_system = system_prompt or (
            "You are AegisWave, a sovereign, fast, concise, and helpful AI assistant. "
            "Provide direct, high-value answers without unnecessary filler."
        )

        with self._model.chat_session(system_prompt=full_system):
            response_text = self._model.generate(
                prompt=prompt,
                max_tokens=220,
                temp=0.7,
                top_k=40,
                top_p=0.9
            )

        # Check for tool call patterns
        tool_calls = []
        if "```json" in response_text:
            try:
                snippet = response_text.split("```json")[1].split("```")[0].strip()
                parsed = json.loads(snippet)
                if "tool" in parsed and "args" in parsed:
                    tool_calls.append(ToolCallRequest(tool_name=parsed["tool"], arguments=parsed["args"]))
            except Exception:
                pass

        return ModelResponse(
            text=response_text.strip(),
            tool_calls=tool_calls,
            raw_provider=f"gpt4all ({self.model_name})"
        )
