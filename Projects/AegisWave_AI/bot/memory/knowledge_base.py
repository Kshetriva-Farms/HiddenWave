"""
AegisWave AI - Local Knowledge Base & Document Intelligence (FTS5 + BM25)
Zero-overhead, 100% private offline document indexer and retrieval engine.
"""

import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional
from config.settings import KNOWLEDGE_DIR, VAULT_DB_PATH

# Optional PDF parsing support
try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

class KnowledgeBase:
    """Manages offline document indexing and BM25 full-text retrieval using SQLite FTS5."""

    SUPPORTED_EXTENSIONS = {".txt", ".md", ".py", ".json", ".csv", ".log", ".yaml", ".yml", ".html"}
    if HAS_PYPDF:
        SUPPORTED_EXTENSIONS.add(".pdf")

    def __init__(self, db_path: Path = VAULT_DB_PATH, knowledge_dir: Path = KNOWLEDGE_DIR):
        self.db_path = Path(db_path)
        self.knowledge_dir = Path(knowledge_dir)
        self.knowledge_dir.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self._init_schema()

    def _init_schema(self):
        with self.conn:
            # Create FTS5 virtual table for lightning-fast BM25 document search
            self.conn.execute("""
                CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
                    filename,
                    chunk_id,
                    content,
                    tokenize='porter unicode61'
                );
            """)
            # Metadata tracking table
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS knowledge_meta (
                    filename TEXT PRIMARY KEY,
                    file_size INTEGER,
                    mtime REAL,
                    total_chunks INTEGER,
                    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

    def _read_file_text(self, file_path: Path) -> str:
        suffix = file_path.suffix.lower()
        if suffix == ".pdf" and HAS_PYPDF:
            try:
                reader = pypdf.PdfReader(str(file_path))
                pages = [page.extract_text() or "" for page in reader.pages]
                return "\n".join(pages)
            except Exception as e:
                return f"[Error reading PDF: {e}]"
        else:
            try:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    return f.read()
            except Exception as e:
                return f"[Error reading file: {e}]"

    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 80) -> List[str]:
        words = text.split()
        if not words:
            return []
        chunks = []
        i = 0
        while i < len(words):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
            i += (chunk_size - overlap)
        return chunks

    def sync_documents(self) -> Dict[str, Any]:
        """Scans the knowledge/ folder and indexes new or modified documents."""
        stats = {"added": 0, "updated": 0, "skipped": 0, "total_chunks": 0}

        for file_path in self.knowledge_dir.rglob("*"):
            if not file_path.is_file() or file_path.suffix.lower() not in self.SUPPORTED_EXTENSIONS:
                continue

            rel_name = file_path.relative_to(self.knowledge_dir).as_posix()
            stat = file_path.stat()
            file_size = stat.st_size
            mtime = stat.st_mtime

            # Check if file has changed
            cur = self.conn.cursor()
            cur.execute("SELECT file_size, mtime FROM knowledge_meta WHERE filename = ?", (rel_name,))
            row = cur.fetchone()

            if row and row[0] == file_size and abs(row[1] - mtime) < 1e-4:
                stats["skipped"] += 1
                continue

            # Read and chunk
            text = self._read_file_text(file_path)
            chunks = self._chunk_text(text)

            with self.conn:
                # Remove existing chunks for this file
                self.conn.execute("DELETE FROM knowledge_fts WHERE filename = ?", (rel_name,))
                
                # Insert new chunks
                for idx, chunk in enumerate(chunks):
                    self.conn.execute(
                        "INSERT INTO knowledge_fts (filename, chunk_id, content) VALUES (?, ?, ?)",
                        (rel_name, idx, chunk)
                    )

                # Record metadata
                self.conn.execute("""
                    INSERT INTO knowledge_meta (filename, file_size, mtime, total_chunks)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(filename) DO UPDATE SET
                        file_size=excluded.file_size,
                        mtime=excluded.mtime,
                        total_chunks=excluded.total_chunks,
                        indexed_at=CURRENT_TIMESTAMP;
                """, (rel_name, file_size, mtime, len(chunks)))

            if row:
                stats["updated"] += 1
            else:
                stats["added"] += 1
            stats["total_chunks"] += len(chunks)

        return stats

    def search(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Performs BM25 search across indexed documents and returns relevant excerpts."""
        # Sanitize query for FTS5 syntax
        clean_query = "".join(c if c.isalnum() or c.isspace() else " " for c in query).strip()
        if not clean_query:
            return []

        # Split into terms with OR match
        terms = [f'"{w}"' for w in clean_query.split() if len(w) > 1]
        if not terms:
            return []
        fts_query = " OR ".join(terms)

        cur = self.conn.cursor()
        try:
            cur.execute("""
                SELECT filename, chunk_id, snippet(knowledge_fts, 2, '<b>', '</b>', '...', 32) as match_excerpt,
                       content, rank
                FROM knowledge_fts
                WHERE knowledge_fts MATCH ?
                ORDER BY rank
                LIMIT ?
            """, (fts_query, limit))

            results = []
            for fn, cid, exc, full, rk in cur.fetchall():
                results.append({
                    "filename": fn,
                    "chunk_id": cid,
                    "excerpt": exc,
                    "content": full,
                    "score": round(-rk, 2)  # FTS5 rank is negative (lower = better)
                })
            return results
        except Exception as e:
            return [{"error": f"Search error: {e}"}]

    def list_indexed_files(self) -> List[Dict[str, Any]]:
        cur = self.conn.cursor()
        cur.execute("SELECT filename, file_size, total_chunks, indexed_at FROM knowledge_meta ORDER BY filename ASC")
        return [
            {"filename": r[0], "size_bytes": r[1], "chunks": r[2], "indexed_at": r[3]}
            for r in cur.fetchall()
        ]
