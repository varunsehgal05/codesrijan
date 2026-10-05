import nodemailer from 'nodemailer';

async function testEmail() {
    const user = process.env.EMAIL_USER || 'codesrijan@gmail.com';
    const pass = process.env.EMAIL_PASS || 'jvsstyromfvdadyj';

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for 587
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 8000
    });

    try {
        const info = await transporter.sendMail({
            from: '"CodeSrijan System" <codesrijan@gmail.com>',
            to: 'admin@codesrijan.com',
            subject: 'Test Email',
            text: 'This is a test.'
        });
        console.log('Email sent successfully:', info.messageId);
    } catch (e) {
        console.error('Email failed:', e);
    }
}
testEmail();
