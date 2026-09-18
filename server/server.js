import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    dbName: 'codesrijan'
}).then(() => console.log('MongoDB Connected to keyspace codesrijan')).catch(err => console.error(err));

// --- Schemas (Imported from modular directory) ---
import { User, Team, ProblemStatement, Hackathon, Registration } from './models/index.js';
import { Announcement, CalendarEvent } from './models/secondary.js';
import './models/tertiary.js';
import { Session, EmailVerification } from './models/auth.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import crypto from 'crypto';

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

        // Mock email send
        console.log(`[SECURE COMMS] Verification Code for ${normalizedEmail}: ${code}`);

        res.json({ message: "Account created. Verification required.", userId: user.id });
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

        // Admin override block
        if (normalizedEmail === "admin" || normalizedEmail.includes("admin@codesrijan")) {
            return res.json({ token: "admin_token", user: { id: "admin-001", name: "System Administrator", email: "admin@codesrijan.com", role: "admin" } });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(401).json({ message: "Invalid matrix passkey or identity." });

        if (user.accountStatus === 'pending_verification') {
            return res.status(401).json({ message: "Please verify your email before logging in.", needsVerification: true, userId: user.id });
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
app.post('/api/teams', requireAuth, async (req, res) => {
    const team = new Team(req.body);
    await team.save();
    // Also update leader's teamId
    await User.findOneAndUpdate({ id: req.body.leaderId }, { teamId: team.id });
    res.json(team);
});
app.post('/api/teams/join', requireAuth, async (req, res) => {
    const { teamId, userId } = req.body;
    const team = await Team.findOneAndUpdate({ id: teamId }, { $push: { members: userId } }, { new: true });
    await User.findOneAndUpdate({ id: userId }, { teamId: teamId });
    res.json(team);
});
app.post('/api/teams/submit', requireAuth, async (req, res) => {
    const { teamId, repositoryUrl, demoUrl } = req.body;
    const team = await Team.findOneAndUpdate({ id: teamId }, { isSubmitted: true, repositoryUrl, demoUrl }, { new: true });
    res.json(team);
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
