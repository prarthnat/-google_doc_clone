import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { initDb, db } from '../db.js';

describe('Ajaia Collaborative Document Editor API Tests', () => {
  beforeAll(() => {
    initDb();
  });

  it('1. GET /api/users should return seeded users including Prarthna Tiwari and Alex Chen', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    
    const prarthna = res.body.find((u: any) => u.email === 'prarthnatiwari04@gmail.com');
    expect(prarthna).toBeDefined();
    expect(prarthna.name).toBe('Prarthna Tiwari');
  });

  it('2. POST /api/documents should create a new document with default title and content', async () => {
    const res = await request(app)
      .post('/api/documents')
      .send({
        title: 'Automated Test Document',
        content: '<p>This is a test document created via Vitest.</p>',
        ownerId: 'usr_prarthna'
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Automated Test Document');
    expect(res.body.owner_id).toBe('usr_prarthna');
    expect(res.body.permission).toBe('owner');
  });

  it('3. GET /api/documents/:id should enforce permissions (403 for unshared users, 200 for shared users)', async () => {
    // Create doc as Prarthna
    const createRes = await request(app)
      .post('/api/documents')
      .send({
        title: 'Confidential Strategy Doc',
        content: '<p>Secret plans.</p>',
        ownerId: 'usr_prarthna'
      });
    const docId = createRes.body.id;

    // David Kim tries to access without share -> 403
    const unauthRes = await request(app).get(`/api/documents/${docId}?userId=usr_david`);
    expect(unauthRes.status).toBe(403);

    // Share with David Kim with 'view' permission
    const shareRes = await request(app)
      .post(`/api/documents/${docId}/share`)
      .send({
        ownerId: 'usr_prarthna',
        targetUserId: 'usr_david',
        permission: 'view'
      });
    expect(shareRes.status).toBe(200);

    // Now David Kim accesses -> 200
    const authRes = await request(app).get(`/api/documents/${docId}?userId=usr_david`);
    expect(authRes.status).toBe(200);
    expect(authRes.body.permission).toBe('view');
  });

  it('4. POST /api/upload/import should parse markdown file and convert headers and bold text to HTML', async () => {
    const mdContent = '# Project Notes\n\nThis is **important** information for the team.\n\n- Task 1\n- Task 2';
    const res = await request(app)
      .post('/api/upload/import')
      .attach('file', Buffer.from(mdContent), 'notes.md');

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('notes');
    expect(res.body.content).toContain('<h1>Project Notes</h1>');
    expect(res.body.content).toContain('<strong>important</strong>');
    expect(res.body.content).toContain('<li>Task 1</li>');
  });

  it('5. POST /api/documents/:id/versions should create named checkpoint snapshots and list them', async () => {
    // Create doc as Prarthna
    const createRes = await request(app)
      .post('/api/documents')
      .send({
        title: 'Versioned Spec Doc',
        content: '<p>Initial draft.</p>',
        ownerId: 'usr_prarthna'
      });
    const docId = createRes.body.id;

    // Create a named checkpoint
    const snapRes = await request(app)
      .post(`/api/documents/${docId}/versions`)
      .send({
        userId: 'usr_prarthna',
        summary: 'Before major architecture refactor'
      });
    expect(snapRes.status).toBe(201);
    expect(Array.isArray(snapRes.body)).toBe(true);
    expect(snapRes.body[0].summary).toBe('Before major architecture refactor');

    // Fetch all versions
    const getVerRes = await request(app).get(`/api/documents/${docId}/versions`);
    expect(getVerRes.status).toBe(200);
    expect(getVerRes.body.length).toBeGreaterThanOrEqual(1);
  });

  it('6. POST /api/documents/:id/versions/:versionId/restore should restore historical content (version restore)', async () => {
    // Create doc with v1 content
    const createRes = await request(app)
      .post('/api/documents')
      .send({
        title: 'Rollback Test Doc',
        content: '<p>Original Content v1</p>',
        ownerId: 'usr_prarthna'
      });
    const docId = createRes.body.id;

    // Snapshot v1
    await request(app)
      .post(`/api/documents/${docId}/versions`)
      .send({ userId: 'usr_prarthna', summary: 'Snapshot v1' });

    // Get versions to find v1 id
    const versionsAfterV1 = (await request(app).get(`/api/documents/${docId}/versions`)).body;
    const v1Id = versionsAfterV1[0].id;

    // Update doc to v2 content
    await request(app)
      .put(`/api/documents/${docId}`)
      .send({ userId: 'usr_prarthna', content: '<p>Modified Content v2</p>' });

    // Restore back to v1
    const restoreRes = await request(app)
      .post(`/api/documents/${docId}/versions/${v1Id}/restore`)
      .send({ userId: 'usr_prarthna' });

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.content).toBe('<p>Original Content v1</p>');

    // Verify document in database is now v1 content
    const getRes = await request(app).get(`/api/documents/${docId}?userId=usr_prarthna`);
    expect(getRes.body.content).toBe('<p>Original Content v1</p>');
  });

  it('7. DELETE /api/documents/:id/share/:targetUserId should revoke access (share revoke)', async () => {
    // Create doc and share with Maya
    const createRes = await request(app)
      .post('/api/documents')
      .send({ title: 'Revocation Test Doc', content: '<p>Classified</p>', ownerId: 'usr_prarthna' });
    const docId = createRes.body.id;

    await request(app)
      .post(`/api/documents/${docId}/share`)
      .send({ ownerId: 'usr_prarthna', targetUserId: 'usr_maya', permission: 'edit' });

    // Verify Maya can access
    expect((await request(app).get(`/api/documents/${docId}?userId=usr_maya`)).status).toBe(200);

    // Revoke share as Owner
    const revokeRes = await request(app)
      .delete(`/api/documents/${docId}/share/usr_maya?ownerId=usr_prarthna`);
    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.success).toBe(true);

    // Verify Maya now gets 403 Forbidden
    const afterRevoke = await request(app).get(`/api/documents/${docId}?userId=usr_maya`);
    expect(afterRevoke.status).toBe(403);
  });

  it('8. POST /api/documents with empty or whitespace title should default gracefully to "Untitled Document" (empty-title edge case)', async () => {
    const res = await request(app)
      .post('/api/documents')
      .send({
        title: '   ',
        content: '<p>Document without a title</p>',
        ownerId: 'usr_prarthna'
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Untitled Document');
  });

  it('9. PUT /api/documents/:id should reject edits (403 Forbidden) when attempted by a view-only collaborator', async () => {
    const createRes = await request(app)
      .post('/api/documents')
      .send({ title: 'Read Only Target', content: '<p>Protected</p>', ownerId: 'usr_prarthna' });
    const docId = createRes.body.id;

    // Share with David Kim as 'view' only
    await request(app)
      .post(`/api/documents/${docId}/share`)
      .send({ ownerId: 'usr_prarthna', targetUserId: 'usr_david', permission: 'view' });

    // David Kim tries to modify content -> 403
    const editRes = await request(app)
      .put(`/api/documents/${docId}`)
      .send({ userId: 'usr_david', content: '<p>Hacked content</p>' });

    expect(editRes.status).toBe(403);
    expect(editRes.body.error).toContain('You do not have permission to edit this document');
  });

  it('10. GET /api/documents should correctly return owned and shared lists with exact permission properties', async () => {
    const res = await request(app).get('/api/documents?userId=usr_alex');
    expect(res.status).toBe(200);
    expect(res.body.owned).toBeDefined();
    expect(res.body.shared).toBeDefined();

    // Verify shared items have permission property defined
    if (res.body.shared.length > 0) {
      expect(res.body.shared[0].permission).toBeDefined();
    }
  });
});
