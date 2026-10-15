"""
AegisWave AI - Security Sandbox
Guarantees path jailing and limits tool execution within authorized project roots.
"""

from pathlib import Path
from typing import List, Union

class SecuritySandbox:
    """Enforces execution boundaries and prevents arbitrary filesystem or OS escape."""

    def __init__(self, allowed_roots: List[Path]):
        self.allowed_roots = [r.resolve() for r in allowed_roots]

    def resolve_safe_path(self, target_path: Union[str, Path]) -> Path:
        """
        Resolves a path and verifies it strictly resides inside an allowed root.
        Raises PermissionError if path attempts directory traversal or OS escape.
        """
        p = Path(target_path)
        if not p.is_absolute():
            # Treat relative to the primary root
            resolved = (self.allowed_roots[0] / p).resolve()
        else:
            resolved = p.resolve()

        # Check against all allowed roots
        is_safe = False
        for root in self.allowed_roots:
            try:
                # Relative_to raises ValueError if not within root
                resolved.relative_to(root)
                is_safe = True
                break
            except ValueError:
                continue

        if not is_safe:
            raise PermissionError(
                f"Security Breach Blocked: Path '{target_path}' attempts to escape sandbox boundary '{self.allowed_roots[0]}'."
            )

        return resolved

    def is_path_safe(self, target_path: Union[str, Path]) -> bool:
        try:
            self.resolve_safe_path(target_path)
            return True
        except PermissionError:
            return False
