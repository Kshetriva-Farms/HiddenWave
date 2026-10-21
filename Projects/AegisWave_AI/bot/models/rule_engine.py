"""
AegisWave AI - Conversational Engine & Intent Planner
Provides communicative, engaging dialogue and intelligent tool dispatching.
"""

import re
from typing import Dict, Any, List, Optional
from .base import BaseModelProvider, ModelResponse, ToolCallRequest

class RuleEngineProvider(BaseModelProvider):
    """Communicative offline engine with conversational warmth and tool orchestration."""

    def is_available(self) -> bool:
        return True

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        available_tools: Optional[List[Dict[str, Any]]] = None
    ) -> ModelResponse:
        p_lower = prompt.lower().strip()
        tool_calls = []

        # 1. Greetings & Warm Dialogue
        if p_lower in ["hi", "hello", "hey", "hola", "greetings", "good morning", "good evening", "good afternoon"]:
            return ModelResponse(
                text=(
                    "Hello! I am AegisWave AI, your sovereign intelligent companion.\n"
                    "I am protected by your private security shield with real-time credential masking.\n\n"
                    "How can I help you today? You can ask me to inspect project files, run verified calculations, "
                    "monitor system hardware, or query local knowledge documents."
                ),
                tool_calls=[],
                raw_provider="conversational_core"
            )

        # 2. Identity & Architecture Explanation
        if any(w in p_lower for w in ["who are you", "what are you", "what can you do", "introduce yourself"]):
            return ModelResponse(
                text=(
                    "I am **AegisWave AI** — your sovereign, privacy-first personal intelligence companion.\n\n"
                    "**Key Core Capabilities:**\n"
                    " • **100% Sovereign Privacy:** PII and credentials are sanitized before leaving your machine.\n"
                    " • **Empirical Grounding:** Mathematical results and file analyses are verified by sandbox tools.\n"
                    " • **Path-Jailed Sandbox:** Secure filesystem access strictly bounded within the workspace.\n"
                    " • **Adaptive Hybrid Routing:** Seamlessly switches between Cloud (Gemini/Groq) and Local engines.\n\n"
                    "Try typing: `show telemetry`, `calculate 15000 * 1.08^5`, or `check system_logs.txt`!"
                ),
                tool_calls=[],
                raw_provider="conversational_core"
            )

        # 3. System Telemetry & Hardware Status
        if any(w in p_lower for w in [
            "telemetry", "hardware", "cpu", "ram", "battery", "specs", "disk",
            "how is my pc", "laptop status", "system status", "pc performance"
        ]):
            tool_calls.append(ToolCallRequest(tool_name="system_telemetry", arguments={}))
            return ModelResponse(
                text="Checking live system hardware telemetry and resource utilization...",
                tool_calls=tool_calls,
                raw_provider="conversational_core"
            )

        # 4. Math Calculations (including compound interest & word problems)
        # 4a. Compound growth pattern: "compound growth of 25000 at 9.5% annual return for 7 years"
        compound_match = re.search(
            r"compound (?:growth|interest)(?: of)?\s+([0-9\.,]+)\s+(?:at|with)\s+([0-9\.]+)%\s+(?:annual return|rate|interest)?\s*(?:for)?\s+([0-9\.]+)\s+years?",
            p_lower
        )
        if compound_match:
            try:
                principal = float(compound_match.group(1).replace(",", ""))
                rate = float(compound_match.group(2)) / 100.0
                years = float(compound_match.group(3))
                expr = f"{principal} * (1 + {rate}) ** {years}"
                tool_calls.append(ToolCallRequest(tool_name="calculate", arguments={"expression": expr}))
                return ModelResponse(
                    text=f"Calculating compound growth: ${principal:,.2f} at {rate*100}% for {years} years...",
                    tool_calls=tool_calls,
                    raw_provider="conversational_core"
                )
            except Exception:
                pass

        # 4b. Percentage pattern: "15% of 200" or "calculate 20% of 500"
        pct_expr_match = re.search(r"(?:calculate|compute|what is|how much is|solve)?\s*([0-9\.]+)\s*%\s*(?:of|\*)\s*([0-9\.]+)", p_lower)
        if pct_expr_match:
            pct_val = pct_expr_match.group(1)
            target_val = pct_expr_match.group(2)
            expr = f"({pct_val} / 100.0) * {target_val}"
            tool_calls.append(ToolCallRequest(tool_name="calculate", arguments={"expression": expr}))
            return ModelResponse(
                text=f"Calculating {pct_val}% of {target_val}...",
                tool_calls=tool_calls,
                raw_provider="conversational_core"
            )

        # 4c. Standard arithmetic pattern
        math_pattern = r"(?:calculate|compute|what is|how much is|solve)\s+([0-9\.\+\-\*\/\^\(\)\s\*\*\^\%]+)"
        match_math = re.search(math_pattern, prompt, re.IGNORECASE)
        if match_math:
            candidate_expr = match_math.group(1).strip()
            # Verify candidate expression actually contains math operators
            if re.search(r"[\+\-\*\/\^]", candidate_expr):
                tool_calls.append(ToolCallRequest(tool_name="calculate", arguments={"expression": candidate_expr}))
                return ModelResponse(
                    text=f"Calculating `{candidate_expr}` with verified arithmetic...",
                    tool_calls=tool_calls,
                    raw_provider="conversational_core"
                )

        # 5. Local Knowledge Search (RAG) & Project Guide queries
        knowledge_triggers = [
            "project guide", "knowledge base", "search knowledge", "search notes",
            "find in notes", "search docs", "what does my project guide say",
            "guide say", "what do the docs say", "hardware configuration", "architecture principles"
        ]
        if any(w in p_lower for w in knowledge_triggers):
            # Extract query keywords
            cleaned_query = prompt
            for phrase in [
                r"(?i)what does my project guide say about",
                r"(?i)what does the project guide say about",
                r"(?i)what does the guide say about",
                r"(?i)search\s+(?:knowledge\s+(?:for\s+)?|notes\s+(?:for\s+)?|docs\s+(?:for\s+)?)",
                r"(?i)find\s+in\s+(?:notes|docs|knowledge)"
            ]:
                cleaned_query = re.sub(phrase, "", cleaned_query).strip()

            search_term = cleaned_query or prompt
            tool_calls.append(ToolCallRequest(tool_name="search_knowledge", arguments={"query": search_term}))
            return ModelResponse(
                text=f"Searching local knowledge base for: '{search_term}'...",
                tool_calls=tool_calls,
                raw_provider="conversational_core"
            )

        # 6. File Operations - Reading / Analyzing
        file_read_pattern = r"(?:read|check|analyze|view|inspect)\s+([a-zA-Z0-9_\-\.\/\\]+\.[a-zA-Z0-9]+)"
        match_file = re.search(file_read_pattern, prompt, re.IGNORECASE)
        if match_file:
            filepath = match_file.group(1).strip()
            tool_calls.append(ToolCallRequest(tool_name="read_file", arguments={"path": filepath}))
            return ModelResponse(
                text=f"Opening and analyzing project file '{filepath}'...",
                tool_calls=tool_calls,
                raw_provider="conversational_core"
            )

        # 7. Directory Listing
        if any(w in p_lower for w in ["list files", "directory", "show folder", "what files do i have", "ls", "dir", "list workspace"]):
            tool_calls.append(ToolCallRequest(tool_name="list_directory", arguments={"path": "."}))
            return ModelResponse(
                text="Listing the files inside your project directory...",
                tool_calls=tool_calls,
                raw_provider="conversational_core"
            )

        # 8. Web Fetch
        web_pattern = r"(?:browse|fetch|read|scrape|visit)\s+(https?://[^\s]+)"
        match_web = re.search(web_pattern, prompt, re.IGNORECASE)
        if match_web:
            url = match_web.group(1).strip()
            tool_calls.append(ToolCallRequest(tool_name="fetch_web_page", arguments={"url": url}))
            return ModelResponse(
                text=f"Fetching and parsing web page: {url}",
                tool_calls=tool_calls,
                raw_provider="conversational_core"
            )

        # 9. Educational / Conceptual Questions (Offline encyclopedic answers)
        if "operating system" in p_lower and any(w in p_lower for w in ["what is", "explain", "define"]):
            return ModelResponse(
                text=(
                    "An **operating system (OS)** is the fundamental system software that manages a computer's hardware, memory, and running processes. "
                    "It acts as an intermediary between the user applications and the physical hardware, enabling programs to execute seamlessly without needing low-level machine instructions."
                ),
                tool_calls=[],
                raw_provider="conversational_core"
            )

        if "quantum computing" in p_lower and any(w in p_lower for w in ["what is", "explain"]):
            return ModelResponse(
                text=(
                    "**Quantum computing** is a multidisciplinary field comprising aspects of computer science, physics, and mathematics that utilizes quantum mechanics to solve complex problems faster than classical computers.\n\n"
                    "Instead of classical bits (which represent 0 or 1), quantum computers use **qubits** that can exist in a state of superposition and entanglement, exponentially speeding up cryptographic, optimization, and molecular simulation computations."
                ),
                tool_calls=[],
                raw_provider="conversational_core"
            )

        # 10. General Conversational Fallback with Helpful Suggestions
        return ModelResponse(
            text=(
                f"I received your inquiry: *\"{prompt}\"*\n\n"
                f"I am operating in sovereign mode with real-time privacy scrubbing. Here are tasks you can run:\n"
                f" • **Live System Status:** Type `show telemetry`\n"
                f" • **Verified Math:** Type `calculate 15000 * 1.08^5`\n"
                f" • **Knowledge Search:** Type `search knowledge for project guide`\n"
                f" • **File Analysis:** Type `check system_logs.txt`\n"
                f" • **Workspace Explorer:** Type `list files`\n\n"
                f"💡 *Tip:* You can enable seamless open-ended neural dialogue anytime by entering a free Gemini, Groq, or OpenAI API key in the Cloud & Privacy settings!"
            ),
            tool_calls=[],
            raw_provider="conversational_core"
        )
