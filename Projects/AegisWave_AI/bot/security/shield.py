"""
AegisWave AI - Security Shield
Provides real-time credential, API key, PII, and sensitive data scrubbing
to guarantee zero data leakage during hybrid cloud and local inference.
"""

import re
from typing import Dict, Tuple, List, Optional

class SecurityShield:
    """
    Detects and masks confidential tokens (API keys, credentials, PII, connection strings)
    with surrogate placeholders before sending text to any model or external service.
    Restores original values locally when presenting output back to the user.
    """

    PATTERNS = {
        # Private Cryptographic Keys
        "PRIVATE_KEY": r"-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----",
        
        # High-Risk API Keys & Cloud Credentials
        "API_KEY": r"(?:sk-|sk-ant-|AIzaSy|gsk_|ghp_|gho_|github_pat_|hf_|AKIA[0-9A-Z]{16}|sk_live_|rk_live_|xoxb-|xoxp-)[a-zA-Z0-9_\-]{14,}",
        
        # Database & Service Connection URIs (containing embedded credentials)
        "CONNECTION_STRING": r"(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^\s\"'<>]+",
        
        # Explicit Credential / Secret Assignments
        "CREDENTIAL": r"(?i)(?:password|passwd|secret|token|api_key|access_token)\s*[:=]\s*[\"']?([^\s\"',;]{6,})[\"']?",
        
        # Authentication Bearer Headers
        "AUTH_BEARER": r"(?i)bearer\s+[a-zA-Z0-9\-\._~\+\/]{16,}={0,2}",
        
        # Personally Identifiable Information (Emails)
        "EMAIL": r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b",
        
        # Phone Numbers (International & Standard formats)
        "PHONE": r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
        
        # Credit Card Numbers (16-digit spaced or dashed)
        "CREDIT_CARD": r"\b(?:\d{4}[-\s]?){3}\d{4}\b",
        
        # IPv4 Network Addresses
        "IPV4": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
        
        # Local Windows User Profiles (prevents leaking local username)
        "LOCAL_USER_PATH": r"[A-Za-z]:\\[Uu]sers\\[a-zA-Z0-9_\-\.]+\\",
    }

    CONFIDENTIAL_MARKERS = [
        "[PRIVATE]", "[LOCAL]", "[CONFIDENTIAL]", "[AIRGAP]", "[RESTRICTED]", "[SECRET]"
    ]

    def __init__(self):
        self.redaction_map: Dict[str, str] = {}
        self.reverse_map: Dict[str, str] = {}
        self._counter = 0

    def is_confidential(self, text: str) -> bool:
        """
        Determines if text is strictly confidential (contains private keys or air-gap tags)
        and must NEVER be transmitted to any cloud API under any circumstances.
        """
        upper = text.upper()
        if any(marker in upper for marker in self.CONFIDENTIAL_MARKERS):
            return True
        if re.search(self.PATTERNS["PRIVATE_KEY"], text):
            return True
        return False

    def sanitize(self, text: str) -> Tuple[str, List[Dict[str, str]]]:
        """
        Replaces sensitive values with surrogate tokens like <API_KEY_1> or <EMAIL_2>.
        Returns the sanitized text and the list of redactions made.
        """
        sanitized = text
        redacted_items = []

        all_matches = []
        for category, pattern in self.PATTERNS.items():
            for m in re.finditer(pattern, text):
                val = m.group(0)
                all_matches.append((category, val))

        # Sort matches by length descending so longer tokens are replaced before sub-tokens
        all_matches.sort(key=lambda x: len(x[1]), reverse=True)

        for category, match in all_matches:
            if match in sanitized:
                if match not in self.redaction_map:
                    self._counter += 1
                    token = f"<{category}_{self._counter}>"
                    self.redaction_map[match] = token
                    self.reverse_map[token] = match
                else:
                    token = self.redaction_map[match]

                sanitized = sanitized.replace(match, token)
                redacted_items.append({"category": category, "token": token, "length": len(match)})

        return sanitized, redacted_items

    def restore(self, text: str) -> str:
        """
        Restores original values locally when presenting output back to the user.
        The external cloud never sees the real values; restoration happens strictly in local memory.
        """
        restored = text
        for token, original in self.reverse_map.items():
            restored = restored.replace(token, original)
        return restored

    def has_secrets(self, text: str) -> bool:
        """Checks whether text contains any high-risk confidential pattern."""
        for pattern in self.PATTERNS.values():
            if re.search(pattern, text):
                return True
        return False

