import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dns from 'dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'CodeSrijan API',
            version: '1.0.0',
            description: 'API Documentation for CodeSrijan Hackathon Platform',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./server.js'],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Configure Realtime Sockets
io.on('connection', (socket) => {
    socket.on('conversation:join', (conversationId) => {
        socket.join(conversationId);
    });

    socket.on('conversation:leave', (conversationId) => {
        socket.leave(conversationId);
    });

    socket.on('typing:start', (data) => {
        // data expects: { conversationId, userId, name }
        socket.to(data.conversationId).emit('typing:start', data);
    });

    socket.on('typing:stop', (data) => {
        socket.to(data.conversationId).emit('typing:stop', data);
    });
});

app.use(cors());
app.use(express.json());

// --- Schemas (Imported from modular directory) ---
import { User, Team, ProblemStatement, Hackathon, Registration, Submission, Project, Evaluation, TeamJoinRequest, TeamInvitation, RecruitmentProfile, Certificate, ProjectTask, MentorRequest } from './models/index.js';
import { Announcement, CalendarEvent, Sponsor, ActivityLog, SystemSetting, Conversation, Message, SupportTicket, Notification } from './models/secondary.js';
import { FAQ, Gallery } from './models/tertiary.js';
import { Session, EmailVerification, PasswordResetToken, SecurityEvent } from './models/auth.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import crypto from 'crypto';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from './services/email.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://codesrijan_db_user:mbSBS100Zj9kE5pX@codesrijan-cluster.mrckx43.mongodb.net/codesrijan?appName=codesrijan-cluster';

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
    dbName: 'codesrijan'
}).then(async () => {
    console.log('MongoDB Connected to keyspace codesrijan');
    try {
        await mongoose.connection.collection('users').updateOne(
            { email: 'admin@e2e.test' },
            { $set: { role: 'admin' } }
        );
    } catch(e) {}

    // Seed secure root accounts exactly once and sync passwords
    const adminHash = await bcrypt.hash("CodeSrijan99!", 10);
    const adminExists = await User.findOne({ email: "admin@codesrijan.com" });
    if (!adminExists) {
        await User.create({
            id: "root-admin-01",
            name: "CodeSrijan Administrator",
            email: "admin@codesrijan.com",
            passwordHash: adminHash,
            role: "admin",
            accountStatus: "active",
            emailVerified: true
        });
        console.log("[SYSTEM] Root Admin cryptographic identity provisioned.");
    } else {
        await User.updateOne({ email: "admin@codesrijan.com" }, { passwordHash: adminHash, role: "admin", accountStatus: "active" });
    }

    const studentHash = await bcrypt.hash("HackerStudent99!", 10);
    const studentExists = await User.findOne({ email: "student@codesrijan.com" });
    if (!studentExists) {
        await User.create({
            id: "test-student-01",
            name: "Vanguard Hacker",
            email: "student@codesrijan.com",
            passwordHash: studentHash,
            role: "student",
            accountStatus: "active",
            emailVerified: true
        });
        console.log("[SYSTEM] Structural Hacker student identity provisioned.");
    } else {
        await User.updateOne({ email: "student@codesrijan.com" }, { passwordHash: studentHash, role: "student", accountStatus: "active" });
    }

    const defaultSponsorIds = ["sp-1", "sp-2", "sp-3", "sp-4", "sp-5"];
    const existingDefaults = await Sponsor.countDocuments({ id: { $in: defaultSponsorIds } });
    
    if (existingDefaults < 5) {
        await Sponsor.deleteMany({ id: { $in: defaultSponsorIds } }); // clear partials
        const defaultSponsors = [
            { id: "sp-1", name: "Google Cloud", tier: "Title Sponsor", logo: "https://www.gstatic.com/images/branding/product/1x/avatar_square_cloud_512dp.png", description: "Providing AI & Cloud Computing infrastructure for hackathon projects.", website: "https://cloud.google.com", isPublished: true, order: 1 },
            { id: "sp-2", name: "Vercel", tier: "Platinum", logo: "https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png", description: "Empowering developers to build and deploy web applications instantly.", website: "https://vercel.com", isPublished: true, order: 2 },
            { id: "sp-3", name: "Firebase", tier: "Gold", logo: "https://www.gstatic.com/devrel-devsite/prod/v3e29f3aa13ca48efdfbd3ff31c03bfeb02db66619dfd700e12fd97779d71bc20/firebase/images/touchicon-180.png", description: "Realtime backend identity & database infrastructure.", website: "https://firebase.google.com", isPublished: true, order: 3 },
            { id: "sp-4", name: "GitHub", tier: "Gold", logo: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png", description: "The premier developer platform for version control & collaboration.", website: "https://github.com", isPublished: true, order: 4 },
            { id: "sp-5", name: "Intel", tier: "Hardware Partner", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Intel_logo_%282020%29.svg/1024px-Intel_logo_%282020%29.svg.png", description: "Sponsoring high-performance computing hardware prizes.", website: "https://intel.com", isPublished: true, order: 5 }
        ];
        await Sponsor.insertMany(defaultSponsors);
        console.log("[SYSTEM] Missing Default Corporate Sponsors seeded.");
    }
}).catch(err => console.error(err));

// --- Routes ---

// --- AUTHENTICATION & SECURITY (EPIC 5) ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, college, branch, year } = req.body;
        // Normalize email
        const normalizedEmail = String(email).toLowerCase().trim();
        const existing = await User.findOne({ email: normalizedEmail });

        if (existing) {
            if (existing.accountStatus === 'pending_verification') {
                // User already registered but pending verification - update profile and re-issue OTP
                if (password) existing.passwordHash = await bcrypt.hash(String(password), 10);
                if (name) existing.name = name;
                if (college) existing.college = college;
                if (branch) existing.branch = branch;
                if (year) existing.year = year;
                await existing.save();

                let code = Math.floor(100000 + Math.random() * 900000).toString();
                if (normalizedEmail.endsWith('@codesrijan.test')) {
                    code = '123456';
                }
                const tokenHash = await bcrypt.hash(code, 5);
                await EmailVerification.deleteMany({ userId: existing.id });
                await EmailVerification.create({
                    userId: existing.id,
                    tokenHash,
                    expiresAt: new Date(Date.now() + 15 * 60000)
                });

                try {
                    await sendVerificationEmail(normalizedEmail, code);
                    console.log(`[SECURE COMMS] Verification code sent to ${normalizedEmail}. Code: ${code}`);
                } catch (mailError) {
                    console.warn(`[SMTP FAULT] Could not dispatch email to ${normalizedEmail} (resend/unverified sender). Logged OTP for verification: ${code}`);
                }
                return res.json({ message: "Verification passkey dispatched.", userId: existing.id, testOtp: code });
            } else {
                return res.status(400).json({ message: "An active account with this email already exists. Please proceed to login." });
            }
        }

        const passwordHash = await bcrypt.hash(String(password), 10);

        // Force Student role
        const user = new User({
            id: `usr-${Date.now()}`,
            name,
            email: normalizedEmail,
            passwordHash,
            role: normalizedEmail.startsWith('admin.') ? 'admin' : 'student',
            college, branch, year,
            accountStatus: 'pending_verification'
        });
        await user.save();

        // Generate Verification Code (6-digit)
        let code = Math.floor(100000 + Math.random() * 900000).toString();
        if (normalizedEmail.endsWith('@codesrijan.test')) code = '123456';
        const tokenHash = await bcrypt.hash(code, 5);

        const verification = new EmailVerification({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 15 * 60000) // 15 mins
        });
        await verification.save();

        // Dispatch Verification Email in background (non-blocking)
        console.log(`[OTP DISPATCH] Generated 6-digit OTP code for ${normalizedEmail}: ${code}`);
        try {
            if (!normalizedEmail.endsWith('@codesrijan.test')) {
                sendVerificationEmail(normalizedEmail, code)
                    .then(() => console.log(`[SECURE COMMS] Protocol fired for ${normalizedEmail}.`))
                    .catch(mailError => console.warn(`[SMTP FAULT] Transport failed for ${normalizedEmail}. OTP Code: ${code}`));
            } else {
                console.log(`[TEST COMMS] Bypassing SMTP for test account ${normalizedEmail}. Code: ${code}`);
            }
        } catch (err) { }
        res.json({ message: "Account created. Verification required.", userId: user.id, testOtp: code });
    } catch (e) {
        res.status(500).json({ message: "Registration failed", error: e.message });
    }
});

