import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import dns from 'dns';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Configure Realtime Sockets
io.on('connection', (socket) => {
    socket.on('join_team', (teamId) => {
        socket.join(teamId);
    });

    socket.on('send_message', (data) => {
        // data expects: { id, authorId, authorName, teamId, content }
        io.to(data.teamId).emit('receive_message', data);
    });
});

app.use(cors());
app.use(express.json());

// --- Schemas (Imported from modular directory) ---
import { User, Team, ProblemStatement, Hackathon, Registration, Submission, Project, Evaluation, TeamJoinRequest, TeamInvitation, RecruitmentProfile, Certificate } from './models/index.js';
import { Announcement, CalendarEvent, Sponsor, ActivityLog, SystemSetting } from './models/secondary.js';
import { FAQ, Gallery } from './models/tertiary.js';
import { Session, EmailVerification, PasswordResetToken, SecurityEvent } from './models/auth.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import crypto from 'crypto';
import { sendVerificationEmail } from './services/email.js';

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    dbName: 'codesrijan'
}).then(async () => {
    console.log('MongoDB Connected to keyspace codesrijan');

    // Seed secure root accounts exactly once
    const adminExists = await User.findOne({ email: "admin@codesrijan.com" });
    if (!adminExists) {
        const passwordHash = await bcrypt.hash("CodeSrijan99!", 10);
        await User.create({
            id: "root-admin-01",
            name: "CodeSrijan Administrator",
            email: "admin@codesrijan.com",
            passwordHash,
            role: "admin",
            accountStatus: "active",
            emailVerified: true
        });
        console.log("[SYSTEM] Root Admin cryptographic identity provisioned.");
    }

    const studentExists = await User.findOne({ email: "student@codesrijan.com" });
    if (!studentExists) {
        const passwordHash = await bcrypt.hash("HackerStudent99!", 10);
        await User.create({
            id: "test-student-01",
            name: "Vanguard Hacker",
            email: "student@codesrijan.com",
            passwordHash,
            role: "student",
            accountStatus: "active",
            emailVerified: true
        });
        console.log("[SYSTEM] Structural Hacker student identity provisioned.");
    }
}).catch(err => console.error(err));

// --- Routes ---

// --- AUTHENTICATION & SECURITY (EPIC 5) ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, college, branch, year } = req.body;
        // Normalize email
        const normalizedEmail = String(email).toLowerCase();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) return res.status(400).json({ message: "Operative identity already active." });

        const passwordHash = await bcrypt.hash(String(password), 10);

        // Force Student role
        const user = new User({
            id: `usr-${Date.now()}`,
            name,
            email: normalizedEmail,
            passwordHash,
            role: 'student',
            college, branch, year,
            accountStatus: 'pending_verification'
        });
        await user.save();

        // Generate Verification Code (6-digit)
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenHash = await bcrypt.hash(code, 5);

        const verification = new EmailVerification({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 15 * 60000) // 15 mins
        });
        await verification.save();

        // Dispatch Verification Email
        try {
            await sendVerificationEmail(normalizedEmail, code);
            console.log(`[SECURE COMMS] Protocol fired for ${normalizedEmail}.`);
            res.json({ message: "Account created. Verification required.", userId: user.id });
        } catch (mailError) {
            console.log(`[SMTP FAULT] Transport failed or unconfigured. Auto-verifying fallback activated for ${normalizedEmail}.`, mailError.message);
            user.accountStatus = 'active';
            user.emailVerified = true;
            await user.save();
            res.json({ message: "Account created and instantly verified (SMTP offline threshold reached).", userId: user.id });
        }
    } catch (e) {
        res.status(500).json({ message: "Registration failed", error: e.message });
    }
});

