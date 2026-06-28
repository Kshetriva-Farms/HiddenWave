# HiddenWave.in Web Portal

This repository contains the design, copywriting structure, and interactive scripts for **HiddenWave.in**—a premium, bright slate-white themed web portal outlining our professional business services.

HiddenWave unifies three foundational operational tracks: **Web Operations**, **Growth Marketing**, and **CA Compliance** under a single coordinated strategy.

---

## 🎨 Visual Design Tokens
- **Theme**: Clean Slate-White corporate interface with natural shadows and subtle borders (avoiding dark AI-template indicators).
- **Core Background**: Soft Slate Grey (`#f8fafc`).
- **Core Card Backdrops**: Crisp Pure White (`#ffffff`).
- **Headings & Body Copy**: Slate Navy (`#0f172a` / `#334155`).
- **Signatures & Icons**:
  - Web Operations: Sky Blue (`#0284c7`)
  - Growth Marketing: Indigo (`#4f46e5`)
  - CA Compliance: Emerald Green (`#059669`)

---

## 📂 File Architecture

All code files are located in the `HiddenWave` folder:

- **`index.html`**: Main entrance portal. Hosts the hero banner, core capabilities summaries, an interactive SVG Venn diagram detailing partner responsibilities, the Plan Mixer price builder, and the consultation form.
- **`styles.css`**: Design system tokens, variables, typography sets (`Outfit` and `Inter` from Google Fonts), responsive grids, keyframes animations, and element highlight rules.
- **`script.js`**: UI animations observer, mobile responsive navigation menu trigger, interactive Venn sector hover/click descriptions, price discounts calculator, and contact submit AJAX simulations.
- **`web-operations.html`**: Dedicated showcase page detailing front-end builds, API channels, speed optimization metrics, Next.js e-commerce case studies, and Aravind Nair's bio card.
- **`growth-marketing.html`**: Dedicated marketing subpage outlining keyword SEO audits, Google/Meta campaign management, ROAS case study achievements, and Rohit Sharma's bio card.
- **`ca-compliance.html`**: Dedicated chartered accountant subpage highlighting corporate GST filings, statutory audits, startup equity advisory case studies, and Neha Gupta's CA bio card.

---

## 📈 Plan Mixer & Cumulative Discounts Policy

The interactive service builder in the Plan Mixer dynamically aggregates pricing and applies cumulative discount rates based on selection:

| Services Selected | Base Rates (Est.) | Discount Applied | Calculated Output (Example) |
| :--- | :--- | :--- | :--- |
| **1 Service Only** | Web: ₹35,000 (Setup)<br>Mktg: ₹20,000/mo<br>Fin: ₹12,000/mo | **10%** | Web only: ₹31,500 (Setup)<br>Mktg only: ₹18,000/mo |
| **Any 2 Services** | Tech (Setup) + Mktg/Fin | **20%** | Web + Mktg: ₹28,000 setup + ₹16,000/mo |
| **All 3 Services** | Tech (Setup) + Mktg + Fin | **30%** | ₹24,500 setup + ₹22,400/mo |

---

## 🚀 Running Locally

You can open the web files directly in your web browser by double-clicking `index.html`. 

To run a lightweight local web server for advanced testing (such as URL scrolls or routing offsets):

### Python Server
```bash
python -m http.server 8080 --directory .
```

### NodeJS (NPM) Server
```bash
npx serve .
```

Navigate to **`http://localhost:8080`** in Chrome, Firefox, Safari, or Edge.
