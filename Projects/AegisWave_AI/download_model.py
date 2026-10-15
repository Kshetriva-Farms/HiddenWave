"""
AegisWave AI - Local Neural Model Downloader
Downloads Llama-3.2-3B-Instruct into data/models/ for 100% offline neural chat.
"""

import sys
from pathlib import Path
from gpt4all import GPT4All
from config.settings import MODELS_DIR

MODEL_NAME = "Llama-3.2-3B-Instruct-Q4_0.gguf"

def download_model(auto_confirm: bool = False):
    print("=" * 65)
    print(" AegisWave AI — Local Neural Model Setup")
    print("=" * 65)
    print(f"Model: {MODEL_NAME} (~1.9 GB)")
    print(f"Destination: {MODELS_DIR}")
    print("This runs 100% offline on your HP Victus (GTX 1650 / Ryzen 5).")
    print("=" * 65)

    if not auto_confirm:
        confirm = input("\nProceed with download? (y/N): ").strip().lower()
        if confirm != 'y':
            print("Download cancelled.")
            return

    print("\n[+] Downloading model weights... (Will automatically resume from previous byte position)")
    
    max_retries = 10
    for attempt in range(1, max_retries + 1):
        try:
            print(f"\n[Attempt {attempt}/{max_retries}] Connecting to model repository...")
            model = GPT4All(model_name=MODEL_NAME, model_path=str(MODELS_DIR), allow_download=True)
            print("\n[SUCCESS] Model downloaded and verified!")
            print("AegisWave will now automatically use this local neural engine for full conversational chat!")
            return
        except Exception as e:
            print(f"\n[!] Network interruption on attempt {attempt}: {e}")
            if attempt < max_retries:
                import time
                print("Re-establishing connection in 5 seconds...")
                time.sleep(5)
            else:
                print(f"\n[ERROR] Download failed after {max_retries} attempts.")

if __name__ == "__main__":
    auto = any(arg in sys.argv for arg in ["-y", "--yes"])
    download_model(auto_confirm=auto)
