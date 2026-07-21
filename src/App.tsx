import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { User, Document } from './types';
import { api } from './utils/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DocumentList } from './components/DocumentList';
import { DocumentEditor } from './components/DocumentEditor';
import { ShareModal } from './components/ShareModal';
import { ImportModal } from './components/ImportModal';
import { VersionHistoryDrawer } from './components/VersionHistoryDrawer';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [ownedDocs, setOwnedDocs] = useState<Document[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Document[]>([]);
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);

  const [activeView, setActiveView] = useState<'dashboard' | 'editor'>('dashboard');
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'shared'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Drawers state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; title: string } | null>(null);

  // Initial load: Fetch users and documents
  useEffect(() => {
    initApp();
  }, []);

  const activeDocId = activeDoc?.id;

  // When current user changes, reload documents for that user
  useEffect(() => {
    if (currentUser) {
      loadDocuments(currentUser.id);
      // If currently editing a document, reload its fresh state & shares under new user
      if (activeDocId) {
        api.getDocument(activeDocId, currentUser.id)
          .then((doc) => setActiveDoc(doc))
          .catch(() => {
            // If new user doesn't have permission, return to dashboard
            setActiveView('dashboard');
            setActiveDoc(null);
          });
      }
    }
  }, [currentUser, activeDocId]);

  const initApp = async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await api.getUsers();
      setUsers(fetchedUsers);
      
      // Default to Prarthna Tiwari
      const prarthna = fetchedUsers.find((u) => u.email.includes('prarthna')) || fetchedUsers[0];
      if (prarthna) {
        setCurrentUser(prarthna);
        await loadDocuments(prarthna.id);
      }
    } catch (err) {
      console.error('Failed to initialize app:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async (userId: string) => {
    try {
      const data = await api.getDocuments(userId);
      setOwnedDocs(data.owned);
      setSharedDocs(data.shared);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleOpenDocument = async (id: string) => {
    if (!currentUser) return;
    try {
      const doc = await api.getDocument(id, currentUser.id);
      setActiveDoc(doc);
      setActiveView('editor');
    } catch (err: any) {
      toast.error(err.message || 'Error opening document');
    }
  };

  const handleCreateNewDocument = async () => {
    if (!currentUser) return;
    try {
      const newDoc = await api.createDocument('Untitled Document', '<p></p>', currentUser.id);
      await loadDocuments(currentUser.id);
      setActiveDoc(newDoc);
      setActiveView('editor');
      toast.success('New document created');
    } catch (err: any) {
      toast.error('Failed to create document');
    }
  };

  const handleDeleteDocument = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    const targetDoc = [...ownedDocs, ...sharedDocs].find(d => d.id === id) || (activeDoc?.id === id ? activeDoc : null);
    const title = targetDoc?.title || 'Untitled Document';
    setDocToDelete({ id, title });
  };

  const executeDeleteDocument = async () => {
    if (!currentUser || !docToDelete) return;
    const id = docToDelete.id;
    try {
      await api.deleteDocument(id, currentUser.id);
      await loadDocuments(currentUser.id);
      if (activeDoc?.id === id) {
        setActiveView('dashboard');
        setActiveDoc(null);
      }
      setDocToDelete(null);
      toast.success('Document permanently deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document');
      setDocToDelete(null);
    }
  };

  const handleShareFromList = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    api.getDocument(doc.id, currentUser.id).then((fullDoc) => {
      setActiveDoc(fullDoc);
      setShareModalOpen(true);
    });
  };

  const handleShareSubmit = async (targetUserId: string, permission: 'view' | 'comment' | 'edit') => {
    if (!activeDoc || !currentUser) return;
    const res = await api.shareDocument(activeDoc.id, currentUser.id, targetUserId, permission);
    setActiveDoc((prev) => prev ? { ...prev, shares: res.shares } : null);
    await loadDocuments(currentUser.id);
  };

  const handleRevokeShare = async (targetUserId: string) => {
    if (!activeDoc || !currentUser) return;
    const res = await api.revokeShare(activeDoc.id, currentUser.id, targetUserId);
    setActiveDoc((prev) => prev ? { ...prev, shares: res.shares } : null);
    await loadDocuments(currentUser.id);
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!activeDoc || !currentUser) return;
    const updated = await api.restoreVersion(activeDoc.id, versionId, currentUser.id);
    setActiveDoc((prev) => prev ? { ...prev, title: updated.title, content: updated.content } : null);
    await loadDocuments(currentUser.id);
  };

  const handleCreateCheckpoint = async (summary: string) => {
    if (!activeDoc || !currentUser) return [];
    return await api.createVersion(activeDoc.id, currentUser.id, summary);
  };

  const handleImportSuccess = async (title: string, content: string, mode: 'new' | 'current') => {
    if (!currentUser) return;
    setImportModalOpen(false);

    if (mode === 'new' || !activeDoc) {
      const newDoc = await api.createDocument(title, content, currentUser.id);
      await loadDocuments(currentUser.id);
      setActiveDoc(newDoc);
      setActiveView('editor');
    } else {
      // Append to active draft
      const newContent = `${activeDoc.content}<hr/><h2>Imported: ${title}</h2>${content}`;
      const updated = await api.updateDocument(activeDoc.id, currentUser.id, {
        content: newContent,
        createVersion: true,
        summary: `Imported file: ${title}`
      });
      setActiveDoc((prev) => prev ? { ...prev, content: updated.content } : null);
    }
  };

  const handleTitleUpdate = (newTitle: string) => {
    setActiveDoc((prev) => prev ? { ...prev, title: newTitle } : null);
    if (currentUser) {
      loadDocuments(currentUser.id);
    }
  };

  // Filter documents based on activeTab and searchQuery
  const allDocs = [...ownedDocs, ...sharedDocs];
  const filteredDocs = (
    activeTab === 'all' ? allDocs :
    activeTab === 'owned' ? ownedDocs :
    sharedDocs
  ).filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.content.replace(/<[^>]+>/g, '').toLowerCase().includes(q) ||
      doc.owner_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-doc-bg text-slate-800">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        users={users}
        onSelectUser={(u) => setCurrentUser(u)}
        onCreateNewDoc={handleCreateNewDocument}
        onOpenImportModal={() => setImportModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeView={activeView}
        onNavigateHome={() => {
          setActiveView('dashboard');
          setActiveDoc(null);
        }}
      />

      {/* Main Container */}
      {activeView === 'dashboard' ? (
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            ownedCount={ownedDocs.length}
            sharedCount={sharedDocs.length}
          />
          <DocumentList
            documents={filteredDocs}
            currentUser={currentUser}
            onOpenDocument={handleOpenDocument}
            onShareDocument={handleShareFromList}
            onDeleteDocument={handleDeleteDocument}
            onCreateNewDoc={handleCreateNewDocument}
            isLoading={isLoading}
            activeTab={activeTab}
          />
        </div>
      ) : activeDoc ? (
        <DocumentEditor
          document={activeDoc}
          currentUser={currentUser}
          onBack={() => {
            setActiveView('dashboard');
            setActiveDoc(null);
            if (currentUser) loadDocuments(currentUser.id);
          }}
          onOpenShare={() => setShareModalOpen(true)}
          onOpenHistory={() => setHistoryDrawerOpen(true)}
          onOpenImport={() => setImportModalOpen(true)}
          onUpdateTitle={handleTitleUpdate}
        />
      ) : null}

      {/* Modals & Drawers */}
      {shareModalOpen && activeDoc && (
        <ShareModal
          document={activeDoc}
          currentUser={currentUser}
          users={users}
          onClose={() => setShareModalOpen(false)}
          onShare={handleShareSubmit}
          onRevoke={handleRevokeShare}
          onPublicUpdated={async () => {
            if (activeDoc && currentUser) {
              const fullDoc = await api.getDocument(activeDoc.id, currentUser.id);
              setActiveDoc(fullDoc);
              await loadDocuments(currentUser.id);
            }
          }}
        />
      )}

      {importModalOpen && (
        <ImportModal
          onClose={() => setImportModalOpen(false)}
          onImportSuccess={handleImportSuccess}
          hasCurrentDocument={activeView === 'editor' && !!activeDoc}
        />
      )}

      {historyDrawerOpen && activeDoc && currentUser && (
        <VersionHistoryDrawer
          documentId={activeDoc.id}
          currentUserId={currentUser.id}
          canEdit={activeDoc.permission === 'owner' || activeDoc.permission === 'edit'}
          onClose={() => setHistoryDrawerOpen(false)}
          onRestore={handleRestoreVersion}
          onCreateCheckpoint={handleCreateCheckpoint}
        />
      )}

      {docToDelete && (
        <DeleteConfirmModal
          documentTitle={docToDelete.title}
          onConfirm={executeDeleteDocument}
          onClose={() => setDocToDelete(null)}
        />
      )}

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
