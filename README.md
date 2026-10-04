# HiddenWave.in Web Portal

This repository contains the design, copywriting structure, and interactive scripts for **HiddenWave.in**—a premium, bright slate-white themed web portal outlining our professional business services.

HiddenWave unifies three foundational operational tracks: **Web Operations**, **Growth Marketing**, and **CA Compliance** under a single coordinated strategy.

---

## 🎨 Visual Design Tokens & Animations
- **Theme**: Clean Slate-White corporate interface with natural shadows and subtle borders (avoiding dark AI-template indicators).
- **Core Background**: Soft Slate Grey (`#f8fafc`).
- **Core Card Backdrops**: Crisp Pure White (`#ffffff`).
- **Headings & Body Copy**: Slate Navy (`#0f172a` / `#334155`).
- **Pillar Accents**:
  - Web Operations: Sky Blue (`#0284c7`)
  - Growth Marketing: Indigo (`#4f46e5`)
  - CA Compliance: Emerald Green (`#059669`)
- **Premium UI Features**:
  - **Scroll Progress Indicator**: Located at the top of the browser window.
  - **Page Loader**: Full-screen fade transition on initial load.
  - **Back-to-Top Button**: Smooth scrolling navigation float.

---

## 📂 File Architecture

All code files are located in the `HiddenWave` folder:

- **`index.html`**: Main entrance portal. Hosts the hero banner, core capabilities summaries, an interactive SVG Venn diagram detailing partner responsibilities, trusted client logo arrays, testimonials, the consultation form, and the Client Portal modal.
- **`styles.css`**: Design system tokens, variables, typography sets (`Outfit` and `Inter` from Google Fonts), responsive grids, keyframes animations, header dropdown menus, customer auth modal layouts, scroll progress, and back-to-top layouts.
- **`script.js`**: Mobile responsive navigation menu trigger, interactive Venn sector hover/click descriptions, Web Operations custom package price configurator, Firestore profile persistence, and Google Auth Sign-In popup handlers.
- **`web-operations.html`**: Dedicated showcase page detailing front-end builds, API channels, speed optimization metrics, Next.js e-commerce case studies (featuring KshetrivaFarms.com logo Integration), and K.Vishnu Vardhan's developer bio card.
- **`growth-marketing.html`**: Active growth marketing page featuring search campaign visibility checklists, conversion optimization metrics, and Rohit Sharma's marketing lead bio.
- **`ca-compliance.html`**: Active corporate chartered accountant compliance page detailing tax returns, statutory filings, bookkeeping audits, and Neha Gupta's CA bio.
- **`privacy.html`**: Privacy policy detailing data protection, client portal session security, and Firestore account removal steps.
- **`terms.html`**: Terms of Service detailing statement of work scopes, billing terms, and Hyderabad, India legal jurisdiction.
- **`blog.html`**: Insights home listing active B2B articles.
- **`blog-nextjs-ecommerce.html`**: Article reviewing Next.js headless e-commerce speed.
- **`blog-organic-scaling.html`**: Article outlining zero-ad keyword acquisition.
- **`blog-gst-compliance.html`**: Article detailing GST filings and tax regulations for startups.
- **`sitemap.xml`**: Search engine index catalog tracking all 10 public directories.

---

## 🔐 Client Portal & Authentication (Profile Persistence)

The web portal includes a Client Portal popup modal accessible via the Account button in the header across all pages:
- **Google Sign-In**: Uses Firebase Authentication with Google Auth Provider to authenticate corporate accounts.
- **Mock Sandbox Mode**: Runs in offline sandbox mode if Firebase is unconfigured, using mock details (`John Doe`, `john.doe@corporate.com`).
- **Profile Edit & Save**: Clients can save and persist basic details (Display Name, Phone Number, Company Name) inside the modal. Changes are stored in `localStorage` and synchronized to Google Firestore.

---

## 📈 Web Service Cost Configurator & Discounts

The interactive service builder in `web-operations.html` dynamically aggregates pricing and applies cumulative discount rates based on core layer selections:

### Core Layers
- Landing Page / Basic Website: `₹10,000`
- E-Commerce Storefront (e.g. Grocery Store): `₹25,000`
- Advanced Web App (React / Next.js): `₹35,000`
- Custom Backend API & Database: `₹30,000`

### Optional Platform Features
- All add-ons are exactly `₹5,000` each (CMS Admin, Payments, Notifications, Chat, Analytics, Multi-Language).

### Cumulative Discounts
- 1 Core layer selected: **10%** discount
- 2 Core layers selected: **20%** discount
- 3+ Core layers selected: **30%** discount

*Discount rates apply dynamically to the combined selected sum, with the final estimated range outputting as `discounted_sum` to `discounted_sum * 1.3`.*

---

## 🚀 Running Locally

You can open the web files directly in your web browser by double-clicking `index.html`. 

To run a lightweight local web server:

### Python Server
```bash
python -m http.server 8080 --directory .
```

### NodeJS (NPM) Server
```bash
npx serve .
```

Navigate to **`http://localhost:8080`** in your browser.
