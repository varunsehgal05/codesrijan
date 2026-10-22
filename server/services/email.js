import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Helper to sanitize recipient for diagnostic logs
const maskEmail = (email) => {
    if (!email || typeof email !== 'string' || !email.includes('@')) return 'unknown';
    const [user, domain] = email.split('@');
    return `${user.slice(0, 2)}***@${domain}`;
};

// Singleton Transporter Cache
let transporterInstance = null;
let customTransporter = null;
let customAppsScriptDispatcher = null;

/**
 * Allows automated test suites to inject a mocked transporter or Apps Script dispatcher
 */
export const setTestTransporter = (mock) => {
    customTransporter = mock;
};

export const setTestAppsScriptDispatcher = (mockFn) => {
    customAppsScriptDispatcher = mockFn;
};

// Only server configuration chooses the destination and review link.
export const sendPaymentReviewNotification = async (registration, eventName, registrationName) => {
    const to = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
    try {
        if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { success: false };
        const base = new URL(process.env.FRONTEND_URL);
        if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password) return { success: false };
        return await dispatchViaAppsScript('payment_review_notification', to, {
            eventName,
            registrationName,
            registrationReference: registration.id,
            feeAmount: registration.feeAmount,
            currency: registration.currency,
            transactionReference: registration.transactionReference,
            submittedAt: new Date(registration.paymentSubmittedAt).toISOString(),
            reviewUrl: new URL('/admin/payments', base).href
        }) || { success: false };
    } catch {
        return { success: false };
    }
};

/**
 * Builds or returns the cached Nodemailer Gmail SMTP transporter
 */
const getTransporter = () => {
    if (customTransporter) return customTransporter;

    const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

    if (!user || !pass) {
        return null;
    }

    if (!transporterInstance) {
        const port = parseInt(process.env.SMTP_PORT || '465', 10);
        const secure = port === 465;

        transporterInstance = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port,
            secure,
            auth: {
                user: user.trim(),
                pass: pass.trim().replace(/\s+/g, '') // remove spaces from Google App Passwords
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,
            socketTimeout: 15000 // 15 seconds
        });
    }

    return transporterInstance;
};

const getSenderIdentity = () => {
    const from = process.env.EMAIL_FROM || process.env.GMAIL_USER || process.env.EMAIL_USER;
    if (from && from.includes('<')) return from;
    if (from) return `CodeSrijan <${from.trim()}>`;
    return 'CodeSrijan <codesrijan@gmail.com>';
};

/**
 * Dispatches email via authenticated Google Apps Script Web App HTTPS Relay
 * Avoids outbound SMTP port blocking on Render Free ($0 cost)
 */
export const dispatchViaAppsScript = async (template, to, data = {}) => {
    if (customAppsScriptDispatcher) {
        return await customAppsScriptDispatcher(template, to, data);
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secret = process.env.APPS_SCRIPT_SECRET || process.env.CODESRIJAN_RELAY_SECRET;

    if (!scriptUrl || !secret) {
        return null; // Not configured
    }

    try {
        const timestamp = Date.now();
        const nonce = crypto.randomBytes(16).toString('hex');
        const cleanTo = (to || '').trim();
        const cleanTemplate = (template || '').trim();

        const messageToSign = `${timestamp}.${nonce}.${cleanTemplate}.${cleanTo}.${JSON.stringify(data)}`;
        const signature = crypto.createHmac('sha256', secret).update(messageToSign).digest('hex');

        const payload = {
            auth: {
                timestamp,
                nonce,
                signature
            },
            template: cleanTemplate,
            to: cleanTo,
            data
        };

        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'CodeSrijan-Backend-Relay/1.0'
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(20000)
        });

        const resData = await response.json();

        if (resData && resData.success) {
            console.log('[APPS SCRIPT RELAY] Email dispatched to %s via MailApp (Quota remaining: %s)', maskEmail(to), resData.remainingQuota ?? 'N/A');
            return {
                success: true,
                messageId: `apps-script-${resData.timestamp || timestamp}`,
                remainingQuota: resData.remainingQuota
            };
        } else {
            const errStr = 'Relay rejected email request';
            console.error('[APPS SCRIPT RELAY FAULT] Relay returned error for %s: %s', maskEmail(to), errStr);
            return {
                success: false,
                error: errStr
            };
        }
    } catch (err) {
        console.error('[APPS SCRIPT RELAY FAULT] HTTP call to Apps Script failed for %s', maskEmail(to));
        return {
            success: false,
            error: 'Apps Script relay failure'
        };
    }
};

