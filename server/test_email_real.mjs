import nodemailer from 'nodemailer';

async function testEmail() {
    const user = 'codesrijan@gmail.com';
    const pass = 'jvsstyromfvdadyj';

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for 587
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000
    });

    try {
        console.log('Sending email...');
        const info = await transporter.sendMail({
            from: '"CodeSrijan System" <codesrijan@gmail.com>',
            to: 'varunsehgal2005@gmail.com',
            subject: 'Test Email - CodeSrijan',
            text: 'This is a test email to verify that SMTP is working properly.'
        });
        console.log('Email sent successfully:', info.messageId);
    } catch (e) {
        console.error('Email failed:', e.message);
        console.error(e);
    }
}
testEmail();
