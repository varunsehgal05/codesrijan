import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'codesrijan@gmail.com',
        pass: 'jvss tyro mfvd adyj'
    }
});

export const sendVerificationEmail = async (to, code) => {
    try {
        const mailOptions = {
            from: '"CodeSrijan Protocol" <codesrijan@gmail.com>',
            to,
            subject: 'CodeSrijan Identity Verification Code',
            html: `
                <div style="font-family: inherit; max-width: 600px; margin: 0 auto; background-color: #FAFAFA; border: 4px solid #141416; padding: 32px;">
                    <div style="background-color: #0047FF; color: white; padding: 16px; border-bottom: 4px solid #141416; margin-bottom: 24px;">
                        <h1 style="margin: 0; text-transform: uppercase; font-family: monospace; letter-spacing: 2px;">Identity Verification Protocol</h1>
                    </div>
                    
                    <h2 style="color: #141416; text-transform: uppercase;">Incoming Transmission...</h2>
                    <p style="color: #333333; font-size: 16px; line-height: 1.5;">This email address was just registered at CodeSrijan. Your verification passkey is generated below. Do not share this under any circumstances.</p>
                    
                    <div style="background-color: #F8F9FA; padding: 24px; border: 4px dashed #0047FF; text-align: center; margin: 32px 0;">
                        <p style="font-size: 14px; text-transform: uppercase; color: #555555; margin-top: 0;">Secure Passkey</p>
                        <h1 style="font-size: 48px; letter-spacing: 8px; margin: 0; color: #141416;">${code}</h1>
                    </div>
                    
                    <p style="color: #555555; font-size: 14px; border-top: 2px solid #DDDDDD; padding-top: 16px;">If you did not initiate this sequence, you may safely ignore this transmission. The payload will self-destruct shortly.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification Email dispatched: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Mail engine failure:', error);
        return false;
    }
};
