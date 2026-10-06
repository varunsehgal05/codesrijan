import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const getTransporter = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    if (user && pass) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
        });
    }
    return null;
};

const getResend = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    return new Resend(apiKey);
};

const FROM_EMAIL = process.env.EMAIL_USER || 'codesrijan@gmail.com';

export const sendVerificationEmail = async (to, code) => {
    const htmlContent = `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F4F4F5; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <tr>
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 4px solid #141416;">
                        <tr>
                            <td style="background-color: #0047FF; border-bottom: 4px solid #141416; padding: 24px; text-align: center;">
                                <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">CODESRIJAN</h1>
                                <p style="margin: 8px 0 0 0; color: #FFFFFF; font-size: 12px; font-family: monospace; letter-spacing: 1px;">IDENTITY_VERIFICATION_PROTOCOL</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 32px;">
                                <h2 style="margin: 0 0 16px 0; color: #141416; font-size: 20px; font-weight: 800; text-transform: uppercase;">Incoming Transmission</h2>
                                <p style="margin: 0 0 32px 0; color: #3F3F46; font-size: 16px; line-height: 1.6; font-weight: 500;">
                                    This email address was registered at CodeSrijan. To finalize your authorization, use the secure passkey below.
                                </p>
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F4F4F5; border: 4px dashed #0047FF;">
                                    <tr>
                                        <td align="center" style="padding: 32px;">
                                            <p style="margin: 0 0 12px 0; color: #71717A; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Secure Passkey</p>
                                            <h1 style="margin: 0; color: #0047FF; font-size: 48px; font-family: monospace; font-weight: 900; letter-spacing: 12px;">${code}</h1>
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin: 32px 0 0 0; color: #71717A; font-size: 14px; font-weight: 500;">
                                    This code expires in <strong>15 minutes</strong>. Do not disclose this code under any circumstances.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #141416; padding: 24px; text-align: center;">
                                <p style="margin: 0; color: #A1A1AA; font-size: 12px; font-family: monospace;">If you did not initiate this sequence, you may safely ignore this transmission.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    `;

    // 1. Try Nodemailer (Gmail SMTP)
    try {
        const transporter = getTransporter();
        if (transporter) {
            const info = await transporter.sendMail({
                from: `"CodeSrijan Protocol" <${FROM_EMAIL}>`,
                to,
                subject: 'CodeSrijan [OTP VERIFICATION]',
                html: htmlContent
            });
            console.log('[SECURE COMMS] Verification Email dispatched via Gmail SMTP: %s', info.messageId);
            return true;
        }
    } catch (e) {
        console.warn('[SECURE COMMS] Gmail SMTP failed, attempting Resend fallback:', e.message);
    }

    // 2. Fallback to Resend API if configured
    try {
        const resend = getResend();
        if (resend) {
            const { data, error } = await resend.emails.send({
                from: 'CodeSrijan <onboarding@resend.dev>',
                to: [to],
                subject: 'CodeSrijan [OTP VERIFICATION]',
                html: htmlContent
            });
            if (!error) {
                console.log('[SECURE COMMS] Verification Email dispatched via Resend: %s', data?.id);
                return true;
            }
        }
    } catch (e) { }

    console.log(`[SECURE COMMS] Local test log. Verification OTP Code for ${to}: ${code}`);
    return true;
};

export const sendWelcomeEmail = async (to, name, role = 'student') => {
    const htmlContent = `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F4F4F5; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <tr>
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 4px solid #141416;">
                        <tr>
                            <td style="background-color: #FF3366; border-bottom: 4px solid #141416; padding: 24px; text-align: center;">
                                <h1 style="margin: 0; color: #141416; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">CODESRIJAN</h1>
                                <p style="margin: 8px 0 0 0; color: #141416; font-size: 12px; font-family: monospace; font-weight: 700; letter-spacing: 1px;">ACCESS_CLEARANCE_GRANTED</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 32px;">
                                <h2 style="margin: 0 0 16px 0; color: #141416; font-size: 20px; font-weight: 800; text-transform: uppercase;">Welcome to the Platform, ${name || 'Operative'}!</h2>
                                <p style="margin: 0 0 32px 0; color: #3F3F46; font-size: 16px; line-height: 1.6; font-weight: 500;">
                                    Your cryptographic identity has been fully verified and enrolled into the CodeSrijan network with role clearance: <strong style="color: #0047FF; text-transform: uppercase; padding: 2px 6px; border: 2px solid #0047FF;">${role}</strong>.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    `;

    try {
        const transporter = getTransporter();
        if (transporter) {
            await transporter.sendMail({
                from: `"CodeSrijan Protocol" <${FROM_EMAIL}>`,
                to,
                subject: 'CodeSrijan [ACCESS APPROVED]',
                html: htmlContent
            });
            console.log('[SECURE COMMS] Welcome transmission dispatched via Gmail SMTP to %s', to);
            return true;
        }
    } catch (e) { }

    return true;
};
