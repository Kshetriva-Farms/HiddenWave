"""
AegisWave AI - Local Vault (SQLite WAL)
Self-contained, portable, persistent memory store for sessions, learned facts, and audit logs.
"""

import sqlite3
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

class LocalVault:
    """Manages local-first SQLite database with ACID guarantees and zero cloud telemetry."""

    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self._init_db()

    def _init_db(self):
        with self.conn:
            # Enable WAL mode for high concurrency & reliability
            self.conn.execute("PRAGMA journal_mode=WAL;")
            self.conn.execute("PRAGMA synchronous=NORMAL;")

            # Long-term Key-Value Memory
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS memory (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    category TEXT DEFAULT 'general',
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Conversation History
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS conversation (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    metadata TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Audit Trail
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    action TEXT NOT NULL,
                    status TEXT NOT NULL,
                    details TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

    def remember(self, key: str, value: Any, category: str = "general"):
        val_str = json.dumps(value) if not isinstance(value, str) else value
        with self.conn:
            self.conn.execute("""
                INSERT INTO memory (key, value, category, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET
                    value=excluded.value,
                    category=excluded.category,
                    updated_at=CURRENT_TIMESTAMP;
            """, (key, val_str, category))

    def recall(self, key: str) -> Optional[Any]:
        cur = self.conn.cursor()
        cur.execute("SELECT value FROM memory WHERE key = ?", (key,))
        row = cur.fetchone()
        if not row:
            return None
        val_str = row[0]
        try:
            return json.loads(val_str)
        except Exception:
            return val_str

    def list_memories(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        cur = self.conn.cursor()
        if category:
            cur.execute("SELECT key, value, category, updated_at FROM memory WHERE category = ? ORDER BY updated_at DESC", (category,))
        else:
            cur.execute("SELECT key, value, category, updated_at FROM memory ORDER BY updated_at DESC")
        
        results = []
        for key, val, cat, updated in cur.fetchall():
            results.append({"key": key, "value": val, "category": cat, "updated_at": updated})
        return results

    def add_message(self, session_id: str, role: str, content: str, metadata: Optional[Dict[str, Any]] = None):
        meta_str = json.dumps(metadata or {})
        with self.conn:
            self.conn.execute("""
                INSERT INTO conversation (session_id, role, content, metadata)
                VALUES (?, ?, ?, ?);
            """, (session_id, role, content, meta_str))

    def get_session_history(self, session_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        cur = self.conn.cursor()
        cur.execute("""
            SELECT role, content, created_at FROM conversation
            WHERE session_id = ? ORDER BY id ASC LIMIT ?
        """, (session_id, limit))
        return [{"role": r, "content": c, "timestamp": t} for r, c, t in cur.fetchall()]

    def log_audit(self, action: str, status: str, details: str):
        with self.conn:
            self.conn.execute("""
                INSERT INTO audit_logs (action, status, details)
                VALUES (?, ?, ?);
            """, (action, status, details))

    def get_recent_audits(self, limit: int = 10) -> List[Dict[str, Any]]:
        cur = self.conn.cursor()
        cur.execute("""
            SELECT id, action, status, details, timestamp
            FROM audit_logs ORDER BY id DESC LIMIT ?
        """, (limit,))
        return [
            {"id": i, "action": a, "status": s, "details": d, "timestamp": t}
            for i, a, s, d, t in cur.fetchall()
        ]

    def close(self):
        self.conn.close()
