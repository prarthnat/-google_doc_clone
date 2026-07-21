import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'ajaia_docs.db');
export const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance & reliability
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatar TEXT,
      role_title TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS document_shares (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      permission TEXT NOT NULL DEFAULT 'view',
      shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(document_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS document_versions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      summary TEXT,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      selected_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved BOOLEAN DEFAULT 0,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Safe schema migrations for existing databases
  try {
    db.exec('ALTER TABLE documents ADD COLUMN is_public BOOLEAN DEFAULT 0;');
  } catch (e) { /* Column already exists */ }
  try {
    db.exec("ALTER TABLE documents ADD COLUMN public_permission TEXT DEFAULT 'view';");
  } catch (e) { /* Column already exists */ }

  // Seed default users if empty
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (id, name, email, avatar, role_title) VALUES (?, ?, ?, ?, ?)');
    insertUser.run('usr_prarthna', 'Prarthna Tiwari', 'prarthnatiwari04@gmail.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'AI-Native Full Stack Product Engineer');
    insertUser.run('usr_alex', 'Alex Chen', 'alex.chen@ajaia.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Senior Product Manager');
    insertUser.run('usr_maya', 'Maya Lin', 'maya.lin@ajaia.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'Staff Product Designer');
    insertUser.run('usr_david', 'David Kim', 'david.kim@ajaia.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'Engineering Director');

    // Seed Sample Documents
    const insertDoc = db.prepare('INSERT INTO documents (id, title, content, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
    
    const doc1Id = 'doc_strategy_2026';
    const doc1Title = 'Ajaia 2026 Product Strategy & Roadmap';
    const doc1Content = `
      <h1>Ajaia 2026 Product Strategy & Roadmap</h1>
      <p>Welcome to our shared planning document! This document outlines our core focus areas for building the next generation of AI-native team collaboration tools.</p>
      <h2>Executive Summary</h2>
      <p>Modern teams move fast, but fragmented knowledge and clunky document editors slow them down. Ajaia's goal is to introduce lightweight, high-speed, collaborative workspaces with embedded AI capabilities that feel natural, instant, and frictionless.</p>
      <h2>Key Pillars for Q3 & Q4</h2>
      <ul>
        <li><p><strong>Frictionless Authoring:</strong> Rich-text formatting with instant responsiveness, keyboard shortcuts, and clean markdown support.</p></li>
        <li><p><strong>Seamless File Ingestion:</strong> Drag-and-drop or upload <code>.md</code>, <code>.txt</code>, or <code>.html</code> files and turn them into collaborative documents seamlessly.</p></li>
        <li><p><strong>Granular & Simple Sharing:</strong> Clear distinction between owned drafts and team shared documents with role-based permissions (View vs. Edit).</p></li>
        <li><p><strong>Reliable Persistence & Versioning:</strong> Automatic snapshotting so you never lose work and can roll back to previous checkpoints.</p></li>
      </ul>
      <blockquote><p>"The fastest tool wins when it comes to daily team productivity. Let's make sure our product judgment shines through in every interaction." — Prarthna Tiwari</p></blockquote>
    `;
    const now = new Date().toISOString();
    insertDoc.run(doc1Id, doc1Title, doc1Content, 'usr_prarthna', now, now);

    // Share Doc 1 with Alex (edit) and Maya (view)
    const insertShare = db.prepare('INSERT INTO document_shares (id, document_id, user_id, permission, shared_at) VALUES (?, ?, ?, ?, ?)');
    insertShare.run('shr_1', doc1Id, 'usr_alex', 'edit', now);
    insertShare.run('shr_2', doc1Id, 'usr_maya', 'view', now);

    // Initial version snapshot for Doc 1
    const insertVersion = db.prepare('INSERT INTO document_versions (id, document_id, version_number, title, content, created_by, created_at, summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertVersion.run('ver_1', doc1Id, 1, doc1Title, doc1Content, 'usr_prarthna', now, 'Initial document creation');

    // Sample Document 2
    const doc2Id = 'doc_architecture_spec';
    const doc2Title = 'Q3 Engineering Spec: Lightweight Collaborative Editor';
    const doc2Content = `
      <h1>Q3 Engineering Spec: Lightweight Collaborative Editor</h1>
      <p><em>Author: Alex Chen | Reviewers: Prarthna Tiwari, David Kim</em></p>
      <h2>1. Overview</h2>
      <p>This technical note describes our architecture for the candidate assessment take-home project. We prioritize performance, self-contained deployment, and a delightful user experience.</p>
      <h2>2. Technology Stack</h2>
      <ol>
        <li><p><strong>Frontend:</strong> React 19 + TypeScript + Vite + Tailwind CSS for a stunning, Google Docs-inspired sleek interface.</p></li>
        <li><p><strong>Rich Text Editor:</strong> TipTap (ProseMirror engine) providing robust formatting (bold, italic, underline, lists, headings, alignments).</p></li>
        <li><p><strong>Backend API:</strong> Express.js running on Node with TypeScript.</p></li>
        <li><p><strong>Database:</strong> SQLite with <code>better-sqlite3</code> for zero-configuration, ACID-compliant persistence directly in the repository.</p></li>
      </ol>
      <h2>3. Tradeoffs & Product Decisions</h2>
      <p>Instead of setting up a complex, heavy distributed operational transformation (OT/CRDT) engine that requires external WebSocket brokers like Yjs/Redis (which would make local review complicated), we opted for a clean REST API architecture with instant autosaving, clear sharing permissions, and full version snapshotting.</p>
    `;
    insertDoc.run(doc2Id, doc2Title, doc2Content, 'usr_alex', now, now);
    insertShare.run('shr_3', doc2Id, 'usr_prarthna', 'edit', now);
    insertShare.run('shr_4', doc2Id, 'usr_david', 'view', now);
    insertVersion.run('ver_2', doc2Id, 1, doc2Title, doc2Content, 'usr_alex', now, 'Draft review circulated');

    console.log('✅ SQLite Database seeded successfully with demo users and sample documents.');
  }
}