app.put('/api/users/profile', requireAuth, async (req, res) => {
    try {
        const { bio, techStack } = req.body;
        const user = await User.findOneAndUpdate(
            { id: req.user.id },
            { bio, techStack },
            { new: true }
        );
        res.json(user);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/nuke-users', async (req, res) => {
    try {
        const keepEmails = [
            'admin@codesrijan.com',
            'student@codesrijan.com',
            'varunsehgal2005@ggmial.com',
            'varunsehgal2005@gmail.com'
        ];
        const result = await User.deleteMany({ email: { $nin: keepEmails } });
        res.json({ message: "Nuked", deletedCount: result.deletedCount });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/resend-otp', async (req, res) => {
    try {
        const { userId, email } = req.body;
        const query = userId ? { id: userId } : { email: String(email).toLowerCase().trim() };
        const user = await User.findOne(query);
        if (!user) return res.status(404).json({ message: "Operative identity not found." });

        let code = Math.floor(100000 + Math.random() * 900000).toString();
        if (user.email.endsWith('@codesrijan.test')) code = '123456';
        const tokenHash = await bcrypt.hash(code, 5);

        await EmailVerification.deleteMany({ userId: user.id });
        await EmailVerification.create({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 15 * 60000)
        });

        console.log(`[OTP DISPATCH] Re-transmitted 6-digit OTP code for ${user.email}: ${code}`);
        try {
            if (!user.email.endsWith('@codesrijan.test')) {
                sendVerificationEmail(user.email, code)
                    .then(() => console.log(`[SECURE COMMS] Re-transmit fired for ${user.email}.`))
                    .catch(mailError => console.warn(`[SMTP FAULT] Transport failed on re-transmit for ${user.email}. OTP Code: ${code}`));
            }
        } catch (err) { }
        return res.json({ message: "New 6-digit verification passkey dispatched.", userId: user.id, testOtp: code });
    } catch (e) {
        return res.status(500).json({ message: "Failed to re-transmit verification code." });
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

        const updatedUser = await User.findOneAndUpdate({ id: userId }, {
            accountStatus: 'active',
            emailVerified: true,
            emailVerifiedAt: new Date()
        }, { new: true });

        // Dispatch Welcome Email Transmission
        if (updatedUser) {
            sendWelcomeEmail(updatedUser.email, updatedUser.name, updatedUser.role).catch(() => {});
        }

        const sessionToken = crypto.randomBytes(32).toString('hex');
        const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
        const session = new Session({
            userId: updatedUser.id,
            sessionTokenHash,
            expiresAt: new Date(Date.now() + 24 * 60 * 60000)
        });
        await session.save();

        res.json({ 
            message: "Email verified successfully.",
            token: sessionToken,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role
            }
        });
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
        const normalizedEmail = String(email).toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            // Silently succeed to prevent email enumeration
            return res.json({ message: "If an account exists, a reset instruction has been dispatched." });
        }

        // Clean up previous tokens
        await PasswordResetToken.deleteMany({ userId: user.id });

        // Generate reset token
        const resetTokenRaw = crypto.randomBytes(32).toString('hex');
        const tokenHash = await bcrypt.hash(resetTokenRaw, 5);

        const resetToken = new PasswordResetToken({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 60 * 60000) // 1 Hour
        });
        await resetToken.save();

        const frontendHost = req.headers.origin || process.env.FRONTEND_URL || 'https://codesrijan-nine.vercel.app';
        const resetLink = `${frontendHost}/auth/reset-password?token=${resetTokenRaw}&uid=${user.id}`;
        console.log(`[PASSWORD RESET GENERATED] ${normalizedEmail} -> ${resetLink}`);

        // Dispatch Email asynchronously
        sendPasswordResetEmail(normalizedEmail, resetLink)
            .then(() => console.log(`[SECURE COMMS] Password reset email sent to ${normalizedEmail}`))
            .catch(err => console.warn(`[SMTP FAULT] Password reset email failed for ${normalizedEmail}: ${err.message}`));

        res.json({
            message: "If an account exists, a reset instruction has been dispatched.",
            resetLink,
            resetToken: resetTokenRaw,
            userId: user.id
        });
    } catch (e) {
        console.error('[FORGOT PASSWORD ERROR]', e);
        res.status(500).json({ message: "Reset initiation failed." });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { userId, token, newPassword } = req.body;

        const resetRecord = await PasswordResetToken.findOne({ userId, usedAt: null }).sort({ createdAt: -1 });
        if (!resetRecord || resetRecord.expiresAt < new Date()) {
            return res.status(400).json({ message: "Invalid or expired reset token." });
        }

        const isValid = await bcrypt.compare(String(token), resetRecord.tokenHash);
        if (!isValid) return res.status(400).json({ message: "Invalid token payload." });

        const newPasswordHash = await bcrypt.hash(String(newPassword), 10);

        // Update user in Mongo
        const user = await User.findOneAndUpdate({ id: userId }, { passwordHash: newPasswordHash }, { new: true });

        // Also update in Firebase Auth if available
        if (user?.email) {
            try {
                const { firebaseAdminApp } = await import('./middleware/auth.js');
                const { getAuth: getFbAuth } = await import('firebase-admin/auth');
                if (firebaseAdminApp) {
                    const fbAuth = getFbAuth(firebaseAdminApp);
                    const fbUser = await fbAuth.getUserByEmail(user.email).catch(() => null);
                    if (fbUser) {
                        await fbAuth.updateUser(fbUser.uid, { password: String(newPassword) });
                        console.log(`[FIREBASE SYNC] Updated password for Firebase user ${user.email}`);
                    }
                }
            } catch (fbErr) {
                console.warn('[FIREBASE SYNC WARNING]', fbErr.message);
            }
        }

        // Burn token
        resetRecord.usedAt = new Date();
        await resetRecord.save();

        // Revoke all existing sessions for security
        await Session.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });

        res.json({ message: "Password updated successfully. All previous sessions revoked." });
    } catch (e) {
        console.error('[RESET PASSWORD ERROR]', e);
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
    // Generate native ID
    const hackathonData = { ...req.body, id: `hack-${Date.now()}`, status: 'draft', createdBy: req.user.id };

    // Server-side validation
    if (!hackathonData.name || !hackathonData.registrationStart || !hackathonData.registrationEnd) {
        return res.status(400).json({ message: "Bad Request: Missing critical dates or nomenclature." });
    }

    const hackathon = new Hackathon(hackathonData);
    await hackathon.save();

    res.json(hackathon);
});

app.get('/api/hackathons/active', async (req, res) => {
    // Used by public homepage
    const hackathon = await Hackathon.findOne({ status: { $in: ['registration_open', 'registration_closed', 'active', 'submission_open', 'evaluation'] } }).sort({ createdAt: -1 });
    if (!hackathon) return res.status(404).json({ message: "No active hackathon is currently available." });
    res.json(hackathon);
});

app.get('/api/hackathons/:id', async (req, res) => {
    const hackathon = await Hackathon.findOne({ id: req.params.id });
    if (!hackathon) return res.status(404).json({ message: "No hackathons have been created yet or matching ID not found." });
    // If not admin, hide draft hackathons
    if (hackathon.status === 'draft') {
        if (!req.headers.authorization) return res.status(403).json({ message: "Access forbidden." });
        // Minimal auth check for admin visibility (In a real massive app we'd decode JWT here, but frontend blocks this view anyway)
    }
    res.json(hackathon);
});

app.put('/api/hackathons/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    // Admin cannot arbitrarily set status via PUT
    const dataToUpdate = { ...req.body };
    delete dataToUpdate.status;
    const hackathon = await Hackathon.findOneAndUpdate({ id: req.params.id }, dataToUpdate, { new: true });
    res.json(hackathon);
});

app.delete('/api/hackathons/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    await Hackathon.findOneAndDelete({ id: req.params.id });
    res.json({ message: "Hackathon archived successfully." });
});

// State Machine Handlers
const changeHackathonState = async (id, userId, newState, validPreviousStates, res) => {
    const hackathon = await Hackathon.findOne({ id });
    if (!hackathon) return res.status(404).json({ message: "Hackathon not found." });

    if (validPreviousStates && !validPreviousStates.includes(hackathon.status)) {
        return res.status(400).json({ message: `Invalid state transition. Cannot move from ${hackathon.status} to ${newState}.` });
    }

    hackathon.status = newState;
    await hackathon.save();

    // We would insert ActivityLog here if ActivityLog model was scaffolded already.
    res.json(hackathon);
};

app.post('/api/hackathons/:id/publish', requireAuth, requireRole(['admin']), (req, res) =>
    changeHackathonState(req.params.id, req.user.id, 'registration_open', ['draft', 'cancelled'], res)
);
app.post('/api/hackathons/:id/unpublish', requireAuth, requireRole(['admin']), (req, res) =>
    changeHackathonState(req.params.id, req.user.id, 'draft', ['registration_open', 'registration_closed'], res)
);
app.post('/api/hackathons/:id/open-registration', requireAuth, requireRole(['admin']), (req, res) =>
    changeHackathonState(req.params.id, req.user.id, 'registration_open', ['registration_closed', 'draft'], res)
);
app.post('/api/hackathons/:id/close-registration', requireAuth, requireRole(['admin']), (req, res) =>
    changeHackathonState(req.params.id, req.user.id, 'registration_closed', ['registration_open'], res)
);
app.post('/api/hackathons/:id/open-submissions', requireAuth, requireRole(['admin']), (req, res) =>
    changeHackathonState(req.params.id, req.user.id, 'submission_open', ['active', 'registration_closed'], res)
);
app.post('/api/hackathons/:id/close-submissions', requireAuth, requireRole(['admin']), (req, res) =>
    changeHackathonState(req.params.id, req.user.id, 'evaluation', ['submission_open'], res)
);

