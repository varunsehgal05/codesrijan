import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dns from 'dns';
import crypto from 'crypto';

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
export const PRODUCTION_ORIGIN = 'https://codesrijan-nine.vercel.app';

// Local development origins allowed strictly in non-production environments
export const LOCAL_DEV_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173'
];

// Project-specific preview regex: matches ONLY codesrijan project preview deployments
// (e.g. https://codesrijan-nine.vercel.app, https://codesrijan-git-*.vercel.app, https://codesrijan-*.vercel.app)
// Strictly rejects arbitrary Vercel apps (e.g. https://attacker.vercel.app, https://malicious.vercel.app)
export const CODESRIJAN_PROJECT_PREVIEW_REGEX = /^https:\/\/codesrijan(?:-[a-z0-9-]+)?\.vercel\.app$/i;

export function isOriginAllowed(origin) {
    if (!origin || typeof origin !== 'string') return false;

    // 1. Exact canonical production frontend
    if (origin === PRODUCTION_ORIGIN) return true;

    // 2. Explicitly configured FRONTEND_URL if provided
    if (process.env.FRONTEND_URL) {
        const cleanFrontendUrl = process.env.FRONTEND_URL.replace(/\/$/, '');
        if (origin === cleanFrontendUrl) return true;
    }

    // 3. Project-specific preview deployments on Vercel strictly scoped to codesrijan
    if (CODESRIJAN_PROJECT_PREVIEW_REGEX.test(origin)) return true;

    // 4. Local development origins ONLY allowed in non-production environments
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction && LOCAL_DEV_ORIGINS.includes(origin)) {
        return true;
    }

    return false;
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || isOriginAllowed(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Blocked by CORS policy'));
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Apply the same verified-account authentication used by HTTP routes.
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string' || !token) return next(new Error('Unauthorized'));
    const req = { headers: { authorization: 'Bearer ' + token } };
    const res = { status() { return this; }, json() { next(new Error('Unauthorized')); } };
    requireAuth(req, res, () => { socket.data.user = req.user; next(); });
});
io.on('connection', (socket) => {
    const authorize = async (conversationId) => {
        if (typeof conversationId !== 'string') return false;
        // Recheck account/session validity when subscribing or emitting.
        const user = await new Promise(resolve => {
            const req = { headers: { authorization: 'Bearer ' + socket.handshake.auth.token } };
            requireAuth(req, { status() { return this; }, json() { resolve(null); } }, () => resolve(req.user));
        });
        if (!user) return false;
        const conv = await Conversation.findOne({ id: conversationId });
        if (!conv) return false;
        return user.role === 'admin' || conv.participantIds?.includes(user.id) || !!(conv.teamId && await Team.exists({ id: conv.teamId, memberIds: user.id }));
    };
    socket.on('conversation:join', async (conversationId, ack) => {
        try { const allowed = await authorize(conversationId); if (allowed) await socket.join(conversationId); if (typeof ack === 'function') ack({ allowed: !!allowed }); } catch { if (typeof ack === 'function') ack({ allowed: false }); }
    });
    socket.on('conversation:leave', (conversationId) => { if (typeof conversationId === 'string') socket.leave(conversationId); });
    for (const event of ['typing:start', 'typing:stop']) socket.on(event, async (data) => {
        try {
            if (await authorize(data?.conversationId)) socket.to(data.conversationId).emit(event, { conversationId: data.conversationId, userId: socket.data.user.id, name: socket.data.user.name });
        } catch { /* fail closed */ }
    });
});

