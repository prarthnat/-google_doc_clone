# Architecture Note — Ajaia Collaborative Document Editor

**Author:** Prarthna Tiwari (`prarthnatiwari04@gmail.com`)  
**Role:** AI-Native Full Stack Product Engineer Assessment  

---

## 1. Executive Summary & Design Philosophy

When building internal productivity tools for high-velocity teams, the three most critical engineering constraints are:
1. **Low Latency & Immediate Responsiveness:** The editing flow must feel smooth, tactile, and instant without UI jitter.
2. **Frictionless Collaboration:** Users need clear, unambiguous visibility into ownership and permissions (`View` vs `Edit`).
3. **Operational Reliability & Easy Deployment:** The system must run self-contained across development and production without fragile dependencies.

To achieve this within our 4-6 hour timebox, we designed a **modern full-stack architecture** utilizing **React 19 + TipTap (ProseMirror)** on the client and **Node.js + Express + SQLite (`better-sqlite3`)** on the backend.

---

## 2. System Architecture & Component Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT (Vite + React 19)                          |
|                                                                                   |
|  +--------------------+     +-----------------------+     +--------------------+  |
|  |   Navbar & Account |     |    DocumentEditor     |     |   VersionHistory   |  |
|  |     Switcher       | <-> |  (TipTap/ProseMirror) | <-> |       Drawer       |  |
|  +--------------------+     +-----------------------+     +--------------------+  |
|            |                            |                           |             |
|            +----------------------------+---------------------------+             |
|                                         | (REST API / JSON / FormData)            |
+-----------------------------------------|-----------------------------------------+
                                          v
+-----------------------------------------------------------------------------------+
|                           SERVER (Node.js + Express + TypeScript)                 |
|                                                                                   |
|  +-------------------------+    +-----------------------+    +-----------------+  |
|  |   Auth / Users Route    |    |  Documents & Sharing  |    |  File Upload &  |  |
|  |  (Seeded Demo Switcher) |    |  Route + Permissions  |    | Markdown Import |  |
|  +-------------------------+    +-----------------------+    +-----------------+  |
|                                         |                                         |
+-----------------------------------------|-----------------------------------------+
                                          v
+-----------------------------------------------------------------------------------+
|                          DATABASE LAYER (better-sqlite3)                          |
|                                                                                   |
|  [ users ] <---> [ documents ] <---> [ document_shares ] <---> [ document_versions ] |
|                                                                                   |
|  * ACID-Compliant Synchronous Transactions                                       |
|  * WAL (Write-Ahead Log) Mode Enabled for High Concurrent Throughput               |
|  * Zero External Database Configuration Needed (`data/ajaia_docs.db`)            |
+-----------------------------------------------------------------------------------+
```

---

## 3. Key Technology Choices & Tradeoffs

### Why TipTap (`@tiptap/react`) over Quill or Slate?
- **ProseMirror Foundation:** TipTap is built on top of ProseMirror, the industry standard for production-grade rich text editors (used by Notion, Linear, and NYTimes).
- **Extensible Document Model:** Unlike Quill (which relies on DOM manipulation), TipTap represents documents as structured JSON schemas with clean HTML serialization, allowing seamless markdown parsing, highlighting, and version comparison.
- **Headless & Accessible:** TipTap is headless, enabling us to design a tailored, Google Docs-accurate UI using Tailwind CSS tokens without overriding rigid vendor stylesheets.

### Why `better-sqlite3` over Postgres / Supabase for this scope?
- **Reviewer Ergonomics:** Requiring reviewers to spin up Docker containers, configure `.env` database URLs, or create free-tier cloud DB accounts creates unnecessary review friction.
- **Synchronous Speed & WAL Mode:** `better-sqlite3` runs synchronously right within the Node process, offering sub-millisecond query execution. By enabling `db.pragma('journal_mode = WAL')` and foreign key enforcement, we get robust ACID compliance and multi-table cascading deletes (`ON DELETE CASCADE`) with zero setup.

### Why REST API + Debounced Autosave over WebSocket CRDTs (Yjs)?
- While CRDTs (like Yjs with WebSockets) are standard for real-time multiplayer cursor tracking, setting up an external WebSocket relay service adds infrastructure complexity that distracts from core product quality within a 4-hour take-home.
- We implemented a **700ms debounced autosave architecture** over REST that instantly persists updates to SQLite, combined with our **Version History Snapshot Engine**. This ensures zero data loss while keeping local setup and automated testing (`Vitest + Supertest`) straightforward and rock-solid.

---

## 4. Data Model Design

Our relational schema cleanly decouples ownership, shared access, and versioning:

1. **`users` Table:** Stores seeded profiles (`id`, `name`, `email`, `avatar`, `role_title`).
2. **`documents` Table:** Stores core document state (`id`, `title`, `content`, `owner_id`, `created_at`, `updated_at`).
3. **`document_shares` Table:** Handles granular collaboration permissions:
   - Composite Unique Key: `UNIQUE(document_id, user_id)`
   - Permission check logic:
     $$\text{Access}(u, d) = \begin{cases} \text{Owner} & \text{if } d.\text{owner\_id} = u \\ \text{Permission} & \text{if } (d, u) \in \text{document\_shares} \\ \text{Forbidden} & \text{otherwise} \end{cases}$$
4. **`document_versions` Table:** Maintains chronological audit snapshots (`version_number`, `title`, `content`, `created_by`, `summary`), enabling instant rollback via `POST /api/documents/:id/versions/:versionId/restore`.

---

## 5. Security & Permission Verification

Access control is checked at both layers:
- **Backend Enforcement:** Middleware/handlers verify whether `req.query.userId` or `req.body.userId` is the owner or holds `edit`/`view` rights before executing any `PUT`, `DELETE`, or sharing mutations. Unauthorized queries immediately receive `403 Forbidden`.
- **Frontend Graceful Adaptation:** When an account has only `view` permission, TipTap transitions to `editable: false`, the formatting bar turns semi-transparent (`pointer-events-none`), and an informative warning banner guides the user.

> [!IMPORTANT]
> **Production Security Note & Authentication Gap:** In production, `userId` would be derived from a cryptographically verified JWT/session token (`req.user.id` via middleware like Passport or Auth0), not a request parameter or header. For this take-home assessment, we pass `userId` explicitly to make the instant top-right Account Switcher frictionless for reviewers without requiring mock login forms or password flows.
