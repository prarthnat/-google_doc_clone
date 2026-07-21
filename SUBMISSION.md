# Submission Manifest — Ajaia Collaborative Document Editor

**Candidate:** Prarthna Tiwari (`prarthnatiwari04@gmail.com`)  
**Position:** AI-Native Full Stack Product Engineer  
**Submission Date:** July 2026  

---

## 📂 Deliverables Included in this Package

This repository contains the complete, self-contained full-stack application and required documentation for the Ajaia candidate assessment.

### 📜 Core Documentation
1. **`README.md`** — Comprehensive guide covering local setup (`npm i && npm run dev`), seeded demo accounts (`Prarthna Tiwari`, `Alex Chen`, `Maya Lin`, `David Kim`), step-by-step review instructions, and scope prioritization.
2. **`ARCHITECTURE.md`** — Detailed technical architecture note explaining why React 19 + TipTap + Node/Express + `better-sqlite3` was selected, database relational design, and permission verification rules.
3. **`AI_WORKFLOW.md`** — AI-native workflow documentation detailing how Google Antigravity/Gemini accelerated development, where AI outputs were changed or rejected (e.g., rejecting heavy WebSocket brokers and fixing hallucinated icon exports), and how quality was verified.
4. **`SUBMISSION.md`** — This exact submission manifest.
5. **`WALKTHROUGH_LINK.txt`** — Text file containing the placeholder/actual URL for the 3-5 minute video walkthrough.

---

## 💻 Source Code Structure