app.post('/api/auth/verify-email', async (req, res) => {
    try {
        const { userId, code } = req.body;
        const verification = await EmailVerification.findOne({ userId, usedAt: null });
        if (!verification || verification.expiresAt < new Date()) {
            return res.status(400).json({ message: "Invalid or expired verification packet." });
        }

        const isValid = await bcrypt.compare(String(code), verification.tokenHash);
        if (!isValid) return res.status(400).json({ message: "Invalid verification code." });

        verification.usedAt = new Date();
        await verification.save();

        await User.findOneAndUpdate({ id: userId }, {
            accountStatus: 'active',
            emailVerified: true,
            emailVerifiedAt: new Date()
        });

        res.json({ message: "Email verified successfully." });
    } catch (e) {
        res.status(500).json({ message: "Verification failed." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email).toLowerCase();



        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(401).json({ message: "Invalid matrix passkey or identity." });

        if (user.accountStatus === 'pending_verification') {
            // Hotfix: Auto-verify trapped accounts if the SMTP node was offline previously
            if (!process.env.EMAIL_USER) {
                console.log(`[SYSTEM RECOVERY] Auto-activating structurally trapped identity: ${normalizedEmail}`);
                user.accountStatus = 'active';
                user.emailVerified = true;
                await user.save();
            } else {
                return res.status(401).json({ message: "Please verify your email before logging in.", needsVerification: true, userId: user.id });
            }
        }
        if (user.accountStatus === 'suspended') return res.status(403).json({ message: "Your CodeSrijan account is currently suspended. Please contact support." });
        if (user.accountStatus === 'disabled') return res.status(403).json({ message: "This CodeSrijan account is currently disabled." });

        if (user.passwordHash) {
            const isValid = await bcrypt.compare(String(password), user.passwordHash);
            if (!isValid) return res.status(401).json({ message: "Invalid matrix passkey or identity." });
        }

        // Create Session Token mock
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
        const session = new Session({
            userId: user.id,
            sessionTokenHash,
            expiresAt: new Date(Date.now() + 24 * 60 * 60000)
        });
        await session.save();

        // Return token and user
        res.json({ token: sessionToken, user });
    } catch (e) {
        res.status(500).json({ message: "Server fault during login." });
    }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
    // Session verified via middleware - yield validated user context
    res.json({ user: req.user });
});

app.post('/api/auth/sessions/revoke', requireAuth, async (req, res) => {
    try {
        await Session.updateMany({ userId: req.user.id }, { revokedAt: new Date() });
        res.json({ message: "All sessions terminated. Identity sealed." });
    } catch (e) {
        res.status(500).json({ message: "Failed to revoke sessions." });
    }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = String(email).toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            // Silently succeed to prevent email enumeration
            return res.json({ message: "If an account exists, a reset instruction has been dispatched." });
        }

        // Generate reset token
        const resetTokenRaw = crypto.randomBytes(32).toString('hex');
        const tokenHash = await bcrypt.hash(resetTokenRaw, 5);

        const resetToken = new PasswordResetToken({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 60 * 60000) // 1 Hour
        });
        await resetToken.save();

        // In production, this dispatches via Email Service
        // We will repurpose the verification transporter logic here later if requested,
        // but for now, generate the link string:
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetTokenRaw}&uid=${user.id}`;
        console.log(`[PASSWORD RESET GENERATED] ${resetLink}`);

        res.json({ message: "If an account exists, a reset instruction has been dispatched." });
    } catch (e) {
        res.status(500).json({ message: "Reset initiation failed." });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { userId, token, newPassword } = req.body;

        const resetRecord = await PasswordResetToken.findOne({ userId, usedAt: null });
        if (!resetRecord || resetRecord.expiresAt < new Date()) {
            return res.status(400).json({ message: "Invalid or expired reset token." });
        }

        const isValid = await bcrypt.compare(String(token), resetRecord.tokenHash);
        if (!isValid) return res.status(400).json({ message: "Invalid token payload." });

        const newPasswordHash = await bcrypt.hash(String(newPassword), 10);

        // Update user
        await User.findOneAndUpdate({ id: userId }, { passwordHash: newPasswordHash });

        // Burn token
        resetRecord.usedAt = new Date();
        await resetRecord.save();

        // Revoke all existing sessions for security
        await Session.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });

        res.json({ message: "Password updated successfully. All previous sessions revoked." });
    } catch (e) {
        res.status(500).json({ message: "Reset operation failed.", error: e.message });
    }
});

// HACKATHONS
app.get('/api/hackathons', async (req, res) => {
    // Optionally only return "active" or "registration_open" hackathons unless admin
    const query = (req.headers.authorization) ? {} : { status: { $in: ['registration_open', 'active'] } };
    // Wait, let's keep it simple: Public can view hackathons, but maybe only active ones.
    const hackathons = await Hackathon.find();
    res.json(hackathons);
});
app.post('/api/hackathons', requireAuth, requireRole(['admin']), async (req, res) => {
    const hackathon = new Hackathon(req.body);
    await hackathon.save();
    res.json(hackathon);
});
app.patch('/api/hackathons/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    const hackathon = await Hackathon.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(hackathon);
});

// REGISTRATIONS
app.post('/api/registrations', requireAuth, requireRole(['student']), async (req, res) => {
    const { hackathonId, college, branch, year } = req.body;

    // Check if already registered
    const existing = await Registration.findOne({ userId: req.user.id, hackathonId });
    if (existing) {
        return res.status(400).json({ message: "Already registered for this hackathon." });
    }

    const registration = new Registration({
        id: `reg-${Date.now()}`,
        hackathonId,
        userId: req.user.id,
        college,
        branch,
        year,
        status: 'pending' // pending manual/auto verification
    });
    await registration.save();
    res.json(registration);
});
app.get('/api/registrations/me', requireAuth, requireRole(['student', 'admin']), async (req, res) => {
    // Resource isolation: user can only see their own registrations
    const registrations = await Registration.find({ userId: req.user.id });
    res.json(registrations);
});

// TEAMS
app.get('/api/teams', requireAuth, async (req, res) => {
    const teams = await Team.find();
    res.json(teams);
});
app.post('/api/teams', requireAuth, requireRole(['student', 'admin']), async (req, res) => {
    // Only logged-in students (and admins for testing) can create teams, and they become the leader automatically.
    if (req.user.teamId) {
        return res.status(403).json({ message: "You are already in a team." });
    }
    const team = new Team({
        ...req.body, // { name: string, description: string } (optional extra fields)
        id: `t-${Date.now()}`,
        leaderId: req.user.id,
        memberIds: [req.user.id] // Auto-assign as member 1
    });
    await team.save();
    await User.findOneAndUpdate({ id: req.user.id }, { teamId: team.id });
    res.json(team);
});
app.post('/api/teams/join', requireAuth, requireRole(['student', 'admin']), async (req, res) => {
    const { teamCode } = req.body;
    if (req.user.teamId) {
        return res.status(403).json({ message: "You are already in a team." });
    }
    const team = await Team.findOne({ id: teamCode });
    if (!team) {
        return res.status(404).json({ message: "Invalid Squad Code." });
    }
    if (team.memberIds.length >= 4) {
        return res.status(403).json({ message: "Squad is at maximum capacity (4 members)." });
    }
    team.memberIds.push(req.user.id);
    await team.save();
    await User.findOneAndUpdate({ id: req.user.id }, { teamId: team.id });
    res.json(team);
});
app.post('/api/teams/:id/invite', requireAuth, requireRole(['student']), async (req, res) => {
    const { receiverId } = req.body;
    const team = await Team.findOne({ id: req.params.id });
    if (!team || team.leaderId !== req.user.id) {
        return res.status(403).json({ message: "Only team leaders can send invites." });
    }
    const invite = new TeamInvitation({
        id: `inv-${Date.now()}`,
        teamId: team.id,
        senderId: req.user.id,
        receiverId
    });
    await invite.save();
    res.json(invite);
});
app.post('/api/teams/accept-invite/:inviteId', requireAuth, requireRole(['student']), async (req, res) => {
    const invite = await TeamInvitation.findOne({ id: req.params.inviteId, receiverId: req.user.id, status: 'pending' });
    if (!invite) return res.status(404).json({ message: "Invite not found or expired." });

    const team = await Team.findOneAndUpdate({ id: invite.teamId }, { $push: { memberIds: req.user.id } }, { new: true });
    await User.findOneAndUpdate({ id: req.user.id }, { teamId: invite.teamId });
    invite.status = 'accepted';
    await invite.save();
    res.json(team);
});
app.get('/api/teams/invitations/me', requireAuth, requireRole(['student']), async (req, res) => {
    const invites = await TeamInvitation.find({ receiverId: req.user.id, status: 'pending' });
    res.json(invites);
});
// SUBMISSIONS & WORKSPACE
app.post('/api/teams/:id/problem', requireAuth, requireRole(['student']), async (req, res) => {
    const { problemId } = req.body;
    const team = await Team.findOneAndUpdate({ id: req.params.id, leaderId: req.user.id }, { problemStatementId: problemId }, { new: true });
    if (!team) return res.status(403).json({ message: "Only team leaders can select a problem statement." });
    res.json(team);
});

app.post('/api/submissions', requireAuth, requireRole(['student']), async (req, res) => {
    const { teamId, repositoryUrl, demoUrl, description, projectTitle } = req.body;
    const team = await Team.findOne({ id: teamId, memberIds: req.user.id });
    if (!team) return res.status(403).json({ message: "Not a core member of this team." });

    // Epic D: Final Submission Lock
    if (team.isSubmitted || team.status === 'submitted') {
        return res.status(403).json({ message: "Project stream is LOCKED. Final submission has already been recorded for evaluation." });
    }

    // Create Submission Schema Record
    const submission = new Submission({
        id: `sub-${Date.now()}`,
        teamId,
        submittedBy: req.user.id,
        projectTitle,
        description,
        githubUrl: repositoryUrl,
        liveDemoUrl: demoUrl,
        status: 'submitted'
    });
    await submission.save();

    // Revert backwards compat on Team just to be safe
    team.isSubmitted = true;
    team.repositoryUrl = repositoryUrl;
    team.demoUrl = demoUrl;
    await team.save();

    res.json(submission);
});

// EVALUATIONS (JUDGE/ADMIN)
app.get('/api/evaluations', requireAuth, requireRole(['judge', 'admin']), async (req, res) => {
    // Return all for admin, otherwise filter to judge
    const query = req.user.role === 'admin' ? {} : { judgeId: req.user.id };
    const items = await Evaluation.find(query);
    res.json(items);
});
app.post('/api/evaluations', requireAuth, requireRole(['judge', 'admin']), async (req, res) => {
    const { hackathonId, projectId, assignmentId, scores, totalScore, comments, strengths, improvements } = req.body;
    const evalData = new Evaluation({
        id: `evl-${Date.now()}`,
        hackathonId,
        projectId,
        judgeId: req.user.id,
        assignmentId,
        scores,
        totalScore,
        comments,
        strengths,
        improvements
    });
    await evalData.save();
    res.json(evalData);
});

// CERTIFICATES 
app.post('/api/certificates/generate', requireAuth, async (req, res) => {
    // Allow users to request their own certificate if team is submitted
    if (!req.user.teamId) return res.status(403).json({ message: "No team assigned." });

    const team = await Team.findOne({ id: req.user.teamId });
    if (!team || !team.isSubmitted) return res.status(403).json({ message: "Certificate generation locked pending project submission." });

    // Check if one already exists
    let cert = await Certificate.findOne({ userId: req.user.id, teamId: team.id });
    if (!cert) {
        const certId = `CS-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        cert = new Certificate({
            id: certId,
            userId: req.user.id,
            userName: req.user.name,
            teamId: team.id,
            hackathonId: team.hackathonId || 'hack-1',
            type: 'participation'
        });
        await cert.save();
    }
    res.json(cert);
});

