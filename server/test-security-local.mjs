import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { requireTestDatabaseUri } from './test-database.js';
import { User, Team } from './models/index.js';
import { Session } from './models/auth.js';

// No database, cloud, email, or production service is contacted by this suite.
process.env.MONGO_URI = 'mongodb://127.0.0.1:1/codesrijan_test';
mongoose.connect = () => new Promise(() => {});
const { httpServer } = await import('./server.js');
await new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + httpServer.address().port;
const originalFindOne = User.findOne;
const originalTeamFindOne = Team.findOne;
const originalSessionFindOne = Session.findOne;

try {
    await test('test URI guard rejects production, remote, missing, credentials and unsafe db names', () => {
        for (const uri of [undefined, '', 'mongodb+srv://example.com/codesrijan', 'mongodb://example.com/test', 'mongodb://localhost/codesrijan', 'mongodb://u:p@localhost/test', 'mongodb://localhost/test?replicaSet=remote']) {
            assert.throws(() => requireTestDatabaseUri(uri));
        }
        assert.equal(requireTestDatabaseUri('mongodb://127.0.0.1:27017/codesrijan_test_local'), 'mongodb://127.0.0.1:27017/codesrijan_test_local');
    });
    await test('user JSON never exposes password hashes', () => {
        const user = new User({ id: 'test-user', passwordHash: 'sensitive-hash' });
        assert.equal(user.toJSON().passwordHash, undefined);
        assert.ok(user.passwordHash, 'bcrypt comparison still has access internally');
    });
    await test('password login denies identities without a local password hash', async () => {
        User.findOne = async () => ({ id: 'firebase-only', accountStatus: 'active', emailVerified: true });
        const result = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'test@example.invalid', password: 'anything' }) });
        assert.equal(result.status, 401);
    });
    await test('disabled and unverified sessions are denied', async () => {
        Session.findOne = async () => ({ userId: 'test-user', expiresAt: new Date(Date.now() + 60000) });
        for (const state of [{ accountStatus: 'disabled', emailVerified: true }, { accountStatus: 'active', emailVerified: false }]) {
            User.findOne = async () => ({ id: 'test-user', ...state });
            const result = await fetch(base + '/api/auth/me', { headers: { Authorization: 'Bearer local-test-session' } });
            assert.equal(result.status, 403);
        }
    });
    await test('locked roster blocks leave, dissolve and transfer', async () => {
        User.findOne = async () => ({ id: 'test-user', role: 'student', accountStatus: 'active', emailVerified: true, teamId: 'test-team' });
        Team.findOne = async () => ({ id: 'test-team', leaderId: 'test-user', memberIds: ['test-user'], isLocked: true });
        for (const [path, method] of [['/api/teams/leave', 'POST'], ['/api/teams/test-team', 'DELETE'], ['/api/teams/test-team/transfer', 'POST']]) {
            const result = await fetch(base + path, { method, headers: { Authorization: 'Bearer local-test-session', 'Content-Type': 'application/json' }, body: JSON.stringify({ newLeaderId: 'someone' }) });
            assert.equal(result.status, 403);
        }
    });
    await test('protected receipt endpoint rejects missing authorization', async () => {
        const result = await fetch(base + '/api/admin/payments/nonexistent/receipt');
        assert.equal(result.status, 401);
    });
} finally {
    User.findOne = originalFindOne;
    Team.findOne = originalTeamFindOne;
    Session.findOne = originalSessionFindOne;
    await new Promise(resolve => httpServer.close(resolve));
}
