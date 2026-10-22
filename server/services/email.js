import nodemailer from 'nodemailer';

// Helper to sanitize recipient for diagnostic logs
const maskEmail = (email) => {
    if (!email || typeof email !== 'string' || !email.includes('@')) return 'unknown';
    const [user, domain] = email.split('@');
    return `${user.slice(0, 2)}***@${domain}`;
};

// Singleton Transporter Cache
let transporterInstance = null;
let customTransporter = null;

/**
 * Allows automated test suites to inject a mocked transporter
 */
export const setTestTransporter = (mock) => {
    customTransporter = mock;
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
 * Dispatches 6-digit OTP verification email via Gmail SMTP (Nodemailer)
 * @param {string} to - Destination recipient email
 * @param {string} code - Cryptographically generated 6-digit OTP code
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendVerificationEmail = async (to, code) => {
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
        console.warn('[EMAIL SERVICE WARNING] Gmail credentials missing (GMAIL_USER / EMAIL_USER and GMAIL_APP_PASSWORD / EMAIL_PASS). Email held.');
        return {
            success: false,
            error: 'Gmail SMTP unconfigured: missing GMAIL_USER / EMAIL_USER or GMAIL_APP_PASSWORD / EMAIL_PASS in environment variables.'
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
 * Dispatches password recovery link via Gmail SMTP (Nodemailer)
 * @param {string} to - Destination recipient email
 * @param {string} resetLink - Cryptographic single-use reset URL
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendPasswordResetEmail = async (to, resetLink) => {
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
                        <tr>
                            <td style="background-color: #0B0F14; border-top: 1px solid #223249; padding: 20px; text-align: center;">
                                <p style="margin: 0; color: #64748B; font-size: 12px; font-family: monospace;">CodeSrijan Identity Protection System</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    `;

    const transporter = getTransporter();
    if (!transporter) {
        console.warn('[EMAIL SERVICE WARNING] Gmail credentials missing for password reset.');
        return { success: false, error: 'Gmail SMTP unconfigured.' };
    }

    try {
        const info = await transporter.sendMail({
            from: getSenderIdentity(),
            to,
            subject: 'CodeSrijan [PASSWORD RESET REQUEST]',
            html: htmlContent
        });

        console.log('[SECURE COMMS] Password reset email accepted by Gmail SMTP for %s. Message ID: %s', maskEmail(to), info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (e) {
        console.error('[SECURE COMMS FAULT] Password reset send failed to %s: %s', maskEmail(to), e.message);
        return { success: false, error: e.message };
    }
};

/**
 * Dispatches account clearance confirmation via Gmail SMTP (Nodemailer)
 * @param {string} to - Destination recipient email
 * @param {string} name - Operative name
 * @param {string} role - Operative role
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendWelcomeEmail = async (to, name, role = 'student') => {
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
    if (!transporter) return { success: false, error: 'Gmail SMTP unconfigured' };

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