### 🗄️ Backend API & SQLite Database (`server/`)
- **`server/db.ts`** — SQLite database initialization using `better-sqlite3` with WAL mode and foreign key enforcement. Automatically seeds 4 demo users and 2 rich sample documents (`"Ajaia 2026 Product Strategy"` and `"Q3 Engineering Spec"`).
- **[`server/index.ts`](file:///Users/prarthna/Downloads/google_doc_clone/server/index.ts)** — Node.js Express API server implementing full REST CRUD endpoints (`/api/users`, `/api/documents`, `/api/documents/:id/share`, `/api/documents/:id/versions`, `/api/upload/import` with `.docx`, `.md`, `.txt`, `.html` conversion).
- **[`server/tests/documents.test.ts`](file:///Users/prarthna/Downloads/google_doc_clone/server/tests/documents.test.ts)** — Automated Vitest + Supertest integration test suite verifying user seeding, document creation, `403 Forbidden` vs `200 OK` access control, and Markdown file conversion.

### 🎨 Frontend Web Application (`src/`)
- **[`src/types/index.ts`](file:///Users/prarthna/Downloads/google_doc_clone/src/types/index.ts)** — TypeScript interfaces (`User`, `Document`, `DocumentShare`, `DocumentVersion`).
- **[`src/utils/api.ts`](file:///Users/prarthna/Downloads/google_doc_clone/src/utils/api.ts)** — Type-safe client API wrapper for all backend routes.
- **[`src/components/Navbar.tsx`](file:///Users/prarthna/Downloads/google_doc_clone/src/components/Navbar.tsx)** — Top header containing brand badge, search bar, and our interactive **Demo Account Switcher** (`Check` badge on current user).
- **[`src/components/Sidebar.tsx`](file:///Users/prarthna/Downloads/google_doc_clone/src/components/Sidebar.tsx)** — Navigation tabs (`All Documents`, `Owned by Me`, `Shared with Me`) and Quick Start guide.
- **[`src/components/DocumentList.tsx`](file:///Users/prarthna/Downloads/google_doc_clone/src/components/DocumentList.tsx)** — Grid view displaying document cards with owner avatars, permission badges (`Owner`, `Can Edit`, `Can View`), excerpt previews, and quick actions.
- **[`src/components/DocumentEditor.tsx`](file:///Users/prarthna/Downloads/google_doc_clone/src/components/DocumentEditor.tsx)** — Main document editor with physical paper UI (`shadow-paper`), Google Docs menu bar, ruler, outline sidebar with live stats, pill Share button + active collaborator avatars, debounced autosaving with offline `localStorage` buffer, and export tools (`.md`, `.html`, `.txt`).
- **[`src/components/EditorToolbar.tsx`](file:///Users/prarthna/Downloads/google_doc_clone/src/components/EditorToolbar.tsx)** — Formatting controls pinned above the canvas (`Bold`, `Italic`, `Underline`, `Headings`, `Lists`, `Code`, `Quotes`, `Alignments`, `Font Picker`, `Color Palette`) with focus-safe `type="button"` event handling.
- **[`src/components/ShareModal.tsx`](file:///Users/prarthna/Downloads/google_doc_clone/src/components/ShareModal.tsx)** — Modal allowing owners to invite teammates (`view` vs `edit` permissions), inspect active collaborators, and revoke access.
- **[`src/components/ImportModal.tsx`](file:///Users/prarthna/Downloads/google_doc_clone/src/components/ImportModal.tsx)** — Upload workflow allowing users to drag and drop `.docx`, `.md`, `.txt`, or `.html` files and turn them into a new document or insert right into the current draft.
- **[`src/components/VersionHistoryDrawer.tsx`](file:///Users/prarthna/Downloads/google_doc_clone/src/components/VersionHistoryDrawer.tsx)** — Slide-out right drawer showing historical checkpoints, diff previews, and one-click rollback.
- **[`src/components/CommentsDrawer.tsx`](file:///Users/prarthna/Downloads/google_doc_clone/src/components/CommentsDrawer.tsx)** — Selection-based commenting and feedback drawer supporting selection text snippet attachments, Commenter Mode, and resolution workflows.
- **[`src/components/DeleteConfirmModal.tsx`](file:///Users/prarthna/Downloads/google_doc_clone/src/components/DeleteConfirmModal.tsx)** — Defensive confirmation dialog preventing accidental permanent document deletion.
- **[`src/components/UrlPromptModal.tsx`](file:///Users/prarthna/Downloads/google_doc_clone/src/components/UrlPromptModal.tsx)** — Custom styled modal for inserting links and images without relying on blocking native browser prompts.

---

## 🧪 Verification & Build Status
- **Automated Tests:** `npm test` ✅ (`1 passed, 10 tests total`)
- **Production Bundle:** `npm run build` ✅ (`dist/index.html` and bundled assets generated cleanly without errors)

---

## 🎯 Rubric Status & Scope Breakdown

### ✅ What is Working
1. **Document Creation & Editing:** Real-time editable titles, physical paper UI, and TipTap rich-text editing (Bold, Italic, Underline, H1/H2/H3, Bullet & Numbered lists, Blockquotes, Code Blocks, Alignments, Fonts, Colors).
2. **File Upload / Import Engine:** Drag-and-drop ingestion of `.docx`, `.md`, `.txt`, and `.html` files, with the choice to create a new document or append directly to the current active draft.
3. **Multi-User Sharing Model:** Granular access control (`Owner`, `Can Edit`, `Can Comment`, `Can View`), protected by both read-only UI states and backend `403 Forbidden` verification. Includes an interactive **Demo Account Switcher** (4 seeded personas) for instant multi-user testing without login friction.
4. **Reliable Persistence:** SQLite (`better-sqlite3`) in **WAL mode** combined with a synchronous **localStorage Write-Ahead Buffer** that captures offline keystrokes and automatically replays mutations upon network re-connection.
5. **✨ All 5 Optional Stretch Enhancements:**
   - Real-time collaborator avatars displayed right next to the Share button.
   - Selection-based commenting and suggestion mode (`CommentsDrawer`).
   - Chronological Version History snapshots with one-click rollback (`VersionHistoryDrawer`).
   - Multi-format document export (`.md`, `.html`, `.txt`) plus PDF print export (`window.print()`).
   - Role-based permissions beyond basic access (`Owner`, `Can Edit`, `Can Comment`, `Can View`).

### 🛑 What is Incomplete / Intentionally Scoped Out
1. **Real-Time WebSockets / CRDT Live Sync:** We consciously avoided external WebSocket relays (`Yjs`/`Hocuspocus`/Redis) to guarantee zero setup friction (`npm i && npm run dev`), zero external database dependencies, and 100% deterministic grading out of the box. Multi-tab synchronization occurs via 700ms debounced REST + SQLite WAL checkpoints.
2. **Enterprise Authentication (JWT / OAuth):** Instead of requiring reviewers to sign up or fill out mock login forms repeatedly, `userId` is passed dynamically via our top-bar **Account Switcher**, allowing reviewers to verify permission boundaries across 4 seeded roles in under 30 seconds.
3. **Lossy Markdown Export Visual Styling:** While our TipTap editor supports custom font colors (`#dc2626`), font families, and center alignments, standard `.md` export strips visual styling because Markdown specification standardizes semantic text structure rather than visual presentation (handled cleanly by providing HTML and PDF export).

### 🚀 What We Would Build Next with Another 2–4 Hours
1. **CRDT Real-Time Sync (Yjs + Hocuspocus/WebSockets):** With additional time outside the take-home constraint, we would attach `@tiptap/extension-collaboration` and `@tiptap/extension-collaboration-cursor` connected to a lightweight Hocuspocus server for live selection bubbles (`Prarthna is typing...`).
2. **Granular Public Link Sharing Settings:** Add expiration timestamps and password protection for public share links (`/api/documents/:id/public`).
3. **Export to Native `.docx`:** Integrate a server-side `docx` generator library so users can export rich text directly back into Microsoft Word `.docx` binary format alongside our current `.md`, `.html`, and PDF exports.
