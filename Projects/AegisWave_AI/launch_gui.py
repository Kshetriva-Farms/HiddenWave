"""
AegisWave AI — GUI Launcher
Starts a lightweight local HTTP server and opens the visual architecture
walkthrough directly in your default web browser.
"""

import http.server
import socketserver
import webbrowser
import threading
import time
from pathlib import Path

PORT = 8765
DIRECTORY = Path(__file__).parent / "gui_demo"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

def open_browser():
    time.sleep(0.8)
    url = f"http://localhost:{PORT}"
    print(f"\n[+] Opening visual GUI demo in your browser: {url}")
    webbrowser.open(url)

if __name__ == "__main__":
    print("=" * 65)
    print(" AegisWave AI — Interactive Visual Architecture Guide")
    print("=" * 65)
    print(f"Serving GUI from: {DIRECTORY}")
    print(f"URL: http://localhost:{PORT}")
    print("Press Ctrl+C in this terminal to stop the server.\n")

    threading.Thread(target=open_browser, daemon=True).start()

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[!] GUI Server stopped.")
