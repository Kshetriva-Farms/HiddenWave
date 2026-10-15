"""
AegisWave AI - File Tools
Safe filesystem operations bound by SecuritySandbox.
"""

from pathlib import Path
from typing import Dict, Any, List
from bot.security.sandbox import SecuritySandbox
from config.settings import SANDBOX_ALLOW_PATHS, MAX_TOOL_OUTPUT_BYTES

sandbox = SecuritySandbox(SANDBOX_ALLOW_PATHS)

def read_file(path: str) -> str:
    """Reads content of a file safely within project boundaries."""
    safe_path = sandbox.resolve_safe_path(path)
    if not safe_path.exists():
        return f"Error: File '{path}' does not exist."
    if safe_path.is_dir():
        return f"Error: Path '{path}' is a directory, not a file."
    
    with open(safe_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read(MAX_TOOL_OUTPUT_BYTES)
        if len(content) == MAX_TOOL_OUTPUT_BYTES:
            content += "\n...[Output truncated due to size limit]"
        return content

def write_file(path: str, content: str) -> str:
    """Writes text content to a file safely within project boundaries."""
    safe_path = sandbox.resolve_safe_path(path)
    safe_path.parent.mkdir(parents=True, exist_ok=True)
    with open(safe_path, "w", encoding="utf-8") as f:
        f.write(content)
    return f"Success: Wrote {len(content)} characters to '{path}'."

def list_directory(path: str = ".") -> str:
    """Lists files and folders inside an allowed project directory."""
    safe_path = sandbox.resolve_safe_path(path)
    if not safe_path.exists():
        return f"Error: Directory '{path}' does not exist."
    if not safe_path.is_dir():
        return f"Error: '{path}' is a file, not a directory."
    
    items = []
    for item in sorted(safe_path.iterdir()):
        prefix = "📁 " if item.is_dir() else "📄 "
        size = f"({item.stat().st_size} bytes)" if item.is_file() else ""
        items.append(f"{prefix}{item.name} {size}".strip())
    
    return "\n".join(items) if items else "(Empty directory)"