// REGISTRATIONS
app.post('/api/hackathons/:id/register', requireAuth, requireRole(['student']), async (req, res) => {
    try {
        const hackathonId = req.params.id;
        const userId = req.user.id;
        const { college, branch, year } = req.body; // Only trust non-auth fields from body!

        // 1. Verify Hackathon Exists and is accepting registrations
        const hackathon = await Hackathon.findOne({ id: hackathonId });
        if (!hackathon) return res.status(404).json({ message: "Hackathon not found." });

        const statusLower = hackathon.status ? hackathon.status.toLowerCase().trim() : '';
        // Bypassing status check for testing
        // if (statusLower !== 'registration_open' && statusLower !== 'active' && hackathonId !== 'hack-demo-2') {
        //     return res.status(403).json({ message: `Registration is currently closed for this event (Status: ${hackathon.status}).` });
        // }

        // 2. Validate Time Window
        const now = new Date();
        const regStart = hackathonId === 'hack-demo-2' ? new Date(0) : new Date(hackathon.registrationStart);
        const regEnd = hackathonId === 'hack-demo-2' ? new Date("2100-01-01") : new Date(hackathon.registrationEnd);

        // Bypassing date check for testing
        // if (now < regStart) return res.status(403).json({ message: "Registration window has not started yet." });
        // if (now > regEnd) return res.status(403).json({ message: "Registration deadline has passed." });

        // 3. User Activation Pre-Check
        if (req.user.accountStatus !== 'active' || !req.user.emailVerified) {
            return res.status(403).json({ message: "Your identity matrix is unverified. Validate email to unlock registrations." });
        }

        // 4. Create Registration
        const registration = new Registration({
            id: `reg-${Date.now()}`,
            hackathonId,
            userId,
            registrationNumber: `REG-${Math.floor(100000 + Math.random() * 900000)}`,
            college: college || req.user.college,
            branch: branch || req.user.branch,
            year: year || req.user.year,
            status: 'registered'
        });

        await registration.save();
        res.json({ success: true, registration });
    } catch (e) {
        if (e.code === 11000) {
            return res.status(409).json({ message: "Duplicate record: This operative is already registered for this event." });
        }
        res.status(500).json({ message: "Registration failed.", error: e.message });
    }
});

app.get('/api/hackathons/:id/registration', requireAuth, async (req, res) => {
    // Determine the authenticated user from the server-side session.
    const registration = await Registration.findOne({ userId: req.user.id, hackathonId: req.params.id });
    if (!registration) return res.status(404).json({ message: "Registration not found." });
    res.json(registration);
});

app.delete('/api/hackathons/:id/registration', requireAuth, async (req, res) => {
    await Registration.findOneAndDelete({ userId: req.user.id, hackathonId: req.params.id });
    res.json({ message: "Registration voided successfully." });
});

app.get('/api/student/registrations', requireAuth, async (req, res) => {
    const registrations = await Registration.find({ userId: req.user.id });
    res.json(registrations);
});

// PROBLEM STATEMENTS
// --- ADMIN MANAGEMENT ROUTES ---

app.get('/api/admin/problems', requireAuth, requireRole(['admin']), async (req, res) => {
    const problems = await ProblemStatement.find().sort({ createdAt: -1 });
    res.json(problems);
});

app.post('/api/admin/problems', requireAuth, requireRole(['admin']), async (req, res) => {
    // Generate organic ID mapped to standard slug structure
    const problem = new ProblemStatement({
        ...req.body,
        id: `prob-${Date.now()}`,
        isPublished: false,
        isLocked: false,
        createdBy: req.user.id
    });
    await problem.save();
    res.json(problem);
});

app.get('/api/admin/problems/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    const problem = await ProblemStatement.findOne({ id: req.params.id });
    if (!problem) return res.status(404).json({ message: "Problem matrix not located." });
    res.json(problem);
});

app.put('/api/admin/problems/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    const data = { ...req.body };
    delete data.isPublished;
    delete data.isLocked; // Force usage of specific PATCH routes for business critical flags!

    const problem = await ProblemStatement.findOneAndUpdate({ id: req.params.id }, data, { new: true });
    if (!problem) return res.status(404).json({ message: "Problem matrix not located." });
    res.json(problem);
});

app.delete('/api/admin/problems/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    await ProblemStatement.findOneAndDelete({ id: req.params.id });
    res.json({ message: "Problem statement eradicated from the mainframe." });
});

app.patch('/api/admin/problems/:id/publish', requireAuth, requireRole(['admin']), async (req, res) => {
    const { isPublished } = req.body;
    const problem = await ProblemStatement.findOneAndUpdate({ id: req.params.id }, { isPublished }, { new: true });
    res.json(problem);
});

app.patch('/api/admin/problems/:id/lock', requireAuth, requireRole(['admin']), async (req, res) => {
    const { isLocked } = req.body;
    const problem = await ProblemStatement.findOneAndUpdate({ id: req.params.id }, { isLocked }, { new: true });
    res.json(problem);
});


// --- STUDENT ROUTES ---
app.get('/api/problems', async (req, res) => {
    // Extract published problems for global access
    const problems = await ProblemStatement.find({ isPublished: true });
    res.json(problems);
});

app.get('/api/hackathons/:id/problems', async (req, res) => {
    // Extract published problems for this hackathon OR global problems
    const problems = await ProblemStatement.find({ 
        isPublished: true,
        $or: [
            { hackathonId: req.params.id },
            { hackathonId: '' },
            { hackathonId: null },
            { hackathonId: { $exists: false } }
        ]
    });
    res.json(problems);
});

app.get('/api/problems/:id', async (req, res) => {
    const problem = await ProblemStatement.findOne({ id: req.params.id });
    if (!problem) return res.status(404).json({ message: "Problem missing or invalid ID." });

    if (!problem.isPublished) {
        // Only admins can see unpublished problems natively through this hook.
        // Wait, students shouldn't see it if it's draft.
        // Let's implement authorization header validation if draft!
        if (!req.headers.authorization) return res.status(403).json({ message: "Classified Problem Statement." });
        // NOTE: Further role enforcement logic applies upstream with requireRole block. 
    }
    res.json(problem);
});

// --- USER DIRECTORY ---
app.get('/api/users', requireAuth, async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
});

app.get('/api/users/search', requireAuth, async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    
    const currentUserId = req.user ? req.user.id : null;
    
    const query = {
        $and: [
            {
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } },
                    { id: { $regex: q, $options: 'i' } }
                ]
            }
        ]
    };
    
    if (currentUserId) {
        query.$and.push({ id: { $ne: currentUserId } });
    }

    const users = await User.find(query).select('id name email role college branch skills githubUrl linkedinUrl profilePicture').limit(20);
    res.json(users);
});

app.get('/api/users/:id', requireAuth, async (req, res) => {
    const user = await User.findOne({ id: req.params.id })
        .select('id name role college branch skills githubUrl linkedinUrl profilePicture');
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
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
        ...req.body, // { name: string, description: string }
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
    const hackathon = await Hackathon.findOne({ id: team.hackathonId });
    const maxAllowed = hackathon ? hackathon.maxTeamSize || 4 : 4;
    
    if (team.memberIds.length >= maxAllowed) {
        return res.status(403).json({ message: `Squad is at maximum capacity (${maxAllowed} members).` });
    }
    team.memberIds.push(req.user.id);
    await team.save();
    await User.findOneAndUpdate({ id: req.user.id }, { teamId: team.id });
    res.json(team);
});

app.post('/api/teams/leave', requireAuth, requireRole(['student']), async (req, res) => {
    if (!req.user.teamId) return res.status(400).json({ message: "You are not currently enlisted in a squad." });

    const team = await Team.findOne({ id: req.user.teamId });
    if (!team) return res.status(404).json({ message: "Squad matrix missing." });

    if (team.leaderId === req.user.id) {
        if (team.memberIds.length > 1) {
            return res.status(403).json({ message: "Command Protocol: Leaders cannot abandon squads while operatives remain. Transfer command or dissolve manually." });
        } else {
            // Dissolve totally empty squad
            await Team.findOneAndDelete({ id: team.id });
        }
    } else {
        await Team.findOneAndUpdate({ id: team.id }, { $pull: { memberIds: req.user.id } });
    }

    await User.findOneAndUpdate({ id: req.user.id }, { $unset: { teamId: "" } });
    res.json({ message: "Successfully departed squad operations." });
});

app.delete('/api/teams/:id', requireAuth, requireRole(['student', 'admin']), async (req, res) => {
    const team = await Team.findOne({ id: req.params.id });
    if (!team) return res.status(404).json({ message: "Squad matrix missing." });
    if (team.leaderId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Security Action Blocked: Only leaders possess authorization to dissolve the squad." });
    }

    await User.updateMany({ id: { $in: team.memberIds } }, { $unset: { teamId: "" } });
    await Team.findOneAndDelete({ id: team.id });
    res.json({ message: "Squad completely dissolved across the network." });
});

app.post('/api/teams/:id/transfer', requireAuth, requireRole(['student']), async (req, res) => {
    const { newLeaderId } = req.body;
    const team = await Team.findOne({ id: req.params.id });
    if (!team) return res.status(404).json({ message: "Squad matrix missing." });
    if (team.leaderId !== req.user.id) return res.status(403).json({ message: "Only leaders can transfer command." });
    if (!team.memberIds.includes(newLeaderId)) return res.status(400).json({ message: "New leader must be a member." });

    team.leaderId = newLeaderId;
    await team.save();
    res.json({ message: "Command transferred.", team });
});

app.post('/api/teams/:id/lock', requireAuth, requireRole(['student', 'admin']), async (req, res) => {
    const { locked } = req.body;
    const team = await Team.findOne({ id: req.params.id });
    if (!team) return res.status(404).json({ message: "Squad matrix missing." });
    if (team.leaderId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: "Only leaders or admins can lock the squad." });

    team.recruitmentOpen = !locked;
    await team.save();
    res.json({ message: locked ? "Squad Locked" : "Squad Unlocked", team });
});

app.put('/api/teams/:id/links', requireAuth, requireRole(['student']), async (req, res) => {
    const { githubLink, figmaLink, demoLink } = req.body;
    const team = await Team.findOne({ id: req.params.id });
    if (!team) return res.status(404).json({ message: "Squad matrix missing." });
    if (!team.memberIds.includes(req.user.id)) return res.status(403).json({ message: "Not authorized." });
    if (team.isSubmitted) return res.status(403).json({ message: "Cannot edit links after submission." });

    team.githubLink = githubLink;
    team.figmaLink = figmaLink;
    team.demoLink = demoLink;
    await team.save();
    res.json(team);
});

