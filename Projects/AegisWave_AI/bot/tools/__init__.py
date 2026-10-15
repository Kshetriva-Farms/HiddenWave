"""
AegisWave AI - Tool Package Initializer
Assembles registered tools into a unified registry.
"""

from .registry import ToolRegistry
from .files import read_file, write_file, list_directory
from .system import get_system_telemetry
from .math_tool import calculate
from .web import fetch_web_page
from .knowledge_tool import search_knowledge, sync_knowledge_files

default_registry = ToolRegistry()

# Register core safe tools
default_registry.register(
    name="read_file",
    description="Reads the text content of a file inside the project workspace.",
    parameters={"path": {"type": "string", "description": "Relative or project path to read"}},
    risk_level="SAFE"
)(read_file)

default_registry.register(
    name="write_file",
    description="Writes text content to a file inside the project workspace.",
    parameters={"path": {"type": "string"}, "content": {"type": "string"}},
    risk_level="SAFE"
)(write_file)

default_registry.register(
    name="list_directory",
    description="Lists files and subdirectories in a given project folder.",
    parameters={"path": {"type": "string", "default": "."}},
    risk_level="SAFE"
)(list_directory)

default_registry.register(
    name="system_telemetry",
    description="Returns live system hardware status: CPU, RAM, Disk, Battery.",
    parameters={},
    risk_level="SAFE"
)(get_system_telemetry)

default_registry.register(
    name="calculate",
    description="Evaluates mathematical expressions safely (e.g. arithmetic, powers, logs).",
    parameters={"expression": {"type": "string"}},
    risk_level="SAFE"
)(calculate)

default_registry.register(
    name="fetch_web_page",
    description="Fetches readable text from a public web URL.",
    parameters={"url": {"type": "string"}},
    risk_level="SAFE"
)(fetch_web_page)

default_registry.register(
    name="search_knowledge",
    description="Searches local indexed documents in knowledge/ for relevant facts or notes.",
    parameters={"query": {"type": "string", "description": "Search keyword or question"}},
    risk_level="SAFE"
)(search_knowledge)

default_registry.register(
    name="sync_knowledge",
    description="Scans the knowledge/ folder and indexes all new or updated documents.",
    parameters={},
    risk_level="SAFE"
)(sync_knowledge_files)

__all__ = ["default_registry"]
