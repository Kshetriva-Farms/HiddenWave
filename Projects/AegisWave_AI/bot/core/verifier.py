"""
AegisWave AI - Accuracy & Verification Engine
Audits model responses against raw tool observations to catch hallucinations before output.
"""

import re
from typing import Tuple, List, Dict, Any

class AccuracyVerifier:
    """Audits agent claims against empirical evidence gathered during tool execution."""

    @staticmethod
    def audit_numerical_claims(proposed_answer: str, tool_observations: List[str]) -> Tuple[bool, str]:
        """
        Extracts numbers in the proposed answer and checks if they appear or are supported
        by tool observation outputs.
        """
        combined_evidence = " ".join(tool_observations)
        
        # Extract standalone numbers / percentages (e.g. 75, 75.0, 15000, 22039.92)
        numbers_in_answer = re.findall(r"\b\d+(?:\.\d+)?%?\b", proposed_answer)
        
        unsupported = []
        for num in numbers_in_answer:
            raw_num = num.replace("%", "")
            # Check if raw number or float representation exists in evidence
            if raw_num not in combined_evidence:
                try:
                    val = float(raw_num)
                    # Allow common trivial numbers like 0, 1, 2, 3 in natural language
                    if val in [0, 1, 2, 3]:
                        continue
                except ValueError:
                    pass
                unsupported.append(num)

        if unsupported:
            return False, f"Potential hallucination: Numbers {unsupported} not found in tool evidence."
        
        return True, "Verified: All primary claims supported by tool evidence."

    @staticmethod
    def verify_tool_execution(tool_observations: List[str]) -> Tuple[bool, str]:
        """Checks if any tool errored or failed."""
        for obs in tool_observations:
            if obs.startswith("Error:") or obs.startswith("Security Breach Blocked:"):
                return False, f"Tool execution failed: {obs}"
        return True, "All tools executed successfully."