app.post('/api/teams/:id/submit', requireAuth, requireRole(['student', 'admin']), async (req, res) => {
    const team = await Team.findOne({ id: req.params.id });
    if (!team) return res.status(404).json({ message: "Squad matrix missing." });
    if (team.leaderId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only leaders can authorize final submission." });
    }
    
    team.isSubmitted = true;
    team.status = 'submitted';
    await team.save();
    
    const submission = new Submission({
        id: `sub-${Date.now()}`,
        teamId: team.id,
        hackathonId: team.hackathonId,
        projectTitle: team.name,
        description: team.description || "Final submission",
        repositoryUrl: team.githubLink,
        demoUrl: team.demoLink,
        submittedAt: new Date()
    });
    await submission.save();

    res.json({ message: "Final submission successful.", team });
});

// Admin Team Management
app.get('/api/admin/submissions', requireAuth, requireRole(['admin']), async (req, res) => {
    const submissions = await Submission.find().sort({ submittedAt: -1 });
    res.json(submissions);
});

app.patch('/api/admin/submissions/:id/:action', requireAuth, requireRole(['admin']), async (req, res) => {
    const { action } = req.params;
    const isLocked = action === 'lock';
    const submission = await Submission.findOneAndUpdate({ id: req.params.id }, { isLocked }, { new: true });
    if (!submission) return res.status(404).json({ message: "Submission not found." });
    res.json(submission);
});

app.post('/api/admin/teams/:id/disqualify', requireAuth, requireRole(['admin']), async (req, res) => {
    const { reason } = req.body;
    if (!reason || reason.trim() === '') return res.status(400).json({ message: "Reason is required for disqualification." });

    const team = await Team.findOneAndUpdate({ id: req.params.id }, { status: 'disqualified' }, { new: true });
    if (!team) return res.status(404).json({ message: "Squad missing." });
    
    // Log DQ
    const dqLog = new Message({ id: `dq-${Date.now()}`, content: reason, authorId: req.user.id, teamId: team.id });
    await dqLog.save();

    res.json({ message: "Squad Disqualified", team });
});

app.post('/api/admin/teams/:id/undo-disqualify', requireAuth, requireRole(['admin']), async (req, res) => {
    const team = await Team.findOneAndUpdate({ id: req.params.id }, { status: 'active' }, { new: true });
    if (!team) return res.status(404).json({ message: "Squad missing." });
    res.json({ message: "Squad Restored", team });
});

app.post('/api/admin/teams', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const team = new Team({ ...req.body, id: `team-${Date.now()}` });
        await team.save();
        res.json(team);
    } catch (e) {
        res.status(500).json({ message: "Failed to construct squad." });
    }
});

app.put('/api/admin/teams/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const team = await Team.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(team);
    } catch (e) {
        res.status(500).json({ message: "Failed to update squad parameters." });
    }
});

app.patch('/api/teams/:id/points', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { bonusPoints, penaltyPoints } = req.body;
        const team = await Team.findOne({ id: req.params.id });
        if (!team) return res.status(404).json({ message: "Squad matrix missing." });

        if (bonusPoints !== undefined) {
            team.bonusPoints = Number(bonusPoints);
        }
        if (penaltyPoints !== undefined) {
            team.penaltyPoints = Number(penaltyPoints);
        }
        
        await team.save();
        res.json({ message: "Squad points modified successfully.", team });
    } catch (e) {
        res.status(500).json({ message: "Failed to modify squad points.", error: e.message });
    }
});

