import crypto from 'crypto';
import { ActivityLog, Notification } from '../models/secondary.js';
import { User } from '../models/index.js';

// Comprehensive pattern list for 18+, explicit sexual, abusive, and severe NSFW keywords
const EXPLICIT_18_PLUS_PATTERNS = [
    /\b(porn|pornography|xxx|nsfw|nude|nudes|boobs|penis|vagina|blowjob|handjob|anal|dildo|cum|slut|whore|bitch|bastard|fuck|fucker|fucking|fucked|asshole|cunt|dick|pussy|cock)\b/i,
    /\b(sex|sexy|horny|orgasm|erotic|hardcore|incest|rape|pedophile|striptease)\b/i,
    /\b(chutiya|bhenchod|madarchod|gand|bhosdike|lauda|gaand|harami)\b/i
];

/**
 * Checks message string for prohibited 18+ or explicit terms.
 * Returns { flagged: boolean, matchedTerms: string[] }
 */
export function detectProhibitedContent(text) {
    if (!text || typeof text !== 'string') {
        return { flagged: false, matchedTerms: [] };
    }

    const matched = new Set();
    for (const pattern of EXPLICIT_18_PLUS_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(m => matched.add(m.toLowerCase()));
        }
    }

    return {
        flagged: matched.size > 0,
        matchedTerms: Array.from(matched)
    };
}

/**
 * Dispatches an authoritative moderation incident log and administrative alert
 * when 18+ content is detected in Admin or SrijanBot channels.
 */
export async function handleContentModerationIncident({ req, channel, message, conversationId = null, flaggedTerms = [] }) {
    try {
        const user = req?.user || { id: 'anonymous', name: 'Anonymous Operative', email: 'unauthenticated' };
        const ipAddress = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req?.socket?.remoteAddress || req?.ip || '127.0.0.1';
        const userAgent = req?.headers?.['user-agent'] || 'unknown';

        const termsStr = flaggedTerms.join(', ');
        const sanitizedSnippet = message && message.length > 150 ? message.slice(0, 147) + '...' : (message || '');

        // 1. Immutable Audit Record in ActivityLog
        const logId = `mod-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        await ActivityLog.create({
            id: logId,
            userId: user.email || user.id,
            role: user.role || 'student',
            action: '18_PLUS_CONTENT_VIOLATION',
            entityType: 'COMMUNICATION_SECURITY',
            entityId: conversationId || channel,
            description: `[18+ CONTENT FLAGGED] User "${user.name}" (${user.email}) posted explicit terms in ${channel}. Flagged terms: [${termsStr}]. Message: "${sanitizedSnippet}". Origin IP: ${ipAddress}`,
            ipAddress,
            userAgent
        });

        // 2. Dispatch High-Priority Alert to all Administrators
        const admins = await User.find({ role: 'admin' }).lean();
        const alertNotifications = admins.map(admin => ({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            userId: admin.id,
            type: 'admin_security_alert',
            title: '🚨 18+ CONTENT VIOLATION FLAGGED',
            message: `User ${user.name} (${user.email}) posted 18+ prohibited content in ${channel}. Flagged: [${termsStr}]. Inspect audit ledger.`,
            link: '/admin/logs',
            createdAt: new Date(),
            isRead: false
        }));

        if (alertNotifications.length > 0) {
            await Notification.insertMany(alertNotifications);
        }

        console.warn(`[MODERATION AUDIT] 18+ violation logged for ${user.email} in ${channel}: [${termsStr}]`);
        return { success: true, logId };
    } catch (err) {
        console.error('[MODERATION ERROR] Failed to record moderation incident:', err.message);
        return { success: false, error: err.message };
    }
}