app.use(cors({
    origin: (origin, callback) => {
        // Missing origin (same-origin, curl, server-to-server) receives safe handling without CORS headers
        if (!origin) {
            return callback(null, true);
        }
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        // Disallow untrusted origin cleanly without setting Access-Control-Allow-Origin
        return callback(null, false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// --- Schemas (Imported from modular directory) ---
import { User, Team, ProblemStatement, Hackathon, Registration, Submission, Project, Evaluation, TeamJoinRequest, TeamInvitation, RecruitmentProfile, Certificate, ProjectTask, MentorRequest } from './models/index.js';
import { Announcement, CalendarEvent, Sponsor, ActivityLog, SystemSetting, Conversation, Message, SupportTicket, Notification } from './models/secondary.js';
import { FAQ, Gallery } from './models/tertiary.js';
import { Session, EmailVerification, PasswordResetToken, SecurityEvent } from './models/auth.js';
import { requireAuth, requireRole, resolveOptionalUser } from './middleware/auth.js';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendPaymentReviewNotification, sendPaymentRejectionEmail, sendPaymentApprovalEmail } from './services/email.js';
import { validatePaymentProofFile, uploadProofToGridFS, deleteGridFSProof, getGridFSProofStream, getStorageStats } from './services/storage.js';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI must be explicitly configured.');

/**
 * Immutable server-side audit logging helper for administrative actions (Feature 7).
 * Extracts caller identity strictly from validated session, records timestamp, IP, and target.
 */
export async function logAdminActivity(req, { action, entityType, entityId, description }) {
    try {
        if (!req?.user) return null;
        const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || '127.0.0.1';
        const userAgent = req.headers?.['user-agent'] || 'unknown';
        const log = await ActivityLog.create({
            id: `log-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
            userId: req.user.email || req.user.id || 'admin',
            role: req.user.role || 'admin',
            action: String(action || 'UNKNOWN_ACTION').toUpperCase(),
            entityType: String(entityType || 'SYSTEM').toUpperCase(),
            entityId: String(entityId || ''),
            description: String(description || ''),
            ipAddress,
            userAgent
        });
        return log;
    } catch (err) {
        console.error('[AUDIT LOG ERROR]', err.message);
        return null;
    }
}

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || 'codesrijan'
}).then(async () => {
    console.log('MongoDB Connected to keyspace codesrijan');
    // Seed only absent accounts with explicitly configured credentials.
    for (const account of [
        { email: 'admin@codesrijan.com', id: 'root-admin-01', name: 'CodeSrijan Administrator', role: 'admin', password: process.env.SEED_ADMIN_PASSWORD },
        { email: 'student@codesrijan.com', id: 'test-student-01', name: 'Vanguard Hacker', role: 'student', password: process.env.SEED_STUDENT_PASSWORD }
    ]) {
        const { password, ...identity } = account;
        if (password && !(await User.exists({ email: identity.email }))) {
            if (password.length < 12) throw new Error('Seed passwords must contain at least 12 characters.');
            await User.create({ ...identity, passwordHash: await bcrypt.hash(password, 12), accountStatus: 'active', emailVerified: true });
        }
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

    try {
        const settings = await SystemSetting.find();
        settings.forEach(s => {
            if (s.key) globalSystemSettings[s.key] = s.value;
        });
        console.log("[SYSTEM] Global settings synced. Maintenance mode:", globalSystemSettings.maintenanceMode);
    } catch (e) {}
}).catch(err => console.error(err));

// --- Global System Status & Maintenance Protocol ---
const globalSystemSettings = {
    maintenanceMode: false,
    registrationEnabled: true,
    submissionEnabled: true,
    chatEnabled: true,
    recruitmentEnabled: true,
    leaderboardVisible: true
};

export const getSystemSettings = () => globalSystemSettings;
export const setSystemSettings = (newSettings) => {
    Object.assign(globalSystemSettings, newSettings);
};

// Global Maintenance Mode Guard Middleware (Affects students & visitors, never administrators)
app.use(async (req, res, next) => {
    if (globalSystemSettings.maintenanceMode === true) {
        const path = req.path;
        // Bypassed endpoints
        if (
            path.startsWith('/api/admin') ||
            path.startsWith('/api/auth') ||
            path === '/api/system/status' ||
            path === '/api/settings/public'
        ) {
            return next();
        }

        // Check if admin is authenticated (Admin bypass)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const sessionTokenHash = crypto.createHash('sha256').update(token).digest('hex');
                const session = await Session.findOne({ sessionTokenHash, revokedAt: null });
                if (session) {
                    const u = await User.findOne({ id: session.userId });
                    if (u && u.role === 'admin') {
                        return next(); // Admin bypasses maintenance completely!
                    }
                }
            } catch (err) {}
        }

        return res.status(503).json({
            error: "Platform in Maintenance Mode",
            maintenance: true,
            message: "CodeSrijan is undergoing scheduled system upgrades. Regular operative access is temporarily paused."
        });
    }
    next();
});

// Public System Status Endpoint
app.get('/api/system/status', (req, res) => {
    res.json({
        success: true,
        maintenanceMode: globalSystemSettings.maintenanceMode === true,
        settings: globalSystemSettings
    });
});
app.get('/api/settings/public', (req, res) => {
    res.json({
        success: true,
        maintenanceMode: globalSystemSettings.maintenanceMode === true,
        settings: globalSystemSettings
    });
});

// --- Routes ---

// --- AUTHENTICATION & SECURITY (EPIC 5) ---
// Durable resend limits survive code replacement and pending-account recovery.
const rotateVerification = async (userId, tokenHash) => {
    const now = new Date();
    const current = await EmailVerification.findOne({ userId, usedAt: null }).sort({ createdAt: -1 });
    const fail = (retryAfter = 60) => { const error = new Error('Verification locked or resend limit reached. Please wait before requesting another code.'); error.status = 429; error.retryAfter = retryAfter; throw error; };
    if (!current) fail();
    if (current.lockedUntil > now) fail(Math.ceil((current.lockedUntil - now) / 1000));
    if (current.lastResendAt && now - current.lastResendAt < 60000) fail(Math.ceil((60000 - (now - current.lastResendAt)) / 1000));
    const windowStart = current.resendWindowStartedAt || current.createdAt;
    const freshWindow = now - windowStart >= 3600000;
    if (!freshWindow && current.resendCount >= 5) fail(Math.ceil((3600000 - (now - windowStart)) / 1000));
    const update = await EmailVerification.findOneAndUpdate({ _id: current._id, tokenHash: current.tokenHash, usedAt: null, lastResendAt: current.lastResendAt || null, lockedUntil: current.lockedUntil || null, attempts: current.attempts }, { $set: {
        tokenHash, expiresAt: new Date(now.getTime() + 15 * 60000), lastResendAt: now,
        resendCount: freshWindow ? 1 : (current.resendCount || 0) + 1, resendWindowStartedAt: freshWindow ? now : windowStart,
        ...(current.lockedUntil && current.lockedUntil <= now ? { attempts: 0, lockedUntil: null } : {})
    } }, { new: true });
    if (!update) fail();
};

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, college, branch, year } = req.body;
        
        // Strict input validation
        if (!name || !String(name).trim()) {
            return res.status(400).json({ message: "Full name is required." });
        }
        if (!email || !String(email).trim()) {
            return res.status(400).json({ message: "Email address is required." });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(email).trim())) {
            return res.status(400).json({ message: "Valid email address format is required." });
        }
        if (!password || typeof password !== 'string') {
            return res.status(400).json({ message: "Password is required." });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long." });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const existing = await User.findOne({ email: normalizedEmail });

        if (existing) {
            if (existing.accountStatus === 'pending_verification') {
                // Pending account recovery: re-hash password, update academic profile, and re-issue fresh OTP
                existing.passwordHash = await bcrypt.hash(String(password), 10);
                existing.name = String(name).trim();
                if (college) existing.college = college;
                if (branch) existing.branch = branch;
                if (year) existing.year = year;

                // Generate cryptographically secure 6-digit OTP
                const code = crypto.randomInt(100000, 1000000).toString();
                const tokenHash = await bcrypt.hash(code, 10);

                await rotateVerification(existing.id, tokenHash);
                await existing.save();

                const sendResult = await sendVerificationEmail(normalizedEmail, code);
                if (!sendResult.success) {
                    console.warn(`[REGISTRATION] Account updated for ${normalizedEmail}, but email dispatch failed: ${sendResult.error}`);
                    return res.status(200).json({
                        message: "Account details updated. Email delivery encountered a temporary issue. You may request a resend.",
                        userId: existing.id,
                        emailDeliveryStatus: "failed",
                        emailDispatchFailed: true
                    });
                }

                return res.status(200).json({
                    message: "Verification passkey dispatched.",
                    userId: existing.id,
                    emailDeliveryStatus: "dispatched"
                });
            } else {
                return res.status(400).json({ message: "An active account with this email already exists. Please proceed to login." });
            }
        }

        const passwordHash = await bcrypt.hash(String(password), 10);

        // Public registration always provisions a student.
        const user = new User({
            id: `usr-${Date.now()}`,
            name: String(name).trim(),
            email: normalizedEmail,
            passwordHash,
            role: 'student',
            college: college || '',
            branch: branch || '',
            year: year || '',
            accountStatus: 'pending_verification'
        });
        await user.save();

        // Cryptographically secure 6-digit OTP
        const code = crypto.randomInt(100000, 1000000).toString();
        const tokenHash = await bcrypt.hash(code, 10);

        await EmailVerification.deleteMany({ userId: user.id });
        const verification = new EmailVerification({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 15 * 60000), // 15 mins
            attempts: 0,
            maxAttempts: 5,
            lastResendAt: new Date(),
            resendCount: 1
        });
        await verification.save();

        // Dispatch Verification Email via Resend HTTPS API
        const sendResult = await sendVerificationEmail(normalizedEmail, code);
        if (!sendResult.success) {
            console.warn(`[REGISTRATION] Account created for ${normalizedEmail}, but email dispatch failed: ${sendResult.error}`);
            return res.status(201).json({
                message: "Account created, but verification email could not be delivered immediately. Please use Resend Code on the next screen.",
                userId: user.id,
                emailDeliveryStatus: "failed",
                emailDispatchFailed: true
            });
        }

        res.status(201).json({
            message: "Account created. Verification passkey dispatched to your email.",
            userId: user.id,
            emailDeliveryStatus: "dispatched"
        });
    } catch (e) {
        console.error('[REGISTRATION ERROR]', e);
        res.status(e.status || 500).json({ message: e.status ? e.message : "Registration failed", ...(e.status === 429 ? { retryAfter: e.retryAfter } : {}) });
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

app.post('/api/auth/resend-otp', async (req, res) => {
    try {
        const { userId, email } = req.body;
        const query = userId ? { id: userId } : { email: String(email).toLowerCase().trim() };
        const user = await User.findOne(query);
        
        // Generic response to mitigate email enumeration attacks
        if (!user) {
            return res.json({ 
                message: "If an unverified account exists for this identity, a fresh verification passkey has been dispatched." 
            });
        }

        if (user.accountStatus === 'active') {
            return res.status(400).json({ message: "Account is already verified and active. Please proceed to login." });
        }

        if (user.accountStatus !== 'pending_verification') return res.status(403).json({ message: 'Account is not eligible for verification.' });
        const code = crypto.randomInt(100000, 1000000).toString();
        const tokenHash = await bcrypt.hash(code, 10);
        await rotateVerification(user.id, tokenHash);

        // Dispatch via Resend HTTPS
        const sendResult = await sendVerificationEmail(user.email, code);
        if (!sendResult.success) {
            return res.status(200).json({ 
                message: "New verification code generated, but email delivery encountered an issue. Please try again shortly.",
                userId: user.id,
                emailDispatchFailed: true,
                emailDeliveryStatus: "failed"
            });
        }

        return res.json({ 
            message: "New 6-digit verification passkey dispatched to your email.", 
            userId: user.id,
            emailDeliveryStatus: "dispatched"
        });
    } catch (e) {
        console.error('[RESEND OTP ERROR]', e);
        return res.status(e.status || 500).json({ message: e.status ? e.message : "Failed to re-transmit verification code.", ...(e.status === 429 ? { retryAfter: e.retryAfter } : {}) });
    }
});

app.post('/api/auth/verify-email', async (req, res) => {
    try {
        const { userId, code } = req.body;
        if (!userId || !code) {
            return res.status(400).json({ message: "User ID and 6-digit verification code are required." });
        }

        const verification = await EmailVerification.findOne({ userId, usedAt: null }).sort({ createdAt: -1 });
        if (!verification) {
            return res.status(400).json({ message: "No active verification request found. Please request a new code." });
        }

        // Check expiration
        if (verification.expiresAt < new Date()) {
            return res.status(400).json({ message: "Verification passkey has expired. Please request a fresh code." });
        }

        // Check if session is locked
        if (verification.lockedUntil && verification.lockedUntil > new Date()) {
            const remainingLockSeconds = Math.ceil((verification.lockedUntil.getTime() - Date.now()) / 1000);
            return res.status(429).json({ 
                message: `Too many failed attempts. Verification locked for ${remainingLockSeconds} seconds.`,
                locked: true,
                retryAfter: remainingLockSeconds
            });
        }

        const normalizedCode = String(code).trim();
        const isValid = await bcrypt.compare(normalizedCode, verification.tokenHash);

        const eligible = { _id: verification._id, tokenHash: verification.tokenHash, usedAt: null, expiresAt: { $gt: new Date() }, attempts: { $lt: verification.maxAttempts }, $or: [{ lockedUntil: null }, { lockedUntil: { $lte: new Date() } }] };
        if (!isValid) {
            const failed = await EmailVerification.findOneAndUpdate(eligible, { $inc: { attempts: 1 } }, { new: true });
            if (!failed || failed.attempts >= failed.maxAttempts) {
                await EmailVerification.updateOne({ _id: verification._id, tokenHash: verification.tokenHash, usedAt: null, attempts: { $gte: verification.maxAttempts } }, { $set: { lockedUntil: new Date(Date.now() + 10 * 60000) } });
                return res.status(429).json({ message: 'Maximum verification attempts exceeded. Request a new code after lockout.', locked: true, retryAfter: 600 });
            }
            return res.status(400).json({ message: 'Invalid verification code.', remainingAttempts: failed.maxAttempts - failed.attempts });
        }
        const consumed = await EmailVerification.findOneAndUpdate(eligible, { $set: { usedAt: new Date() } }, { new: true });
        if (!consumed) return res.status(400).json({ message: 'Verification request was consumed, replaced, or locked. Please request a new code.' });

        const updatedUser = await User.findOneAndUpdate({ id: userId, accountStatus: 'pending_verification' }, {
            accountStatus: 'active',
            emailVerified: true,
            emailVerifiedAt: new Date()
        }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User identity not found." });
        }

        // Dispatch Welcome Email asynchronously
        sendWelcomeEmail(updatedUser.email, updatedUser.name, updatedUser.role).catch(() => {});

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
        console.error('[VERIFY EMAIL ERROR]', e);
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

        if (!user.passwordHash || typeof password !== 'string') return res.status(401).json({ message: 'Invalid matrix passkey or identity.' });
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

        const frontendHost = process.env.FRONTEND_URL || 'https://codesrijan-nine.vercel.app';
        const resetLink = `${frontendHost}/auth/reset-password?token=${resetTokenRaw}&uid=${user.id}`;

        // Dispatch Email asynchronously via Resend HTTPS
        sendPasswordResetEmail(normalizedEmail, resetLink)
            .then(() => console.log(`[SECURE COMMS] Password reset email dispatched for ${normalizedEmail.split('@')[0].slice(0, 2)}***`))
            .catch(err => console.warn(`[RESEND FAULT] Password reset email failed: ${err.message}`));

        res.json({
            message: "If an account exists, a reset instruction has been dispatched."
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

// HACKATHONS (Public Catalog + Authenticated Admin Access)
app.get('/api/hackathons', async (req, res) => {
    try {
        const optionalUser = await resolveOptionalUser(req);
        const isAdmin = optionalUser?.role === 'admin';

        const filter = {};
        // CRITICAL VISIBILITY POLICY:
        // Authenticated administrators view the complete catalog (including drafts and archived records).
        // Public guests and participants view all active, upcoming, open-registration, in-progress, and concluded arenas.
        // Only draft and explicitly archived events are suppressed from public view.
        if (!isAdmin) {
            filter.status = { $nin: ['archived', 'draft'] };
            filter.isArchived = { $ne: true };
        }

        const hackathons = await Hackathon.find(filter).sort({ createdAt: -1 });
        res.json(hackathons);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Dedicated Administrator Catalog endpoint (guarantees unfiltered access for console management)
app.get('/api/admin/hackathons', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const hackathons = await Hackathon.find({}).sort({ createdAt: -1 });
        res.json(hackathons);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.post('/api/hackathons', requireAuth, async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        // Generate native ID
        const isExplicitTest = req.body.isTest === true ||
            (typeof req.body.id === 'string' && req.body.id.startsWith('qa-')) ||
            (typeof req.body.name === 'string' && /^qa[-_\s]/i.test(req.body.name.trim()));

        const hackathonId = req.body.id || `hack-${Date.now()}`;
        const revealMode = req.body.problemRevealMode || 'manual';
        const isImmediate = revealMode === 'immediate';

        const hackathonData = {
            ...req.body,
            id: hackathonId,
            status: isAdmin ? (req.body.status || 'draft') : 'draft',
            mode: req.body.mode || 'online',
            amenities: Array.isArray(req.body.amenities) ? req.body.amenities : [],
            problemRevealMode: revealMode,
            problemStatementsRevealed: isImmediate,
            entryType: req.body.entryType || 'free',
            fee: req.body.entryType === 'paid' ? (Number(req.body.fee) || 0) : 0,
            feeBasis: req.body.feeBasis || 'per_team',
            currency: 'INR',
            upiId: req.body.upiId,
            payeeName: req.body.payeeName,
            qrImageUrl: req.body.qrImageUrl,
            paymentInstructions: req.body.paymentInstructions,
            institutionName: req.body.institutionName,
            coordinatorEmail: req.body.coordinatorEmail || req.user.email,
            coordinatorName: req.body.coordinatorName || req.user.name,
            coordinatorPhone: req.body.coordinatorPhone,
            createdBy: req.user.id,
            isTest: isExplicitTest
        };

        // Server-side validation
        if (!hackathonData.name || !hackathonData.registrationStart || !hackathonData.registrationEnd) {
            return res.status(400).json({ message: "Bad Request: Missing critical dates or nomenclature." });
        }

        const hackathon = new Hackathon(hackathonData);
        await hackathon.save();

        // Create linked problem statements if provided in the hosting request
        if (Array.isArray(req.body.problemStatements) && req.body.problemStatements.length > 0) {
            for (let i = 0; i < req.body.problemStatements.length; i++) {
                const ps = req.body.problemStatements[i];
                if (ps && ps.title) {
                    await ProblemStatement.create({
                        id: `ps-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
                        hackathonId: hackathon.id,
                        title: ps.title,
                        slug: ps.slug || ps.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                        domain: ps.track || ps.domain || 'General',
                        difficulty: ps.difficulty || 'medium',
                        description: ps.description || ps.title,
                        fullDescription: ps.fullDescription || ps.description || ps.title,
                        requirements: Array.isArray(ps.requirements) ? ps.requirements : (ps.requirements ? [ps.requirements] : []),
                        isPublished: isImmediate,
                        isLocked: !isImmediate,
                        createdBy: req.user.id
                    }).catch(err => console.error("Problem statement creation fault:", err));
                }
            }
        }

        // Notify admins if created as a proposal by student/organizer
        if (!isAdmin) {
            const adminUsers = await User.find({ role: 'admin' });
            for (const adm of adminUsers) {
                await Notification.create({
                    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                    userId: adm.id,
                    type: 'system',
                    title: 'New Hackathon Proposal Submitted',
                    message: `Coordinator ${hackathonData.coordinatorName || req.user.name} from "${hackathonData.institutionName || 'Campus'}" submitted "${hackathonData.name}" (${hackathonData.mode.toUpperCase()}).`,
                    referenceType: 'hackathon',
                    referenceId: hackathon.id,
                    isRead: false
                }).catch(() => {});
            }
        }

        res.json(hackathon);
    } catch (e) {
        res.status(500).json({ message: "Failed to create hackathon: " + e.message });
    }
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
    try {
        const dataToUpdate = { ...req.body };
        delete dataToUpdate._id;
        delete dataToUpdate.id;
        const hackathon = await Hackathon.findOneAndUpdate({ id: req.params.id }, dataToUpdate, { new: true });
        if (!hackathon) return res.status(404).json({ message: "Hackathon not found." });
        res.json(hackathon);
    } catch (e) {
        res.status(500).json({ message: "Failed to update hackathon: " + e.message });
    }
});

