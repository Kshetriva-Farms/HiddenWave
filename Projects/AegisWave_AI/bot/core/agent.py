"""
AegisWave AI - Sovereign Autonomous Agent
Coordinates Security Shield, Model Reasoning, Tool Sandbox, Verifier, and Persistent Vault.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import time

from bot.security.shield import SecurityShield
from bot.memory.vault import LocalVault
from bot.tools import default_registry
from bot.models.router import ModelRouter
from bot.core.verifier import AccuracyVerifier
from config.settings import VAULT_DB_PATH, DEFAULT_MODEL_NAME

@dataclass
class AgentStep:
    stage: str
    status: str
    details: str

@dataclass
class AgentResult:
    final_text: str
    sanitized_prompt: str
    redactions: List[Dict[str, str]]
    steps: List[AgentStep]
    verification_status: str

class AegisAgent:
    def __init__(self, session_id: str = "default_session", router: Optional[ModelRouter] = None):
        self.session_id = session_id
        self.shield = SecurityShield()
        self.vault = LocalVault(VAULT_DB_PATH)
        self.tools = default_registry
        self.router = router or ModelRouter(preferred_model=DEFAULT_MODEL_NAME)
        self.verifier = AccuracyVerifier()

    def run(self, user_prompt: str) -> AgentResult:
        steps: List[AgentStep] = []
        start_time = time.time()

        # -------------------------------------------------------------
        # STAGE 1: Security Shield Scrubbing & Confidentiality Gate
        # -------------------------------------------------------------
        is_confidential = self.shield.is_confidential(user_prompt)
        sanitized_prompt, redactions = self.shield.sanitize(user_prompt)

        if is_confidential:
            steps.append(AgentStep(
                stage="Security Shield",
                status="AIR-GAP ENFORCED",
                details="Classified/Confidential content detected. Strictly forcing 100% offline local execution."
            ))
            self.vault.log_audit("SECURITY", "AIRGAP_OVERRIDE", f"Forced local airgap for session {self.session_id}")
        elif redactions:
            steps.append(AgentStep(
                stage="Security Shield",
                status="PROTECTED",
                details=f"Masked {len(redactions)} sensitive credential(s) before model ingestion."
            ))
            self.vault.log_audit("SANITIZE", "SUCCESS", f"Masked {len(redactions)} tokens in session {self.session_id}")
        else:
            steps.append(AgentStep(
                stage="Security Shield",
                status="CLEAN",
                details="Zero sensitive credentials detected. Direct safe passthrough."
            ))

        # -------------------------------------------------------------
        # STAGE 2: Model Planning & Tool Dispatch
        # -------------------------------------------------------------
        steps.append(AgentStep(
            stage="Reasoning Engine",
            status="ACTIVE",
            details=f"Active Provider: {self.router.get_active_provider_name()}"
        ))

        # Retrieve recent session history for continuous conversational context
        history = self.vault.get_session_history(self.session_id, limit=4)
        if history:
            context_prefix = "\n".join([f"{h['role'].capitalize()}: {h['content']}" for h in history])
            context_prompt = f"Previous context:\n{context_prefix}\n\nUser: {sanitized_prompt}"
        else:
            context_prompt = sanitized_prompt

        model_resp = self.router.generate(
            prompt=context_prompt,
            available_tools=self.tools.get_descriptions(),
            is_confidential=is_confidential
        )

        tool_observations = []

        # -------------------------------------------------------------
        # STAGE 3: Sandboxed Tool Execution
        # -------------------------------------------------------------
        if model_resp.tool_calls:
            for tc in model_resp.tool_calls:
                steps.append(AgentStep(
                    stage="Tool Sandbox",
                    status="EXECUTING",
                    details=f"Tool: {tc.tool_name}({tc.arguments})"
                ))

                try:
                    tool_out = self.tools.execute(tc.tool_name, **tc.arguments)
                    tool_observations.append(str(tool_out))
                    steps.append(AgentStep(
                        stage="Tool Sandbox",
                        status="SUCCESS",
                        details=f"Observation: {str(tool_out)[:200]}..." if len(str(tool_out)) > 200 else f"Observation: {tool_out}"
                    ))
                    self.vault.log_audit("TOOL_EXEC", "SUCCESS", f"Executed {tc.tool_name}")
                except Exception as e:
                    err_msg = f"Error: {e}"
                    tool_observations.append(err_msg)
                    steps.append(AgentStep(
                        stage="Tool Sandbox",
                        status="ERROR",
                        details=err_msg
                    ))
                    self.vault.log_audit("TOOL_EXEC", "BLOCKED", f"{tc.tool_name}: {err_msg}")

        # -------------------------------------------------------------
        # STAGE 4: Accuracy Verification
        # -------------------------------------------------------------
        if tool_observations:
            tools_ok, tool_msg = self.verifier.verify_tool_execution(tool_observations)
            if not tools_ok:
                verify_status = f"WARNING: {tool_msg}"
            else:
                verify_status = "PASS: Ground truth empirically confirmed."
            
            steps.append(AgentStep(
                stage="Accuracy Verifier",
                status="VERIFIED" if tools_ok else "FLAGGED",
                details=verify_status
            ))
            
            # Formulate grounded output
            if any("read_file" in s.details for s in steps):
                content = tool_observations[0]
                lines = [l for l in content.splitlines() if l.strip()]
                error_count = content.count("[ERROR]")
                if error_count > 0:
                    answer = f"Analyzed file ({len(lines)} lines). Found {error_count} error events."
                else:
                    answer = f"File Content Summary:\n{content[:500]}"
            elif any("calculate" in s.details for s in steps):
                answer = f"Calculation Result: {tool_observations[0]}"
            elif any("system_telemetry" in s.details for s in steps):
                answer = tool_observations[0]
            elif any("list_directory" in s.details for s in steps):
                answer = f"Directory Listing:\n{tool_observations[0]}"
            elif any("fetch_web_page" in s.details for s in steps):
                answer = f"Web Content:\n{tool_observations[0][:600]}"
            else:
                answer = "\n".join(tool_observations)
        else:
            verify_status = "Direct conversational response."
            answer = model_resp.text

        # -------------------------------------------------------------
        # STAGE 5: Local Memory Commit & Token Restoration
        # -------------------------------------------------------------
        # Restore masked tokens back to user view
        final_user_answer = self.shield.restore(answer)

        # Commit to local SQLite
        self.vault.add_message(self.session_id, "user", user_prompt)
        self.vault.add_message(self.session_id, "assistant", final_user_answer)
        self.vault.log_audit("TASK_COMPLETE", "SUCCESS", f"Completed in {time.time() - start_time:.2f}s")

        return AgentResult(
            final_text=final_user_answer,
            sanitized_prompt=sanitized_prompt,
            redactions=redactions,
            steps=steps,
            verification_status=verify_status
        )

    def unload_model(self):
        """Release underlying model weights from memory."""
        self.router.unload_models()
