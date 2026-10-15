"""
AegisWave AI - Web Fetch & Extraction Tool
Safely fetches and summarizes public web text with stripped ads and trackers.
"""

import requests
from bs4 import BeautifulSoup
from typing import Optional

def fetch_web_page(url: str, max_chars: int = 4000) -> str:
    """Fetches a web page and extracts its primary readable text content."""
    if not (url.startswith("http://") or url.startswith("https://")):
        return "Error: URL must start with http:// or https://"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AegisWave-Research/1.0"
    }

    try:
        resp = requests.get(url, headers=headers, timeout=8)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        # Strip scripts, styles, and navigational junk
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
            tag.decompose()

        text = soup.get_text(separator="\n")
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        clean_text = "\n".join(lines)

        if len(clean_text) > max_chars:
            clean_text = clean_text[:max_chars] + f"\n...[Truncated at {max_chars} chars]"

        return f"Content of {url}:\n\n{clean_text}" if clean_text else "Page returned no text."

    except requests.exceptions.Timeout:
        return f"Error: Request to {url} timed out."
    except Exception as e:
        return f"Web Fetch Error: {e}"