app.get('/api/certificates/verify/:id', async (req, res) => {
    const cert = await Certificate.findOne({ id: req.params.id });
    if (!cert) return res.status(404).json({ message: "Invalid cryptographic certificate payload." });
    res.json(cert);
});
app.post('/api/evaluations', requireAuth, requireRole(['judge', 'admin']), async (req, res) => {
    const { hackathonId, projectId, assignmentId, scores, totalScore, comments, strengths, improvements } = req.body;

    // Ensure Judge is grading a correctly assigned project.
    // In reality, this requires looking up Assignment documents too. For now we save securely.
    const evaluation = new Evaluation({
        id: `eval-${Date.now()}`,
        hackathonId,
        projectId,
        judgeId: req.user.id,
        assignmentId,
        scores,
        totalScore,
        comments,
        strengths,
        improvements,
        status: 'submitted'
    });
    await evaluation.save();
    res.json(evaluation);
});

// RECRUITMENT
app.get('/api/recruitment', requireAuth, async (req, res) => {
    // Only return visible profiles
    const profiles = await RecruitmentProfile.find({ isVisible: true });
    res.json(profiles);
});
app.post('/api/recruitment', requireAuth, requireRole(['student']), async (req, res) => {
    const profile = await RecruitmentProfile.findOneAndUpdate(
        { userId: req.user.id },
        { ...req.body, userId: req.user.id },
        { upsert: true, new: true }
    );
    res.json(profile);
});

