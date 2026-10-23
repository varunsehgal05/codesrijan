// server/test-qa-data-isolation.mjs
// Regression test suite for mixed QA and non-QA data isolation

import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { runMigration, VERIFIED_QA_EVENT_IDS } from './migrate-qa-data.mjs';

const mongod = await MongoMemoryServer.create({
  binary: {
    systemBinary: process.env.MONGOMS_SYSTEM_BINARY || path.join(os.homedir(), '.cache/mongodb-binaries/mongod-x64-win32-8.2.6.exe')
  }
});
const testDbName = 'codesrijan_qa_isolation_test';
process.env.MONGO_URI = mongod.getUri(testDbName);
process.env.MONGO_DB_NAME = testDbName;
process.env.SEED_ADMIN_PASSWORD = '';
process.env.SEED_STUDENT_PASSWORD = '';

await mongoose.connect(process.env.MONGO_URI, { dbName: testDbName });

const { httpServer } = await import('./server.js');
const { User, Team, Hackathon, Registration, Project, Evaluation } = await import('./models/index.js');
const { Session } = await import('./models/auth.js');

await new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve));
const baseUrl = 'http://127.0.0.1:' + httpServer.address().port + '/api';

const apiGet = async (path, token) => {
  const res = await fetch(baseUrl + path, {
    headers: token ? { Authorization: 'Bearer ' + token } : {}
  });
  return { status: res.status, data: await res.json() };
};

const apiPost = async (path, body, token) => {
  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: JSON.stringify(body)
  });
  return { status: res.status, data: await res.json() };
};

test.after(async () => {
  await new Promise(resolve => httpServer.close(resolve));
  await mongoose.disconnect();
  await mongod.stop();
});

test.beforeEach(async () => {
  await Promise.all([
    Hackathon.deleteMany({}),
    Registration.deleteMany({}),
    Team.deleteMany({}),
    User.deleteMany({}),
    Project.deleteMany({}),
    Evaluation.deleteMany({}),
    Session.deleteMany({})
  ]);
});

test('1. Public stats excludes QA registrations and QA active countdown', async () => {
  await Hackathon.create([
    {
      id: 'hack-real-001',
      name: 'CodeSrijan Real Hackathon 2026',
      status: 'registration_open',
      isTest: false
    },
    {
      id: 'qa-paid-hack-1792650786332',
      name: 'QA PAID HACKATHON 2026',
      status: 'registration_open',
      isTest: true
    }
  ]);

  await Registration.create([
    { id: 'reg-real-1', hackathonId: 'hack-real-001', userId: 'usr-1', isTest: false, status: 'registered' },
    { id: 'reg-real-2', hackathonId: 'hack-real-001', userId: 'usr-2', isTest: false, status: 'registered' },
    { id: 'reg-legacy-real', hackathonId: 'hack-real-001', userId: 'usr-3', status: 'registered' }, // legacy missing isTest
    { id: 'reg-qa-1', hackathonId: 'qa-paid-hack-1792650786332', userId: 'usr-qa-1', isTest: true, status: 'registered' },
    { id: 'reg-qa-2', hackathonId: 'qa-paid-hack-1792650786332', userId: 'usr-qa-2', isTest: true, status: 'registered' }
  ]);

  await User.create([
    { id: 'usr-1', email: 'real1@example.com', role: 'student', college: 'Real College' },
    { id: 'usr-2', email: 'real2@example.com', role: 'student', college: 'Real College' }
  ]);

  const res = await apiGet('/public/stats');
  assert.equal(res.status, 200);
  assert.equal(res.data.registrationsCount, 3);
  assert.equal(res.data.activeHackathon.id, 'hack-real-001');
});