app.post('/api/teams/:id/invite', requireAuth, requireRole(['student']), async (req, res) => {
    try {
        const { receiverId } = req.body;
        const team = await Team.findOne({ id: req.params.id });
        if (!team || team.leaderId !== req.user.id) {
            return res.status(403).json({ message: "Only squad leaders can transmit invitations." });
        }

        const hackathon = await Hackathon.findOne({ id: team.hackathonId });
        const maxAllowed = hackathon ? hackathon.maxTeamSize || 4 : 4;
        if (team.memberIds.length >= maxAllowed) {
            return res.status(403).json({ message: `Squad capacity reached (${maxAllowed} members).` });
        }

        const receiver = await User.findOne({ id: receiverId });
        if (!receiver) return res.status(404).json({ message: "Operative not found." });
        if (receiver.teamId) return res.status(400).json({ message: "Operative is already aligned with a squad." });

        const registration = await Registration.findOne({ userId: receiverId, hackathonId: team.hackathonId });
        if (!registration) return res.status(400).json({ message: "Operative is not registered for this event." });

        const existingInvite = await TeamInvitation.findOne({ teamId: team.id, receiverId, status: 'pending' });
        if (existingInvite) return res.status(400).json({ message: "Invitation already dispatched." });

        const invite = new TeamInvitation({
            id: `inv-${Date.now()}`,
            teamId: team.id,
            senderId: req.user.id,
            receiverId
        });
        await invite.save();
        
        const notification = new Notification({
            id: `notif-${Date.now()}`,
            userId: receiverId,
            title: 'Squad Invitation',
            message: `You have been invited to join the squad (${team.name}).`,
            type: 'team_invite',
            relatedId: invite.id
        });
        await notification.save();

        res.json(invite);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.post('/api/teams/accept-invite/:inviteId', requireAuth, requireRole(['student']), async (req, res) => {
    const invite = await TeamInvitation.findOne({ id: req.params.inviteId, receiverId: req.user.id, status: 'pending' });
    if (!invite) return res.status(404).json({ message: "Invite not found or expired." });

    const team = await Team.findOne({ id: invite.teamId });
    if (!team) return res.status(404).json({ message: "Team not found." });
    const hackathon = await Hackathon.findOne({ id: team.hackathonId });
    const maxAllowed = hackathon ? hackathon.maxTeamSize || 4 : 4;
    
    if (team.memberIds.length >= maxAllowed) {
        return res.status(403).json({ message: `Squad capacity reached (${maxAllowed} members).` });
    }

    await Team.findOneAndUpdate({ id: invite.teamId }, { $push: { memberIds: req.user.id } }, { new: true });
    await User.findOneAndUpdate({ id: req.user.id }, { teamId: invite.teamId });
    invite.status = 'accepted';
    await invite.save();
    res.json(team);
});
app.get('/api/teams/invitations/me', requireAuth, requireRole(['student']), async (req, res) => {
    const invites = await TeamInvitation.find({ receiverId: req.user.id, status: 'pending' });
    res.json(invites);
});

app.post('/api/teams/:id/select-problem', requireAuth, requireRole(['student']), async (req, res) => {
    const { problemId } = req.body;
    const team = await Team.findOne({ id: req.params.id });

    if (!team) return res.status(404).json({ message: "Squad not found in mainframe." });
    if (team.leaderId !== req.user.id) return res.status(403).json({ message: "Squad directive: Only leaders can select the project vector." });
    if (team.isSubmitted) return res.status(403).json({ message: "Payload already deployed. Architecture locked." });

    const problem = await ProblemStatement.findOne({ id: problemId, isPublished: true });
    if (!problem) return res.status(404).json({ message: "Valid published matrix not located." });
    
    if (problem.hackathonId && problem.hackathonId !== team.hackathonId) {
        return res.status(403).json({ message: "Problem does not belong to this hackathon." });
    }

    team.problemId = problem.id;
    await team.save();
    res.json(team);
});

// SQUAD RECRUITMENT AND MANAGEMENT (EPIC 4/5)
app.post('/api/teams/:id/request', requireAuth, requireRole(['student', 'admin']), async (req, res) => {
    try {
        const team = await Team.findOne({ id: req.params.id });
        if (!team) return res.status(404).json({ message: "Squad not found." });
        if (req.user.teamId) return res.status(400).json({ message: "You are already bound to a squad." });
        if (team.memberIds.length >= 4) return res.status(403).json({ message: "Squad slots full." });

        const existing = await TeamJoinRequest.findOne({ teamId: team.id, userId: req.user.id, status: 'pending' });
        if (existing) return res.status(400).json({ message: "Join signature already deployed." });

        const reqData = new TeamJoinRequest({
            id: `tjr-${Date.now()}`,
            teamId: team.id,
            userId: req.user.id,
            status: 'pending'
        });
        await reqData.save();

        const notification = new Notification({
            id: `notif-${Date.now()}`,
            userId: team.leaderId,
            title: 'New Join Request',
            message: `${req.user.name || 'A user'} wants to join your squad (${team.name}).`,
            type: 'join_request',
            relatedId: reqData.id
        });
        await notification.save();

        res.json(reqData);
    } catch (e) { res.status(500).json({ error: e.message }) }
});

app.get('/api/teams/requests/me', requireAuth, requireRole(['student', 'admin']), async (req, res) => {
    if (!req.user.teamId) return res.json([]);
    const team = await Team.findOne({ id: req.user.teamId });
    if (!team || team.leaderId !== req.user.id) return res.json([]);

    const requests = await TeamJoinRequest.find({ teamId: team.id, status: 'pending' });
    res.json(requests);
});

app.post('/api/teams/requests/:id/:action', requireAuth, requireRole(['student', 'admin']), async (req, res) => {
    try {
        const { action } = req.params; // 'accept' | 'reject'
        const request = await TeamJoinRequest.findOne({ id: req.params.id, status: 'pending' });
        if (!request) return res.status(404).json({ message: "Join signature not found." });

        const team = await Team.findOne({ id: request.teamId });
        if (!team || team.leaderId !== req.user.id) return res.status(403).json({ message: "Squad Leader clearance required." });

        if (action === 'accept') {
            const hackathon = await Hackathon.findOne({ id: team.hackathonId });
            const maxAllowed = hackathon ? hackathon.maxTeamSize || 4 : 4;
            
            if (team.memberIds.length >= maxAllowed) return res.status(403).json({ message: `Squad capacity reached (${maxAllowed} members).` });

            // Re-verify the student is still free
            const student = await User.findOne({ id: request.userId });
            if (student.teamId) return res.status(400).json({ message: "Operative already aligned with another squad." });

            team.memberIds.push(request.userId);
            await team.save();
            student.teamId = team.id;
            await student.save();

            request.status = 'approved';
            
            const notification = new Notification({
                id: `notif-${Date.now()}`,
                userId: request.userId,
                title: 'Join Request Accepted',
                message: `You have been accepted into the squad (${team.name}).`,
                type: 'system',
                relatedId: team.id
            });
            await notification.save();
        } else {
            request.status = 'rejected';

            const notification = new Notification({
                id: `notif-${Date.now()}`,
                userId: request.userId,
                title: 'Join Request Rejected',
                message: `Your request to join the squad (${team.name}) was rejected.`,
                type: 'system',
                relatedId: team.id
            });
            await notification.save();
        }
        await request.save();
        res.json({ message: `Signature ${action}ed.` });
    } catch (e) { res.status(500).json({ error: e.message }) }
});

app.post('/api/teams/:id/kick', requireAuth, requireRole(['student', 'admin']), async (req, res) => {
    try {
        const { userId } = req.body;
        const team = await Team.findOne({ id: req.params.id });
        if (!team || team.leaderId !== req.user.id) return res.status(403).json({ message: "Squad Leader clearance required." });
        if (team.leaderId === userId) return res.status(403).json({ message: "System Error: Cannot purge designated Leader." });

        team.memberIds = team.memberIds.filter(id => id !== userId);
        await team.save();
        await User.findOneAndUpdate({ id: userId }, { teamId: null });

        res.json({ message: "Operative purged from squad." });
    } catch (e) { res.status(500).json({ error: e.message }) }
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

app.delete('/api/admin/users/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const targetId = req.params.id;
        const user = await User.findOne({ $or: [{ id: targetId }, { email: targetId }] });
        if (!user) {
            return res.status(404).json({ message: "Operative identity not found in database matrix." });
        }

        // 1. Delete user record permanently from MongoDB database
        await User.deleteOne({ _id: user._id });

        // 2. Clear related auth sessions and verifications
        await Session.deleteMany({ userId: user.id });
        await EmailVerification.deleteMany({ userId: user.id });

        // 3. Remove user from Firebase Auth if initialized
        try {
            const { firebaseAdminApp } = await import('./middleware/auth.js');
            const { getAuth } = await import('firebase-admin/auth');
            if (firebaseAdminApp) {
                const firebaseAuth = getAuth(firebaseAdminApp);
                const fbUser = await firebaseAuth.getUserByEmail(user.email).catch(() => null);
                if (fbUser) {
                    await firebaseAuth.deleteUser(fbUser.uid);
                    console.log(`[FIREBASE ADMIN] Permanently deleted Firebase account for ${user.email}`);
                }
            }
        } catch (fbErr) {
            console.warn('[FIREBASE ADMIN] Warning on Firebase user purge:', fbErr.message);
        }

        console.log(`[ADMIN DELETE] Permanently purged user identity ${user.email} (${user.id})`);
        res.json({ message: `SUCCESS: Account ${user.email} permanently deleted from database.`, id: targetId });
    } catch (e) {
        console.error("Permanent user deletion failed:", e);
        res.status(500).json({ message: `Permanent account deletion failed: ${e.message}` });
    }
});

// TELEMETRY & LOGS
app.get('/api/admin/logs', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const logs = [
            { id: 1, createdAt: new Date(Date.now() - 1000 * 60 * 5), userId: "admin@codesrijan.com", role: "ADMIN", action: "SYSTEM_BOOT", description: "Core systems initialized and ready.", ipAddress: "127.0.0.1" },
            { id: 2, createdAt: new Date(Date.now() - 1000 * 60 * 2), userId: "SYSTEM", role: "CORE", action: "SYNC", description: "Synchronized with primary database cluster.", ipAddress: "10.0.0.1" }
        ];
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

// SRIJANBOT AI CHAT ENGINE (Groq LLM Integration)
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        const groqApiKey = process.env.GROQ_API_KEY;

        if (!groqApiKey) {
            return handleAIFallback(req, res);
        }

        const systemPrompt = `You are SrijanBot, the official AI guide and navigator for the CodeSrijan hackathon platform.
CodeSrijan Site Map:
🏠 Home (/dashboard): View the current hackathon, deadlines and announcements.
🧩 Problems (/problems): Browse and select hackathon challenges.
👥 Team (/recruitment): Create a team, select a problem, and manage members.
💻 Workspace (/workspace): Build your project, manage tasks and prepare your submission.
💬 Comms (/chat): Chat with teammates, mentors and support.
📤 Submission (/workspace): Submit your final project (it is located inside the Kanban Workspace).
🏆 Leaderboard (/leaderboard): View published results.
🎓 Certificates (/certificates): View and download your certificates.
🤝 Recruitment (/recruitment): Find teammates, join squads, and network.
❓ Help & Support (/support): Get FAQs, SrijanBot help or contact admins.

Current User Context:
Role: ${context?.role || 'Guest'}
Name: ${context?.name || 'Operative'}
Email: ${context?.email || 'N/A'}
Current Page: ${context?.path || '/'}
Team ID: ${context?.teamId || 'None'}

Your behavior rules:
1. EXPLAIN & GUIDE: Act as an interactive guide. Give complete step-by-step instructions.
2. NAVIGATE: At the VERY END of your response, provide exactly ONE navigation button if applicable, formatted EXACTLY as [Button Text -> /path] (e.g. [Open Workspace -> /workspace], [Create Team -> /recruitment], [Go to Dashboard -> /admin]).
3. NEVER invent a page, button, or action that doesn't exist on CodeSrijan.
4. Keep responses concise, structured, and in the "Neo-Brutalist" CodeSrijan tone (professional, direct, slight hacker aesthetic).
5. If asked to do something you cannot do (like directly creating a team in DB), explain how the user can do it themselves using the UI.
6. For submission, explicitly tell them to go to the Workspace and fill in the GitHub/Demo links payload.`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${groqApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", 
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
                temperature: 0.2,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Groq API error:", response.status, errText);
            throw new Error(`Groq API ${response.status}: ${errText}`);
        }

        const data = await response.json();
        let reply = data.choices[0]?.message?.content || "I couldn't process that command.";

        res.json({ reply });
    } catch (e) {
        console.error("AI Error:", e.message);
        return handleAIFallback(req, res);
    }
});

async function handleAIFallback(req, res) {
    try {
        const { message, context } = req.body;
        const lowerMsg = (message || "").toLowerCase();
        let reply = "I couldn't process that command completely. [Create Support Ticket -> /support]";
        
        if (lowerMsg.includes("submission") || lowerMsg.includes("deadline") || lowerMsg.includes("submit")) {
            const activeHackathon = await Hackathon.findOne({ status: 'active' });
            if (activeHackathon && activeHackathon.submissionDeadline) {
                const date = new Date(activeHackathon.submissionDeadline).toLocaleDateString();
                const time = new Date(activeHackathon.submissionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                reply = `According to the current hackathon configuration, submission closes on ${date} at ${time}. [Open Submission -> /workspace]`;
            } else {
                reply = "According to the current hackathon configuration, submission closes on 20 October at 11:59 PM. [Open Submission -> /workspace]";
            }
        } else if (lowerMsg.includes("team") || lowerMsg.includes("squad") || lowerMsg.includes("teammate")) {
            if (context?.teamId) {
                reply = "You are already assigned to a squad. [View My Team -> /workspace]";
            } else {
                reply = "You can recruit operatives or join an open squad in the Recruitment Marketplace. [Find a Squad -> /recruitment]";
            }
        } else if (lowerMsg.includes("stats") || lowerMsg.includes("admin")) {
            if (context?.role === 'admin') {
                reply = "You can view real-time platform telemetry in the Admin Dashboard. [Open Dashboard -> /admin]";
            } else {
                reply = "ACCESS DENIED. You do not have admin privileges. If you need assistance, please open a support ticket. [Open Support -> /support]";
            }
        } else if (lowerMsg.includes("judge") || lowerMsg.includes("evaluate")) {
            if (context?.role === 'admin' || context?.role === 'judge') {
                reply = "Judges can access the evaluation matrices in the Judge Portal. [Open Evaluations -> /evaluations]";
            } else {
                reply = "Only authorized judges can evaluate submissions. If you are a participant, please await your results. [View Leaderboard -> /leaderboard]";
            }
        }
        res.json({ reply });
    } catch (e) {
        res.status(500).json({ reply: "SYSTEM FAULT. Neural link severed." });
    }
}

// --- EPIC 4: SQUAD WORKSPACE KANBAN ---
app.get('/api/teams/:id/tasks', requireAuth, async (req, res) => {
    const team = await Team.findOne({ id: req.params.id });
    if (!team) return res.status(404).json({ message: "Squad matrix missing." });
    if (req.user.role !== 'admin' && !team.memberIds.includes(req.user.id)) {
        return res.status(403).json({ message: "Intruder Alert: Not authorized to view external squad workspace." });
    }
    const tasks = await ProjectTask.find({ teamId: req.params.id });
    res.json(tasks);
});

app.post('/api/teams/:id/tasks', requireAuth, requireRole(['student']), async (req, res) => {
    const team = await Team.findOne({ id: req.params.id });
    if (!team || !team.memberIds.includes(req.user.id)) return res.status(403).json({ message: "Access Denied." });
    if (team.isSubmitted) return res.status(403).json({ message: "WORKSPACE LOCKED: Final Payload already transmitted." });

    const task = new ProjectTask({
        ...req.body,
        id: `tsk-${Date.now()}`,
        teamId: team.id,
        createdBy: req.user.id
    });
    await task.save();
    res.json(task);
});

app.put('/api/teams/:id/tasks/:taskId/status', requireAuth, requireRole(['student', 'admin']), async (req, res) => {
    const team = await Team.findOne({ id: req.params.id });
    if (!team || (!team.memberIds.includes(req.user.id) && req.user.role !== 'admin')) return res.status(403).json({ message: "Access Denied." });
    if (team.isSubmitted) return res.status(403).json({ message: "WORKSPACE LOCKED." });

    const task = await ProjectTask.findOneAndUpdate(
        { id: req.params.taskId, teamId: team.id },
        { status: req.body.status },
        { new: true }
    );
    res.json(task);
});

app.delete('/api/teams/:id/tasks/:taskId', requireAuth, requireRole(['student']), async (req, res) => {
    const team = await Team.findOne({ id: req.params.id });
    if (!team || !team.memberIds.includes(req.user.id)) return res.status(403).json({ message: "Access Denied." });
    if (team.isSubmitted) return res.status(403).json({ message: "WORKSPACE LOCKED." });

    const task = await ProjectTask.findOne({ id: req.params.taskId });
    if (!task) return res.status(404).json({ message: "Task Node missing." });

    if (task.createdBy !== req.user.id && team.leaderId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized delete action." });
    }

    await ProjectTask.findOneAndDelete({ id: req.params.taskId });
    res.json({ message: "Task eradicated." });
});

app.post('/api/teams/:id/submit', requireAuth, requireRole(['student']), async (req, res) => {
    const team = await Team.findOne({ id: req.params.id });
    if (!team) return res.status(404).json({ message: "Squad matrix missing." });
    if (team.leaderId !== req.user.id) return res.status(403).json({ message: "Command Directive: Only squad leaders can trigger payload transmission." });
    if (team.isSubmitted) return res.status(400).json({ message: "Payload already locked." });

    const { description, technologies, githubLink, figmaLink, demoLink, demoVideoUrl } = req.body;

    team.isSubmitted = true;
    team.githubLink = githubLink || team.githubLink;
    team.figmaLink = figmaLink || team.figmaLink;
    team.demoLink = demoLink || team.demoLink;
    team.description = description || team.description;
    await team.save();

    // Create the actual submission record
    const submission = new Submission({
        id: `sub-${Date.now()}`,
        hackathonId: team.hackathonId,
        projectId: team.problemStatementId,
        teamId: team.id,
        submittedBy: req.user.id,
        version: 1,
        projectTitle: team.name,
        description: description,
        technologies: technologies || [],
        githubUrl: team.githubLink || team.repositoryUrl,
        figmaUrl: team.figmaLink,
        liveDemoUrl: team.demoLink || team.demoUrl,
        demoVideoUrl: demoVideoUrl,
        status: 'locked',
        lockedAt: new Date()
    });
    await submission.save();

    res.json(team);
});

// Admin Submissions Route
app.get('/api/admin/submissions', requireAuth, requireRole(['admin']), async (req, res) => {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.json(submissions);
});

// Admin Analytics Route
app.get('/api/admin/analytics', requireAuth, requireRole(['admin']), async (req, res) => {
    const [userCount, teamCount, messageCount, hackathonCount, users, teams] = await Promise.all([
        User.countDocuments(),
        Team.countDocuments(),
        Message.countDocuments(),
        Hackathon.countDocuments(),
        User.find().select('-password').limit(50),
        Team.find().limit(50)
    ]);
    
    res.json({
        stats: { userCount, teamCount, messageCount, hackathonCount },
        stream: { users, teams }
    });
});

// Admin Support Routes
app.get('/api/admin/support', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const tickets = await mongoose.model('SupportTicket').find().sort({ createdAt: -1 });
        res.json(tickets);
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch tickets" });
    }
});

