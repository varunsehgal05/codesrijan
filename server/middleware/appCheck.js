import { getApps } from 'firebase-admin/app';
import { getAppCheck } from 'firebase-admin/app-check';

/**
 * Firebase App Check Verification Middleware (Controlled Rollout Mode)
 * Checks x-firebase-appcheck header, validates token with Firebase Admin SDK,
 * attaches verification status to request without blocking legitimate users during rollout.
 */
export async function verifyAppCheck(req, res, next) {
    const appCheckToken = req.headers['x-firebase-appcheck'];

    if (!appCheckToken) {
        req.appCheck = { verified: false, reason: 'missing_header' };
        return next();
    }

    const apps = getApps();
    if (apps.length === 0) {
        req.appCheck = { verified: false, reason: 'firebase_admin_uninitialized' };
        return next();
    }

    try {
        const appCheck = getAppCheck(apps[0]);
        const appCheckClaims = await appCheck.verifyToken(appCheckToken);
        req.appCheck = { verified: true, appId: appCheckClaims.app_id };
    } catch (err) {
        req.appCheck = { verified: false, error: err.message };
        console.warn('[APP CHECK BACKEND] Token verification notice:', err.message);
    }

    next();
}
