import nodemailer from 'nodemailer';

const getTransporter = () => {
    const user = process.env.EMAIL_USER || 'codesrijan@gmail.com';
    const pass = process.env.EMAIL_PASS || 'jvsstyromfvdadyj';

    // Prefer port 587 with STARTTLS and timeout controls to prevent hanging on cloud hosts
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for 587
        auth: { user, pass },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000
    });
};

export const sendVerificationEmail = async (to, code) => {
    try {
        const transporter = getTransporter();
        const mailOptions = {
            from: '"CodeSrijan System" <codesrijan@gmail.com>',
            to,
            subject: 'CodeSrijan [OTP VERIFICATION]',
            html: `
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F4F4F5; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <tr>
                        <td align="center">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 4px solid #141416;">
                                
                                <!-- Header -->
                                <tr>
                                    <td style="background-color: #0047FF; border-bottom: 4px solid #141416; padding: 24px; text-align: center;">
                                        <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">CODESRIJAN</h1>
                                        <p style="margin: 8px 0 0 0; color: #FFFFFF; font-size: 12px; font-family: monospace; letter-spacing: 1px;">IDENTITY_VERIFICATION_PROTOCOL</p>
                                    </td>
                                </tr>
                                
                                <!-- Body -->
                                <tr>
                                    <td style="padding: 40px 32px;">
                                        <h2 style="margin: 0 0 16px 0; color: #141416; font-size: 20px; font-weight: 800; text-transform: uppercase;">Incoming Transmission</h2>
                                        <p style="margin: 0 0 32px 0; color: #3F3F46; font-size: 16px; line-height: 1.6; font-weight: 500;">
                                            This email address was registered at CodeSrijan. To finalize your authorization, use the secure passkey below.
                                        </p>
                                        
                                        <!-- OTP Box -->
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
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #141416; padding: 24px; text-align: center;">
                                        <p style="margin: 0; color: #A1A1AA; font-size: 12px; font-family: monospace;">If you did not initiate this sequence, you may safely ignore this transmission.</p>
                                    </td>
                                </tr>
                                
                            </table>
                        </td>
                    </tr>
                </table>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('[SECURE COMMS] Verification Email dispatched: %s', info.messageId);
        return true;
    } catch (e) {
        console.warn('[SECURE COMMS] Verification email deferred or failed:', e.message);
        return false;
    }
};

export const sendWelcomeEmail = async (to, name, role = 'student') => {
    try {
        const transporter = getTransporter();
        const mailOptions = {
            from: '"CodeSrijan System" <codesrijan@gmail.com>',
            to,
            subject: 'CodeSrijan [ACCESS APPROVED]',
            html: `
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F4F4F5; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <tr>
                        <td align="center">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 4px solid #141416;">
                                
                                <!-- Header -->
                                <tr>
                                    <td style="background-color: #FF3366; border-bottom: 4px solid #141416; padding: 24px; text-align: center;">
                                        <h1 style="margin: 0; color: #141416; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">CODESRIJAN</h1>
                                        <p style="margin: 8px 0 0 0; color: #141416; font-size: 12px; font-family: monospace; font-weight: 700; letter-spacing: 1px;">ACCESS_CLEARANCE_GRANTED</p>
                                    </td>
                                </tr>
                                
                                <!-- Body -->
                                <tr>
                                    <td style="padding: 40px 32px;">
                                        <h2 style="margin: 0 0 16px 0; color: #141416; font-size: 20px; font-weight: 800; text-transform: uppercase;">Welcome to the Platform, ${name || 'Operative'}!</h2>
                                        <p style="margin: 0 0 32px 0; color: #3F3F46; font-size: 16px; line-height: 1.6; font-weight: 500;">
                                            Your cryptographic identity has been fully verified and enrolled into the CodeSrijan network with role clearance: <strong style="color: #0047FF; text-transform: uppercase; padding: 2px 6px; border: 2px solid #0047FF;">${role}</strong>.
                                        </p>
                                        
                                        <!-- Directives Box -->
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAFAFA; border: 4px solid #141416; margin-bottom: 32px;">
                                            <tr>
                                                <td style="background-color: #141416; padding: 12px 16px;">
                                                    <h3 style="margin: 0; color: #FFFFFF; font-size: 14px; font-family: monospace; font-weight: 700; text-transform: uppercase;">Next Operational Directives:</h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 24px;">
                                                    <ul style="margin: 0; padding-left: 20px; color: #141416; font-size: 15px; line-height: 1.8; font-weight: 600;">
                                                        <li>Assemble or join a Hackathon Squad in the Recruitment Node.</li>
                                                        <li>Review published Problem Statement directives.</li>
                                                        <li>Initialize your team's Kanban workspace.</li>
                                                        <li>Track live progress on the Global Leaderboard.</li>
                                                    </ul>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Action Button -->
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                            <tr>
                                                <td align="center">
                                                    <a href="https://codesrijan-nine.vercel.app/login" style="background-color: #0047FF; color: #FFFFFF; padding: 16px 32px; font-size: 16px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; border: 4px solid #141416; display: inline-block;">
                                                        Initialize Session &rarr;
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #141416; padding: 24px; text-align: center;">
                                        <p style="margin: 0; color: #A1A1AA; font-size: 12px; font-family: monospace;">CodeSrijan Hackathon Infrastructure • Automated Terminal Dispatch</p>
                                    </td>
                                </tr>
                                
                            </table>
                        </td>
                    </tr>
                </table>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('[SECURE COMMS] Welcome transmission dispatched to %s: %s', to, info.messageId);
        return true;
    } catch (e) {
        console.warn('[SECURE COMMS] Welcome email deferred or failed:', e.message);
        return false;
    }
};