test('2. Public leaderboard edge cases: genuine, QA, ambiguous, legacy, and multi-event teams', async () => {
  await Hackathon.create([
    { id: 'hack-real-001', name: 'Genuine Hackathon 2026', isTest: false },
    { id: 'qa-paid-hack-1792650786332', name: 'QA Test Hackathon', isTest: true }
  ]);

  // 1. Genuine submitted team belonging to a genuine event
  // 2. Test team belonging to a QA event (isTest: true)
  // 3. Ambiguous team linked to QA registration/event, but team.isTest remains UNSET/false
  // 4. Genuine team with missing legacy isTest field
  // 5. Team with multi-event participation (genuine event + QA event)
  await Team.create([
    { id: 'team-real-1', name: 'Real Alpha Team', hackathonId: 'hack-real-001', isSubmitted: true, isTest: false, bonusPoints: 10 },
    { id: 'team-qa-1', name: 'QA Test Squad', hackathonId: 'qa-paid-hack-1792650786332', isSubmitted: true, isTest: true, bonusPoints: 100 },
    { id: 't-1791543889807', name: 'Ambiguous Historical Squad', hackathonId: 'qa-paid-hack-1792650786332', isSubmitted: true, isTest: false, bonusPoints: 50 },
    { id: 'team-legacy-real', name: 'Real Legacy Team', hackathonId: 'hack-real-001', isSubmitted: true, bonusPoints: 5 },
    { id: 'team-multi-1', name: 'Multi Event Squad', hackathonId: 'hack-real-001', isSubmitted: true, isTest: false, bonusPoints: 0 }
  ]);

  await Registration.create([
    { id: 'reg-real-1', hackathonId: 'hack-real-001', teamId: 'team-real-1', userId: 'u1', isTest: false },
    { id: 'reg-legacy-1', hackathonId: 'hack-real-001', teamId: 'team-legacy-real', userId: 'u2' }, // legacy missing isTest
    { id: 'reg-qa-1', hackathonId: 'qa-paid-hack-1792650786332', teamId: 'team-qa-1', userId: 'u3', isTest: true },
    { id: 'reg-ambig-1', hackathonId: 'qa-paid-hack-1792650786332', teamId: 't-1791543889807', userId: 'u4', isTest: true },
    { id: 'reg-multi-real', hackathonId: 'hack-real-001', teamId: 'team-multi-1', userId: 'u5', isTest: false },
    { id: 'reg-multi-qa', hackathonId: 'qa-paid-hack-1792650786332', teamId: 'team-multi-1', userId: 'u5', isTest: true }
  ]);

  await Evaluation.create([
    { id: 'eval-real-1', hackathonId: 'hack-real-001', teamId: 'team-real-1', totalScore: 85, scores: [{ criteriaId: 'c1', score: 85 }] },
    { id: 'eval-legacy-1', hackathonId: 'hack-real-001', teamId: 'team-legacy-real', totalScore: 80, scores: [{ criteriaId: 'c1', score: 80 }] },
    { id: 'eval-qa-1', hackathonId: 'qa-paid-hack-1792650786332', teamId: 'team-qa-1', totalScore: 99, scores: [{ criteriaId: 'c1', score: 99 }] },
    { id: 'eval-ambig-1', hackathonId: 'qa-paid-hack-1792650786332', teamId: 't-1791543889807', totalScore: 95, scores: [{ criteriaId: 'c1', score: 95 }] },
    { id: 'eval-multi-genuine', hackathonId: 'hack-real-001', teamId: 'team-multi-1', totalScore: 75, scores: [{ criteriaId: 'c1', score: 75 }] },
    { id: 'eval-multi-qa-leak', hackathonId: 'qa-paid-hack-1792650786332', teamId: 'team-multi-1', totalScore: 1000, scores: [{ criteriaId: 'c1', score: 1000 }] }
  ]);

  const res = await apiGet('/leaderboard');
  assert.equal(res.status, 200);
  const returnedIds = res.data.map(t => t.id);

  // 1. Genuine team is included
  assert.ok(returnedIds.includes('team-real-1'), 'Genuine team must appear on public leaderboard');

  // 2. Legacy team without isTest field is included
  assert.ok(returnedIds.includes('team-legacy-real'), 'Legacy genuine team must appear on public leaderboard');

  // 3. Explicit QA team is excluded
  assert.ok(!returnedIds.includes('team-qa-1'), 'Explicit test team must not appear on public leaderboard');

  // 4. Ambiguous team linked to QA registration/event is excluded without mutating its team record
  assert.ok(!returnedIds.includes('t-1791543889807'), 'Ambiguous team linked only to QA activity must not appear on public leaderboard');

  // 5. Multi-event team appears with its genuine event score only (75, not 1075)
  assert.ok(returnedIds.includes('team-multi-1'), 'Multi-event team appears for its genuine participation');
  const multiTeamData = res.data.find(t => t.id === 'team-multi-1');
  assert.equal(multiTeamData.evalScore, 75, 'QA evaluation score (1000) must not leak into genuine leaderboard score');
});

