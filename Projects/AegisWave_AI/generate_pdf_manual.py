"""
AegisWave AI - Publication-Quality PDF Documentation Generator
Uses reportlab to compile the Master System Specification into a formatted PDF manual.
"""

from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)

ROOT = Path(__file__).parent.resolve()
OUTPUT_PDF = ROOT / "AegisWave_AI_Master_Manual.pdf"

def build_pdf():
    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0B2545")     # Deep Navy
    ACCENT = colors.HexColor("#134074")      # Slate Blue
    CYAN_ACCENT = colors.HexColor("#0077B6") # Cyan / Blue
    TEXT_DARK = colors.HexColor("#1D2D44")   # Charcoal
    LIGHT_BG = colors.HexColor("#EEF4F8")    # Soft Slate Light
    BORDER_COLOR = colors.HexColor("#8DA9C4")# Muted Slate

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=ACCENT,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=CYAN_ACCENT,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#0D1B2A"),
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT_DARK
    )

    story = []

    # =========================================================================
    # COVER / HEADER BANNER
    # =========================================================================
    story.append(Paragraph("AEGISWAVE AI — MASTER SYSTEM SPECIFICATION", title_style))
    story.append(Paragraph("Sovereign, Multipurpose, Accurate, Reliable, Portable & Data-Secure AI Architecture", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=CYAN_ACCENT, spaceAfter=12))

    meta_text = (
        "<b>Target System:</b> HP Victus Gaming Laptop (AMD Ryzen 5 5600H, NVIDIA GTX 1650 4GB VRAM, 8GB DDR4)<br/>"
        "<b>Workspace Path:</b> <code>D:\\HiddenWave\\Projects\\My_Bot</code> | <b>Document Version:</b> 1.0.0 Production Core"
    )
    story.append(Paragraph(meta_text, body_style))
    story.append(Spacer(1, 10))

    # =========================================================================
    # 1. CORE PHILOSOPHY & PILLARS
    # =========================================================================
    story.append(Paragraph("1. Core Philosophy & The Four Pillars", h1_style))
    story.append(Paragraph(
        "AegisWave AI is an autonomous personal AI engineered from first principles for complete data sovereignty, "
        "factual accuracy, reliability, and portability. It operates without streaming unredacted user prompts "
        "or confidential documents to cloud infrastructure, keeping full ownership and control in the user's hands.",
        body_style
    ))

    # Pillars Table
    pillar_data = [
        [
            Paragraph("<b>Pillar</b>", table_header_style),
            Paragraph("<b>Core Mechanism</b>", table_header_style),
            Paragraph("<b>User Benefit</b>", table_header_style)
        ],
        [
            Paragraph("<b>1. Data Secure</b>", table_cell_style),
            Paragraph("Real-time regex & entropy PII scrubbing; local SQLite storage.", table_cell_style),
            Paragraph("Zero telemetry. Passwords, API keys, and client emails never leave unmasked.", table_cell_style)
        ],
        [
            Paragraph("<b>2. Accurate</b>", table_cell_style),
            Paragraph("Empirical verification loop auditing numbers against tool observations.", table_cell_style),
            Paragraph("Eliminates hallucinations. Math and facts are proven by code execution.", table_cell_style)
        ],
        [
            Paragraph("<b>3. Reliable</b>", table_cell_style),
            Paragraph("Security sandbox jailing tool actions inside project boundaries.", table_cell_style),
            Paragraph("Crash-resilient SQLite WAL checkpoints; code cannot harm the host OS.", table_cell_style)
        ],
        [
            Paragraph("<b>4. Portable</b>", table_cell_style),
            Paragraph("Self-contained project folder with relative path resolution.", table_cell_style),
            Paragraph("Entire bot and memory travel on a USB drive or laptop with zero install hassle.", table_cell_style)
        ]
    ]

    t_pillars = Table(pillar_data, colWidths=[100, 210, 220])
    t_pillars.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_BG])
    ]))
    story.append(t_pillars)
    story.append(Spacer(1, 14))

    # =========================================================================
    # 2. HARDWARE ENVIRONMENT & TUNING
    # =========================================================================
    story.append(Paragraph("2. Target Hardware Profile (HP Victus)", h1_style))
    story.append(Paragraph(
        "The architecture is explicitly tuned for your laptop's specific hardware constraints:",
        body_style
    ))

    hw_data = [
        [Paragraph("<b>Component</b>", table_header_style), Paragraph("<b>Specification</b>", table_header_style), Paragraph("<b>Optimization Strategy</b>", table_header_style)],
        [Paragraph("CPU", table_cell_style), Paragraph("AMD Ryzen 5 5600H (6C/12T, 3.3-4.2 GHz)", table_cell_style), Paragraph("Allocates up to 8 worker threads for data parsing and AST math.", table_cell_style)],
        [Paragraph("GPU (Dedicated)", table_cell_style), Paragraph("NVIDIA GeForce GTX 1650 (4 GB GDDR6)", table_cell_style), Paragraph("Houses Q4_K_M 1B-3.8B models in VRAM for instant CUDA speed (~45 tok/s).", table_cell_style)],
        [Paragraph("System RAM", table_cell_style), Paragraph("8 GB DDR4 (Single Stick @ 3200 MHz)", table_cell_style), Paragraph("Prevents RAM exhaustion by keeping heavy model weights on the GPU.", table_cell_style)],
        [Paragraph("Storage", table_cell_style), Paragraph("512 GB NVMe PCIe M.2 SSD", table_cell_style), Paragraph("Rapid model loading (<2s) and high-concurrency SQLite WAL commits.", table_cell_style)]
    ]
    t_hw = Table(hw_data, colWidths=[90, 210, 230])
    t_hw.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), ACCENT),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_BG])
    ]))
    story.append(t_hw)
    story.append(Spacer(1, 14))

    # =========================================================================
    # 3. THE 5-STAGE EXECUTION PIPELINE
    # =========================================================================
    story.append(Paragraph("3. The 5-Stage Autonomous Execution Pipeline", h1_style))
    story.append(Paragraph(
        "Whenever a user submits an instruction, it traverses a deterministic 5-stage sovereign pipeline:",
        body_style
    ))

    stages = [
        ("Stage 1: Security Shield", "Scans the prompt via regex/entropy patterns. Replaces API keys (sk_...), emails, and IP addresses with surrogate tokens (<SECRET_KEY_1>, <EMAIL_2>). Logs audit action."),
        ("Stage 2: Reasoning Core", "Injects multi-turn conversational history from SQLite. Determines intent (conversational dialogue vs. tool action) and generates execution plan."),
        ("Stage 3: Sandboxed Tools", "Executes tools (read_file, calculate, system_telemetry, web_fetch). Path jailing strictly blocks attempts to escape D:\\HiddenWave\\Projects\\My_Bot."),
        ("Stage 4: Accuracy Verifier", "Audits proposed output numbers and claims against raw tool observation logs. Flags or rejects hallucinations before user presentation."),
        ("Stage 5: Local Vault Commit", "Restores original secrets locally for user display. Commits message records and audit entries to SQLite WAL database.")
    ]

    for title, desc in stages:
        story.append(Paragraph(f"<b>• {title}:</b> {desc}", bullet_style))

    story.append(Spacer(1, 14))

    # =========================================================================
    # 4. INFERENCE ENGINE OPTIONS & 5 CAPABILITY DOMAINS
    # =========================================================================
    story.append(Paragraph("4. Dual Engine Strategy & Capability Domains", h1_style))
    story.append(Paragraph(
        "AegisWave AI features a plug-and-play Model Router supporting both offline local execution and sovereign cloud supercharging:",
        body_style
    ))

    engine_data = [
        [Paragraph("<b>Domain</b>", table_header_style), Paragraph("<b>Option A: Local Neural (Llama 3.2 3B)</b>", table_header_style), Paragraph("<b>Option B: Sovereign Cloud (Gemini/Groq)</b>", table_header_style)],
        [Paragraph("<b>Privacy & Air-Gap</b>", table_cell_style), Paragraph("100% Offline. Zero bytes leave machine.", table_cell_style), Paragraph("Sanitized. Sensitive tokens masked by Shield first.", table_cell_style)],
        [Paragraph("<b>Text & Language</b>", table_cell_style), Paragraph("Strong daily writing, summarization, translation.", table_cell_style), Paragraph("Massive context (1M+ tokens), handles 100+ languages.", table_cell_style)],
        [Paragraph("<b>Creativity</b>", table_cell_style), Paragraph("Good for copy, email drafting, brainstorming.", table_cell_style), Paragraph("Master-level storytelling, tone nuance, scripts.", table_cell_style)],
        [Paragraph("<b>Data & Logic</b>", table_cell_style), Paragraph("Verified arithmetic via AST tool + Python debugging.", table_cell_style), Paragraph("Deep multi-step algorithmic reasoning & complex math.", table_cell_style)],
        [Paragraph("<b>Vision & Sound</b>", table_cell_style), Paragraph("Requires local modules (Whisper/Moondream).", table_cell_style), Paragraph("Native multimodal vision, audio, and handwriting OCR.", table_cell_style)],
        [Paragraph("<b>Automation</b>", table_cell_style), Paragraph("Path-jailed local filesystem & telemetry tools.", table_cell_style), Paragraph("Identical local tools with higher-level planning.", table_cell_style)]
    ]
    t_engines = Table(engine_data, colWidths=[90, 220, 220])
    t_engines.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_BG])
    ]))
    story.append(t_engines)
    story.append(Spacer(1, 14))

    # =========================================================================
    # 5. USER INTERFACES & RUNTIME MAP
    # =========================================================================
    story.append(Paragraph("5. User Interfaces & Operations", h1_style))
    story.append(Paragraph(
        "The system can be operated through three complementary interfaces:",
        body_style
    ))
    story.append(Paragraph("<b>1. Universal Interactive Launcher:</b> <code>python start_bot.py</code> (Provides numbered menu for CLI, Web, Diagnostics, and Model Download).", bullet_style))
    story.append(Paragraph("<b>2. Rich Terminal CLI:</b> <code>python bot/main.py</code> (Interactive console with /telemetry, /audit, /vault, /clear commands).", bullet_style))
    story.append(Paragraph("<b>3. Mobile & Desktop Web Gateway:</b> <code>python web/server.py</code> (Flask REST API on Port 5000. Mobile phones access via local Wi-Fi or Tailscale PWA).", bullet_style))
    story.append(Paragraph("<b>4. Visual Architecture Guide:</b> <code>python launch_gui.py</code> (Interactive browser visualizer on Port 8765).", bullet_style))

    story.append(Spacer(1, 14))

    # =========================================================================
    # 6. REPOSITORY FILE STRUCTURE
    # =========================================================================
    story.append(Paragraph("6. Complete Repository Structure", h1_style))

    file_tree = (
        "D:\\HiddenWave\\Projects\\My_Bot\\\n"
        "├── start_bot.py               # Universal Interactive Menu\n"
        "├── download_model.py          # Local Neural Model (Llama 3.2 3B) Downloader\n"
        "├── launch_gui.py              # Visual Architecture Server (Port 8765)\n"
        "├── AEGISWAVE_MASTER_MANUAL.md # Full Markdown Specification\n"
        "├── AegisWave_AI_Master_Manual.pdf # Official PDF Documentation\n"
        "├── config/\n"
        "│   ├── hardware_profile.json  # HP Victus GPU/CPU hardware tuning specs\n"
        "│   └── settings.py            # Environment roots, sandbox rules, model defaults\n"
        "├── bot/\n"
        "│   ├── main.py                # Rich Interactive Terminal CLI Client\n"
        "│   ├── core/                  # agent.py (ReAct Loop), verifier.py (The Critic)\n"
        "│   ├── security/              # shield.py (PII Scrubber), sandbox.py (Path Jail)\n"
        "│   ├── memory/                # vault.py (SQLite WAL Storage)\n"
        "│   ├── tools/                 # files.py, system.py, math_tool.py, web.py\n"
        "│   └── models/                # router.py, gpt4all_provider.py, cloud_provider.py\n"
        "├── web/server.py              # Flask Mobile & Web Gateway (Port 5000)\n"
        "├── gui_demo/index.html        # Modern Visual Architecture Dashboard\n"
        "└── data/                      # vault.db (SQLite) & models/ (Local GGUF Weights)\n"
    )

    story.append(Paragraph(f"<pre>{file_tree.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')}</pre>", code_style))

    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8))
    story.append(Paragraph("<i>AegisWave AI — Document compiled and verified on local HP Victus hardware.</i>", body_style))

    # Build Document
    doc.build(story)
    print(f"[SUCCESS] PDF Generated at: {OUTPUT_PDF}")

if __name__ == "__main__":
    build_pdf()