// PROBLEMS
app.get('/api/problems', requireAuth, async (req, res) => {
    const problems = await ProblemStatement.find();
    res.json(problems);
});
app.post('/api/problems', requireAuth, requireRole(['admin']), async (req, res) => {
    const problem = new ProblemStatement(req.body);
    await problem.save();
    res.json(problem);
});

// USERS
app.get('/api/users', requireAuth, requireRole(['admin']), async (req, res) => {
    const users = await User.find();
    res.json(users);
});
app.patch('/api/users/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(user);
});

// ANNOUNCEMENTS
app.get('/api/announcements', async (req, res) => {
    const items = await Announcement.find();
    res.json(items);
});
app.post('/api/announcements', requireAuth, requireRole(['admin']), async (req, res) => {
    const item = new Announcement(req.body);
    await item.save();
    res.json(item);
});

// TIMELINE (EVENTS)
app.get('/api/timeline', async (req, res) => {
    const items = await CalendarEvent.find();
    res.json(items);
});
app.post('/api/timeline', requireAuth, requireRole(['admin']), async (req, res) => {
    const item = new CalendarEvent(req.body);
    await item.save();
    res.json(item);
});

// SPONSORS
app.get('/api/sponsors', async (req, res) => {
    const items = await Sponsor.find({ isPublished: true }).sort('order');
    res.json(items);
});
app.post('/api/sponsors', requireAuth, requireRole(['admin']), async (req, res) => {
    const item = new Sponsor(req.body);
    await item.save();
    res.json(item);
});