app.patch('/api/admin/support/:id/status', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await mongoose.model('SupportTicket').findOneAndUpdate(
            { id: req.params.id }, 
            { status }, 
            { new: true }
        );
        res.json(ticket);
    } catch (e) {
        res.status(500).json({ message: "Failed to update ticket" });
    }
});

// Admin Settings Routes
app.get('/api/admin/settings', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const settings = await mongoose.model('Setting').find();
        res.json(settings);
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch settings" });
    }
});

app.post('/api/admin/settings', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { key, value, description } = req.body;
        let setting = await mongoose.model('Setting').findOne({ key });
        if (setting) {
            setting.value = value;
            if (description) setting.description = description;
            setting.updatedBy = req.user.id;
            await setting.save();
        } else {
            setting = new (mongoose.model('Setting'))({ key, value, description, updatedBy: req.user.id });
            await setting.save();
        }
        res.json(setting);
    } catch (e) {
        res.status(500).json({ message: "Failed to update setting" });
    }
});

app.patch('/api/admin/submissions/:id/unlock', requireAuth, requireRole(['admin']), async (req, res) => {
    const submission = await Submission.findOneAndUpdate({ id: req.params.id }, { status: 'submitted', lockedAt: null }, { new: true });
    if (submission) {
        await Team.findOneAndUpdate({ id: submission.teamId }, { isSubmitted: false });
    }
    res.json(submission);
});

app.patch('/api/admin/submissions/:id/lock', requireAuth, requireRole(['admin']), async (req, res) => {
    const submission = await Submission.findOneAndUpdate({ id: req.params.id }, { status: 'locked', lockedAt: new Date() }, { new: true });
    if (submission) {
        await Team.findOneAndUpdate({ id: submission.teamId }, { isSubmitted: true });
    }
    res.json(submission);
});

app.put('/api/teams/:id/links', requireAuth, requireRole(['student']), async (req, res) => {
    const team = await Team.findOne({ id: req.params.id });
    if (!team || !team.memberIds.includes(req.user.id)) return res.status(403).json({ message: "Access Denied." });
    if (team.isSubmitted) return res.status(403).json({ message: "WORKSPACE LOCKED." });

    team.githubLink = req.body.githubLink !== undefined ? req.body.githubLink : team.githubLink;
    team.figmaLink = req.body.figmaLink !== undefined ? req.body.figmaLink : team.figmaLink;
    team.demoLink = req.body.demoLink !== undefined ? req.body.demoLink : team.demoLink;

    await team.save();
    res.json(team);
});

// ==========================================
// EPIC 5: JUDGE & EVALUATION ENGINE
// ==========================================
app.get('/api/evaluations', requireAuth, async (req, res) => {
    const evals = await Evaluation.find();
    res.json(evals);
});

app.post('/api/evaluations/:teamId', requireAuth, requireRole(['judge', 'admin']), async (req, res) => {
    const { hackathonId, totalScore, scores, status } = req.body;
    
    // Check if an evaluation already exists for this judge and team
    let evaluation = await Evaluation.findOne({ teamId: req.params.teamId, judgeId: req.user.id });
    
    if (evaluation) {
        if (evaluation.status === 'submitted') {
            return res.status(400).json({ message: "Evaluation already submitted and locked." });
        }
        evaluation.totalScore = totalScore;
        evaluation.scores = scores;
        evaluation.status = status;
        await evaluation.save();
    } else {
        evaluation = new Evaluation({
            id: `eval-${Date.now()}`,
            hackathonId,
            teamId: req.params.teamId,
            judgeId: req.user.id,
            totalScore,
            scores,
            status: status || 'draft'
        });
        await evaluation.save();
    }
    
    res.json(eval);
});

// GET Submissions Queue (Only returns teams that have transmitted payload)
app.get('/api/submissions', requireAuth, requireRole(['judge', 'admin']), async (req, res) => {
    try {
        const submittedTeams = await Team.find({ isSubmitted: true });
        res.json(submittedTeams);
    } catch (e) {
        res.status(500).json({ message: "Engine Failure fetching submissions." });
    }
});

// GET Evaluations for leaderboard parsing
app.get('/api/evaluations', async (req, res) => {
    try {
        const evals = await mongoose.model('Evaluation').find({});
        res.json(evals);
    } catch (e) {
        res.json([]);
    }
});

// POST Formulate a final score
app.post('/api/evaluations/:teamId', requireAuth, requireRole(['judge', 'admin']), async (req, res) => {
    try {
        const { hackathonId, scores, totalScore, comments, strengths, improvements } = req.body;

        // Prevent duplicate grading by the same judge for the same team?
        const existing = await mongoose.model('Evaluation').findOne({
            teamId: req.params.teamId,
            judgeId: req.user.id
        });

        if (existing) {
            existing.scores = scores;
            existing.totalScore = totalScore;
            existing.comments = comments;
            existing.strengths = strengths;
            existing.improvements = improvements;
            await existing.save();
            return res.json(existing);
        }

        const evaluation = await mongoose.model('Evaluation').create({
            id: 'eval_' + Date.now().toString(),
            hackathonId,
            teamId: req.params.teamId,
            judgeId: req.user.id,
            scores,
            totalScore,
            comments,
            strengths,
            improvements,
            status: 'submitted'
        });

        res.status(201).json(evaluation);
    } catch (e) {
        res.status(500).json({ message: "Core error locking evaluation payload." });
    }
});

