import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { User } from '../models/index.js';
import { Session } from '../models/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
let firebaseAdminApp = null;
try {
    const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        const existingApps = getApps();
        if (existingApps.length > 0) {
            firebaseAdminApp = existingApps[0];
        } else {
            firebaseAdminApp = initializeApp({
                credential: cert(serviceAccount)
            });
        }
        console.log('[FIREBASE ADMIN] Initialized successfully with Service Account Key.');
    } else if (process.env.FIREBASE_PRIVATE_KEY) {
        firebaseAdminApp = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            })
        });
        console.log('[FIREBASE ADMIN] Initialized via environment variables.');
    } else {
        console.warn('[FIREBASE ADMIN] No Service Account Key found. Firebase token verification fallback enabled.');
    }
} catch (err) {
    console.error('[FIREBASE ADMIN] Initialization warning:', err.message);
}

export const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Unauthorized. Missing bearer token." });
        }

        const token = authHeader.split(' ')[1];

        // 1. Try Firebase Admin ID Token Verification
        if (firebaseAdminApp) {
            try {
                const firebaseAuth = getAuth(firebaseAdminApp);
                const decodedToken = await firebaseAuth.verifyIdToken(token);
                if (decodedToken && decodedToken.email) {
                    let user = await User.findOne({ email: decodedToken.email.toLowerCase() });
                    if (!user) {
                        // Provision Firebase User in Mongo DB
                        user = new User({
                            id: `usr-${Date.now()}`,
                            name: decodedToken.name || decodedToken.email.split('@')[0],
                            email: decodedToken.email.toLowerCase(),
                            role: decodedToken.email.toLowerCase().startsWith('admin.') ? 'admin' : 'student',
                            accountStatus: 'active',
                            emailVerified: true
                        });
                        await user.save();
                    }

                    req.user = user;
                    req.firebaseToken = decodedToken;
                    return next();
                }
            } catch (fbErr) {
                // Not a valid Firebase ID Token or token expired, fallback to session token lookup
            }
        }

        // 2. Legacy Session Token lookup
        const sessionTokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const session = await Session.findOne({ sessionTokenHash, revokedAt: null });

        if (!session || session.expiresAt < new Date()) {
            return res.status(401).json({ message: "Session expired or invalid." });
        }

        const user = await User.findOne({ id: session.userId });
        if (!user || user.accountStatus === 'suspended') {
            return res.status(403).json({ message: "Account disabled or suspended." });
        }

        req.user = user;
        req.session = session;

        next();
    } catch (e) {
        return res.status(401).json({ message: "Session verification failed.", error: e.message });
    }
};

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized." });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden. Insufficient clearance." });
        }
        next();
    };
};
