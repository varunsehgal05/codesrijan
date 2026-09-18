import crypto from 'crypto';
import { User } from '../models/index.js';
import { Session } from '../models/auth.js';

export const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Unauthorized. Missing bearer token." });
        }

        const token = authHeader.split(' ')[1];

        // Fast sha256 lookup
        const sessionTokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const session = await Session.findOne({ sessionTokenHash, revokedAt: null });

        if (!session || session.expiresAt < new Date()) {
            return res.status(401).json({ message: "Session expired or invalid." });
        }

        const user = await User.findOne({ id: session.userId });
        if (!user || user.accountStatus !== 'active') {
            return res.status(403).json({ message: "Account disabled or suspended." });
        }

        // Inject user context into request
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