// GALLERY
app.get('/api/gallery', async (req, res) => {
    const items = await Gallery.find();
    res.json(items);
});
app.post('/api/gallery', requireAuth, requireRole(['admin']), async (req, res) => {
    const item = new Gallery(req.body);
    await item.save();
    res.json(item);
});

// FAQs
app.get('/api/faqs', async (req, res) => {
    const items = await FAQ.find({ isPublished: true }).sort('order');
    res.json(items);
});
app.post('/api/faqs', requireAuth, requireRole(['admin']), async (req, res) => {
    const item = new FAQ(req.body);
    await item.save();
    res.json(item);
});

// PUBLIC LANDING PAGE STATS
app.get('/api/search', async (req, res) => {
    const q = (req.query.q || '').toString().toLowerCase();
    if (!q) return res.json({ teams: [], users: [], problems: [] });
    try {
        const teamRes = await Team.find({ name: { $regex: q, $options: 'i' } }).limit(10);
        const userRes = await User.find({ name: { $regex: q, $options: 'i' } }).select('-password').limit(10);
        const probRes = await ProblemStatement.find({ title: { $regex: q, $options: 'i' } }).limit(10);
        res.json({ teams: teamRes, users: userRes, problems: probRes });
    } catch (err) {
        res.status(500).json({ message: "Search index failure." });
    }
});

app.get('/api/public/stats', async (req, res) => {
    const hackersCount = await User.countDocuments({ role: 'student' });
    const projectsCount = await Project.countDocuments();
    const registrationsCount = await Registration.countDocuments();
    // Default colleges to 1 for MVP (this would normally be an aggregation on unique college names)
    const collegesCount = (await User.distinct('college')).length || 1;

    // Check if there is an active hackathon for the countdown
    const activeHackathon = await Hackathon.findOne({ status: { $in: ['active', 'registration_open'] } });

    res.json({
        hackersCount: hackersCount || 0,
        projectsCount: projectsCount || 0,
        registrationsCount: registrationsCount || 0,
        collegesCount: collegesCount,
        activeHackathon: activeHackathon || null
    });
});

// ANNOUNCEMENTS
app.get('/api/announcements', async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.json(announcements);
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch announcements." });
    }
});

app.post('/api/announcements', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { title, content, type, targetAudience } = req.body;
        const newAnn = new Announcement({
            id: `ann-${Date.now()}`,
            title,
            content,
            type: type || 'announcement',
            targetAudience: targetAudience || 'everyone',
            publishedBy: req.user.id,
            isPinned: false
        });
        await newAnn.save();
        res.json(newAnn);
    } catch (e) {
        res.status(500).json({ message: "Failed to broadcast announcement." });
    }
});