test('3. Admin payments queue retains QA records with visible isTest tag and separated summary', async () => {
  const adminUser = await User.create({
    id: 'admin-test',
    email: 'admin@codesrijan.com',
    role: 'admin',
    accountStatus: 'active',
    emailVerified: true
  });
  
  const token = 'test-token-' + Date.now();
  const sessionTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await Session.create({
    userId: adminUser.id,
    sessionTokenHash,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
    revokedAt: null
  });

  await Registration.create([
    { id: 'reg-real-p1', hackathonId: 'hack-real-1', userId: 'u1', entryType: 'paid', paymentStatus: 'verified', isTest: false },
    { id: 'reg-real-p2', hackathonId: 'hack-real-1', userId: 'u2', entryType: 'paid', paymentStatus: 'payment_under_review', isTest: false },
    { id: 'reg-qa-p1', hackathonId: 'qa-paid-hack-1792650786332', userId: 'u-qa1', entryType: 'paid', paymentStatus: 'verified', isTest: true }
  ]);

  const res = await apiGet('/admin/payments', token);
  assert.equal(res.status, 200);
  assert.equal(res.data.registrations.length, 3);

  const qaReg = res.data.registrations.find(r => r.id === 'reg-qa-p1');
  const realReg = res.data.registrations.find(r => r.id === 'reg-real-p1');
  assert.equal(qaReg.isTest, true);
  assert.equal(realReg.isTest, false);

  assert.equal(res.data.summary.verifiedCount, 1);
  assert.equal(res.data.summary.pendingCount, 1);
  assert.equal(res.data.summary.testCount, 1);
});

