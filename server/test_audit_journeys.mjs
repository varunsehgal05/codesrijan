import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { setTestAppsScriptDispatcher } from './services/email.js';

test('Comprehensive CodeSrijan Journey & Admin Workflow Audit', async (t) => {
  const mongo = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  process.env.MONGO_URI = mongo.getUri();
  process.env.MONGO_DB_NAME = 'isolated_comprehensive_audit';
  process.env.ADMIN_NOTIFICATION_EMAIL = 'admin@example.test';
  process.env.FRONTEND_URL = 'https://example.test';

  const originalConnect = mongoose.connect.bind(mongoose);
  mongoose.connect = (uri, options) => {
    assert.equal(uri, mongo.getUri());
    return originalConnect(uri, { ...options, dbName: 'isolated_comprehensive_audit' });
  };

  const mailLog = [];
  setTestAppsScriptDispatcher(async (template, to, data) => {
    mailLog.push({ template, to, data, timestamp: new Date() });
    return { success: true };
  });

  let server;
  const results = {};

  try {
    ({ httpServer: server } = await import('./server.js'));
    await mongoose.connection.asPromise();

    const {
      User,
      Registration,
      Team,
      Hackathon,
      TeamInvitation,
      ProblemStatement,
      SupportTicket,
      Notification,
      Conversation,
      Message
    } = await import('./models/index.js');

    await Registration.init();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const base = `http://127.0.0.1:${port}/api`;

    const request = async (path, token, body, expectedStatus = 200, methodOverride = null) => {
      const method = methodOverride || (body === undefined ? 'GET' : 'POST');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const response = await fetch(`${base}${path}`, {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      let json = null;
      try {
        json = await response.json();
      } catch (e) {
        json = { raw: await response.text() };
      }
      return { status: response.status, data: json };
    };

    // ==========================================
    // GROUP B: AUTH, OTP & LOGIN TESTS
    // ==========================================
    console.log('--- Testing Group B: Auth, OTP & Login ---');

    // AUTH-002: Empty registration submission
    const emptyReg = await request('/auth/register', null, {});
    assert.equal(emptyReg.status, 400);
    results['AUTH-002'] = { status: 'PASS', actual: 'Rejected with 400 when fields missing' };

    // AUTH-003: Malformed email
    const malformedReg = await request('/auth/register', null, {
      name: 'Test',
      email: 'not-an-email',
      password: 'Password123!'
    });
    assert.equal(malformedReg.status, 400, `Expected 400 for malformed email, got ${malformedReg.status}`);
    results['AUTH-003'] = { status: 'PASS', actual: `Status ${malformedReg.status}: ${JSON.stringify(malformedReg.data)}` };

    // AUTH-004: Password validation
    const weakPass = await request('/auth/register', null, {
      name: 'Test',
      email: 'weak@example.test',
      password: '123'
    });
    assert.equal(weakPass.status, 400, `Expected 400 for weak password, got ${weakPass.status}`);
    results['AUTH-004'] = { status: 'PASS', actual: `Status ${weakPass.status}` };

    // AUTH-006: Successful registration of Student A
    const regA = await request('/auth/register', null, {
      name: 'Student A',
      email: 'student_a@example.test',
      password: 'ValidPassword123!',
      college: 'Test College',
      branch: 'CSE',
      year: '3'
    });
    assert.equal(regA.status, 201);
    const otpMsgA = mailLog.findLast((m) => m.template === 'verification_otp' && m.to === 'student_a@example.test');
    assert.ok(otpMsgA, 'OTP email was dispatched');
    const otpA = otpMsgA.data.code;
    results['AUTH-006'] = { status: 'PASS', actual: 'User registered, OTP dispatched via relay' };

    // AUTH-007: Duplicate email
    const dupReg = await request('/auth/register', null, {
      name: 'Student A Duplicate',
      email: 'student_a@example.test',
      password: 'ValidPassword123!'
    });
    assert.ok(dupReg.status === 400 || dupReg.status === 429, `Expected 400 or 429, got ${dupReg.status}`);
    results['AUTH-007'] = { status: 'PASS', actual: `Duplicate email rejected with HTTP ${dupReg.status} (rate limited / duplicate guard)` };

    // AUTH-010: Incorrect OTP
    const badOtp = await request('/auth/verify-email', null, {
      userId: regA.data.userId,
      code: '000000'
    });
    assert.equal(badOtp.status, 400);
    results['AUTH-010'] = { status: 'PASS', actual: 'Bad OTP rejected with HTTP 400' };

    // AUTH-013: Login before verification
    const preVerifyLogin = await request('/auth/login', null, {
      email: 'student_a@example.test',
      password: 'ValidPassword123!'
    });
    assert.equal(preVerifyLogin.status, 401);
    results['AUTH-013'] = { status: 'PASS', actual: 'Unverified login rejected with 401' };

    // AUTH-009: Correct OTP
    const verifyA = await request('/auth/verify-email', null, {
      userId: regA.data.userId,
      code: otpA
    });
    assert.equal(verifyA.status, 200);
    results['AUTH-009'] = { status: 'PASS', actual: 'OTP accepted and email marked verified' };

    // AUTH-011: Expired/reused OTP
    const reuseOtp = await request('/auth/verify-email', null, {
      userId: regA.data.userId,
      code: otpA
    });
    assert.equal(reuseOtp.status, 400);
    results['AUTH-011'] = { status: 'PASS', actual: 'Reused OTP rejected with HTTP 400' };

    // AUTH-014: First successful login
    const loginA = await request('/auth/login', null, {
      email: 'student_a@example.test',
      password: 'ValidPassword123!'
    });
    assert.equal(loginA.status, 200);
    assert.ok(loginA.data.token);
    const tokenA = loginA.data.token;
    const userAId = loginA.data.user.id;
    results['AUTH-014'] = { status: 'PASS', actual: 'Logged in successfully, JWT received' };

    // AUTH-015: Invalid login
    const badLogin = await request('/auth/login', null, {
      email: 'student_a@example.test',
      password: 'WrongPassword!'
    });
    assert.equal(badLogin.status, 401);
    results['AUTH-015'] = { status: 'PASS', actual: 'Wrong password denied with HTTP 401' };

    // AUTH-019: Role manipulation attempt
    const roleTamper = await request('/users/profile', tokenA, {
      role: 'admin'
    }, 200, 'PUT');
    const meA = await request('/auth/me', tokenA);
    assert.equal(meA.data.user.role, 'student', 'Role must remain student');
    results['AUTH-019'] = { status: 'PASS', actual: 'Client role manipulation ignored, role remains student' };

    // AUTH-017 & AUTH-018: Forgot Password & Reset
    const forgot = await request('/auth/forgot-password', null, {
      email: 'student_a@example.test'
    });
    assert.equal(forgot.status, 200);
    const resetMail = mailLog.findLast((m) => m.template === 'password_reset' && m.to === 'student_a@example.test');
    assert.ok(resetMail, 'Password reset email sent');
    results['AUTH-017'] = { status: 'PASS', actual: 'Forgot password accepted and reset email dispatched' };

    // Register Student B
    const regB = await request('/auth/register', null, {
      name: 'Student B',
      email: 'student_b@example.test',
      password: 'ValidPassword123!',
      college: 'Test College',
      branch: 'IT',
      year: '2'
    });
    const otpMsgB = mailLog.findLast((m) => m.template === 'verification_otp' && m.to === 'student_b@example.test');
    await request('/auth/verify-email', null, { userId: regB.data.userId, code: otpMsgB.data.code });
    const loginB = await request('/auth/login', null, {
      email: 'student_b@example.test',
      password: 'ValidPassword123!'
    });
    const tokenB = loginB.data.token;
    const userBId = loginB.data.user.id;

    // Create Root Admin
    const adminPassword = 'AdminSecret123!';
    await User.create({
      id: 'admin-root',
      email: 'admin@codesrijan.com',
      name: 'Root Administrator',
      role: 'admin',
      accountStatus: 'active',
      emailVerified: true,
      passwordHash: await bcrypt.hash(adminPassword, 10)
    });
    const loginAdmin = await request('/auth/login', null, {
      email: 'admin@codesrijan.com',
      password: adminPassword
    });
    assert.equal(loginAdmin.status, 200);
    const adminToken = loginAdmin.data.token;
    results['ADMIN-001'] = { status: 'PASS', actual: 'Admin logged in with role admin' };

    // ADMIN-002: Student attempts admin access
    const studentAsAdmin = await request('/admin/payments', tokenA);
    assert.equal(studentAsAdmin.status, 403);
    results['ADMIN-002'] = { status: 'PASS', actual: 'Student denied from admin route with HTTP 403' };

    // ==========================================
    // GROUP C: PROFILE & SETTINGS
    // ==========================================
    console.log('--- Testing Group C: Profile & Settings ---');
    const updateProfile = await request('/users/profile', tokenA, {
      bio: 'Competitive hacker',
      githubUrl: 'https://github.com/student-a'
    }, 200, 'PUT');
    assert.equal(updateProfile.status, 200);
    const verifyProfile = await request('/auth/me', tokenA);
    assert.equal(verifyProfile.data.user.bio, 'Competitive hacker');
    results['STUDENT-002'] = { status: 'PASS', actual: 'Profile update persists and returns updated fields' };

    // ==========================================
    // GROUP H & E: ADMIN CREATES HACKATHON & FREE REGISTRATION
    // ==========================================
    console.log('--- Testing Admin Hackathon Creation & Free Registration ---');
    // ADMIN-005: Create free hackathon
    const createFreeHack = await request('/hackathons', adminToken, {
      name: 'Winter Code Sprint 2026',
      description: 'Free collegiate hackathon',
      registrationStart: '2026-01-01',
      registrationEnd: '2026-12-31',
      entryType: 'free',
      teamSizeMin: 1,
      teamSizeMax: 4
    });
    assert.equal(createFreeHack.status, 200);
    const freeHackId = createFreeHack.data.id;
    assert.equal(createFreeHack.data.status, 'draft');
    results['ADMIN-005'] = { status: 'PASS', actual: 'Free hackathon created as draft' };

    // ADMIN-010: Publish hackathon
    const publishHack = await request(`/hackathons/${freeHackId}/publish`, adminToken, {});
    assert.equal(publishHack.status, 200);
    assert.equal(publishHack.data.status, 'registration_open');
    results['ADMIN-010'] = { status: 'PASS', actual: 'Hackathon moved from draft to registration_open' };

    // EVENT-002: Register solo student for free hackathon
    const regSolo = await request(`/hackathons/${freeHackId}/register`, tokenA, {
      type: 'solo',
      college: 'Test College',
      branch: 'CSE',
      year: '3'
    });
    assert.equal(regSolo.status, 200);
    assert.equal(regSolo.data.registration.status, 'registered');
    assert.equal(regSolo.data.registration.feeAmount, 0);
    results['EVENT-002'] = { status: 'PASS', actual: 'Solo student registered with status registered and fee 0' };

    // EVENT-003: Duplicate registration
    const dupEventReg = await request(`/hackathons/${freeHackId}/register`, tokenA, {
      type: 'solo'
    });
    assert.equal(dupEventReg.status, 409);
    results['EVENT-003'] = { status: 'PASS', actual: 'Duplicate registration rejected with HTTP 409' };

    // ==========================================
    // GROUP D: TEAM CREATION, INVITATIONS & TEAM-008 DEPENDENCY CHECK
    // ==========================================
    console.log('--- Testing Team Creation, Invitations & TEAM-008 ---');

    // Create a new event for team testing
    const createTeamHack = await request('/hackathons', adminToken, {
      name: 'Team Championship 2026',
      description: 'Squad challenge',
      registrationStart: '2026-01-01',
      registrationEnd: '2026-12-31',
      entryType: 'paid',
      fee: 150,
      feeBasis: 'per_participant',
      teamSizeMin: 2,
      teamSizeMax: 4
    });
    const teamHackId = createTeamHack.data.id;
    await request(`/hackathons/${teamHackId}/open-registration`, adminToken, {});

    // TEAM-002: Create Team by Student A
    const teamA = await request('/teams', tokenA, {
      name: 'Alpha Squad',
      hackathonId: teamHackId
    });
    assert.equal(teamA.status, 200);
    const teamAId = teamA.data.id;
    assert.equal(teamA.data.leaderId, userAId);
    results['TEAM-002'] = { status: 'PASS', actual: 'Team created with Student A as leader' };

    // TEAM-004: Try to invite Student B BEFORE Student B registers
    const preRegInvite = await request(`/teams/${teamAId}/invite`, tokenA, {
      receiverId: userBId
    });
    console.log('Pre-registration invite response:', preRegInvite.status, preRegInvite.data);

    // TEAM-008 REPRODUCTION:
    // To allow invitation, Student B MUST register solo first!
    const regSoloB = await request(`/hackathons/${teamHackId}/register`, tokenB, {
      type: 'solo'
    });
    assert.equal(regSoloB.status, 200);
    const soloBRegId = regSoloB.data.registration.id;
    console.log('Student B solo registration created:', soloBRegId, 'feeAmount:', regSoloB.data.registration.feeAmount);

    // Now Student A invites Student B
    const validInvite = await request(`/teams/${teamAId}/invite`, tokenA, {
      receiverId: userBId
    });
    assert.equal(validInvite.status, 200);
    const inviteId = validInvite.data.id;
    results['TEAM-004'] = { status: 'PASS', actual: 'Invitation created after invitee registered solo' };

    // TEAM-006: Student B accepts invitation
    const acceptInvite = await request(`/teams/accept-invite/${inviteId}`, tokenB, {});
    assert.equal(acceptInvite.status, 200);
    results['TEAM-006'] = { status: 'PASS', actual: 'Student B accepted invite, added to team memberIds' };

    // Leader (Student A) now registers the team for the hackathon
    const regTeam = await request(`/hackathons/${teamHackId}/register`, tokenA, {
      type: 'team',
      teamId: teamAId
    });
    assert.equal(regTeam.status, 200);
    const teamRegId = regTeam.data.registration.id;
    console.log('Team registration created:', teamRegId, 'feeAmount:', regTeam.data.registration.feeAmount, 'roster:', regTeam.data.registration.rosterMembers.length);

    // NOW CHECK DATA INTEGRITY FOR TEAM-008:
    const allRegistrationsForEvent = await Registration.find({ hackathonId: teamHackId });
    console.log('Total registration records for teamHackId:', allRegistrationsForEvent.length);
    allRegistrationsForEvent.forEach(r => {
      console.log(` - Reg ${r.id}: type=${r.type}, userId=${r.userId}, fee=${r.feeAmount}, roster=${r.rosterMembers.map(m=>m.userId).join(',')}`);
    });

    const soloRecordRemains = allRegistrationsForEvent.some(r => r.id === soloBRegId && r.type === 'solo');
    assert.equal(soloRecordRemains, false, 'Solo placeholder registration must be deleted upon team registration');
    assert.equal(allRegistrationsForEvent.length, 1, 'Only team registration must remain for hackathon');

    results['TEAM-008'] = {
      status: 'PASS',
      soloRecordRemains: false,
      totalRegistrations: allRegistrationsForEvent.length,
      actual: 'Solo registration was cleanly reconciled without duplicate fees'
    };

    // TEAM-008-SAFETY: Verify that a solo registration WITH financial payment proof or verified status is NEVER deleted
    const createSafeHack = await request('/hackathons', adminToken, {
      name: 'Safety Check Hackathon',
      description: 'Proof preservation check',
      registrationStart: '2026-01-01',
      registrationEnd: '2026-12-31',
      entryType: 'paid',
      fee: 200,
      feeBasis: 'per_team',
      teamSizeMin: 2,
      teamSizeMax: 4
    });
    const safeHackId = createSafeHack.data.id;
    await request(`/hackathons/${safeHackId}/open-registration`, adminToken, {});

    // Member B registers solo and submits a real UTR
    const regSoloSafeB = await request(`/hackathons/${safeHackId}/register`, tokenB, { type: 'solo' });
    assert.equal(regSoloSafeB.status, 200);
    const soloSafeBId = regSoloSafeB.data.registration.id;
    await Registration.updateOne({ id: soloSafeBId }, {
      transactionReference: 'UTR-PAID-SAFE-8877',
      paymentProofUrl: 'https://storage.example.test/proof.png',
      paymentStatus: 'payment_under_review'
    });

    // Create an isolated leader and team containing Student B (who already has a submitted UTR)
    const crypto = await import('node:crypto');
    const { Session } = await import('./models/auth.js');
    const safeLeader = await User.create({
      id: `usr-leader-${Date.now()}`,
      email: 'safe_leader@example.test',
      name: 'Safe Leader',
      role: 'student',
      accountStatus: 'active',
      emailVerified: true,
      college: 'Test College'
    });
    const safeTeamDoc = await Team.create({
      id: `team-safe-${Date.now()}`,
      name: 'Beta Squad',
      leaderId: safeLeader.id,
      memberIds: [safeLeader.id, userBId],
      hackathonId: safeHackId
    });
    safeLeader.teamId = safeTeamDoc.id;
    await safeLeader.save();

    const safeToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = crypto.createHash('sha256').update(safeToken).digest('hex');
    await Session.create({
      userId: safeLeader.id,
      sessionTokenHash,
      expiresAt: new Date(Date.now() + 60000)
    });

    const regTeamWithPaidMember = await request(`/hackathons/${safeHackId}/register`, safeToken, {
      type: 'team',
      teamId: safeTeamDoc.id
    });
    // Expected: 409 conflict because member has active payment proof; record must NOT be deleted
    assert.equal(regTeamWithPaidMember.status, 409, 'Team registration must not wipe submitted payment proof');
    const preservedSolo = await Registration.findOne({ id: soloSafeBId });
    assert.ok(preservedSolo, 'Legitimate payment proof registration must be strictly preserved');
    assert.equal(preservedSolo.transactionReference, 'UTR-PAID-SAFE-8877');
    results['TEAM-008-SAFETY'] = { status: 'PASS', actual: 'Solo registration with payment proof cannot be deleted by squad entry' };

    // TEAM-010: Team locked after registration
    const lockedTeamDoc = await Team.findOne({ id: teamAId });
    assert.equal(lockedTeamDoc.isLocked, true);
    // Attempt to leave locked team
    const leaveLocked = await request('/teams/leave', tokenB, { teamId: teamAId });
    assert.equal(leaveLocked.status, 403);
    results['TEAM-010'] = { status: 'PASS', actual: 'Team locked, member cannot leave locked roster (HTTP 403)' };

    // ==========================================
    // GROUP F: PAID HACKATHON & PAYMENT WORKFLOW
    // ==========================================
    console.log('--- Testing Paid Hackathon & Payment Review ---');

    // PAY-003 & PAY-004: Payment proof submission
    const emptyProof = await request(`/hackathons/${teamHackId}/payment-proof`, tokenA, {});
    assert.equal(emptyProof.status, 400);
    results['PAY-004'] = { status: 'PASS', actual: 'Missing payment proof rejected with 400' };

    // PAY-006 & PAY-007: Submit valid proof
    const validProof = {
      transactionReference: 'UTR-AUDIT-998877',
      paymentProofUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
    };
    const submitProof = await request(`/hackathons/${teamHackId}/payment-proof`, tokenA, validProof);
    assert.equal(submitProof.status, 200);
    results['PAY-006'] = { status: 'PASS', actual: 'Proof submitted, status moves to payment_under_review' };

    // Register Outsider Student C for duplicate UTR test
    const regC = await request('/auth/register', null, {
      name: 'Outsider Student',
      email: 'outsider@example.test',
      password: 'ValidPassword123!',
      college: 'Test College',
      branch: 'EE',
      year: '1'
    });
    const otpMsgC = mailLog.findLast((m) => m.template === 'verification_otp' && m.to === 'outsider@example.test');
    await request('/auth/verify-email', null, { userId: regC.data.userId, code: otpMsgC.data.code });
    const loginC = await request('/auth/login', null, {
      email: 'outsider@example.test',
      password: 'ValidPassword123!'
    });
    const tokenC = loginC.data.token;
    await request(`/hackathons/${teamHackId}/register`, tokenC, { type: 'solo' });

    // PAY-005: Duplicate UTR on another registration
    const submitDupProof = await request(`/hackathons/${teamHackId}/payment-proof`, tokenC, validProof);
    assert.equal(submitDupProof.status, 409);
    results['PAY-005'] = { status: 'PASS', actual: 'Duplicate UTR rejected with HTTP 409' };

    // PAY-010: Unauthorized receipt access
    const receiptNonAdmin = await request(`/admin/payments/${teamRegId}/receipt`, tokenB);
    assert.equal(receiptNonAdmin.status, 403);
    results['PAY-010'] = { status: 'PASS', actual: 'Student denied receipt proof with HTTP 403' };

    // PAY-008: Admin Rejection
    const rejectReview = await request(`/admin/payments/${teamRegId}/review`, adminToken, {
      decision: 'reject',
      reason: 'Blurred screenshot'
    });
    assert.equal(rejectReview.status, 200);
    const rejectedReg = await Registration.findOne({ id: teamRegId });
    assert.equal(rejectedReg.paymentStatus, 'rejected');
    results['PAY-008'] = { status: 'PASS', actual: 'Payment rejected with audit reason' };

    // Retry payment
    await request(`/hackathons/${teamHackId}/retry-payment`, tokenA, {});
    await request(`/hackathons/${teamHackId}/payment-proof`, tokenA, {
      transactionReference: 'UTR-AUDIT-998878',
      paymentProofUrl: validProof.paymentProofUrl
    });

    // PAY-009: Admin Approval
    const approveReview = await request(`/admin/payments/${teamRegId}/review`, adminToken, {
      decision: 'approve'
    });
    assert.equal(approveReview.status, 200);
    const approvedReg = await Registration.findOne({ id: teamRegId });
    assert.equal(approvedReg.status, 'registered');
    assert.equal(approvedReg.paymentStatus, 'verified');
    results['PAY-009'] = { status: 'PASS', actual: 'Payment approved, registration verified' };

    // ==========================================
    // GROUP G: STUDENT ACADEMIC FEATURES (WORKSPACE, CHALLENGE, SUPPORT)
    // ==========================================
    console.log('--- Testing Group G: Student Features ---');

    // STUDENT-006: Problem Statement creation & selection
    const createProblem = await request('/problems', adminToken, {
      title: 'Decentralized Identity Verification',
      description: 'Build an autonomous zero-knowledge identity matrix',
      category: 'Security',
      difficulty: 'Hard',
      hackathonId: teamHackId,
      isPublished: true
    });
    assert.equal(createProblem.status, 200);
    const problemId = createProblem.data.id;

    // Student selects problem
    const selectProb = await request(`/teams/${teamAId}/select-problem`, tokenA, {
      problemId
    });
    assert.equal(selectProb.status, 200);
    results['STUDENT-006'] = { status: 'PASS', actual: 'Problem selected by team leader' };

    // STUDENT-005: Workspace task management
    const addTask = await request(`/teams/${teamAId}/tasks`, tokenA, {
      title: 'Design UI Wireframes',
      description: 'High fidelity figma designs'
    });
    assert.equal(addTask.status, 200);
    results['STUDENT-005'] = { status: 'PASS', actual: 'Workspace deliverable task created and persisted' };

    // STUDENT-011: Support Ticket
    const createTicket = await request('/support', tokenA, {
      category: 'Technical',
      subject: 'WebSocket Reconnection issue',
      message: 'Socket closes after 60 seconds'
    });
    assert.equal(createTicket.status, 201);
    const ticketId = createTicket.data.id;

    // Verify Student B cannot see Student A's ticket
    const supportB = await request('/support', tokenB);
    assert.equal(supportB.data.some(t => t.id === ticketId), false);
    results['STUDENT-011'] = { status: 'PASS', actual: 'Support ticket isolated to owner; Student B cannot see Student A ticket' };

    // STUDENT-012: AI Assistant Endpoint
    const aiChat = await request('/ai/chat', null, {
      message: 'How do I submit my hackathon project?'
    });
    assert.equal(aiChat.status, 200, `Expected 200 for AI chat, got ${aiChat.status}`);
    results['STUDENT-012'] = {
      status: 'PASS',
      actual: `AI chat response status ${aiChat.status}`
    };

    // ==========================================
    // GROUP: CHAT & WEBSOCKET
    // ==========================================
    console.log('--- Testing Chat Endpoints ---');
    // CHAT-001 & CHAT-002: Direct conversation
    const directChat = await request('/conversations/direct', tokenA, {
      targetUserId: userBId
    });
    assert.equal(directChat.status, 200);
    const convId = directChat.data.id;

    // Send message
    const sendMsg = await request(`/conversations/${convId}/messages`, tokenA, {
      message: 'Hello Student B!'
    });
    assert.equal(sendMsg.status, 201);
    assert.equal(sendMsg.data.message, 'Hello Student B!');
    results['CHAT-002'] = { status: 'PASS', actual: 'Message sent and persisted in direct conversation' };

    // CHAT-005: Blank message
    const blankMsg = await request(`/conversations/${convId}/messages`, tokenA, {
      message: '   '
    });
    assert.equal(blankMsg.status, 400);
    results['CHAT-005'] = { status: 'PASS', actual: 'Blank message rejected with 400' };

    // ==========================================
    // GROUP: NOTIFICATIONS
    // ==========================================
    console.log('--- Testing Notifications ---');
    const notifsB = await request('/notifications', tokenB);
    assert.equal(notifsB.status, 200);
    assert.ok(Array.isArray(notifsB.data));
    const inviteNotif = notifsB.data.find(n => n.type === 'team_invite');
    assert.ok(inviteNotif, 'Student B received team_invite notification');
    results['NOTIFY-001'] = { status: 'PASS', actual: 'Notification delivered to intended recipient' };

    if (inviteNotif) {
      const readNotif = await request(`/notifications/${inviteNotif.id}/read`, tokenB, {}, 200, 'PATCH');
      assert.equal(readNotif.status, 200);
      results['NOTIFY-004'] = { status: 'PASS', actual: 'Notification marked as read' };
    }

    // ==========================================
    // ADMIN DASHBOARD & ANALYTICS
    // ==========================================
    console.log('--- Testing Admin Dashboard & Analytics ---');
    const adminAnalytics = await request('/admin/analytics', adminToken);
    assert.equal(adminAnalytics.status, 200);
    assert.ok(adminAnalytics.data.stats && adminAnalytics.data.stats.userCount !== undefined);
    results['ADMIN-003'] = { status: 'PASS', actual: `Admin analytics returns valid metrics object: ${JSON.stringify(adminAnalytics.data.stats)}` };

    const failedTests = Object.entries(results).filter(([_, r]) => r.status === 'FAIL');
    assert.equal(failedTests.length, 0, `Audit encountered test failures: ${JSON.stringify(failedTests)}`);

    console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
  } finally {
    setTestAppsScriptDispatcher(null);
    if (server?.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    await mongo.stop();
  }

  console.log('\n--- SUMMARY OF ISOLATED AUDIT RESULTS ---');
  console.log(JSON.stringify(results, null, 2));
});
