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
                    "Hello! I am AegisWave, your sovereign AI companion.\n"
                    "I'm running locally on your HP Victus, fully protected by your private security shield.\n\n"
                    "How can I help you today? You can ask me to inspect project files, run verified calculations, "
                    "monitor system hardware, or analyze confidential logs."
                ),
                tool_calls=[],
                raw_provider="conversational_core"
            )

        # 2. Identity & How it works
        if any(w in p_lower for w in ["who are you", "what are you", "what can you do", "introduce yourself"]):
            return ModelResponse(
                text=(
                    "I am AegisWave AI -- your multipurpose, data-secure, portable personal assistant.\n\n"
                    "Here is what makes me different from standard cloud chatbots:\n"
                    " * 100% Sovereign & Private: Your data, files, and keys never leave your machine unredacted.\n"
                    " * Factually Grounded: I verify all mathematical and file claims before answering to prevent hallucinations.\n"
                    " * Sandboxed & Safe: My tools are path-jailed so I cannot harm your operating system.\n"
                    " * Hardware-Tuned: Optimized specifically for your AMD Ryzen 5 & GTX 1650 4GB GPU.\n\n"
                    "Try asking: 'show telemetry', 'calculate (15000 * 1.08^5)', or 'check system_logs.txt'!"
                ),
                tool_calls=[],
                raw_provider="conversational_core"
            )

        # 3. System Telemetry / Hardware check
        if any(w in p_lower for w in ["telemetry", "hardware", "cpu", "ram", "battery", "specs", "disk", "how is my pc", "laptop status"]):
            tool_calls.append(ToolCallRequest(tool_name="system_telemetry", arguments={}))
            return ModelResponse(
                text="Checking your HP Victus hardware status...",
                tool_calls=tool_calls,
                raw_provider="conversational_core"
            )

        # 4. Math Calculations
        math_pattern = r"(?:calculate|compute|what is|how much is|solve)\s+([0-9\.\+\-\*\/\^\(\)\s]+)"
        match_math = re.search(math_pattern, prompt, re.IGNORECASE)
        if match_math:
            expr = match_math.group(1).strip()
            tool_calls.append(ToolCallRequest(tool_name="calculate", arguments={"expression": expr}))
            return ModelResponse(
                text=f"Calculating {expr} with verified arithmetic...",
                tool_calls=tool_calls,
                raw_provider="conversational_core"
            )

        # 5. File Operations - Reading / Analyzing
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

        # 6. Directory Listing
        if any(w in p_lower for w in ["list files", "directory", "show folder", "what files do i have", "ls", "dir"]):
            tool_calls.append(ToolCallRequest(tool_name="list_directory", arguments={"path": "."}))
            return ModelResponse(
                text="Listing the files inside your project directory...",
                tool_calls=tool_calls,
                raw_provider="conversational_core"
            )

        # 7. Web Fetch
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

        # 8. Local Knowledge Search (RAG)
        if any(w in p_lower for w in ["search knowledge", "knowledge base", "search notes", "find in notes", "search docs"]):
            query = re.sub(r"(?i)search\s+(?:knowledge\s+(?:for\s+)?|notes\s+(?:for\s+)?|docs\s+(?:for\s+)?)", "", prompt).strip()
            tool_calls.append(ToolCallRequest(tool_name="search_knowledge", arguments={"query": query or prompt}))
            return ModelResponse(
                text=f"Searching local knowledge base for: '{query}'...",
                tool_calls=tool_calls,
                raw_provider="conversational_core"
            )

        # 9. Conversational Fallback with Personality
        return ModelResponse(
            text=(
                f"I hear you! You said: \"{prompt}\"\n\n"
                f"I am actively listening and ready to assist. Since you're running in sovereign offline mode, "
                f"here are some interactive tasks you can give me right now:\n"
                f" • Check your PC performance: Type 'show telemetry'\n"
                f" • Do verified math: Type 'calculate (2500 * 1.15)'\n"
                f" • Audit project files: Type 'check system_logs.txt'\n"
                f" • List workspace folders: Type 'list files'\n\n"
                f"💡 Pro-Tip: To enable full open-ended neural conversation, you can load a local model "
                f"(like Llama 3.2 3B) or enter a free API key!"
            ),
            tool_calls=[],
            raw_provider="conversational_core"
        )
