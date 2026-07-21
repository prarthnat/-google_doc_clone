import { User, Document, DocumentVersion } from '../types';

const API_BASE = '/api';

export const api = {
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getDocuments(userId: string): Promise<{ owned: Document[]; shared: Document[] }> {
    const res = await fetch(`${API_BASE}/documents?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async getDocument(id: string, userId: string): Promise<Document> {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch document' }));
      throw new Error(err.error || 'Failed to fetch document');
    }
    return res.json();
  },

  async createDocument(title: string, content: string, ownerId: string): Promise<Document> {
    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, ownerId }),
    });
    if (!res.ok) throw new Error('Failed to create document');
    return res.json();
  },

  async updateDocument(id: string, userId: string, data: { title?: string; content?: string; createVersion?: boolean; summary?: string }): Promise<Document> {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, userId }),
    });
    if (!res.ok) throw new Error('Failed to update document');
    return res.json();
  },

  async deleteDocument(id: string, userId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  async shareDocument(documentId: string, ownerId: string, targetUserId: string, permission: 'view' | 'comment' | 'edit') {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(documentId)}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, targetUserId, permission }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to share document' }));
      throw new Error(err.error || 'Failed to share document');
    }
    return res.json();
  },

  async updatePublicAccess(documentId: string, ownerId: string, isPublic: boolean, publicPermission: 'view' | 'comment' | 'edit') {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(documentId)}/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, isPublic, publicPermission }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update public access' }));
      throw new Error(err.error || 'Failed to update public access');
    }
    return res.json();
  },

  async revokeShare(documentId: string, ownerId: string, targetUserId: string) {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(documentId)}/share/${encodeURIComponent(targetUserId)}?ownerId=${encodeURIComponent(ownerId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to revoke access');
    return res.json();
  },

  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(documentId)}/versions`);
    if (!res.ok) throw new Error('Failed to fetch versions');
    return res.json();
  },

  async createVersion(documentId: string, userId: string, summary: string): Promise<DocumentVersion[]> {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(documentId)}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, summary }),
    });
    if (!res.ok) throw new Error('Failed to create version');
    return res.json();
  },

  async restoreVersion(documentId: string, versionId: string, userId: string): Promise<Document> {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(documentId)}/versions/${encodeURIComponent(versionId)}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to restore version');
    return res.json();
  },

  async importFile(file: File): Promise<{ title: string; content: string; rawContent: string; extension: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload/import`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to import file' }));
      throw new Error(err.error || 'Failed to import file');
    }
    return res.json();
  },

  async aiAssist(text: string, action: 'improve' | 'concise' | 'expand' | 'grammar' | 'summarize', context?: string): Promise<{ result: string }> {
    const res = await fetch(`${API_BASE}/ai/assist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, action, context }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'AI request failed' }));
      throw new Error(err.error || 'AI request failed');
    }
    return res.json();
  },

  async getComments(documentId: string) {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(documentId)}/comments`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  async createComment(documentId: string, userId: string, text: string, selectedText?: string) {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(documentId)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text, selectedText }),
    });
    if (!res.ok) throw new Error('Failed to create comment');
    return res.json();
  },

  async resolveComment(documentId: string, commentId: string, userId: string) {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(documentId)}/comments/${encodeURIComponent(commentId)}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to resolve comment');
    return res.json();
  }
};

