"""
AegisWave AI - Base Model Provider Interface
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

@dataclass
class ToolCallRequest:
    tool_name: str
    arguments: Dict[str, Any]

@dataclass
class ModelResponse:
    text: str
    tool_calls: List[ToolCallRequest]
    raw_provider: str
    finish_reason: str = "stop"

class BaseModelProvider(ABC):
    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        available_tools: Optional[List[Dict[str, Any]]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> ModelResponse:
        """Generates a response or initiates tool calls."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if the engine is ready and reachable."""
        pass
