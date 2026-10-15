"""
AegisWave AI - Universal Entry Launcher
Choose between running the Interactive Rich CLI or the Mobile/Web Gateway Server.
"""

import sys
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
ENV = os.environ.copy()
ENV["PYTHONPATH"] = str(ROOT)

def show_menu():
    print("=" * 60)
    print(" [AEGISWAVE AI] Universal Launcher")
    print("=" * 60)
    print(" [1] Launch Interactive Terminal CLI (Rich UI)")
    print(" [2] Launch Mobile & Web Gateway Server (Port 5000)")
    print(" [3] Run System Telemetry Diagnostics")
    print(" [4] Setup / Download Local Neural Model (Llama 3.2 3B)")
    print(" [5] Exit")
    print("=" * 60)

def main():
    while True:
        show_menu()
        choice = input("Enter choice [1-5]: ").strip()
        if choice == "1":
            print("\nStarting Interactive CLI...\n")
            subprocess.run([sys.executable, str(ROOT / "bot" / "main.py")], env=ENV, cwd=str(ROOT))
        elif choice == "2":
            print("\nStarting Web & Mobile Gateway at http://127.0.0.1:5000...\n")
            subprocess.run([sys.executable, str(ROOT / "web" / "server.py")], env=ENV, cwd=str(ROOT))
        elif choice == "3":
            print("\nRunning Diagnostics...\n")
            subprocess.run([sys.executable, "-c", "from bot.tools.system import get_system_telemetry; print(get_system_telemetry())"], env=ENV, cwd=str(ROOT))
        elif choice == "4":
            subprocess.run([sys.executable, str(ROOT / "download_model.py")], env=ENV, cwd=str(ROOT))
        elif choice == "5":
            print("Exiting.")
            break
        else:
            print("Invalid choice, please select 1-5.\n")

if __name__ == "__main__":
    main()
