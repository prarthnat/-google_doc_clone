# Ajaia Collaborative Document Editor — AI-Native Full Stack Assessment

Welcome to the **Ajaia Collaborative Document Editor**, built for the **AI-Native Full Stack Product Engineer** take-home assignment by **Prarthna Tiwari** (`prarthnatiwari04@gmail.com`).

This project is an ultra-fast, visually polished, self-contained full-stack application inspired by Google Docs, built with **React 19, TypeScript, Vite, Tailwind CSS, TipTap, Express, and SQLite (`better-sqlite3`)**.

---

## 🚀 Quick Setup & Local Run Instructions

We prioritized zero-configuration setup so reviewers can run the full-stack application immediately without needing external database servers (Postgres/Redis/Docker) or paid API keys.

### Prerequisites
- **Node.js** v20+ or v24+ (`node -v`)
- **npm** v10+ (`npm -v`)

### 1. Install Dependencies
```bash
npm install
```

### 2. AI Assistant Setup (Optional / Recommended for full AI features)
To enable live Google Gemini (`gemini-2.5-flash`) AI-native writing features, create a `.env` file in the root directory with your free Gemini API key:
```env
GEMINI_API_KEY=your_key_here
```
*(You can get a free API key with 1M tokens/month instantly at [aistudio.google.com](https://aistudio.google.com)).*  
**Note:** If `GEMINI_API_KEY` is not provided, the application automatically uses a smart local heuristic engine so all 5 AI toolbar actions still work immediately out of the box during grading!

### 3. Run in Development Mode (Client & API concurrently)
```bash
npm run dev
```
- **Frontend UI:** `http://localhost:5173`
- **Backend API:** `http://localhost:3001`

### 3. Run Automated Tests
```bash
npm test
```
Runs our **Vitest + Supertest** automated test suite covering SQLite initialization, user seeding, document creation, access control (`403` vs `200`), and Markdown-to-HTML conversion.

### 4. Production Build & Start
```bash
npm run build
npm start
```
In production mode, our Node Express server on `http://localhost:3001` serves both the REST API and the static React `dist/` build!

---

## 👥 Seeded Demo Accounts & Testing Sharing

To make testing sharing workflows instant and effortless for hiring managers, the application boots with **4 seeded demo accounts** stored in our local SQLite database.

You can **switch accounts instantly anytime** using the **Account Switcher Dropdown in the top-right navigation bar**:

| Name | Email | Role | Default Permissions & Documents |
| :--- | :--- | :--- | :--- |
| **Prarthna Tiwari** *(Candidate)* | `prarthnatiwari04@gmail.com` | AI-Native Full Stack Product Engineer | Owner of *"Ajaia 2026 Product Strategy"*; Editor on Alex's Architecture Spec |
| **Alex Chen** | `alex.chen@ajaia.com` | Senior Product Manager | Owner of *"Q3 Engineering Spec"*; Editor on *"Product Strategy"* |
| **Maya Lin** | `maya.lin@ajaia.com` | Staff Product Designer | Viewer on *"Product Strategy"* (`View Only` mode enforced) |
| **David Kim** | `david.kim@ajaia.com` | Engineering Director | Viewer on *"Q3 Engineering Spec"* (`View Only` mode enforced) |

### How to Test Sharing End-to-End in 30 Seconds:
1. Open **"Ajaia 2026 Product Strategy"** while logged in as **Prarthna Tiwari**.
2. Click the **Share** button in the top right. You will see Alex Chen has **Can Edit** and Maya Lin has **Can View**.
3. Grant **David Kim** either `Can View` or `Can Edit` access using the dropdown.
4. Click the **Account Switcher** in the top bar and select **David Kim**.
5. Notice that David now sees the document under **"Shared with Me"** and opens it with the exact permissions you granted!

---

## 🌟 Core Features Implemented

### 1. Document Creation & Rich Text Editing (TipTap / ProseMirror)
- **Rich Formatting Toolbar:** Bold, Italic, Underline, Highlight, Headings (H1, H2, H3), Bulleted & Numbered Lists, Blockquotes, Code Blocks, and Alignments (Left/Center/Right).
- **Physical Paper UI:** Styled with sleek modern shadows (`shadow-paper`), clean typography (Inter, Merriweather, JetBrains Mono), and status indicators.
- **Title Editing & Autosave:** Real-time debounced autosave to SQLite (`Saving...` → `Saved to SQLite`).

### 2. File Upload & Workflow Integration
- **Supported Formats:** `.docx` (Microsoft Word), `.md` (Markdown), `.txt` (Plain text), `.html` (HTML).
- **Flexible Workflow:** When uploading a file via the modal, you can choose to:
  - **Create New Document:** Opens a fresh collaborative draft converted to rich text.
  - **Insert into Draft:** Appends the imported markdown/text/Word content right into your currently active draft!
- **Exporting:** Download any document anytime as `.md`, `.html`, or `.txt`.

### 3. Sharing & Access Control
- **Granular Permissions:** `Owner`, `Can Edit`, and `Can View`.
- **Enforced Security:** Both frontend UI (read-only editor canvas, hidden formatting bar) and backend APIs (`GET`, `PUT`, `DELETE`, `POST /share` enforce `403 Forbidden` for unauthorized attempts).

### 4. Reliable Persistence & Version History (Optional Stretch Goal Completed!)
- **SQLite Database (`better-sqlite3`):** Persists all users, documents, sharing permissions, and historical versions cleanly inside `data/ajaia_docs.db` using WAL mode.
- **Chronological Version Snapshots:** Automatically captures checkpoints when documents are created or updated, or when users create explicit named snapshots.
- **Historical Snapshot Preview & One-Click Restore:** Slide out the right-hand **History** drawer to inspect previous checkpoints and restore older versions in one click!

### 5. ✨ AI-Native Writing & Editing Assistant
- **Integrated AI Toolbar Dropdown:** Click the glowing **`✨ AI Assistant`** button right inside the formatting toolbar to access intelligent writing features.
- **5 Core Capabilities:**
  - **✨ Improve Writing:** Polishes clarity, tone, and professional phrasing while preserving original intent.
  - **✂️ Make Concise:** Condenses verbose copy into direct, punchy sentences.
  - **📝 Fix Grammar & Spelling:** Corrects syntax and punctuation discrepancies.
  - **📈 Expand Ideas:** Elaborates on concepts with rich, well-structured context.
  - **📊 Executive Summary:** Generates bulleted high-level summaries of documents or selected text.
- **Hybrid Gemini + Local Architecture:** Powered by Google's Gemini API (`gemini-2.5-flash`) via `@google/genai` when `GEMINI_API_KEY` is configured, with a lightning-fast local heuristic engine fallback to guarantee 100% reliable operation out of the box during grading without requiring API keys!

---

## ⚖️ Scope Prioritization & What We Would Build Next

### What is Working End-to-End
- Document CRUD, real-time TipTap rich text editing with **AI-Native Writing Assistant**, debounced autosave, account switcher, sharing modal with role-based access checks, file upload (`.md`, `.txt`, `.html`, `.docx`) with markdown/Word conversion and 10MB limit enforcement, export download (with Turndown Markdown conversion), version history snapshotting and restoration, sonner toast notifications, and automated Vitest testing.

### Intentionally Deprioritized / Simplified
- **Operational Transformation (OT) / CRDT WebSocket Engine:** Instead of setting up a heavy external WebSocket broker (e.g., Yjs/Redis + Hocuspocus) which would require Docker or external server setup for reviewers, we implemented a clean REST architecture with debounced autosaving, live permission checks, and comprehensive version snapshots.
- **External OAuth / Password Auth:** Replaced with our instant **Demo Account Switcher** so reviewers can test multi-user sharing without filling out login forms or verifying emails.

### What We Would Build Next (with another 2-4 hours)
1. **Live Cursor Indicators & Presence:** Add `socket.io` or SSE to broadcast real-time active user avatars and selection bubbles when multiple tabs are open.
2. **Comment & Suggestion Mode:** Allow highlighting text ranges to attach threaded comments or track suggested deletions/insertions.
3. **Export to PDF:** Add `puppeteer` or `html2pdf.js` to generate publication-ready PDF exports with headers and footers.
