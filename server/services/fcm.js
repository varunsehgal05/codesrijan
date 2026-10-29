import { getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

/**
 * Dispatches an FCM push notification to target device tokens.
 * Spark Tier Free Policy — Zero cost.
 */
export async function sendPushNotification(tokens, { title, body, data = {} }) {
    if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) {
        return { successCount: 0, failureCount: 0, staleTokens: [] };
    }

    const tokenList = Array.isArray(tokens) ? tokens.filter(Boolean) : [tokens];
    if (tokenList.length === 0) {
        return { successCount: 0, failureCount: 0, staleTokens: [] };
    }

    const apps = getApps();
    if (apps.length === 0) {
        console.warn('[FCM BACKEND] Firebase Admin App not initialized. Push deferred.');
        return { successCount: 0, failureCount: tokenList.length, staleTokens: [] };
    }

    try {
        const messaging = getMessaging(apps[0]);
        const payload = {
            notification: {
                title: title || 'CodeSrijan Alert',
                body: body || ''
            },
            data: {
                ...data,
                click_action: data.url || '/dashboard'
            },
            tokens: tokenList
        };

        const response = await messaging.sendEachForMulticast(payload);
        const staleTokens = [];

        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                const errorCode = resp.error?.code;
                if (
                    errorCode === 'messaging/invalid-registration-token' ||
                    errorCode === 'messaging/registration-token-not-registered'
                ) {
                    staleTokens.push(tokenList[idx]);
                }
            }
        });

        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
            staleTokens
        };
    } catch (err) {
        console.warn('[FCM BACKEND] Push dispatch error:', err.message);
        return { successCount: 0, failureCount: tokenList.length, staleTokens: [] };
    }
}