test('4. Migration script enforces dual confirmation guards and protects team t-1791543889807', async () => {
  const host = mongod.instanceInfo.ip;

  await Hackathon.create([
    { id: VERIFIED_QA_EVENT_IDS[0], name: 'QA Event 1', isTest: false },
    { id: VERIFIED_QA_EVENT_IDS[1], name: 'QA Event 2' },
    { id: 'hack-prod-keep-safe', name: 'Genuine Hackathon', isTest: false }
  ]);

  await Registration.create([
    {
      id: 'reg-migrate-1',
      hackathonId: VERIFIED_QA_EVENT_IDS[0],
      teamId: 't-qa-squad-1',
      userId: 'u-mig-1',
      paymentStatus: 'verified',
      transactionReference: 'QA-UTR-999',
      paymentProofUrl: 'https://storage.test/qa-proof.png'
    },
    {
      id: 'reg-migrate-ambig',
      hackathonId: VERIFIED_QA_EVENT_IDS[0],
      teamId: 't-1791543889807',
      userId: 'u-mig-2',
      paymentStatus: 'verified',
      transactionReference: 'HISTORICAL-UTR-111'
    },
    {
      id: 'reg-prod-safe',
      hackathonId: 'hack-prod-keep-safe',
      teamId: 't-prod-safe',
      userId: 'u-prod-safe',
      paymentStatus: 'verified',
      transactionReference: 'REAL-UTR-777'
    }
  ]);

  await Team.create([
    { id: 't-qa-squad-1', name: 'QA Explicit Squad', isLocked: true },
    { id: 't-1791543889807', name: 'Historical Ambiguous Squad', isTest: false, isLocked: true },
    { id: 't-prod-safe', name: 'Real Squad', isTest: false, isLocked: true }
  ]);

  // Dry run (read-only by default)
  const dryReport = await runMigration({ mongoUri: process.env.MONGO_URI, apply: false, keepConnected: true });
  assert.equal(dryReport.mode, 'DRY_RUN');
  assert.equal(dryReport.summary.hackathonsFound, 2);
  assert.equal(dryReport.summary.registrationsFound, 2);
  assert.equal(dryReport.summary.teamsEvaluated, 2);
  assert.equal(dryReport.summary.teamsEligibleForUpdate, 1);
  assert.equal(dryReport.summary.teamsUnresolvedOrProtected, 1);

  // Assert dry-run did not mutate database
  let h1 = await Hackathon.findOne({ id: VERIFIED_QA_EVENT_IDS[0] });
  let tQa = await Team.findOne({ id: 't-qa-squad-1' });
  let tAmbig = await Team.findOne({ id: 't-1791543889807' });
  assert.equal(h1.isTest, false);
  assert.equal(tQa.isTest, false);
  assert.equal(tAmbig.isTest, false);

  // 1. Attempt apply without confirmTarget guard: must abort
  await assert.rejects(
    async () => {
      await runMigration({ mongoUri: process.env.MONGO_URI, apply: true, keepConnected: true });
    },
    /Execution aborted\. --apply requires explicit --confirm-target/
  );

  // 2. Attempt apply with wrong confirmTarget: must abort
  await assert.rejects(
    async () => {
      await runMigration({ mongoUri: process.env.MONGO_URI, apply: true, confirmTarget: 'wrong_db_name', confirmCluster: host, keepConnected: true });
    },
    /Target database mismatch/
  );

  // 3. Attempt apply with matching target DB but missing cluster host: must abort
  await assert.rejects(
    async () => {
      await runMigration({ mongoUri: process.env.MONGO_URI, apply: true, confirmTarget: testDbName, keepConnected: true });
    },
    /--apply requires explicit --confirm-cluster/
  );

  // 4. Attempt apply with matching target DB but wrong cluster host: must abort
  await assert.rejects(
    async () => {
      await runMigration({ mongoUri: process.env.MONGO_URI, apply: true, confirmTarget: testDbName, confirmCluster: 'wrong-cluster.example.com', keepConnected: true });
    },
    /Cluster host mismatch/
  );

  // 5. Apply with both correct confirmTarget and correct confirmCluster
  const applyReport = await runMigration({
    mongoUri: process.env.MONGO_URI,
    apply: true,
    confirmTarget: testDbName,
    confirmCluster: host,
    keepConnected: true
  });
  assert.equal(applyReport.mode, 'APPLY');
  assert.equal(applyReport.mutations.hackathonsModified, 2);
  assert.equal(applyReport.mutations.registrationsModified, 2);
  assert.equal(applyReport.mutations.teamsModified, 1); // Only t-qa-squad-1 is modified!

  h1 = await Hackathon.findOne({ id: VERIFIED_QA_EVENT_IDS[0] });
  const reg1 = await Registration.findOne({ id: 'reg-migrate-1' });
  const regAmbig = await Registration.findOne({ id: 'reg-migrate-ambig' });
  tQa = await Team.findOne({ id: 't-qa-squad-1' });
  tAmbig = await Team.findOne({ id: 't-1791543889807' });
  const prodH = await Hackathon.findOne({ id: 'hack-prod-keep-safe' });
  const prodT = await Team.findOne({ id: 't-prod-safe' });

  // Verification of updates and preservation of critical fields
  assert.equal(h1.isTest, true);
  assert.equal(reg1.isTest, true);
  assert.equal(reg1.transactionReference, 'QA-UTR-999', 'UTR must be preserved');
  assert.equal(reg1.paymentProofUrl, 'https://storage.test/qa-proof.png', 'Payment proof must be preserved');
  assert.equal(reg1.paymentStatus, 'verified', 'Payment status must be preserved');

  assert.equal(regAmbig.isTest, true);
  assert.equal(tQa.isTest, true); // Exclusive QA squad updated
  assert.equal(tQa.isLocked, true, 'isLocked must be preserved');

  assert.equal(tAmbig.isTest, false, 'Historical team t-1791543889807 must remain unchanged');
  assert.equal(tAmbig.isLocked, true, 'isLocked must be preserved');

  assert.equal(prodH.isTest, false);
  assert.equal(prodT.isTest, false);
});

