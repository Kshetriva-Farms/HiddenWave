"""
AegisWave AI - Knowledge Retrieval Tool
Enables the agent to search offline documents dropped into the knowledge/ folder.
"""

from bot.memory.knowledge_base import KnowledgeBase
from typing import Dict, Any

kb = KnowledgeBase()

def search_knowledge(query: str) -> str:
    """Searches indexed project documents and personal notes for relevant facts and passages."""
    results = kb.search(query, limit=3)
    if not results:
        return f"No documents in the knowledge base matched the query: '{query}'."

    output_lines = [f"Found {len(results)} relevant passage(s) in local knowledge base:"]
    for i, res in enumerate(results, 1):
        if "error" in res:
            return res["error"]
        output_lines.append(
            f"\n--- Source [{i}]: {res['filename']} (Relevance Score: {res['score']}) ---\n"
            f"{res['content'][:600]}"
        )
    return "\n".join(output_lines)

def sync_knowledge_files() -> str:
    """Indexes or re-scans all files in the knowledge/ folder."""
    stats = kb.sync_documents()
    return (
        f"Knowledge Base Synced: {stats['added']} added, {stats['updated']} updated, "
        f"{stats['skipped']} unchanged. Total chunks: {stats['total_chunks']}."
    )
