import nodemailer from 'nodemailer';

const getTransporter = () => {
    const user = process.env.EMAIL_USER || 'codesrijan@gmail.com';
    const pass = process.env.EMAIL_PASS || 'jvss tyro mfvd adyj';

    // Prefer port 587 with STARTTLS and timeout controls to prevent hanging on cloud hosts
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for 587
        auth: { user, pass },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 8000
    });
};

export const sendVerificationEmail = async (to, code) => {
    const transporter = getTransporter();
    const mailOptions = {
        from: '"CodeSrijan Protocol" <codesrijan@gmail.com>',
        to,
        subject: 'CodeSrijan Identity Verification Code',
        html: `
            <div style="font-family: monospace, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAFAFA; border: 4px solid #141416; padding: 32px;">
                <div style="background-color: #0047FF; color: white; padding: 16px; border-bottom: 4px solid #141416; margin-bottom: 24px;">
                    <h1 style="margin: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 20px;">Identity Verification Protocol</h1>
                </div>
                
                <h2 style="color: #141416; text-transform: uppercase; font-size: 18px;">Incoming Transmission...</h2>
                <p style="color: #333333; font-size: 15px; line-height: 1.5;">This email address was registered at CodeSrijan. Your one-time verification passkey is generated below. Do not disclose this code under any circumstances.</p>
                
                <div style="background-color: #F0F4FF; padding: 24px; border: 4px dashed #0047FF; text-align: center; margin: 28px 0;">
                    <p style="font-size: 13px; text-transform: uppercase; color: #555555; margin-top: 0; letter-spacing: 1px;">Secure Passkey</p>
                    <h1 style="font-size: 44px; letter-spacing: 10px; margin: 8px 0; color: #0047FF;">${code}</h1>
                    <p style="font-size: 12px; color: #888888; margin-bottom: 0;">Expires in 15 minutes</p>
                </div>
                
                <p style="color: #666666; font-size: 13px; border-top: 2px solid #DDDDDD; padding-top: 16px;">If you did not initiate this sequence, you may safely ignore this transmission.</p>
            </div>
        `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[SECURE COMMS] Verification Email dispatched: %s', info.messageId);
    return true;
};

export const sendWelcomeEmail = async (to, name, role = 'student') => {
    try {
        const transporter = getTransporter();
        const mailOptions = {
            from: '"CodeSrijan Command" <codesrijan@gmail.com>',
            to,
            subject: 'CodeSrijan — Operative Access Clearance Granted',
            html: `
                <div style="font-family: monospace, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAFAFA; border: 4px solid #141416; padding: 32px;">
                    <div style="background-color: #141416; color: white; padding: 20px; border-bottom: 4px solid #0047FF; margin-bottom: 24px;">
                        <h1 style="margin: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 22px; color: #0047FF;">CODESRIJAN // ACCESS APPROVED</h1>
                    </div>
                    
                    <h2 style="color: #141416; text-transform: uppercase; font-size: 18px;">Welcome to the Platform, Operative ${name || 'Hacker'}!</h2>
                    <p style="color: #333333; font-size: 15px; line-height: 1.6;">
                        Your cryptographic identity has been fully verified and enrolled into the CodeSrijan network with role clearance: <strong style="color: #0047FF; text-transform: uppercase;">${role}</strong>.
                    </p>
                    
                    <div style="background-color: #FFFFFF; border: 3px solid #141416; padding: 20px; margin: 24px 0;">
                        <h3 style="margin-top: 0; text-transform: uppercase; font-size: 15px;">Next Operational Directives:</h3>
                        <ul style="color: #444444; line-height: 1.8; font-size: 14px; padding-left: 20px; margin-bottom: 0;">
                            <li>Assemble or join a Hackathon Squad in the Recruitment Node.</li>
                            <li>Review published Problem Statement directives.</li>
                            <li>Initialize your team's Kanban workspace.</li>
                            <li>Track live progress on the Global Leaderboard.</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="https://codesrijan-sable.vercel.app/login" style="background-color: #0047FF; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; text-transform: uppercase; border: 3px solid #141416; display: inline-block;">Initialize Session &rarr;</a>
                    </div>
                    
                    <p style="color: #666666; font-size: 12px; border-top: 2px solid #DDDDDD; padding-top: 16px; margin-bottom: 0;">
                        CodeSrijan Hackathon Infrastructure • Automated Terminal Dispatch
                    </p>
                </div>
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