test('5. Duplicate UTR protection and payment review permissions', async () => {
  const adminUser = await User.create({
    id: 'admin-perm-test',
    email: 'admin.perm@codesrijan.com',
    role: 'admin',
    accountStatus: 'active',
    emailVerified: true
  });
  const studentUser = await User.create({
    id: 'student-perm-test',
    email: 'student.perm@codesrijan.com',
    role: 'student',
    accountStatus: 'active',
    emailVerified: true
  });

  const adminToken = 'admin-token-' + Date.now();
  const studentToken = 'student-token-' + Date.now();

  await Session.create([
    {
      userId: adminUser.id,
      sessionTokenHash: crypto.createHash('sha256').update(adminToken).digest('hex'),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      revokedAt: null
    },
    {
      userId: studentUser.id,
      sessionTokenHash: crypto.createHash('sha256').update(studentToken).digest('hex'),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      revokedAt: null
    }
  ]);

  const reg = await Registration.create({
    id: 'reg-perm-test',
    hackathonId: 'hack-paid-perm',
    userId: studentUser.id,
    entryType: 'paid',
    paymentStatus: 'payment_under_review',
    transactionReference: 'UTR-1234567890',
    paymentProofUrl: 'https://storage.test/proof.png',
    status: 'payment_under_review'
  });

  // 1. Student cannot review payment (403 Forbidden)
  const studentReviewRes = await apiPost(`/admin/payments/${reg.id}/review`, { decision: 'approve' }, studentToken);
  assert.equal(studentReviewRes.status, 403);

  // 2. Unauthenticated cannot review payment (401 Unauthorized)
  const unauthReviewRes = await apiPost(`/admin/payments/${reg.id}/review`, { decision: 'approve' });
  assert.equal(unauthReviewRes.status, 401);

  // 3. Admin can review payment (200 OK)
  const adminReviewRes = await apiPost(`/admin/payments/${reg.id}/review`, { decision: 'approve' }, adminToken);
  assert.equal(adminReviewRes.status, 200);

  // 4. Repeated decision fails gracefully (409 Conflict)
  const duplicateDecisionRes = await apiPost(`/admin/payments/${reg.id}/review`, { decision: 'approve' }, adminToken);
  assert.equal(duplicateDecisionRes.status, 409);
});

test('6. Migration aborts if rogue unverified QA hackathon is detected', async () => {
  await Hackathon.create([
    { id: VERIFIED_QA_EVENT_IDS[0], name: 'Verified QA Event' },
    { id: 'qa-rogue-event-999999', name: 'Rogue Unverified QA Hackathon' }
  ]);

  await assert.rejects(
    async () => {
      await runMigration({ mongoUri: process.env.MONGO_URI, apply: false, keepConnected: true });
    },
    /Census anomaly detected: Found 1 rogue QA hackathons not in the allowlist/
  );
});

test('7. Migration aborts if registrations count exceeds expected census (>6)', async () => {
  await Hackathon.create([
    { id: VERIFIED_QA_EVENT_IDS[0], name: 'Verified QA Event' }
  ]);

  // Create 7 registrations (exceeds limit of 6)
  const excessiveRegs = Array.from({ length: 7 }, (_, i) => ({
    id: `reg-excess-${i}`,
    hackathonId: VERIFIED_QA_EVENT_IDS[0],
    userId: `u-excess-${i}`
  }));
  await Registration.create(excessiveRegs);

  await assert.rejects(
    async () => {
      await runMigration({ mongoUri: process.env.MONGO_URI, apply: false, keepConnected: true });
    },
    /Census anomaly detected: Found 7 registrations for allowlisted QA events/
  );
});
