import test from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';

test('=== CORS POLICY & ORIGIN VALIDATION TEST SUITE ===', async (t) => {
    const mongo = await MongoMemoryServer.create();
    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = mongo.getUri();
    process.env.MONGO_DB_NAME = 'cors_test_db';

    const {
        isOriginAllowed,
        PRODUCTION_ORIGIN,
        LOCAL_DEV_ORIGINS,
        CODESRIJAN_PROJECT_PREVIEW_REGEX,
        app,
        httpServer
    } = await import('./server.js');

    console.log('\n--- 1. Testing Origin Allowlist & Rejection Rules ---');

    // 1. Production origin must be allowed
    assert.equal(isOriginAllowed('https://codesrijan-nine.vercel.app'), true, 'Exact production origin must be allowed');

    // 2. Project-specific preview deployments must be allowed
    assert.equal(isOriginAllowed('https://codesrijan-git-feat.vercel.app'), true, 'Git feature preview must be allowed');
    assert.equal(isOriginAllowed('https://codesrijan-preview-123.vercel.app'), true, 'Preview deployment must be allowed');
    assert.equal(isOriginAllowed('https://codesrijan.vercel.app'), true, 'Root project deployment must be allowed');

    // 3. Arbitrary/unrelated *.vercel.app origins MUST be rejected
    assert.equal(isOriginAllowed('https://attacker.vercel.app'), false, 'Arbitrary Vercel app must be rejected');
    assert.equal(isOriginAllowed('https://otherproject.vercel.app'), false, 'Other Vercel project must be rejected');
    assert.equal(isOriginAllowed('https://malicious-codesrijan.vercel.app'), false, 'Lookalike non-subdomain Vercel app must be rejected');
    assert.equal(isOriginAllowed('https://notcodesrijan.vercel.app'), false, 'Unrelated app must be rejected');

    // 4. Arbitrary external domains MUST be rejected
    assert.equal(isOriginAllowed('https://evil.com'), false, 'Arbitrary external origin must be rejected');
    assert.equal(isOriginAllowed('https://google.com'), false, 'External domain must be rejected');
    assert.equal(isOriginAllowed('http://codesrijan-nine.vercel.app'), false, 'Insecure HTTP production origin must be rejected');

    // 5. Missing / malformed origins
    assert.equal(isOriginAllowed(null), false, 'Null origin must return false');
    assert.equal(isOriginAllowed(undefined), false, 'Undefined origin must return false');
    assert.equal(isOriginAllowed(''), false, 'Empty string origin must return false');
    assert.equal(isOriginAllowed('null'), false, 'String "null" origin must return false');

    // 6. Localhost origins: tested with NODE_ENV
    const prevNodeEnv = process.env.NODE_ENV;
    
    // In test/development environment
    process.env.NODE_ENV = 'development';
    assert.equal(isOriginAllowed('http://localhost:5173'), true, 'Localhost 5173 allowed in development');
    assert.equal(isOriginAllowed('http://localhost:3000'), true, 'Localhost 3000 allowed in development');
    assert.equal(isOriginAllowed('http://localhost:4173'), true, 'Localhost 4173 allowed in development');
    assert.equal(isOriginAllowed('http://localhost:8080'), false, 'Unlisted localhost port rejected');

    // In production environment
    process.env.NODE_ENV = 'production';
    assert.equal(isOriginAllowed('http://localhost:5173'), false, 'Localhost 5173 strictly rejected in production');
    assert.equal(isOriginAllowed('http://localhost:3000'), false, 'Localhost 3000 strictly rejected in production');
    assert.equal(isOriginAllowed('http://localhost:4173'), false, 'Localhost 4173 strictly rejected in production');

    // Restore NODE_ENV
    process.env.NODE_ENV = prevNodeEnv;

    console.log('\n--- 2. Testing HTTP Preflight & CORS Headers on Live Application Instance ---');

    await new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve));
    const port = httpServer.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api`;

    try {
        // Test A: Production Origin Request
        const prodRes = await fetch(`${baseUrl}/hackathons`, {
            headers: { 'Origin': 'https://codesrijan-nine.vercel.app' }
        });
        assert.equal(prodRes.status, 200);
        assert.equal(prodRes.headers.get('access-control-allow-origin'), 'https://codesrijan-nine.vercel.app');
        assert.equal(prodRes.headers.get('access-control-allow-credentials'), 'true');
        assert.equal(prodRes.headers.get('vary'), 'Origin');

        // Test B: Preflight OPTIONS for Production Origin
        const preflightProdRes = await fetch(`${baseUrl}/hackathons`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://codesrijan-nine.vercel.app',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Authorization, Content-Type'
            }
        });
        assert.equal(preflightProdRes.status, 204);
        assert.equal(preflightProdRes.headers.get('access-control-allow-origin'), 'https://codesrijan-nine.vercel.app');
        assert.equal(preflightProdRes.headers.get('access-control-allow-credentials'), 'true');
        assert(preflightProdRes.headers.get('access-control-allow-headers')?.includes('Authorization'));
        assert.equal(preflightProdRes.headers.get('vary'), 'Origin');

        // Test C: Arbitrary Vercel Origin (e.g. attacker.vercel.app)
        const attackerRes = await fetch(`${baseUrl}/hackathons`, {
            headers: { 'Origin': 'https://attacker.vercel.app' }
        });
        // Response should NOT contain Access-Control-Allow-Origin
        assert.equal(attackerRes.headers.get('access-control-allow-origin'), null, 'Attacker origin must not receive Access-Control-Allow-Origin');

        // Test D: Preflight OPTIONS for Arbitrary Vercel Origin
        const preflightAttackerRes = await fetch(`${baseUrl}/hackathons`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://attacker.vercel.app',
                'Access-Control-Request-Method': 'POST'
            }
        });
        assert.equal(preflightAttackerRes.headers.get('access-control-allow-origin'), null, 'Attacker preflight must not receive Access-Control-Allow-Origin');

        // Test E: Arbitrary External Origin (evil.com)
        const evilRes = await fetch(`${baseUrl}/hackathons`, {
            headers: { 'Origin': 'https://evil.com' }
        });
        assert.equal(evilRes.headers.get('access-control-allow-origin'), null, 'Evil.com must not receive Access-Control-Allow-Origin');

        // Test F: Missing Origin (Same-origin or curl)
        const noOriginRes = await fetch(`${baseUrl}/hackathons`);
        assert.equal(noOriginRes.status, 200);
        assert.equal(noOriginRes.headers.get('access-control-allow-origin'), null, 'Missing origin must not set Access-Control-Allow-Origin header');

        console.log('✓ All CORS origin and preflight tests PASSED cleanly on canonical application instance.');
    } finally {
        await new Promise(resolve => httpServer.close(resolve));
        const mongoose = (await import('mongoose')).default;
        await mongoose.disconnect();
        await mongo.stop();
    }
});
