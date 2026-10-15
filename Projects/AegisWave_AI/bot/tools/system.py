"""
AegisWave AI - System Telemetry Tools
Monitors CPU, Memory, Disk, and hardware utilization via psutil.
"""

import psutil
from typing import Dict, Any

def get_system_telemetry() -> str:
    """Returns real-time hardware status including CPU %, RAM usage, Disk, and Battery."""
    cpu_pct = psutil.cpu_percent(interval=0.2)
    ram = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    
    battery = psutil.sensors_battery()
    battery_info = "N/A"
    if battery:
        plugged = "Charging" if battery.power_plugged else "Discharging"
        battery_info = f"{battery.percent:.0f}% ({plugged})"

    return (
        f"--- Live System Telemetry ---\n"
        f"CPU Usage: {cpu_pct}%\n"
        f"RAM Used: {ram.used / (1024**3):.1f} GB / {ram.total / (1024**3):.1f} GB ({ram.percent}% used)\n"
        f"RAM Available: {ram.available / (1024**3):.1f} GB\n"
        f"Disk Space: {disk.free / (1024**3):.1f} GB free out of {disk.total / (1024**3):.1f} GB\n"
        f"Battery Status: {battery_info}\n"
    )