/**
 * Dispatches 6-digit OTP verification email
 * Prioritizes Google Apps Script Relay (port-free HTTPS), falls back to Gmail SMTP
 */
export const sendVerificationEmail = async (to, code) => {
    // 1. Try Google Apps Script HTTPS Relay if configured
    if (process.env.APPS_SCRIPT_URL || customAppsScriptDispatcher) {
        const relayResult = await dispatchViaAppsScript('verification_otp', to, { code });
        if (relayResult) return relayResult;
    }

    // 2. Fall back to Gmail SMTP via Nodemailer
    const htmlContent = `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0B0F14; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <tr>
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #121A26; border: 2px solid #223249; border-radius: 8px; overflow: hidden;">
                        <tr>
                            <td style="background-color: #182334; border-bottom: 2px solid #223249; padding: 24px; text-align: center;">
                                <h1 style="margin: 0; color: #F4F7FB; font-size: 24px; font-weight: 900; letter-spacing: 3px; font-family: monospace;">CODESRIJAN</h1>
                                <p style="margin: 8px 0 0 0; color: #22D3EE; font-size: 11px; font-family: monospace; letter-spacing: 2px;">IDENTITY_VERIFICATION_PROTOCOL</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 32px;">
                                <h2 style="margin: 0 0 16px 0; color: #F4F7FB; font-size: 18px; font-weight: 700; text-transform: uppercase;">Incoming Verification Transmission</h2>
                                <p style="margin: 0 0 24px 0; color: #A9B5C5; font-size: 15px; line-height: 1.6;">
                                    This address was registered on the CodeSrijan Mainframe. To confirm authorization and finalize your operative account, input your secure 6-digit passkey:
                                </p>
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0B0F14; border: 2px dashed #7C3AED; border-radius: 6px;">
                                    <tr>
                                        <td align="center" style="padding: 28px;">
                                            <p style="margin: 0 0 8px 0; color: #A9B5C5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Secure Passkey</p>
                                            <h1 style="margin: 0; color: #22D3EE; font-size: 44px; font-family: monospace; font-weight: 900; letter-spacing: 10px;">${code}</h1>
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin: 24px 0 0 0; color: #64748B; font-size: 13px; line-height: 1.5;">
                                    This verification passkey will expire in <strong>15 minutes</strong> and can only be used once. Never disclose this transmission to anyone.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #0B0F14; border-top: 1px solid #223249; padding: 20px; text-align: center;">
                                <p style="margin: 0; color: #64748B; font-size: 12px; font-family: monospace;">If you did not initiate this sequence, you may safely ignore this email.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    `;

    const transporter = getTransporter();
    if (!transporter) {
        console.warn('[EMAIL SERVICE WARNING] No email provider configured (APPS_SCRIPT_URL or Gmail credentials missing). Email held.');
        return {
            success: false,
            error: 'Email unconfigured: Set APPS_SCRIPT_URL & APPS_SCRIPT_SECRET or GMAIL_USER & GMAIL_APP_PASSWORD.'
        };
    }

    try {
        const info = await transporter.sendMail({
            from: getSenderIdentity(),
            to,
            subject: 'CodeSrijan [IDENTITY VERIFICATION PASSKEY]',
            html: htmlContent
        });

        console.log('[SECURE COMMS] Verification email accepted by Gmail SMTP for %s. Message ID: %s', maskEmail(to), info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (e) {
        console.error('[SECURE COMMS FAULT] Gmail SMTP error sending to %s: %s', maskEmail(to), e.message);
        return { success: false, error: e.message || 'SMTP transmission failure' };
    }
};

/**
 * Dispatches password recovery link
 */
export const sendPasswordResetEmail = async (to, resetLink) => {
    // 1. Try Google Apps Script HTTPS Relay
    if (process.env.APPS_SCRIPT_URL || customAppsScriptDispatcher) {
        const relayResult = await dispatchViaAppsScript('password_reset', to, { resetLink });
        if (relayResult) return relayResult;
    }

    // 2. Fall back to Gmail SMTP
    const htmlContent = `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0B0F14; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <tr>
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #121A26; border: 2px solid #223249; border-radius: 8px; overflow: hidden;">
                        <tr>
                            <td style="background-color: #182334; border-bottom: 2px solid #223249; padding: 24px; text-align: center;">
                                <h1 style="margin: 0; color: #F4F7FB; font-size: 24px; font-weight: 900; letter-spacing: 3px; font-family: monospace;">CODESRIJAN</h1>
                                <p style="margin: 8px 0 0 0; color: #7C3AED; font-size: 11px; font-family: monospace; letter-spacing: 2px;">PASSWORD_RECOVERY_PROTOCOL</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 32px;">
                                <h2 style="margin: 0 0 16px 0; color: #F4F7FB; font-size: 18px; font-weight: 700; text-transform: uppercase;">Password Reset Request</h2>
                                <p style="margin: 0 0 24px 0; color: #A9B5C5; font-size: 15px; line-height: 1.6;">
                                    A password reset sequence was initiated for your CodeSrijan account. Click the button below to configure a new password:
                                </p>
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
                                    <tr>
                                        <td align="center">
                                            <a href="${resetLink}" target="_blank" style="background-color: #7C3AED; color: #F4F7FB; font-weight: 800; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 4px; display: inline-block; font-size: 15px; letter-spacing: 1px;">
                                                Reset Password
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin: 24px 0 0 0; color: #64748B; font-size: 13px; line-height: 1.5; word-break: break-all;">
                                    Or copy and paste this link into your browser:<br/>
                                    <span style="color: #22D3EE;">${resetLink}</span>
                                </p>
                                <p style="margin: 16px 0 0 0; color: #64748B; font-size: 12px;">
                                    This link expires in <strong>60 minutes</strong>. If you did not request this reset, your account remains secure and you may safely ignore this transmission.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    `;

    const transporter = getTransporter();
    if (!transporter) {
        console.warn('[EMAIL SERVICE WARNING] Email unconfigured for password reset.');
        return { success: false, error: 'Email service unconfigured.' };
    }

    try {
        const info = await transporter.sendMail({
            from: getSenderIdentity(),
            to,
            subject: 'CodeSrijan [PASSWORD RESET REQUEST]',
            html: htmlContent
        });

        console.log('[SECURE COMMS] Password reset email accepted for %s. Message ID: %s', maskEmail(to), info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (e) {
        console.error('[SECURE COMMS FAULT] Password reset send failed to %s: %s', maskEmail(to), e.message);
        return { success: false, error: e.message };
    }
};

/**
 * Dispatches account clearance confirmation
 */
export const sendWelcomeEmail = async (to, name, role = 'student') => {
    // 1. Try Google Apps Script HTTPS Relay
    if (process.env.APPS_SCRIPT_URL || customAppsScriptDispatcher) {
        const relayResult = await dispatchViaAppsScript('welcome', to, { name, role });
        if (relayResult) return relayResult;
    }

    // 2. Fall back to Gmail SMTP
    const htmlContent = `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0B0F14; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <tr>
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #121A26; border: 2px solid #223249; border-radius: 8px; overflow: hidden;">
                        <tr>
                            <td style="background-color: #182334; border-bottom: 2px solid #223249; padding: 24px; text-align: center;">
                                <h1 style="margin: 0; color: #22C55E; font-size: 24px; font-weight: 900; letter-spacing: 3px; font-family: monospace;">CODESRIJAN</h1>
                                <p style="margin: 8px 0 0 0; color: #F4F7FB; font-size: 11px; font-family: monospace; letter-spacing: 2px;">CLEARANCE_GRANTED</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 32px;">
                                <h2 style="margin: 0 0 16px 0; color: #F4F7FB; font-size: 18px; font-weight: 700;">Welcome to the Platform, ${name || 'Operative'}!</h2>
                                <p style="margin: 0 0 24px 0; color: #A9B5C5; font-size: 15px; line-height: 1.6;">
                                    Your identity has been verified on the CodeSrijan network with role clearance: <strong style="color: #7C3AED; text-transform: uppercase;">${role}</strong>.
                                </p>
                                <p style="margin: 0; color: #64748B; font-size: 13px;">
                                    You can now enroll in hackathons, recruit teammates, and submit solutions directly from your workspace.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    `;

    const transporter = getTransporter();
    if (!transporter) return { success: false, error: 'Email service unconfigured' };

    try {
        const info = await transporter.sendMail({
            from: getSenderIdentity(),
            to,
            subject: 'CodeSrijan [ACCOUNT ACTIVATED]',
            html: htmlContent
        });
        return { success: true, messageId: info.messageId };
    } catch (e) {
        return { success: false, error: e.message };
    }
};