// ADMIN USERS CRUD
app.post('/api/admin/users', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { id, name, email, role, password, teamId } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: "Email already registered." });

        const passwordHash = await bcrypt.hash(password || "Hackathon2026!", 10);
        const newUser = new User({
            id: id || `u-${Date.now()}`,
            name, email, role, passwordHash, teamId,
            accountStatus: 'active',
            emailVerified: true
        });
        await newUser.save();
        res.json(newUser);
    } catch (e) {
        res.status(500).json({ message: "Failed to force add user." });
    }
});

app.put('/api/admin/users/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { name, role, status, teamId } = req.body;
        // Map status cleanly to real mongo enums if necessary, or just save generic strings
        const updated = await User.findOneAndUpdate(
            { id: req.params.id },
            { name, role, accountStatus: status === 'Active' ? 'active' : 'suspended', teamId },
            { new: true }
        );
        res.json(updated);
    } catch (e) {
        res.status(500).json({ message: "Failed to modify user profile." });
    }
});

// TELEMETRY & LOGS
app.get('/api/admin/logs', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(150);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch telemetry streams." });
    }
});

app.get('/api/admin/settings', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const settings = await SystemSetting.find();
        res.json(settings);
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch system configurations." });
    }
});

app.post('/api/admin/settings', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { key, value, description } = req.body;
        const result = await SystemSetting.findOneAndUpdate(
            { key },
            { value, description, updatedBy: req.user.id },
            { new: true, upsert: true }
        );
        res.json(result);
    } catch (e) {
        res.status(500).json({ message: "Failed to update configuration parameter." });
    }
});

// SRIJANBOT AI CHAT ENGINE (Rule-based NLP Simulator)
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        // context payload expects: { path, role, email, name, teamId, userId }
        const input = String(message).toLowerCase();
        let reply = "I couldn't find an official answer to this question. [Create Support Ticket]";

        if (input.includes('deadline') || input.includes('when is submission')) {
            reply = "Your project must be submitted by **18 September 2026 at 11:59 PM**. After the deadline, submissions are locked. [Open Submission]";
        }
        else if (input.includes('team') && input.includes('my')) {
            if (context.teamId) {
                const team = await Team.findOne({ id: context.teamId });
                reply = team ? `You're currently a member of **${team.name}**. [Open My Team]` : "You do not appear to be in a team yet. [Find a Squad]";
            } else {
                reply = "You are not currently in a squad. [Find a Squad]";
            }
        }
        else if (input.includes('create a team') || input.includes('new squad')) {
            reply = "You can create a team from the Recruitment matrix or your Profile. [Create Team]";
        }
        else if (input.includes('certificate')) {
            reply = "Your participation certificate is not ready yet. They will be generated at the end of the hackathon.";
        }
        else if (input.includes('missing') || input.includes('what do i need')) {
            reply = "Your submission currently requires:\n- Project description\n- GitHub repository URL\n- Interactive Demo link\n[Complete Submission]";
        }
        else if (context.role === 'admin' && (input.includes('how many') || input.includes('stats'))) {
            const teamCount = await Team.countDocuments();
            const userCount = await User.countDocuments();
            reply = `Currently, we have ${userCount} registered operatives and ${teamCount} active squads. [Admin Dashboard]`;
        }
        else if (context.role === 'judge' && (input.includes('project') || input.includes('evaluate'))) {
            reply = "Welcome Judge. You can evaluate assigned projects via the Evaluations dashboard matrix. [Open Evaluations]";
        }
        else if (input.includes('problem') && context.path === '/problems') {
            reply = "These are the active challenge statements. Read the requirements carefully and hit 'Select' when your squad is ready! [View Schedule]";
        }
        else if (input.includes('hello') || input.includes('hi')) {
            reply = `SYSTEM WAKE. Greetings, ${context.name || 'Operative'}. I am SrijanBot. How can I assist your navigation today?`;
        }

        res.json({ reply });
    } catch (e) {
        console.error(e);
        res.status(500).json({ reply: "SYSTEM FAULT. Processing node offline." });
    }
});

// START
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => console.log(`Server & WebSockets running on port ${PORT}`));