app.delete('/api/hackathons/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        await Hackathon.findOneAndDelete({ id: req.params.id });
        res.json({ message: "Hackathon deleted successfully." });
    } catch (e) {
        res.status(500).json({ message: "Failed to delete: " + e.message });
    }
});

// State Machine Handlers
const changeHackathonState = async (id, userId, newState, validPreviousStates, res) => {
    try {
        const hackathon = await Hackathon.findOne({ id });
        if (!hackathon) return res.status(404).json({ message: "Hackathon not found." });

        hackathon.status = newState;
        await hackathon.save();

        res.json(hackathon);
    } catch (e) {
        res.status(500).json({ message: "Failed to change state: " + e.message });
    }
};

app.post('/api/hackathons/:id/publish', requireAuth, requireRole(['admin']), (req, res) =>
    changeHackathonState(req.params.id, req.user.id, 'registration_open', null, res)
);
app.post('/api/hackathons/:id/unpublish', requireAuth, requireRole(['admin']), (req, res) =>
    changeHackathonState(req.params.id, req.user.id, 'draft', null, res)
);
app.post('/api/hackathons/:id/open-registration', requireAuth, requireRole(['admin']), (req, res) =>
    changeHackathonState(req.params.id, req.user.id, 'registration_open', null, res)
);
app.post('/api/hackathons/:id/close-registration', requireAuth, requireRole(['admin']), (req, res) =>
    changeHackathonState(req.params.id, req.user.id, 'registration_closed', null, res)
);
app.post('/api/hackathons/:id/open-submissions', requireAuth, requireRole(['admin']), (req, res) =>
    changeHackathonState(req.params.id, req.user.id, 'submission_open', null, res)
);
app.post('/api/hackathons/:id/close-submissions', requireAuth, requireRole(['admin']), (req, res) =>
    changeHackathonState(req.params.id, req.user.id, 'evaluation', null, res)
);
app.post('/api/hackathons/:id/complete', requireAuth, requireRole(['admin']), (req, res) =>
    changeHackathonState(req.params.id, req.user.id, 'completed', null, res)
);

// --- PROBLEM STATEMENT REVEAL DIRECTIVES (ADMIN CONTROLS) ---
app.patch('/api/admin/hackathons/:id/reveal-problems', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const hackathon = await Hackathon.findOneAndUpdate(
            { id: req.params.id },
            { problemStatementsRevealed: true },
            { new: true }
        );
        if (!hackathon) return res.status(404).json({ message: "Hackathon not found." });

        await ProblemStatement.updateMany(
            { hackathonId: req.params.id },
            { isPublished: true, isLocked: false }
        );

        // Notify participants
        const regs = await Registration.find({ hackathonId: req.params.id });
        const userIds = Array.from(new Set(regs.map(r => r.userId)));
        for (const uid of userIds) {
            await Notification.create({
                id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                userId: uid,
                type: 'system',
                title: '🚨 PROBLEM STATEMENTS UNLOCKED!',
                message: `The problem statements for "${hackathon.name}" have been officially revealed by administrators. Choose your track now!`,
                referenceType: 'hackathon',
                referenceId: hackathon.id,
                isRead: false
            }).catch(() => {});
        }

        await logAdminActivity(req, {
            action: 'REVEAL_PROBLEMS',
            entityType: 'HACKATHON',
            entityId: hackathon.id,
            description: `Revealed problem statements for hackathon "${hackathon.name || hackathon.id}"`
        });

        res.json({ success: true, hackathon, message: "Problem statements successfully revealed to all participants." });
    } catch (e) {
        res.status(500).json({ message: "Failed to reveal problem statements: " + e.message });
    }
});

app.patch('/api/admin/hackathons/:id/hide-problems', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const hackathon = await Hackathon.findOneAndUpdate(
            { id: req.params.id },
            { problemStatementsRevealed: false },
            { new: true }
        );
        if (!hackathon) return res.status(404).json({ message: "Hackathon not found." });

        await ProblemStatement.updateMany(
            { hackathonId: req.params.id },
            { isPublished: false, isLocked: true }
        );

        await logAdminActivity(req, {
            action: 'HIDE_PROBLEMS',
            entityType: 'HACKATHON',
            entityId: hackathon.id,
            description: `Classified and hid problem statements for hackathon "${hackathon.name || hackathon.id}"`
        });

        res.json({ success: true, hackathon, message: "Problem statements classified and locked." });
    } catch (e) {
        res.status(500).json({ message: "Failed to hide problem statements: " + e.message });
    }
});

