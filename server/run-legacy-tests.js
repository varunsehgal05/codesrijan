// Run historical suites only against an ephemeral local database with external email disabled.
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const mongo = await MongoMemoryServer.create();
let failed = false;
try {
    for (const phase of [2, 3]) {
        const env = { ...process.env, TEST_MONGO_URI: mongo.getUri(`codesrijan_test_phase${phase}`), NODE_ENV: 'test' };
        for (const key of ['APPS_SCRIPT_URL', 'APPS_SCRIPT_SECRET', 'CODESRIJAN_RELAY_SECRET', 'GMAIL_USER', 'GMAIL_APP_PASSWORD', 'EMAIL_USER', 'EMAIL_PASS', 'ADMIN_NOTIFICATION_EMAIL']) env[key] = '';
        const code = await new Promise((resolve, reject) => {
            const child = spawn(process.execPath, [fileURLToPath(new URL(`test_phase${phase}_${phase === 2 ? 'security' : 'paid_hackathons'}.mjs`, import.meta.url))], { env, stdio: 'inherit' });
            child.on('error', reject);
            child.on('exit', resolve);
        });
        console.log(`LEGACY PHASE ${phase} EXIT: ${code}`);
        if (code !== 0) failed = true;
    }
} finally {
    await mongo.stop();
}
process.exitCode = failed ? 1 : 0;
