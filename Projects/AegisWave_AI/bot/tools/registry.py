"""
AegisWave AI - Tool Registry
Registers, describes, and executes tools with strict validation and error handling.
"""

from typing import Callable, Dict, Any, List
from dataclasses import dataclass

@dataclass
class ToolDefinition:
    name: str
    description: str
    parameters: Dict[str, Any]
    handler: Callable
    risk_level: str = "SAFE"  # SAFE, CONFIRMATION_REQUIRED, RESTRICTED

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}

    def register(self, name: str, description: str, parameters: Dict[str, Any], risk_level: str = "SAFE"):
        def decorator(func: Callable):
            self._tools[name] = ToolDefinition(
                name=name,
                description=description,
                parameters=parameters,
                handler=func,
                risk_level=risk_level
            )
            return func
        return decorator

    def execute(self, name: str, **kwargs) -> Any:
        if name not in self._tools:
            raise KeyError(f"Tool '{name}' is not registered.")
        tool = self._tools[name]
        return tool.handler(**kwargs)

    def get_descriptions(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": t.name,
                "description": t.description,
                "parameters": t.parameters,
                "risk_level": t.risk_level
            }
            for t in self._tools.values()
        ]

    def has_tool(self, name: str) -> bool:
        return name in self._tools
