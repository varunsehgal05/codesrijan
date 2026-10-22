// Missing required eventName guarantees template rejection before MailApp dispatch.
import fs from 'node:fs';
import crypto from 'node:crypto';
const url = fs.readFileSync(new URL('.apps_script_url.tmp', import.meta.url), 'utf8').trim();
const secret = fs.readFileSync(new URL('.apps_script_secret.tmp', import.meta.url), 'utf8').trim();
const timestamp = Date.now(), nonce = crypto.randomBytes(16).toString('hex');
const template = 'payment_review_notification';
const to = process.argv.includes('--wrong-recipient') ? 'qa-deliberately-wrong@example.test' : 'codesrijan@gmail.com';
const data = {
    registrationName: 'QA ONLY / NO PAYMENT', registrationReference: 'QA-NO-SEND',
    feeAmount: 0, currency: 'INR', transactionReference: 'QA-NO-SEND',
    submittedAt: new Date().toISOString(), reviewUrl: 'https://codesrijan-nine.vercel.app/admin/payments'
};
const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${nonce}.${template}.${to}.${JSON.stringify(data)}`).digest('hex');
const allowed = new Map([
    ['Payment notifications require the configured administrator recipient.', 'RECIPIENT_CONFIGURATION_MISMATCH'],
    ['Unsupported template: payment_review_notification', 'RECIPIENT_ACCEPTED_TEMPLATE_REJECTED_AS_EXPECTED'],
    ['Invalid cryptographic signature.', 'INVALID_SIGNATURE'],
    ['Request expired or clock drift exceeds 5 minutes.', 'TIMESTAMP_REJECTED']
]);
try {
    const result = await (await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth: { timestamp, nonce, signature }, template, to, data }),
        signal: AbortSignal.timeout(20000)
    })).json();
    console.log(allowed.get(result.error) || 'OTHER_RESPONSE_WITHHELD');
} catch {
    console.error('NO_SEND_DIAGNOSTIC_NETWORK_OR_RESPONSE_FAILURE');
    process.exitCode = 1;
}