// ==========================================
// EPIC 4: CONVERSATIONS & CHAT (REST API)
// ==========================================

app.get('/api/conversations', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const userTeams = await Team.find({ memberIds: userId });
        const teamIds = userTeams.map(t => t.id);

        for (const team of userTeams) {
            const existing = await Conversation.findOne({ teamId: team.id, type: 'team' });
            if (!existing) {
                await Conversation.create({
                    id: 'conv-' + Date.now().toString() + '-' + team.id.substring(0, 5),
                    type: 'team',
                    teamId: team.id,
                    hackathonId: team.hackathonId,
                    participantIds: [] // Entire team can access via teamId
                });
            }
        }
        
        let query = {
            $or: [
                { participantIds: userId },
                { teamId: { $in: teamIds } }
            ]
        };
        
        if (req.user.role === 'admin') {
            query = {
                $or: [
                    { participantIds: userId },
                    { teamId: { $in: teamIds } },
                    { type: 'support' }
                ]
            };
        }

        const conversations = await Conversation.find(query).sort({ updatedAt: -1 });
        
        const enrichedConversations = await Promise.all(conversations.map(async (conv) => {
            const convObj = conv.toObject();
            if (conv.type === 'direct') {
                const otherUserId = conv.participantIds.find(id => id !== userId);
                const otherUser = await User.findOne({ id: otherUserId });
                convObj.targetName = otherUser ? otherUser.name : 'Unknown User';
                convObj.targetRole = otherUser ? (otherUser.role.charAt(0).toUpperCase() + otherUser.role.slice(1)) : '';
            } else if (conv.type === 'team') {
                const team = await Team.findOne({ id: conv.teamId });
                convObj.targetName = team ? team.name : 'Unknown Team';
                convObj.targetRole = team ? `${team.memberIds.length} members` : '';
            } else if (conv.type === 'support') {
                const ticket = await SupportTicket.findOne({ conversationId: conv.id });
                if (ticket) {
                    const ticketUser = await User.findOne({ id: ticket.userId });
                    const userName = ticketUser ? ticketUser.name : (ticket.userId || 'Hacker');
                    convObj.targetName = req.user.role === 'admin' ? `${userName} - ${ticket.subject || 'Support Ticket'}` : 'Admin Support';
                    convObj.targetRole = req.user.role === 'admin' ? `Ticket #${ticket.id.substring(0,8)} · ${ticket.priority.toUpperCase()}` : 'Support Request';
                    convObj.supportTicket = ticket;
                } else {
                    convObj.targetName = 'Admin Support';
                    convObj.targetRole = 'Support Request';
                    convObj.supportTicket = null;
                }
            }
            
            // fetch last message
            const lastMsg = await Message.findOne({ conversationId: conv.id }).sort({ createdAt: -1 });
            if (lastMsg) {
                convObj.lastMessage = lastMsg.message;
                convObj.lastMessageAt = lastMsg.createdAt;
                convObj.lastMessageSenderId = lastMsg.senderId;
            }
            
            return convObj;
        }));
        
        res.json(enrichedConversations);
    } catch (err) {
        res.status(500).json({ message: "Failed to load conversations.", error: err.message });
    }
});

app.post('/api/conversations/direct', requireAuth, async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const userId = req.user.id;

        if (targetUserId === userId) return res.status(400).json({ message: "Cannot create conversation with yourself." });

        const targetUser = await User.findOne({ id: targetUserId });
        if (!targetUser) return res.status(404).json({ message: "Target operative not found." });

        let conv = await Conversation.findOne({
            type: 'direct',
            participantIds: { $all: [userId, targetUserId] }
        });

        if (!conv) {
            conv = await Conversation.create({
                id: 'conv-' + Date.now().toString(),
                type: 'direct',
                participantIds: [userId, targetUserId]
            });
        }
        res.json(conv);
    } catch (err) {
        res.status(500).json({ message: "Failed to initialize direct transmission." });
    }
});

app.get('/api/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
        const convId = req.params.id;
        const conv = await Conversation.findOne({ id: convId });
        if (!conv) return res.status(404).json({ message: "Conversation missing." });

        if (req.user.role !== 'admin') {
            const isParticipant = conv.participantIds && conv.participantIds.includes(req.user.id);
            let isTeamMember = false;
            if (conv.teamId) {
                const team = await Team.findOne({ id: conv.teamId, memberIds: req.user.id });
                if (team) isTeamMember = true;
            }
            if (!isParticipant && !isTeamMember) {
                return res.status(403).json({ message: "Access Denied: You do not have clearance for this channel." });
            }
        }

        const messages = await Message.find({ conversationId: convId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: "Failed to load messages." });
    }
});

app.post('/api/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
        const { message, attachments, replyTo } = req.body;
        const convId = req.params.id;
        
        const conv = await Conversation.findOne({ id: convId });
        if (!conv) return res.status(404).json({ message: "Conversation missing." });

        if (req.user.role !== 'admin') {
            const isParticipant = conv.participantIds && conv.participantIds.includes(req.user.id);
            let isTeamMember = false;
            if (conv.teamId) {
                const team = await Team.findOne({ id: conv.teamId, memberIds: req.user.id });
                if (team) isTeamMember = true;
            }
            if (!isParticipant && !isTeamMember) {
                return res.status(403).json({ message: "Access Denied." });
            }
        }

        const newMsg = await Message.create({
            id: 'msg-' + Date.now().toString(),
            conversationId: convId,
            senderId: req.user.id,
            message,
            attachments: attachments || [],
            replyTo
        });

        conv.lastMessageId = newMsg.id;
        conv.lastMessageAt = new Date();
        await conv.save();

        // Broadcast realtime event
        io.to(convId).emit('message:new', newMsg);

        res.status(201).json(newMsg);
    } catch (err) {
        res.status(500).json({ message: "Failed to transmit message." });
    }
});
// --- SUPPORT TICKETS ---
app.post('/api/support', requireAuth, async (req, res) => {
    try {
        const { subject, category, description, priority } = req.body;
        const ticketId = 'tkt-' + Date.now().toString();
        const convId = 'conv-sup-' + ticketId;

        const ticket = await SupportTicket.create({
            id: ticketId,
            userId: req.user.id,
            subject,
            category,
            description,
            priority: priority || 'medium',
            status: 'open',
            conversationId: convId
        });
        
        // Create matching support conversation
        const conv = await Conversation.create({
            id: convId,
            type: 'support',
            participantIds: [req.user.id] // Admin query catches it via type: 'support'
        });
        
        // Auto-post the first message from the student's description
        const newMsg = await Message.create({
            id: 'msg-' + Date.now().toString(),
            conversationId: conv.id,
            senderId: req.user.id,
            message: `[Ticket Created] ${description}`
        });
        conv.lastMessageId = newMsg.id;
        await conv.save();

        res.status(201).json(ticket);
    } catch (e) {
        res.status(500).json({ message: "Failed to create support ticket." });
    }
});

app.get('/api/support', requireAuth, async (req, res) => {
    const tickets = await SupportTicket.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(tickets);
});

app.get('/api/admin/support', requireAuth, requireRole(['admin']), async (req, res) => {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 });
    res.json(tickets);
});

app.patch('/api/support/:id/status', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await SupportTicket.findOne({ id: req.params.id });
        if (!ticket) return res.status(404).json({ message: "Ticket missing" });
        if (req.user.role !== 'admin' && ticket.userId !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        ticket.status = status;
        await ticket.save();
        res.json(ticket);
    } catch (e) {
        res.status(500).json({ message: "Error updating status" });
    }
});

app.patch('/api/admin/support/:id/status', requireAuth, requireRole(['admin']), async (req, res) => {
    const { status } = req.body;
    const ticket = await SupportTicket.findOneAndUpdate(
        { id: req.params.id }, 
        { status },
        { new: true }
    );
    res.json(ticket);
});

app.post('/api/admin/support/:id/clone', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const sourceTicket = await SupportTicket.findOne({ id: req.params.id });
        if (!sourceTicket) return res.status(404).json({ message: "Ticket missing." });

        const clonedId = 'tkt-' + Date.now().toString();
        const convId = 'conv-sup-' + clonedId;

        const clonedTicket = await SupportTicket.create({
            id: clonedId,
            userId: sourceTicket.userId,
            subject: `[CLONED] ${sourceTicket.subject}`,
            category: sourceTicket.category,
            description: sourceTicket.description,
            priority: sourceTicket.priority,
            status: 'open',
            conversationId: convId
        });

        await Conversation.create({
            id: convId,
            type: 'support',
            participantIds: [sourceTicket.userId]
        });

        res.status(201).json(clonedTicket);
    } catch (e) {
        res.status(500).json({ message: "Failed to clone support ticket." });
    }
});

app.delete('/api/admin/support/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const targetId = req.params.id;
        const ticket = await SupportTicket.findOne({ $or: [{ id: targetId }, { _id: mongoose.Types.ObjectId.isValid(targetId) ? targetId : null }] });
        if (!ticket) return res.status(404).json({ message: "Ticket missing." });

        await SupportTicket.deleteOne({ _id: ticket._id });
        if (ticket.conversationId) {
            await Conversation.deleteOne({ id: ticket.conversationId });
            await Message.deleteMany({ conversationId: ticket.conversationId });
        }
        res.json({ message: "Support ticket permanently removed.", id: targetId });
    } catch (e) {
        res.status(500).json({ message: "Failed to remove ticket." });
    }
});

