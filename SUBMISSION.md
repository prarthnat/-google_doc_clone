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
- **[`src/components/VersionHistoryDrawer.tsx`](file:///Users/prarthna/Downloads/google_doc_clone/src/components/VersionHistoryDrawer.tsx)** — Slide-out right drawer (optional stretch feature completed!) showing historical checkpoints, diff previews, and one-click rollback.
- **[`src/components/DeleteConfirmModal.tsx`](file:///Users/prarthna/Downloads/google_doc_clone/src/components/DeleteConfirmModal.tsx)** — Defensive confirmation dialog preventing accidental permanent document deletion.
- **[`src/components/UrlPromptModal.tsx`](file:///Users/prarthna/Downloads/google_doc_clone/src/components/UrlPromptModal.tsx)** — Custom styled modal for inserting links and images without relying on blocking native browser prompts.

---

## 🧪 Verification & Build Status
- **Automated Tests:** `npm test` ✅ (`1 passed, 10 tests total`)
- **Production Bundle:** `npm run build` ✅ (`dist/index.html` and bundled assets generated cleanly without errors)
