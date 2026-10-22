// Never uses an authorized mail template: this probe cannot send email.
import fs from 'node:fs';
import crypto from 'node:crypto';
const url = fs.readFileSync(new URL('.apps_script_url.tmp', import.meta.url), 'utf8').trim();
const secret = fs.readFileSync(new URL('.apps_script_secret.tmp', import.meta.url), 'utf8').trim();
const allowed = new Map([
    ['Unsupported template: diagnostic_no_send', 'AUTHENTICATED_UNSUPPORTED_TEMPLATE'],
    ['Invalid cryptographic signature.', 'INVALID_SIGNATURE'],
    ['Request expired or clock drift exceeds 5 minutes.', 'TIMESTAMP_REJECTED'],
    ['Relay secret unconfigured in Script Properties.', 'SECRET_UNCONFIGURED'],
    ['Replay detected: nonce has already been consumed.', 'REPLAY_REJECTED'],
    ['Daily Google Mail quota exhausted. Quota resets at midnight PST.', 'QUOTA_EXHAUSTED']
]);
try {
    const health = await (await fetch(url, { signal: AbortSignal.timeout(20000) })).json();
    console.log(JSON.stringify({ check: 'health', online: health.status === 'online', remainingDailyQuota: typeof health.remainingDailyQuota === 'number' ? health.remainingDailyQuota : null, clockDeltaSeconds: typeof health.timestamp === 'number' ? Math.round((Date.now() - health.timestamp) / 1000) : null }));
    const timestamp = Date.now(), nonce = crypto.randomBytes(16).toString('hex');
    const template = 'diagnostic_no_send', to = 'codesrijan@gmail.com', data = {};
    const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${nonce}.${template}.${to}.${JSON.stringify(data)}`).digest('hex');
    const result = await (await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth: { timestamp, nonce, signature }, template, to, data }),
        signal: AbortSignal.timeout(20000)
    })).json();
    console.log(JSON.stringify({ check: 'signed_unsupported_template', result: allowed.get(result.error) || 'OTHER_RESPONSE_WITHHELD', success: result.success === true, emailTemplateUsed: false }));
} catch {
    console.error('NO_SEND_DIAGNOSTIC_NETWORK_OR_RESPONSE_FAILURE');
    process.exitCode = 1;
}
