import sys
import time
from pathlib import Path

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.markdown import Markdown
from rich.prompt import Prompt

from bot.core.agent import AegisAgent
from config.settings import HARDWARE_CONFIG, VAULT_DB_PATH

console = Console()

def print_banner():
    device_model = HARDWARE_CONFIG.get("device", {}).get("model", "PC")
    gpu_name = HARDWARE_CONFIG.get("device", {}).get("gpu", {}).get("dedicated", {}).get("name", "GPU")
    cpu_name = HARDWARE_CONFIG.get("device", {}).get("cpu", {}).get("name", "CPU")

    banner_text = (
        f"[bold cyan]AegisWave AI[/bold cyan] [dim]| Sovereign Multipurpose Assistant[/dim]\n\n"
        f" * [bold green]Security:[/bold green] Zero-Leakage PII Scrubber Active\n"
        f" * [bold magenta]Hardware Profile:[/bold magenta] {device_model} ({cpu_name} | {gpu_name})\n"
        f" * [bold yellow]Local Vault:[/bold yellow] {VAULT_DB_PATH}\n\n"
        f"[dim]Type your message, or enter [bold cyan]/help[/bold cyan] for commands. ([bold red]/exit[/bold red] to quit)[/dim]"
    )
    console.print(Panel(banner_text, border_style="cyan", title="[bold cyan]AEGISWAVE CORE[/bold cyan]", subtitle="v1.0.0"))

def show_help():
    table = Table(title="Available Slash Commands", border_style="cyan")
    table.add_column("Command", style="bold cyan", width=16)
    table.add_column("Description", style="white")

    table.add_row("/telemetry", "Display live Ryzen CPU %, RAM usage, and battery status")
    table.add_row("/vault", "Inspect stored long-term memories in local SQLite vault")
    table.add_row("/knowledge", "List all indexed files in the private knowledge base")
    table.add_row("/sync", "Scan knowledge/ folder and index new documents")
    table.add_row("/audit", "View recent security shield and tool audit trails")
    table.add_row("/clear", "Clear current session context")
    table.add_row("/help", "Show this help table")
    table.add_row("/exit", "Exit the assistant")

    console.print(table)

def show_telemetry(agent: AegisAgent):
    telemetry_text = agent.tools.execute("system_telemetry")
    console.print(Panel(telemetry_text, title="📊 System Telemetry", border_style="magenta"))

def show_audit(agent: AegisAgent):
    audits = agent.vault.get_recent_audits(limit=8)
    if not audits:
        console.print("[dim]No audit records yet.[/dim]")
        return

    table = Table(title="[Recent Security Audit Trail]", border_style="green")
    table.add_column("ID", width=4)
    table.add_column("Action", style="cyan")
    table.add_column("Status", style="bold")
    table.add_column("Details", style="white")
    table.add_column("Timestamp", style="dim")

    for a in audits:
        status_style = "bold green" if a["status"] == "SUCCESS" else "bold red"
        table.add_row(str(a["id"]), a["action"], f"[{status_style}]{a['status']}[/]", str(a["details"]), a["timestamp"])

    console.print(table)

def show_vault(agent: AegisAgent):
    memories = agent.vault.list_memories()
    if not memories:
        console.print("[dim]No custom memories saved yet. Ask me to remember something![/dim]")
        return

    table = Table(title="[Stored Long-Term Memories]", border_style="yellow")
    table.add_column("Key", style="bold cyan")
    table.add_column("Value", style="white")
    table.add_column("Category", style="dim")
    table.add_column("Last Updated", style="dim")

    for m in memories:
        table.add_row(m["key"], str(m["value"]), m["category"], m["updated_at"])

    console.print(table)

def show_knowledge(agent: AegisAgent):
    from bot.memory.knowledge_base import KnowledgeBase
    kb = KnowledgeBase()
    files = kb.list_indexed_files()
    if not files:
        console.print("[dim]Knowledge base is empty. Drop files into the 'knowledge/' folder and run /sync![/dim]")
        return

    table = Table(title="[Indexed Knowledge Documents]", border_style="cyan")
    table.add_column("Filename", style="bold cyan")
    table.add_column("Size", style="white")
    table.add_column("Chunks", style="magenta")
    table.add_column("Indexed At", style="dim")

    for f in files:
        table.add_row(f["filename"], f"{f['size_bytes']} bytes", str(f["chunks"]), f["indexed_at"])

    console.print(table)

def sync_knowledge(agent: AegisAgent):
    from bot.memory.knowledge_base import KnowledgeBase
    kb = KnowledgeBase()
    with console.status("[bold cyan]Scanning and indexing knowledge documents...[/bold cyan]"):
        stats = kb.sync_documents()
    console.print(
        f"[green]Sync Complete:[/green] {stats['added']} added, {stats['updated']} updated, "
        f"{stats['skipped']} unchanged. [bold cyan]({stats['total_chunks']} total passages indexed)[/bold cyan]"
    )

def main():
    print_banner()
    agent = AegisAgent(session_id="cli_session")

    while True:
        try:
            user_input = Prompt.ask("\n[bold cyan]You[/bold cyan]").strip()
        except (KeyboardInterrupt, EOFError):
            console.print("\n[bold cyan]AegisWave AI:[/bold cyan] Shutting down cleanly. Goodbye!")
            break

        if not user_input:
            continue

        if user_input == "/exit":
            console.print("[bold cyan]AegisWave AI:[/bold cyan] Session terminated safely.")
            break
        elif user_input == "/help":
            show_help()
            continue
        elif user_input == "/telemetry":
            show_telemetry(agent)
            continue
        elif user_input == "/audit":
            show_audit(agent)
            continue
        elif user_input == "/vault":
            show_vault(agent)
            continue
        elif user_input == "/knowledge":
            show_knowledge(agent)
            continue
        elif user_input == "/sync":
            sync_knowledge(agent)
            continue
        elif user_input == "/clear":
            agent = AegisAgent(session_id=f"session_{int(time.time())}")
            console.print("[green]Session reset. Memory cleared for current thread.[/green]")
            continue

        # Execute autonomous agent pipeline
        with console.status("[bold cyan]Reasoning and verifying...[/bold cyan]", spinner="dots"):
            result = agent.run(user_input)

        # Show execution stages
        for step in result.steps:
            if step.stage == "Security Shield" and step.status == "PROTECTED":
                console.print(f"  [bold yellow][SHIELD]:[/bold yellow] [dim]{step.details}[/dim]")
            elif step.stage == "Tool Sandbox":
                console.print(f"  [bold green][TOOL]:[/bold green] [dim]{step.details}[/dim]")
            elif step.stage == "Accuracy Verifier":
                console.print(f"  [bold cyan][VERIFY]:[/bold cyan] [dim]{step.details}[/dim]")

        # Print final response
        console.print("\n[bold cyan]AegisWave AI:[/bold cyan]")
        console.print(Panel(result.final_text, border_style="cyan"))

if __name__ == "__main__":
    main()