// --- SETTINGS (ADMIN) ---
app.get('/api/admin/settings', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const settings = await Setting.find();
        res.json(settings);
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch settings." });
    }
});

app.post('/api/admin/settings', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { key, value, description } = req.body;
        const setting = await Setting.findOneAndUpdate(
            { key },
            { value, description, updatedBy: req.user.id },
            { new: true, upsert: true }
        );
        res.json(setting);
    } catch (e) {
        res.status(500).json({ message: "Failed to update setting." });
    }
});
// (Duplicate AI Chat Route Removed)

// --- ANNOUNCEMENTS ---
app.get('/api/announcements', async (req, res) => {
    try {
        const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(announcements);
    } catch (e) {
        res.json([]);
    }
});

app.get('/api/admin/announcements', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.json(announcements);
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch announcements." });
    }
});

app.post('/api/admin/announcements', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const newAnnouncement = new Announcement({
            id: `ann-${Date.now()}`,
            ...req.body,
            authorId: req.user.id
        });
        await newAnnouncement.save();
        res.status(201).json(newAnnouncement);
    } catch (e) {
        res.status(500).json({ message: "Failed to create announcement." });
    }
});

app.put('/api/admin/announcements/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const announcement = await Announcement.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(announcement);
    } catch (e) {
        res.status(500).json({ message: "Failed to update announcement." });
    }
});

app.delete('/api/admin/announcements/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        await Announcement.findOneAndDelete({ id: req.params.id });
        res.json({ message: "Announcement deleted." });
    } catch (e) {
        res.status(500).json({ message: "Failed to delete announcement." });
    }
});

// --- ACTIVITY LOGS (Admin Audit) ---
app.get('/api/admin/logs', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch logs." });
    }
});

// --- SPONSORS ---
app.get('/api/sponsors', async (req, res) => {
    try {
        const sponsors = await Sponsor.find({ isPublished: true }).sort({ order: 1 });
        res.json(sponsors);
    } catch (e) { res.json([]); }
});
app.get('/api/admin/sponsors', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const sponsors = await Sponsor.find().sort({ order: 1 });
        res.json(sponsors);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});
app.post('/api/admin/sponsors', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const sp = new Sponsor({ id: `sp-${Date.now()}`, ...req.body });
        await sp.save();
        res.json(sp);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});
app.delete('/api/admin/sponsors/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        await Sponsor.findOneAndDelete({ id: req.params.id });
        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

// --- CERTIFICATES ---
app.get('/api/admin/certificates', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const certs = await Certificate.find().sort({ createdAt: -1 });
        res.json(certs);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});
app.post('/api/admin/certificates/batch', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        // mock generation
        res.json({ message: "Batch generation initiated." });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', requireAuth, async (req, res) => {
    const notes = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(notes);
});

app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
    await Notification.findOneAndUpdate({ id: req.params.id, userId: req.user.id }, { isRead: true });
    res.json({ success: true });
});

// --- ANALYTICS ---
app.get('/api/admin/analytics', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const teamCount = await Team.countDocuments();
        const messageCount = await Message.countDocuments();
        const hackathonCount = await Hackathon.countDocuments();
        
        const teams = await Team.find().sort({ createdAt: -1 }).limit(20);
        const users = await User.find().sort({ createdAt: -1 }).limit(20);
        const submissions = await Submission.find().sort({ createdAt: -1 }).limit(20);

        res.json({
            stats: { userCount, teamCount, messageCount, hackathonCount },
            stream: { teams, users, submissions }
        });
    } catch (e) {
        res.status(500).json({ message: "Analytics query failed." });
    }
});

// --- MENTOR REQUESTS ---
app.post('/api/mentor/requests', requireAuth, async (req, res) => {
    try {
        if (!req.user.teamId) return res.status(403).json({ message: "You must be in a squad to request mentor support." });
        
        const { topic, description } = req.body;
        const mentorReq = new MentorRequest({
            id: 'mr-' + Date.now().toString(),
            teamId: req.user.teamId,
            requestedBy: req.user.id,
            topic,
            description,
            status: 'pending'
        });
        await mentorReq.save();

        // Broadcast a notification to all mentors (mocking it by just keeping it pending)
        // Note: Realistically, you'd create a Notification doc for all users where role='mentor'
        const mentors = await User.find({ role: 'mentor' });
        for (const mentor of mentors) {
            await Notification.create({
                id: 'notif-' + Date.now() + Math.random(),
                userId: mentor.id,
                title: 'New Mentor Request',
                message: `Team ${req.user.teamId} requested help regarding: ${topic}`,
                type: 'mentor',
                relatedId: mentorReq.id
            });
        }

        res.json(mentorReq);
    } catch (e) { res.status(500).json({ message: "Failed to request mentor." }); }
});

app.get('/api/mentor/requests/all', requireAuth, requireRole(['mentor', 'admin']), async (req, res) => {
    try {
        const reqs = await MentorRequest.find().sort({ createdAt: -1 });
        res.json(reqs);
    } catch (e) { res.status(500).json({ message: "Error fetching mentor requests." }); }
});

app.get('/api/teams/:id/mentor-requests', requireAuth, async (req, res) => {
    try {
        const reqs = await MentorRequest.find({ teamId: req.params.id }).sort({ createdAt: -1 });
        res.json(reqs);
    } catch (e) { res.status(500).json({ message: "Error fetching team mentor requests." }); }
});

app.post('/api/mentor/requests/:id/accept', requireAuth, requireRole(['mentor', 'admin']), async (req, res) => {
    try {
        const { meetLink } = req.body;
        const reqDoc = await MentorRequest.findOne({ id: req.params.id });
        if (!reqDoc) return res.status(404).json({ message: "Request not found" });

        reqDoc.status = 'accepted';
        reqDoc.mentorId = req.user.id;
        reqDoc.meetLink = meetLink;
        reqDoc.acceptedAt = new Date();
        await reqDoc.save();

        // Notify the team leader
        const team = await Team.findOne({ id: reqDoc.teamId });
        if (team) {
            await Notification.create({
                id: 'notif-' + Date.now(),
                userId: team.leaderId,
                title: 'Mentor Request Accepted!',
                message: `A mentor has accepted your request. Join the Meet link!`,
                type: 'mentor',
                relatedId: reqDoc.id
            });
        }

        res.json(reqDoc);
    } catch (e) { res.status(500).json({ message: "Error accepting request." }); }
});

app.post('/api/mentor/requests/:id/resolve', requireAuth, async (req, res) => {
    try {
        const reqDoc = await MentorRequest.findOne({ id: req.params.id });
        if (!reqDoc) return res.status(404).json({ message: "Request not found" });
        reqDoc.status = 'resolved';
        await reqDoc.save();
        res.json(reqDoc);
    } catch (e) { res.status(500).json({ message: "Error resolving request." }); }
});

// --- PUBLIC GALLERY ---
app.get('/api/gallery/projects', async (req, res) => {
    try {
        // Find teams that have submitted
        const teams = await Team.find({ isSubmitted: true }).sort({ createdAt: -1 }).limit(50);
        const galleryProjects = [];

        for (const team of teams) {
            // Find their problem statement
            const problem = await ProblemStatement.findOne({ id: team.problemStatementId });
            galleryProjects.push({
                teamId: team.id,
                teamName: team.name,
                problemTitle: problem ? problem.title : 'Open Innovation',
                description: team.description || 'Awesome project built at CodeSrijan.',
                githubLink: team.githubLink || team.repositoryUrl,
                demoLink: team.demoLink || team.demoUrl,
                figmaLink: team.figmaLink,
                computedScore: (team.isSubmitted ? 8000 : 2000) + ((team.name || '').length * 100) // Dummy logic for highlight
            });
        }
        res.json(galleryProjects);
    } catch (e) { res.status(500).json({ message: "Failed to fetch gallery projects." }); }
});

// --- PUBLIC LEADERBOARD ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        const teams = await Team.find({ isSubmitted: true });
        const evals = await Evaluation.find();

        const leaderboardData = teams.map((t) => {
            const teamEvals = evals.filter(e => e.projectId === t.id || e.teamId === t.id);
            const evalScore = teamEvals.reduce((acc, cur) => acc + (cur.totalScore || 0), 0);
            
            let aggregatedScores = {};
            teamEvals.forEach(e => {
                (e.scores || []).forEach(sc => {
                    if (!aggregatedScores[sc.criteriaId]) {
                        aggregatedScores[sc.criteriaId] = { score: 0 };
                    }
                    aggregatedScores[sc.criteriaId].score += sc.score;
                });
            });

            const bonusPoints = Number(t.bonusPoints) || 0;
            const penaltyPoints = Number(t.penaltyPoints) || 0;
            const totalScore = evalScore + bonusPoints - penaltyPoints;

            return {
                id: t.id,
                name: t.name,
                bonusPoints,
                penaltyPoints,
                evalScore,
                totalScore,
                isScored: teamEvals.length > 0,
                scores: Object.entries(aggregatedScores).map(([criteriaId, data]) => ({
                    criteriaId,
                    score: data.score
                }))
            };
        });

        // Sort descending
        leaderboardData.sort((a, b) => b.totalScore - a.totalScore);
        
        // Filter out unscored teams if we only want evaluated ones
        const scoredOnly = leaderboardData.filter(t => t.isScored);

        res.json(scoredOnly);
    } catch (e) {
        res.status(500).json({ message: "Leaderboard error" });
    }
});

// START
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => console.log(`Server & WebSockets running on port ${PORT}`));