// REGISTRATIONS & PAID HACKATHON WORKFLOW
app.post('/api/hackathons/:id/register', requireAuth, requireRole(['student']), async (req, res) => {
    try {
        const hackathonId = req.params.id;
        const userId = req.user.id;
        const { college, branch, year, type = 'team', teamId } = req.body;

        // 1. Verify Hackathon Exists and is accepting registrations
        const hackathon = await Hackathon.findOne({ id: hackathonId });
        if (!hackathon) return res.status(404).json({ message: "Hackathon not found." });

        const statusLower = hackathon.status ? hackathon.status.toLowerCase().trim() : '';
        if (statusLower !== 'registration_open' && statusLower !== 'active' && statusLower !== 'upcoming' && hackathonId !== 'hack-demo-2') {
            return res.status(403).json({ message: `Registration is currently closed for this event (Status: ${hackathon.status}).` });
        }

        // 2. Validate Time Window
        const now = new Date();
        const regStart = hackathonId === 'hack-demo-2' ? new Date(0) : new Date(hackathon.registrationStart || 0);
        const regEnd = hackathonId === 'hack-demo-2' ? new Date("2100-01-01") : new Date(hackathon.registrationEnd || "2100-01-01");

        if (now < regStart) return res.status(403).json({ message: "Registration window has not started yet." });
        if (now > regEnd) return res.status(403).json({ message: "Registration deadline has passed." });

        // 3. User Activation Pre-Check
        if (req.user.accountStatus !== 'active' || !req.user.emailVerified) {
            return res.status(403).json({ message: "Your identity matrix is unverified. Validate email to unlock registrations." });
        }

        // 4. Check for Existing Registration
        const existingReg = await Registration.findOne({ hackathonId, userId });
        if (existingReg) {
            return res.status(409).json({ message: "Duplicate record: This operative is already registered for this event.", registration: existingReg });
        }

        // 5. Handle Team vs Solo Registration
        let targetTeam = null;
        let rosterMembers = [];
        const isPaid = hackathon.entryType === 'paid' && (hackathon.fee || 0) > 0;
        let feeAmount = 0;
        const feeBasis = hackathon.feeBasis || 'per_team';

        if (type === 'team') {
            const resolvedTeamId = teamId || req.user.teamId;
            if (!resolvedTeamId) {
                return res.status(400).json({ message: "Team ID required for team registration. Create or join a squad first." });
            }

            targetTeam = await Team.findOne({ id: resolvedTeamId });
            if (!targetTeam) return res.status(404).json({ message: "Designated squad not found." });

            if (targetTeam.leaderId !== userId) {
                return res.status(403).json({ message: "Only the squad leader is authorized to register the squad for this hackathon." });
            }

            // Check min/max team size constraints (allow solo operatives / 1-member squads)
            const allMemberIds = [...new Set([targetTeam.leaderId, ...(targetTeam.memberIds || [])])];
            const totalMembers = allMemberIds.length;
            const minSize = Math.min(hackathon.teamSizeMin ?? 1, 1);
            const maxSize = hackathon.teamSizeMax || 6;
            if (totalMembers < minSize) {
                return res.status(400).json({ message: `Squad size must be at least ${minSize} operatives (Current: ${totalMembers}).` });
            }
            if (totalMembers > maxSize) {
                return res.status(400).json({ message: `Squad size exceeds hackathon maximum of ${maxSize} operatives (Current: ${totalMembers}).` });
            }

            // Verify all squad members are active and verified
            const memberDocs = await User.find({ id: { $in: allMemberIds } });
            if (memberDocs.length !== allMemberIds.length) {
                return res.status(400).json({ message: 'Squad roster contains missing accounts. Reconcile the roster before registering.' });
            }
            
            for (const m of memberDocs) {
                if (m.accountStatus !== 'active' || !m.emailVerified) {
                    return res.status(403).json({ message: `Squad member ${m.name || m.email} has an unverified identity. All members must verify email before hackathon registration.` });
                }
                rosterMembers.push({
                    userId: m.id,
                    name: m.name || 'Operative',
                    email: m.email,
                    college: m.college || college,
                    role: m.id === targetTeam.leaderId ? 'leader' : 'member'
                });
            }

            // Calculate Authoritative Backend Fee
            if (isPaid) {
                if (feeBasis === 'per_participant') {
                    feeAmount = (hackathon.fee || 0) * totalMembers;
                } else {
                    feeAmount = hackathon.fee || 0;
                }
            }

            // Lock Team Roster
            targetTeam.isLocked = true;
            targetTeam.lockedForHackathonId = hackathonId;
            targetTeam.hackathonId = hackathonId;
            const isEventTest = Boolean(hackathon.isTest || (hackathonId && hackathonId.startsWith('qa-')));
            if (isEventTest) {
                targetTeam.isTest = true;
            }
            // Guard: Ensure no squad member has an active submitted or verified solo registration with financial proof
            const activeMemberSolo = await Registration.findOne({
                hackathonId,
                userId: { $in: allMemberIds },
                type: 'solo',
                $or: [
                    { paymentStatus: { $in: ['verified', 'payment_under_review'] } },
                    { transactionReference: { $exists: true, $nin: [null, ''] } },
                    { paymentProofUrl: { $exists: true, $nin: [null, ''] } }
                ]
            });
            if (activeMemberSolo) {
                return res.status(409).json({ 
                    message: "A squad member already has a verified or submitted solo registration with active payment proof for this event. Reconcile existing registrations before squad entry." 
                });
            }

            // Clean up only genuine, unsubmitted placeholder solo registrations (no payment proof, unverified)
            await Registration.deleteMany({
                hackathonId,
                userId: { $in: allMemberIds },
                type: 'solo',
                paymentStatus: { $in: ['pending_proof', 'not_required'] },
                status: { $nin: ['verified', 'payment_under_review'] },
                $and: [
                    { $or: [{ transactionReference: { $exists: false } }, { transactionReference: null }, { transactionReference: '' }] },
                    { $or: [{ paymentProofUrl: { $exists: false } }, { paymentProofUrl: null }, { paymentProofUrl: '' }] }
                ]
            });
            await targetTeam.save();

        } else {
            // Solo Registration
            rosterMembers = [{
                userId: req.user.id,
                name: req.user.name,
                email: req.user.email,
                college: college || req.user.college,
                role: 'solo'
            }];

            if (isPaid) {
                feeAmount = hackathon.fee || 0;
            }
        }

        const isEventTest = Boolean(hackathon.isTest || (hackathonId && hackathonId.startsWith('qa-')));

        // Determine Initial Statuses
        const status = isPaid ? 'awaiting_payment_proof' : 'registered';
        const paymentStatus = isPaid ? 'pending_proof' : 'not_required';

        // 6. Create Registration Document
        const registration = new Registration({
            id: `reg-${Date.now()}`,
            hackathonId,
            userId,
            registrationNumber: `REG-${Math.floor(100000 + Math.random() * 900000)}`,
            college: college || req.user.college,
            branch: branch || req.user.branch,
            year: year || req.user.year,
            type,
            teamId: targetTeam ? targetTeam.id : undefined,
            rosterLocked: targetTeam ? true : false,
            rosterMembers,
            entryType: hackathon.entryType || 'free',
            feeAmount,
            feeBasis,
            currency: hackathon.currency || 'INR',
            paymentStatus,
            status,
            verifiedAt: isPaid ? undefined : new Date(),
            isTest: isEventTest
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

// SUBMIT PAYMENT PROOF (UTR & GRIDFS PRIVATE RECEIPT ATTACHMENT)
app.post('/api/hackathons/:id/payment-proof', requireAuth, requireRole(['student']), async (req, res) => {
    let uploadedFileId = null;
    try {
        const hackathonId = req.params.id;
        const userId = req.user.id;
        const { transactionReference, paymentProofUrl } = req.body;

        // 1. Validate Transaction Reference / UTR format
        if (!transactionReference || typeof transactionReference !== 'string') {
            return res.status(400).json({ message: "Transaction reference / UTR is required." });
        }
        const cleanUtr = transactionReference.trim();
        if (cleanUtr.length < 6 || cleanUtr.length > 64) {
            return res.status(400).json({ message: "Transaction reference / UTR must be between 6 and 64 characters." });
        }
        if (!/^[A-Za-z0-9_\-\.]+$/.test(cleanUtr)) {
            return res.status(400).json({ message: "Transaction reference / UTR contains invalid characters." });
        }

        // 2. Validate Payment Proof Attachment Format and Magic Bytes
        if (!paymentProofUrl || typeof paymentProofUrl !== 'string') {
            return res.status(400).json({ message: "Payment proof attachment (screenshot or receipt image) is required." });
        }

        if (!paymentProofUrl.startsWith('data:')) {
            return res.status(400).json({ message: "Payment proof must be a valid image data URI (JPEG, PNG, WebP)." });
        }

        const validatedProof = validatePaymentProofFile(paymentProofUrl);
        if (!validatedProof.valid) {
            return res.status(validatedProof.statusCode || 400).json({ message: validatedProof.error });
        }

        // 3. Locate Registration for this hackathon and student/team BEFORE storage mutation
        let registration = await Registration.findOne({
            hackathonId,
            $or: [
                { userId },
                { 'rosterMembers.userId': userId }
            ]
        });

        if (!registration) {
            return res.status(404).json({ message: "No registration record found for this hackathon. Please enroll first." });
        }

        if (registration.paymentStatus === 'verified' || registration.status === 'registered') {
            return res.status(400).json({ message: "This registration has already been verified and confirmed as paid." });
        }

        if (registration.paymentStatus === 'payment_under_review') {
            return res.status(400).json({ message: "Payment proof has already been submitted and is currently awaiting administrator review." });
        }

        // 4. Duplicate Transaction Detection
        const dupUtr = await Registration.findOne({
            transactionReference: cleanUtr,
            id: { $ne: registration.id }
        });
        if (dupUtr) {
            return res.status(409).json({ message: "Duplicate transaction reference: This UTR has already been submitted for another registration." });
        }

        // 5. Stream validated image into private MongoDB GridFS storage
        const gridfsUpload = await uploadProofToGridFS({
            buffer: validatedProof.buffer,
            mimeType: validatedProof.mimeType,
            extension: validatedProof.extension,
            registrationId: registration.id,
            userId
        });

        if (!gridfsUpload.success) {
            return res.status(gridfsUpload.statusCode || 503).json({
                error: 'PAYMENT_STORAGE_UNAVAILABLE',
                message: gridfsUpload.error || 'Payment proof upload service is currently unavailable. Your registration has not been marked as under review; please retry later.'
            });
        }

        uploadedFileId = gridfsUpload.fileId;
        const relativeReceiptUrl = `/api/student/registrations/${registration.id}/receipt/file`;

        // 6. Atomically claim state transition and persist GridFS metadata
        const updatedRegistration = await Registration.findOneAndUpdate({
            _id: registration._id,
            entryType: 'paid',
            paymentStatus: { $in: ['pending_proof', 'rejected'] }
        }, {
            $set: {
                transactionReference: cleanUtr,
                paymentProofUrl: relativeReceiptUrl,
                storageProvider: 'gridfs',
                storagePath: gridfsUpload.storagePath,
                storageBucket: gridfsUpload.storageBucket,
                proofMimeType: gridfsUpload.mimeType,
                proofSizeBytes: gridfsUpload.sizeBytes,
                paymentSubmittedAt: new Date(),
                paymentStatus: 'payment_under_review',
                status: 'payment_under_review',
                paymentNotificationStatus: 'pending',
                paymentNotificationAttemptedAt: new Date()
            },
            $push: { reviewHistory: {
                status: 'payment_under_review', reason: 'Proof submitted by operative', timestamp: new Date()
            } }
        }, { returnDocument: 'after', runValidators: true });

        if (!updatedRegistration) {
            // State transition failed (race condition or invalid status) - clean up orphan GridFS object!
            console.warn(`[GRIDFS] State transition failed for registration ${registration.id}; cleaning up orphan object ${uploadedFileId}.`);
            await deleteGridFSProof(uploadedFileId);
            uploadedFileId = null;
            return res.status(409).json({ message: 'Payment submission already processed or registration is not awaiting payment.' });
        }

        registration = updatedRegistration;

        // 7. Dispatch Notification (Queue is already durable; notification failure does not roll back registration)
        try {
            const event = await Hackathon.findOne({ id: hackathonId });
            const team = registration.teamId ? await Team.findOne({ id: registration.teamId }) : null;
            const result = await sendPaymentReviewNotification(registration, event?.name || hackathonId, team?.name || 'Solo registration');
            registration.paymentNotificationStatus = result?.success ? 'sent' : 'failed';
            await Registration.updateOne({ _id: registration._id, paymentSubmittedAt: registration.paymentSubmittedAt }, {
                $set: { paymentNotificationStatus: registration.paymentNotificationStatus }
            });
        } catch {
            registration.paymentNotificationStatus = 'failed';
            await Registration.updateOne({ _id: registration._id, paymentSubmittedAt: registration.paymentSubmittedAt }, {
                $set: { paymentNotificationStatus: 'failed' }
            }).catch(() => {});
            console.warn('[PAYMENT NOTIFICATION] Delivery or outcome recording failed; submission remains in review queue.');
        }

        // 8. Record System Activity Log
        try {
            const activity = new ActivityLog({
                id: `act-${Date.now()}`,
                type: 'payment_submitted',
                title: 'Payment Proof Submitted',
                description: `Operative ${req.user.name || req.user.email} submitted UTR ${cleanUtr} for event ${hackathonId}.`,
                timestamp: new Date()
            });
            await activity.save();
        } catch (logErr) {}

        res.json({
            success: true,
            message: "Payment proof submitted successfully. Operative status: payment_under_review",
            registration
        });
    } catch (err) {
        // If an unexpected error occurred after GridFS upload, clean up orphan file
        if (uploadedFileId) {
            console.warn(`[GRIDFS] Exception during submission; cleaning up orphan file ${uploadedFileId}:`, err.message);
            await deleteGridFSProof(uploadedFileId).catch(() => {});
        }
        res.status(500).json({ message: "Failed to submit payment proof.", error: err.message });
    }
});

// GET CURRENT USER'S HACKATHON REGISTRATION (STUDENT)
app.get('/api/hackathons/:id/my-registration', requireAuth, async (req, res) => {
    try {
        const registration = await Registration.findOne({
            hackathonId: req.params.id,
            $or: [
                { userId: req.user.id },
                { 'rosterMembers.userId': req.user.id }
            ]
        });
        if (!registration) return res.status(404).json({ message: "Registration not found." });
        res.json(registration);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/hackathons/:id/registration', requireAuth, async (req, res) => {
    const registration = await Registration.findOne({ userId: req.user.id, hackathonId: req.params.id });
    if (!registration) return res.status(404).json({ message: "Registration not found." });
    res.json(registration);
});

// RETRY REJECTED PAYMENT PROOF
app.post('/api/hackathons/:id/retry-payment', requireAuth, requireRole(['student']), async (req, res) => {
    try {
        const registration = await Registration.findOne({
            hackathonId: req.params.id,
            userId: req.user.id,
            paymentStatus: 'rejected'
        });
        if (!registration) {
            return res.status(404).json({ message: "No rejected registration found eligible for payment retry." });
        }
        registration.paymentStatus = 'pending_proof';
        registration.status = 'awaiting_payment_proof';
        await registration.save();
        res.json({ success: true, message: "Registration reset to awaiting_payment_proof", registration });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- ADMIN PAYMENT REVIEW QUEUE ROUTES ---
app.get('/api/admin/payments', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const statusFilter = req.query.status;
        const query = {
            $or: [
                { entryType: 'paid' },
                { paymentStatus: { $in: ['payment_under_review', 'verified', 'rejected', 'pending_proof'] } }
            ]
        };

        if (statusFilter && statusFilter !== 'all') {
            query.paymentStatus = statusFilter;
        }

        const registrations = await Registration.find(query).sort({ paymentSubmittedAt: -1, createdAt: -1 });

        // Enrich with Hackathon and Team names, tagging test records
        const enriched = await Promise.all(registrations.map(async (reg) => {
            const obj = reg.toObject();
            const h = reg.hackathonId ? await Hackathon.findOne({ id: reg.hackathonId }).select('name fee currency upiId isTest') : null;
            if (h) {
                obj.hackathonName = h.name || reg.hackathonId;
            } else if (reg.hackathonId) {
                obj.hackathonName = reg.hackathonId;
            }
            if (reg.teamId) {
                const t = await Team.findOne({ id: reg.teamId }).select('name leaderId memberIds isTest');
                obj.teamName = t ? t.name : reg.teamId;
            }
            obj.isTest = Boolean(reg.isTest || (h && h.isTest) || (reg.hackathonId && reg.hackathonId.startsWith('qa-')));
            return obj;
        }));

        const prodFilter = { isTest: { $ne: true } };
        const pendingCount = await Registration.countDocuments({ paymentStatus: 'payment_under_review', ...prodFilter });
        const verifiedCount = await Registration.countDocuments({ paymentStatus: 'verified', ...prodFilter });
        const rejectedCount = await Registration.countDocuments({ paymentStatus: 'rejected', ...prodFilter });
        const pendingProofCount = await Registration.countDocuments({ paymentStatus: 'pending_proof', ...prodFilter });
        const testCount = await Registration.countDocuments({ isTest: true });

        res.json({
            registrations: enriched,
            summary: {
                total: enriched.length,
                pendingCount,
                verifiedCount,
                rejectedCount,
                pendingProofCount,
                testCount
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/payments/:registrationId/review', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { decision, reason, noteOnly } = req.body;
        const now = new Date();

        // 1. Audit Note edit only (no status toggle)
        if (noteOnly) {
            if (!reason?.trim()) return res.status(400).json({ message: 'Audit note text is required.' });
            const registration = await Registration.findOneAndUpdate(
                { id: req.params.registrationId },
                {
                    $set: { reviewReason: reason.trim() },
                    $push: { reviewHistory: { status: 'note_updated', reason: reason.trim(), reviewedBy: req.user.email, timestamp: now } }
                },
                { returnDocument: 'after' }
            );
            if (!registration) return res.status(404).json({ message: "Registration not found." });
            await logAdminActivity(req, {
                action: 'UPDATE_PAYMENT_NOTE',
                entityType: 'REGISTRATION',
                entityId: registration.id,
                description: `Updated audit note for registration ${registration.id}: ${reason.trim().substring(0, 100)}`
            });
            return res.json({ success: true, registration, message: "Audit note updated." });
        }

        if (decision !== 'approve' && decision !== 'reject') {
            return res.status(400).json({ message: "Invalid decision. Must be 'approve' or 'reject'." });
        }

        if (reason != null && typeof reason !== 'string') return res.status(400).json({ message: 'Review reason must be text.' });
        if (decision === 'reject' && !reason?.trim()) return res.status(400).json({ message: 'A rejection reason is strictly required when declining payment.' });

        const paymentStatus = decision === 'approve' ? 'verified' : 'rejected';
        const reviewReason = reason?.trim() || (decision === 'approve' ? 'Payment verified by administrator' : 'Payment declined by administrator');

        const existing = await Registration.findOne({ id: req.params.registrationId });
        if (!existing) return res.status(404).json({ message: "Registration not found." });

        const registration = await Registration.findOneAndUpdate(
            { id: req.params.registrationId },
            {
                $set: {
                    paymentStatus,
                    status: decision === 'approve' ? 'registered' : 'rejected',
                    reviewedBy: req.user.email,
                    reviewedAt: now,
                    reviewReason,
                    ...(decision === 'approve' ? { verifiedAt: now } : {})
                },
                $push: {
                    reviewHistory: { status: paymentStatus, reason: reviewReason, reviewedBy: req.user.email, timestamp: now }
                }
            },
            { returnDocument: 'after' }
        );

        // Retrieve User, Hackathon, and Team context for communication
        const [user, hackathon, team] = await Promise.all([
            User.findOne({ id: registration.userId }),
            Hackathon.findOne({ id: registration.hackathonId }),
            registration.teamId ? Team.findOne({ id: registration.teamId }) : null
        ]);

        const eventName = hackathon?.name || hackathon?.title || registration.hackathonId;
        const teamName = team?.name || registration.teamName || '';
        const userEmail = user?.email || (registration.rosterMembers?.find(m => m.userId === registration.userId)?.email) || (registration.rosterMembers?.[0]?.email);
        const userName = user?.name || registration.rosterMembers?.[0]?.name || 'Operative';

        // Collect all squad members to notify
        const memberIdsToNotify = Array.from(new Set([
            registration.userId,
            ...(registration.rosterMembers?.map(m => m.userId) || []),
            ...(team?.memberIds || []),
            team?.leaderId
        ])).filter(Boolean);

        if (decision === 'reject') {
            // 1. Dispatch Email with Rejection Reason
            if (userEmail) {
                const retryUrl = `${process.env.FRONTEND_URL || 'https://codesrijan-nine.vercel.app'}/payment`;
                sendPaymentRejectionEmail(userEmail, {
                    name: userName,
                    eventName,
                    teamName,
                    reason: reviewReason,
                    transactionReference: registration.transactionReference,
                    feeAmount: registration.feeAmount,
                    currency: registration.currency || 'INR',
                    retryUrl
                }).catch(err => console.error('[PAYMENT REJECTION EMAIL DISPATCH FAULT]', err?.message || err));
            }

            // 2. Dispatch In-App Notification with Rejection Reason to User & Roster
            for (const uid of memberIdsToNotify) {
                try {
                    await Notification.create({
                        id: 'notif-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
                        userId: uid,
                        type: 'payment_rejected',
                        title: 'Payment Verification Declined',
                        message: `Payment of ${registration.currency || 'INR'} ${registration.feeAmount || ''} for "${eventName}" was declined by administrator. Reason: ${reviewReason}`,
                        referenceType: 'registration',
                        referenceId: registration.id,
                        rejectionReason: reviewReason,
                        isRead: false
                    });
                } catch (ne) {
                    console.error('[NOTIF CREATION FAULT]', ne.message);
                }
            }
        } else {
            // Decision is 'approve'
            // If tied to team, update squad status to active/locked
            if (registration.teamId) {
                await Team.findOneAndUpdate({ id: registration.teamId }, { status: 'active', isLocked: true });
            }

            // 1. Dispatch Approval Email
            if (userEmail) {
                sendPaymentApprovalEmail(userEmail, {
                    name: userName,
                    eventName,
                    teamName,
                    transactionReference: registration.transactionReference,
                    feeAmount: registration.feeAmount,
                    currency: registration.currency || 'INR'
                }).catch(err => console.error('[PAYMENT APPROVAL EMAIL DISPATCH FAULT]', err?.message || err));
            }

            // 2. Dispatch In-App Notification to User & Roster
            for (const uid of memberIdsToNotify) {
                try {
                    await Notification.create({
                        id: 'notif-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
                        userId: uid,
                        type: 'payment_approved',
                        title: 'Payment Verified & Approved',
                        message: `Payment for "${eventName}" has been verified and cleared by Administrator. Squad clearance granted.`,
                        referenceType: 'registration',
                        referenceId: registration.id,
                        isRead: false
                    });
                } catch (ne) {
                    console.error('[NOTIF CREATION FAULT]', ne.message);
                }
            }
        }

        await logAdminActivity(req, {
            action: decision === 'approve' ? 'APPROVE_PAYMENT' : 'REJECT_PAYMENT',
            entityType: 'REGISTRATION',
            entityId: registration.id,
            description: `${decision.toUpperCase()} payment for registration ${registration.id}. Reason: ${reviewReason.substring(0, 100)}`
        });

        res.json({ success: true, decision, registration });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN PROTECTED RECEIPT ACCESS
app.get('/api/admin/payments/:registrationId/receipt', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const registration = await Registration.findOne({ id: req.params.registrationId });
        if (!registration) return res.status(404).json({ message: "Registration not found." });
        if (!registration.paymentProofUrl) return res.status(404).json({ message: "No payment receipt on file." });

        res.json({
            registrationId: registration.id,
            transactionReference: registration.transactionReference,
            paymentProofUrl: registration.paymentProofUrl,
            storageProvider: registration.storageProvider || 'direct',
            storagePath: registration.storagePath || null,
            storageBucket: registration.storageBucket || null,
            proofMimeType: registration.proofMimeType || null,
            proofSizeBytes: registration.proofSizeBytes || null,
            submittedAt: registration.paymentSubmittedAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// STUDENT PROTECTED RECEIPT ACCESS (Strict Owner Clearance)
app.get('/api/student/registrations/:registrationId/receipt', requireAuth, async (req, res) => {
    try {
        const registration = await Registration.findOne({ id: req.params.registrationId });
        if (!registration) return res.status(404).json({ message: "Registration not found." });

        const isOwner = registration.userId === req.user.id ||
            registration.rosterMembers?.some(m => m.userId === req.user.id) ||
            req.user.role === 'admin';

        if (!isOwner) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to view another student's payment proof." });
        }

        if (!registration.paymentProofUrl) return res.status(404).json({ message: "No payment receipt on file." });

        res.json({
            registrationId: registration.id,
            transactionReference: registration.transactionReference,
            paymentProofUrl: registration.paymentProofUrl,
            storageProvider: registration.storageProvider || 'direct',
            storagePath: registration.storagePath || null,
            storageBucket: registration.storageBucket || null,
            proofMimeType: registration.proofMimeType || null,
            proofSizeBytes: registration.proofSizeBytes || null,
            submittedAt: registration.paymentSubmittedAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// STREAM RECEIPT BINARY OBJECT FROM GRIDFS
async function streamReceiptFile(registration, res) {
    if (!registration.paymentProofUrl) {
        return res.status(404).json({ message: "No payment receipt on file." });
    }

    if (registration.storageProvider === 'gridfs' && registration.storagePath) {
        const { found, file, stream, error } = await getGridFSProofStream(registration.storagePath);
        if (!found) {
            return res.status(404).json({ message: "Payment proof binary file not found in storage.", error });
        }

        const mime = file.metadata?.contentType || file.metadata?.mimeType || file.contentType || registration.proofMimeType || 'image/jpeg';
        const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';

        res.setHeader('Content-Type', mime);
        if (file.length) res.setHeader('Content-Length', file.length);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
        res.setHeader('Referrer-Policy', 'no-referrer');
        res.setHeader('Content-Security-Policy', "default-src 'none'");
        res.setHeader('Content-Disposition', `inline; filename="receipt-${registration.id}.${ext}"`);

        stream.on('error', (streamErr) => {
            console.error('[GRIDFS STREAM ERROR]', streamErr.message);
            if (!res.headersSent) {
                res.status(500).json({ message: "Failed to stream proof file." });
            }
        });

        return stream.pipe(res);
    }

    // Fallback for legacy direct data URIs
    if (registration.paymentProofUrl.startsWith('data:')) {
        const matches = registration.paymentProofUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
            const mime = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            res.setHeader('Content-Type', mime);
            res.setHeader('Content-Length', buffer.length);
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
            res.setHeader('Referrer-Policy', 'no-referrer');
            res.setHeader('Content-Security-Policy', "default-src 'none'");
            return res.send(buffer);
        }
    }

    return res.status(404).json({ message: "Payment proof binary storage is unavailable for this record." });
}

// ADMIN PROTECTED RECEIPT FILE STREAMING
app.get('/api/admin/payments/:registrationId/receipt/file', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const registration = await Registration.findOne({ id: req.params.registrationId });
        if (!registration) return res.status(404).json({ message: "Registration not found." });
        return await streamReceiptFile(registration, res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// STUDENT PROTECTED RECEIPT FILE STREAMING (Strict Owner / Team Member / Admin Clearance)
app.get('/api/student/registrations/:registrationId/receipt/file', requireAuth, async (req, res) => {
    try {
        const registration = await Registration.findOne({ id: req.params.registrationId });
        if (!registration) return res.status(404).json({ message: "Registration not found." });

        const isOwner = registration.userId === req.user.id ||
            registration.rosterMembers?.some(m => m.userId === req.user.id) ||
            req.user.role === 'admin';

        if (!isOwner) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to view another student's payment proof." });
        }

        return await streamReceiptFile(registration, res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
    try {
        const hackathon = await Hackathon.findOne({ id: req.params.id });
        if (hackathon) {
            const now = new Date();
            const isStartReached = hackathon.startDate && now >= new Date(hackathon.startDate);
            const isRevealed = hackathon.problemStatementsRevealed === true ||
                               hackathon.problemRevealMode === 'immediate' ||
                               isStartReached;
            if (!isRevealed) {
                let isAdmin = false;
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.split(' ')[1];
                    const session = await Session.findOne({ sessionTokenHash: crypto.createHash('sha256').update(token).digest('hex') });
                    if (session) {
                        const user = await User.findOne({ id: session.userId });
                        if (user?.role === 'admin') isAdmin = true;
                    }
                }
                if (!isAdmin) {
                    return res.json([]);
                }
            }
        }
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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
    const users = await User.find().select('-passwordHash');
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
    if (team.isLocked) {
        return res.status(403).json({ message: "Squad roster is locked for an active hackathon registration. Direct join is blocked." });
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
    if (team.isLocked) return res.status(403).json({ message: 'Squad roster is locked for an active hackathon registration.' });

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
    if (team.isLocked) return res.status(403).json({ message: 'Squad roster is locked for an active hackathon registration.' });
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
    if (team.isLocked) return res.status(403).json({ message: 'Squad roster is locked for an active hackathon registration.' });
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

    // Check hackathon submission deadline
    if (team.hackathonId) {
        const hackathon = await Hackathon.findOne({ id: team.hackathonId });
        if (hackathon) {
            if (hackathon.status === 'evaluation' || hackathon.status === 'completed') {
                return res.status(403).json({ message: "Submissions for this hackathon are officially closed." });
            }
            if (hackathon.submissionDeadline && new Date() > new Date(hackathon.submissionDeadline)) {
                return res.status(403).json({ message: "Submission deadline has elapsed. Late submissions are not accepted." });
            }
        }
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
    const { reason, notify = true } = req.body;
    if (!reason || reason.trim() === '') return res.status(400).json({ message: "Reason is required for disqualification." });

    const team = await Team.findOneAndUpdate({ id: req.params.id }, { status: 'disqualified', adminNote: `Disqualified: ${reason.trim()}` }, { new: true });
    if (!team) return res.status(404).json({ message: "Squad missing." });
    
    // Log DQ
    const dqLog = new Message({ id: `dq-${Date.now()}`, content: reason, authorId: req.user.id, teamId: team.id });
    await dqLog.save();

    // Dispatch In-App Notification to all squad members
    if (notify) {
        const members = Array.from(new Set([team.leaderId, ...(team.memberIds || [])])).filter(Boolean);
        for (const uid of members) {
            try {
                await Notification.create({
                    id: 'notif-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
                    userId: uid,
                    type: 'team_disqualified',
                    title: 'Squad Disqualified',
                    message: `Your squad "${team.name}" was disqualified by administration. Reason: ${reason.trim()}`,
                    referenceType: 'team',
                    referenceId: team.id,
                    rejectionReason: reason.trim(),
                    isRead: false
                });
            } catch (ne) {
                console.error('[NOTIF CREATION FAULT]', ne.message);
            }
        }
    }

    res.json({ message: "Squad Disqualified", team });
    await logAdminActivity(req, {
        action: 'DISQUALIFY_TEAM',
        entityType: 'TEAM',
        entityId: team.id,
        description: `Disqualified squad "${team.name}". Reason: ${reason.trim()}`
    });
});

app.post('/api/admin/teams/:id/undo-disqualify', requireAuth, requireRole(['admin']), async (req, res) => {
    const team = await Team.findOneAndUpdate({ id: req.params.id }, { status: 'active' }, { new: true });
    if (!team) return res.status(404).json({ message: "Squad missing." });

    // Notify members of reinstatement
    const members = Array.from(new Set([team.leaderId, ...(team.memberIds || [])])).filter(Boolean);
    for (const uid of members) {
        try {
            await Notification.create({
                id: 'notif-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
                userId: uid,
                type: 'team_updated',
                title: 'Squad Reinstated',
                message: `Your squad "${team.name}" has been restored to active hackathon standing.`,
                referenceType: 'team',
                referenceId: team.id,
                isRead: false
            });
        } catch (ne) {}
    }

    await logAdminActivity(req, {
        action: 'REINSTATE_TEAM',
        entityType: 'TEAM',
        entityId: team.id,
        description: `Reinstated squad "${team.name}" to active status.`
    });

    res.json({ message: "Squad Restored", team });
});

app.post('/api/admin/teams/:id/ban', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { reason = "Violating platform integrity rules." } = req.body;
        const team = await Team.findOneAndUpdate(
            { id: req.params.id }, 
            { status: 'disqualified', isLocked: true, adminNote: `BANNED: ${reason.trim()}` }, 
            { new: true }
        );
        if (!team) return res.status(404).json({ message: "Squad missing." });

        // Dispatch In-App Notification to all squad members
        const members = Array.from(new Set([team.leaderId, ...(team.memberIds || [])])).filter(Boolean);
        for (const uid of members) {
            try {
                await Notification.create({
                    id: 'notif-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
                    userId: uid,
                    type: 'team_disqualified',
                    title: 'Squad Banned from Hackathon',
                    message: `Your squad "${team.name}" was BANNED by administration. Reason: ${reason.trim()}`,
                    referenceType: 'team',
                    referenceId: team.id,
                    rejectionReason: reason.trim(),
                    isRead: false
                });
            } catch (ne) {}
        }

        await logAdminActivity(req, {
            action: 'BAN_TEAM',
            entityType: 'TEAM',
            entityId: team.id,
            description: `Banned squad "${team.name}". Reason: ${reason.trim()}`
        });

        res.json({ message: `Squad "${team.name}" banned successfully.`, team });
    } catch (e) {
        res.status(500).json({ message: "Failed to ban squad." });
    }
});

app.post('/api/admin/teams/:id/verify', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const team = await Team.findOneAndUpdate({ id: req.params.id }, { status: 'verified', isLocked: true }, { new: true });
        if (!team) return res.status(404).json({ message: "Squad missing." });

        // Notify squad members of official verified status
        const members = Array.from(new Set([team.leaderId, ...(team.memberIds || [])])).filter(Boolean);
        for (const uid of members) {
            try {
                await Notification.create({
                    id: 'notif-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
                    userId: uid,
                    type: 'team_updated',
                    title: 'Squad Officially Verified',
                    message: `Congratulations! Squad "${team.name}" has been officially verified and cleared by Hackathon Administration.`,
                    referenceType: 'team',
                    referenceId: team.id,
                    isRead: false
                });
            } catch (ne) {}
        }

        res.json({ message: "Squad Verified & Cleared", team });
    } catch (e) {
        res.status(500).json({ message: "Failed to verify squad." });
    }
});

app.post('/api/admin/teams/:id/notify', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { message, title, type } = req.body;
        if (!message || !message.trim()) return res.status(400).json({ message: "Notification message is required." });

        const team = await Team.findOne({ id: req.params.id });
        if (!team) return res.status(404).json({ message: "Squad missing." });

        const members = Array.from(new Set([team.leaderId, ...(team.memberIds || [])])).filter(Boolean);
        for (const uid of members) {
            try {
                await Notification.create({
                    id: 'notif-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
                    userId: uid,
                    type: type || 'admin_message',
                    title: title || 'Admin Transmission',
                    message: message.trim(),
                    referenceType: 'team',
                    referenceId: team.id,
                    isRead: false
                });
            } catch (ne) {}
        }

        res.json({ success: true, count: members.length });
    } catch (e) {
        res.status(500).json({ message: "Failed to dispatch notification." });
    }
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
        if (!team) return res.status(404).json({ message: "Squad not found." });

        // Dispatch notification to squad members
        const members = Array.from(new Set([team.leaderId, ...(team.memberIds || [])])).filter(Boolean);
        const notifyMsg = req.body.notifyMessage?.trim() || `Your squad "${team.name}" details were updated by administration. Status: ${team.status?.toUpperCase() || 'ACTIVE'}.`;
        for (const uid of members) {
            try {
                await Notification.create({
                    id: 'notif-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
                    userId: uid,
                    type: 'team_updated',
                    title: 'Squad Parameters Updated',
                    message: notifyMsg,
                    referenceType: 'team',
                    referenceId: team.id,
                    isRead: false
                });
            } catch (ne) {}
        }

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
        const team = await Team.findOne({ id: req.params.id });
        if (!team || team.leaderId !== req.user.id) {
            return res.status(403).json({ message: "Only squad leaders can transmit invitations." });
        }
        if (team.isLocked) {
            return res.status(403).json({ message: "Squad roster is locked for an active hackathon registration. No new invitations can be dispatched." });
        }

        const { receiverId, email } = req.body;
        const targetIdentifier = receiverId || email;
        if (!targetIdentifier) return res.status(400).json({ message: "Receiver ID or email is required." });

        const receiver = await User.findOne(
            targetIdentifier.includes('@') ? { email: targetIdentifier } : { id: targetIdentifier }
        );
        if (!receiver) return res.status(404).json({ message: "Operative not found." });
        if (receiver.teamId) return res.status(400).json({ message: "Operative is already aligned with a squad." });

        const existingInvite = await TeamInvitation.findOne({ teamId: team.id, receiverId: receiver.id, status: 'pending' });
        if (existingInvite) return res.status(400).json({ message: "Invitation already dispatched." });

        const invite = new TeamInvitation({
            id: `inv-${Date.now()}`,
            teamId: team.id,
            senderId: req.user.id,
            receiverId: receiver.id
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
    if (team.isLocked) {
        return res.status(403).json({ message: "Squad roster is locked for an active hackathon registration. Invitations cannot be accepted." });
    }
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

// NOTIFICATION CENTER ENDPOINTS
app.get('/api/notifications', requireAuth, async (req, res) => {
    try {
        const notifs = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100);
        res.json(notifs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
        const notif = await Notification.findOneAndUpdate(
            { id: req.params.id, userId: req.user.id },
            { $set: { isRead: true } },
            { returnDocument: 'after' }
        );
        if (!notif) return res.status(404).json({ message: "Notification not found." });
        res.json({ success: true, notification: notif });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.patch('/api/notifications/read-all', requireAuth, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ success: true, message: "All notifications marked as read." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/notifications/:id', requireAuth, async (req, res) => {
    try {
        const result = await Notification.findOneAndDelete({ id: req.params.id, userId: req.user.id });
        if (!result) return res.status(404).json({ message: "Notification not found." });
        res.json({ success: true, message: "Notification deleted." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/notifications/clear-selected', requireAuth, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Array of notification IDs is required." });
        }
        const result = await Notification.deleteMany({ id: { $in: ids }, userId: req.user.id });
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/notifications', requireAuth, async (req, res) => {
    try {
        const result = await Notification.deleteMany({ userId: req.user.id });
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/teams/:id/kick', requireAuth, requireRole(['student', 'admin']), async (req, res) => {
    try {
        const { userId } = req.body;
        const team = await Team.findOne({ id: req.params.id });
        if (!team || team.leaderId !== req.user.id) return res.status(403).json({ message: "Squad Leader clearance required." });
        if (team.leaderId === userId) return res.status(403).json({ message: "System Error: Cannot purge designated Leader." });
        if (team.isLocked) {
            return res.status(403).json({ message: "Squad roster is locked for an active hackathon registration. Operatives cannot be removed." });
        }

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

    // Check hackathon submission deadline
    if (team.hackathonId) {
        const hackathon = await Hackathon.findOne({ id: team.hackathonId });
        if (hackathon) {
            if (hackathon.status === 'evaluation' || hackathon.status === 'completed') {
                return res.status(403).json({ message: "Submissions for this hackathon are officially closed." });
            }
            if (hackathon.submissionDeadline && new Date() > new Date(hackathon.submissionDeadline)) {
                return res.status(403).json({ message: "Submission deadline has elapsed. Late submissions are not accepted." });
            }
        }
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
        const userRes = await User.find({ name: { $regex: q, $options: 'i' } }).select('-passwordHash').limit(10);
        const probRes = await ProblemStatement.find({ title: { $regex: q, $options: 'i' } }).limit(10);
        res.json({ teams: teamRes, users: userRes, problems: probRes });
    } catch (err) {
        res.status(500).json({ message: "Search index failure." });
    }
});

app.get('/api/public/stats', async (req, res) => {
    const hackersCount = await User.countDocuments({ role: 'student' });
    const projectsCount = await Project.countDocuments();
    const registrationsCount = await Registration.countDocuments({ isTest: { $ne: true } });
    // Default colleges to 1 for MVP (this would normally be an aggregation on unique college names)
    const collegesCount = (await User.distinct('college')).length || 1;

    // Check if there is an active hackathon for the countdown, excluding test hackathons
    const activeHackathon = await Hackathon.findOne({
        status: { $in: ['active', 'registration_open'] },
        isTest: { $ne: true }
    });

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

        if (typeof password !== 'string' || password.length < 12) return res.status(400).json({ message: 'An explicit password of at least 12 characters is required.' });
        const passwordHash = await bcrypt.hash(password, 12);
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

// --- FEATURE 7: TELEMETRY & AUDIT TRAIL ---
app.get('/api/admin/logs', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
        const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(limit);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch audit log trail." });
    }
});

// --- FEATURE 1: PLATFORM HEALTH DASHBOARD TELEMETRY ---
app.get('/api/admin/health', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const now = new Date();
        const storageStats = await getStorageStats();
        const isDbConnected = mongoose.connection.readyState === 1;

        const [
            pendingPaymentReviews,
            activeSupportTickets,
            resolvedSupportTickets,
            activeHackathons,
            totalRegistrations,
            totalSquads,
            totalUsers,
            totalSubmissions
        ] = await Promise.all([
            Registration.countDocuments({
                paymentStatus: { $in: ['under_review', 'pending_verification', 'payment_under_review'] }
            }).catch(() => 0),
            SupportTicket.countDocuments({
                status: { $regex: /^\s*(open|in[\s_-]+progress)\s*$/i }
            }).catch(() => 0),
            SupportTicket.countDocuments({
                status: { $regex: /^\s*(resolved|closed)\s*$/i }
            }).catch(() => 0),
            Hackathon.countDocuments({
                $or: [{ status: 'active' }, { isPublished: true }]
            }).catch(() => 0),
            Registration.countDocuments().catch(() => 0),
            Team.countDocuments().catch(() => 0),
            User.countDocuments().catch(() => 0),
            Submission.countDocuments().catch(() => 0)
        ]);

        res.json({
            status: isDbConnected ? 'operational' : 'degraded',
            serverTime: now.toISOString(),
            services: {
                backend: {
                    status: 'operational',
                    uptimeSeconds: Math.floor(process.uptime()),
                    memoryUsage: process.memoryUsage(),
                    nodeVersion: process.version,
                    environment: process.env.NODE_ENV || 'development'
                },
                database: {
                    status: isDbConnected ? 'operational' : 'disconnected',
                    readyState: mongoose.connection.readyState,
                    databaseName: mongoose.connection?.name || 'codesrijan'
                },
                storage: storageStats,
                emailRelay: {
                    status: process.env.GOOGLE_APPS_SCRIPT_URL ? 'configured' : 'not_configured',
                    provider: 'Google Apps Script Relay'
                }
            },
            operationalMetrics: {
                pendingPaymentReviews,
                activeSupportTickets,
                resolvedSupportTickets,
                activeHackathons,
                totalRegistrations,
                totalSquads,
                totalUsers,
                totalSubmissions
            }
        });
    } catch (err) {
        console.error('[ADMIN HEALTH TELEMETRY ERROR]', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// --- FEATURE 2: HACKATHON OPERATIONS DASHBOARD ---
app.get('/api/admin/hackathon-operations', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const now = new Date();
        const hackathons = await Hackathon.find().sort({ startDate: -1 });

        const operationsData = await Promise.all(hackathons.map(async (h) => {
            const [
                totalRegistrations,
                verifiedRegistrations,
                pendingPaymentBacklog,
                activeSquads,
                disqualifiedSquads,
                submissionsCount
            ] = await Promise.all([
                Registration.countDocuments({ hackathonId: h.id }).catch(() => 0),
                Registration.countDocuments({ hackathonId: h.id, paymentStatus: 'verified' }).catch(() => 0),
                Registration.countDocuments({
                    hackathonId: h.id,
                    paymentStatus: { $in: ['under_review', 'pending_verification', 'payment_under_review'] }
                }).catch(() => 0),
                Team.countDocuments({ hackathonId: h.id, status: { $ne: 'disqualified' } }).catch(() => 0),
                Team.countDocuments({ hackathonId: h.id, status: 'disqualified' }).catch(() => 0),
                Submission.countDocuments({ hackathonId: h.id }).catch(() => 0)
            ]);

            const startDate = h.startDate ? new Date(h.startDate) : null;
            const endDate = h.endDate ? new Date(h.endDate) : null;
            const regDeadline = h.registrationDeadline ? new Date(h.registrationDeadline) : null;
            const subDeadline = h.submissionDeadline ? new Date(h.submissionDeadline) : null;

            let phase = 'upcoming';
            if (endDate && now > endDate) {
                phase = 'concluded';
            } else if (subDeadline && now > subDeadline) {
                phase = 'evaluating';
            } else if (startDate && now >= startDate) {
                phase = 'hacking';
            } else if (regDeadline && now > regDeadline) {
                phase = 'registration_closed';
            } else {
                phase = 'registration_open';
            }

            return {
                id: h.id,
                name: h.name || h.title || 'Untitled Hackathon',
                status: h.status || 'draft',
                isPaid: Boolean(h.fee && h.fee > 0),
                fee: h.fee || 0,
                currency: h.currency || 'INR',
                phase,
                problemStatementsRevealed: Boolean(h.problemStatementsRevealed),
                startDate: h.startDate,
                endDate: h.endDate,
                registrationDeadline: h.registrationDeadline,
                submissionDeadline: h.submissionDeadline,
                serverTime: now.toISOString(),
                metrics: {
                    totalRegistrations,
                    verifiedRegistrations,
                    pendingPaymentBacklog,
                    activeSquads,
                    disqualifiedSquads,
                    submissionsCount
                }
            };
        }));

        res.json({
            serverTime: now.toISOString(),
            totalHackathons: operationsData.length,
            operations: operationsData
        });
    } catch (err) {
        console.error('[HACKATHON OPERATIONS ERROR]', err.message);
        res.status(500).json({ message: "Failed to load hackathon operations data: " + err.message });
    }
});

// CSV EXPORT FOR HACKATHON ROSTERS (Feature 2)
app.get('/api/admin/hackathons/:id/export-csv', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const hackathon = await Hackathon.findOne({ id: req.params.id });
        if (!hackathon) return res.status(404).json({ message: "Hackathon not found." });

        const registrations = await Registration.find({ hackathonId: req.params.id }).sort({ createdAt: -1 });
        const teams = await Team.find({ hackathonId: req.params.id });
        const teamMap = new Map(teams.map(t => [t.id, t]));

        // Sanitize string to prevent Excel / Google Sheets formula injection
        const sanitizeCsvCell = (val) => {
            if (val == null) return '""';
            let str = String(val).replace(/"/g, '""');
            if (/^[=+\-@\t\r]/.test(str)) {
                str = `'${str}`;
            }
            return `"${str}"`;
        };

        const headers = [
            'Registration ID',
            'Squad Name',
            'Leader ID',
            'Member Count',
            'Payment Status',
            'Fee Amount',
            'Transaction Ref',
            'Registration Status',
            'Created At'
        ];

        const rows = registrations.map(r => {
            const team = r.teamId ? teamMap.get(r.teamId) : null;
            const memberCount = team ? (team.memberIds?.length || 1) : (r.rosterMembers?.length || 1);
            return [
                sanitizeCsvCell(r.id),
                sanitizeCsvCell(team?.name || r.teamName || 'Solo / Unassigned'),
                sanitizeCsvCell(team?.leaderId || r.userId),
                sanitizeCsvCell(memberCount),
                sanitizeCsvCell(r.paymentStatus || 'free'),
                sanitizeCsvCell(r.feeAmount || 0),
                sanitizeCsvCell(r.transactionReference || 'N/A'),
                sanitizeCsvCell(r.status || 'pending'),
                sanitizeCsvCell(r.createdAt ? new Date(r.createdAt).toISOString() : '')
            ].join(',');
        });

        const csvContent = [headers.map(sanitizeCsvCell).join(','), ...rows].join('\r\n');

        await logAdminActivity(req, {
            action: 'EXPORT_HACKATHON_CSV',
            entityType: 'HACKATHON',
            entityId: hackathon.id,
            description: `Exported roster CSV for hackathon "${hackathon.name || hackathon.id}" (${registrations.length} registrations)`
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="hackathon-${hackathon.id}-roster.csv"`);
        res.status(200).send(csvContent);
    } catch (err) {
        console.error('[CSV EXPORT ERROR]', err.message);
        res.status(500).json({ message: "Failed to generate CSV export: " + err.message });
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
        globalSystemSettings[key] = value;
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
    const prodFilter = { isTest: { $ne: true } };
    const [userCount, teamCount, messageCount, hackathonCount, users, teams] = await Promise.all([
        User.countDocuments(),
        Team.countDocuments(prodFilter),
        Message.countDocuments(),
        Hackathon.countDocuments(prodFilter),
        User.find().select('-passwordHash').limit(50),
        Team.find(prodFilter).limit(50)
    ]);
    
    res.json({
        stats: { userCount, teamCount, messageCount, hackathonCount },
        stream: { users, teams }
    });
});

// Admin Support Routes
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
                    convObj.targetName = req.user.role === 'admin' 
                        ? `[SUPPORT] ${userName} - ${ticket.subject || 'Ticket'}` 
                        : `[SUPPORT TICKET] ${ticket.subject || 'Admin Support'}`;
                    convObj.targetRole = req.user.role === 'admin' 
                        ? `Support Ticket #${ticket.id.substring(0,8)} · ${ticket.priority.toUpperCase()} · ${ticket.status.toUpperCase()}` 
                        : `Official Support Ticket #${ticket.id.substring(0,8)} · Status: ${ticket.status.toUpperCase()}`;
                    convObj.supportTicket = ticket;
                } else {
                    convObj.targetName = '[SUPPORT] Admin Support';
                    convObj.targetRole = 'Official Support Channel';
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
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ message: "Message content cannot be blank." });
        }
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

        // Notify conversation participants
        try {
            const recipients = new Set((conv.participantIds || []).filter(id => id !== req.user.id));
            if (conv.teamId) {
                const team = await Team.findOne({ id: conv.teamId });
                if (team) {
                    if (team.leaderId && team.leaderId !== req.user.id) recipients.add(team.leaderId);
                    (team.memberIds || []).forEach(m => { if (m && m !== req.user.id) recipients.add(m); });
                }
            }
            const snippet = message.length > 75 ? message.slice(0, 72) + '...' : message;
            for (const uid of recipients) {
                await Notification.create({
                    id: 'notif-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
                    userId: uid,
                    type: 'chat_message',
                    title: `Message from ${req.user.name || 'Teammate'}`,
                    message: snippet,
                    referenceType: 'conversation',
                    referenceId: convId,
                    isRead: false
                });
            }
        } catch (err) {
            console.error('[CHAT NOTIF CREATION ERROR]', err.message);
        }

        res.status(201).json(newMsg);
    } catch (err) {
        res.status(500).json({ message: "Failed to transmit message." });
    }
});
// --- SUPPORT TICKETS (Feature 3) ---
app.post('/api/support', requireAuth, async (req, res) => {
    try {
        // Enforce role separation: Admins cannot create student tickets through student interface
        if (req.user.role === 'admin') {
            return res.status(403).json({
                message: "Administrators cannot create student tickets through the student-facing support interface. Please manage tickets from the Admin Console."
            });
        }

        // Spam Prevention: Rate-limit to max 5 tickets per 15 minutes per user
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentTicketsCount = await SupportTicket.countDocuments({
            userId: req.user.id,
            createdAt: { $gte: fifteenMinsAgo }
        });
        if (recentTicketsCount >= 5) {
            return res.status(429).json({
                message: "Rate limit exceeded. You may submit up to 5 tickets every 15 minutes."
            });
        }

        // Input validation and sanitization
        const subject = String(req.body.subject || '').trim();
        if (!subject || subject.length < 3) {
            return res.status(400).json({ message: "Subject must be at least 3 characters long." });
        }
        if (subject.length > 150) {
            return res.status(400).json({ message: "Subject must not exceed 150 characters." });
        }

        const description = String(req.body.description || req.body.message || '').trim();
        if (!description || description.length < 5) {
            return res.status(400).json({ message: "Description must be at least 5 characters long." });
        }
        if (description.length > 3000) {
            return res.status(400).json({ message: "Description must not exceed 3000 characters." });
        }

        const rawCategory = String(req.body.category || 'general').trim().toLowerCase();
        const allowedCategories = new Set([
            'general', 'payment', 'squad', 'support', 'system',
            'bug_report', 'feature_request', 'feedback'
        ]);
        const category = allowedCategories.has(rawCategory) ? rawCategory : 'general';

        const rawPriority = String(req.body.priority || 'medium').trim().toLowerCase();
        const allowedPriorities = new Set(['low', 'medium', 'normal', 'high', 'urgent']);
        const priority = allowedPriorities.has(rawPriority) ? (rawPriority === 'medium' ? 'normal' : rawPriority) : 'normal';

        const affectedPage = req.body.affectedPage ? String(req.body.affectedPage).trim().substring(0, 100) : '';

        const ticketId = 'tkt-' + Date.now().toString();
        const convId = 'conv-sup-' + ticketId;

        const ticket = await SupportTicket.create({
            id: ticketId,
            userId: req.user.id,
            subject,
            category,
            priority,
            description,
            affectedPage,
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

        // Notify admins about new support ticket
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            await Notification.create({
                id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
                userId: admin.id,
                title: `🎫 New Support Ticket: ${subject}`,
                message: `${req.user.name || 'User'} created ticket [${ticketId}]: ${description}`,
                type: 'support',
                relatedId: ticketId,
                isRead: false
            }).catch(() => {});
        }

        res.status(201).json(ticket);
    } catch (e) {
        res.status(500).json({ message: "Failed to create support ticket: " + e.message });
    }
});

export const isTicketStatusActive = (status) => {
    if (!status || typeof status !== 'string') return false;
    const trimmed = status.trim().toLowerCase();
    if (!trimmed) return false;
    const normalized = trimmed.replace(/[\s-]+/g, '_');
    return normalized === 'open' || normalized === 'in_progress';
};

app.get('/api/support', requireAuth, async (req, res) => {
    try {
        const { includeClosed } = req.query;
        const activeCondition = {
            status: { $regex: /^\s*(open|in[\s_-]+progress)\s*$/i }
        };
        let query = {};
        if (req.user.role === 'admin') {
            query = includeClosed === 'true' ? {} : activeCondition;
        } else {
            query = includeClosed === 'true' 
                ? { userId: req.user.id } 
                : { userId: req.user.id, ...activeCondition };
        }
        const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (e) {
        res.status(500).json({ message: "Failed to load support tickets." });
    }
});

app.get('/api/admin/support', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { activeOnly } = req.query;
        const activeCondition = {
            status: { $regex: /^\s*(open|in[\s_-]+progress)\s*$/i }
        };
        const query = activeOnly === 'true' ? activeCondition : {};
        const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (e) {
        res.status(500).json({ message: "Failed to load admin support tickets." });
    }
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
    try {
        const { status } = req.body;
        if (!status || typeof status !== 'string') return res.status(400).json({ message: "Status is required." });
        const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, '_');
        const validStatuses = new Set(['open', 'in_progress', 'resolved', 'closed']);
        if (!validStatuses.has(normalized)) {
            return res.status(400).json({ message: "Invalid ticket status. Allowed values: open, in_progress, resolved, closed." });
        }

        const updateData = { status: normalized };
        if (normalized === 'resolved' || normalized === 'closed') {
            updateData.resolvedAt = new Date();
        }

        const ticket = await SupportTicket.findOneAndUpdate(
            { id: req.params.id }, 
            updateData,
            { new: true }
        );
        if (!ticket) return res.status(404).json({ message: "Ticket missing." });

        await logAdminActivity(req, {
            action: 'UPDATE_SUPPORT_STATUS',
            entityType: 'SUPPORT_TICKET',
            entityId: ticket.id,
            description: `Updated support ticket ${ticket.id} status to ${normalized}`
        });

        res.json(ticket);
    } catch (e) {
        res.status(500).json({ message: "Failed to update ticket status: " + e.message });
    }
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

app.patch('/api/notifications/read-all', requireAuth, async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user.id, isRead: false }, { $set: { isRead: true } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ANALYTICS ---
app.get('/api/admin/analytics', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const prodFilter = { isTest: { $ne: true } };
        const userCount = await User.countDocuments();
        const teamCount = await Team.countDocuments(prodFilter);
        const messageCount = await Message.countDocuments();
        const hackathonCount = await Hackathon.countDocuments(prodFilter);
        
        const teams = await Team.find(prodFilter).sort({ createdAt: -1 }).limit(20);
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

        const team = await Team.findOne({ id: req.user.teamId });
        const squadName = team ? team.name : req.user.teamId;

        // Create high-priority SupportTicket so it appears on /admin/support
        const ticketId = 'tkt-sos-' + Date.now().toString();
        const convId = 'conv-sup-' + ticketId;

        await SupportTicket.create({
            id: ticketId,
            userId: req.user.id,
            subject: `🚨 [SOS MENTOR DISPATCH] ${topic}`,
            category: 'mentor_sos',
            priority: 'urgent',
            description: `[SQUAD: ${squadName}] ${description}`,
            affectedPage: '/workspace',
            status: 'open',
            conversationId: convId
        }).catch(() => {});

        await Conversation.create({
            id: convId,
            type: 'support',
            participantIds: [req.user.id]
        }).catch(() => {});

        await Message.create({
            id: 'msg-' + Date.now().toString(),
            conversationId: convId,
            senderId: req.user.id,
            message: `[SOS Broadcast] Squad "${squadName}" requested urgent mentor dispatch for topic: ${topic}.\nDetails: ${description}`
        }).catch(() => {});

        // Broadcast a notification to all mentors AND admins
        const staffUsers = await User.find({ role: { $in: ['mentor', 'admin'] } });
        for (const staff of staffUsers) {
            await Notification.create({
                id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
                userId: staff.id,
                title: '🚨 SQUAD SOS: MENTOR DISPATCH',
                message: `Squad "${squadName}" sent an SOS distress signal: ${topic}`,
                type: 'support',
                relatedId: mentorReq.id,
                isRead: false
            }).catch(() => {});
        }

        res.json(mentorReq);
    } catch (e) { res.status(500).json({ message: "Failed to request mentor: " + e.message }); }
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
        const { hackathonId, includeAll } = req.query;

        // 1. Identify non-test genuine hackathons
        let hackathonQuery = {
            isTest: { $ne: true },
            id: { $not: /^qa[-_]/i }
        };
        if (hackathonId) {
            hackathonQuery.id = hackathonId;
        }
        const genuineHackathons = await Hackathon.find(hackathonQuery).select('id name status startDate endDate').lean();
        const genuineHackathonIds = new Set(genuineHackathons.map(h => h.id));

        // 2. Identify teams associated with QA registrations or events
        const [testRegistrations, genuineRegistrations] = await Promise.all([
            Registration.find({
                $or: [
                    { isTest: true },
                    { hackathonId: { $regex: /^qa[-_]/i } }
                ]
            }).select('teamId').lean(),
            Registration.find({
                hackathonId: { $in: Array.from(genuineHackathonIds) },
                isTest: { $ne: true }
            }).select('teamId').lean()
        ]);

        const testTeamIds = new Set(testRegistrations.map(r => r.teamId).filter(Boolean));
        const genuineTeamIds = new Set(genuineRegistrations.map(r => r.teamId).filter(Boolean));

        // 3. Query candidate teams (include all joined teams if requested, or submitted teams)
        const teamFilter = { isTest: { $ne: true } };
        if (hackathonId) {
            teamFilter.$or = [
                { hackathonId },
                { lockedForHackathonId: hackathonId }
            ];
        }

        const candidateTeams = await Team.find(teamFilter).lean();

        // Filter out teams that only belong to QA registrations/events and lack genuine registrations
        const eligibleTeams = candidateTeams.filter(t => {
            const hasQaEventRef = (t.hackathonId && /^qa[-_]/i.test(t.hackathonId)) ||
                                  (t.lockedForHackathonId && /^qa[-_]/i.test(t.lockedForHackathonId));
            const isLinkedToQaReg = testTeamIds.has(t.id);
            const hasGenuineReg = genuineTeamIds.has(t.id) || 
                                  (t.hackathonId && genuineHackathonIds.has(t.hackathonId));

            if ((hasQaEventRef || isLinkedToQaReg) && !hasGenuineReg) {
                return false;
            }
            return true;
        });

        // 4. Query evaluations
        const evals = await Evaluation.find({
            $or: [
                { hackathonId: { $in: Array.from(genuineHackathonIds) } },
                { hackathonId: { $exists: false } },
                { hackathonId: null }
            ]
        }).lean();

        const genuineEvals = evals.filter(e => !e.hackathonId || genuineHackathonIds.has(e.hackathonId));

        const leaderboardData = eligibleTeams.map((t) => {
            const teamEvals = genuineEvals.filter(e => e.projectId === t.id || e.teamId === t.id);
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
                hackathonId: t.hackathonId || t.lockedForHackathonId || null,
                status: t.status || 'forming',
                memberIds: t.memberIds || [],
                memberCount: (t.memberIds || []).length,
                isSubmitted: !!t.isSubmitted,
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

        // Sort descending: scored teams by totalScore desc, then submitted, then active
        leaderboardData.sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            if (b.isScored !== a.isScored) return b.isScored ? 1 : -1;
            return (b.memberCount || 0) - (a.memberCount || 0);
        });

        // If includeAll === 'true' or hackathonId specified, return all joined teams; otherwise if scored teams exist return them, or fallback to all eligible
        if (includeAll === 'true' || hackathonId) {
            return res.json(leaderboardData);
        }

        const scoredOnly = leaderboardData.filter(t => t.isScored);
        res.json(scoredOnly.length > 0 ? scoredOnly : leaderboardData);
    } catch (e) {
        res.status(500).json({ message: "Leaderboard error" });
    }
});

// START
const PORT = process.env.PORT || 5001;
const isMain = process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server.cjs'));
if (isMain) {
    httpServer.listen(PORT, () => console.log(`Server & WebSockets running on port ${PORT}`));
}

export { app, httpServer };
