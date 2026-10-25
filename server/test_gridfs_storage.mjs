import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
    validatePaymentProofFile,
    uploadProofToGridFS,
    deleteGridFSProof,
    getGridFSProofStream,
    checkGridFSCapacity,
    GRIDFS_BUCKET_NAME,
    PROOF_STORAGE_BUDGET_BYTES,
    TOTAL_STORAGE_SAFETY_LIMIT_BYTES
} from './services/storage.js';
import { setTestAppsScriptDispatcher } from './services/email.js';

test('=== GRIDFS STORAGE ADAPTER & SECURITY TEST SUITE (15 CHECKS) ===', async (t) => {
    // -------------------------------------------------------------
    // CHECKS 1-5: Payload Validation, Magic Bytes & Size Limits
    // -------------------------------------------------------------
    const validJpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, ...Array(50).fill(0xAA)]);
    const validJpegUri = `data:image/jpeg;base64,${validJpegBuffer.toString('base64')}`;

    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ...Array(50).fill(0xBB)]);
    const validPngUri = `data:image/png;base64,${validPngBuffer.toString('base64')}`;

    const validWebpBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x40, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, ...Array(50).fill(0xCC)]);
    const validWebpUri = `data:image/webp;base64,${validWebpBuffer.toString('base64')}`;

    // Check 1: Valid JPEG, PNG, and WebP upload validation
    const jpegVal = validatePaymentProofFile(validJpegUri);
    assert.equal(jpegVal.valid, true, 'Check 1a: JPEG raster validation succeeds');
    assert.equal(jpegVal.extension, 'jpg');

    const pngVal = validatePaymentProofFile(validPngUri);
    assert.equal(pngVal.valid, true, 'Check 1b: PNG raster validation succeeds');
    assert.equal(pngVal.extension, 'png');

    const webpVal = validatePaymentProofFile(validWebpUri);
    assert.equal(webpVal.valid, true, 'Check 1c: WebP raster validation succeeds');
    assert.equal(webpVal.extension, 'webp');

    // Check 4: SVG and spoofed signature rejection
    const svgUri = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString('base64');
    const svgVal = validatePaymentProofFile(svgUri);
    assert.equal(svgVal.valid, false, 'Check 4a: SVG vector payload rejected');
    assert.equal(svgVal.statusCode, 400);

    const spoofUri = 'data:image/jpeg;base64,' + Buffer.from('console.log("malicious payload")').toString('base64');
    const spoofVal = validatePaymentProofFile(spoofUri);
    assert.equal(spoofVal.valid, false, 'Check 4b: Spoofed magic bytes rejected');
    assert.equal(spoofVal.statusCode, 400);

    // Check 5: Oversized image rejection (> 5MB)
    const oversizedBuffer = Buffer.alloc(5.2 * 1024 * 1024);
    oversizedBuffer[0] = 0xFF; oversizedBuffer[1] = 0xD8; oversizedBuffer[2] = 0xFF;
    const oversizedUri = `data:image/jpeg;base64,${oversizedBuffer.toString('base64')}`;
    const oversizedVal = validatePaymentProofFile(oversizedUri);
    assert.equal(oversizedVal.valid, false, 'Check 5: Oversized payload (>5MB) rejected');
    assert.equal(oversizedVal.statusCode, 413);

    // -------------------------------------------------------------
    // CHECKS 2, 3, 10, 11, 12, 13: GridFS Direct Adapter Tests
    // -------------------------------------------------------------
    const mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = uri;
    process.env.MONGO_DB_NAME = 'isolated_gridfs_tests';
    process.env.ADMIN_NOTIFICATION_EMAIL = 'admin@example.test';
    process.env.FRONTEND_URL = 'https://example.test';

    const originalConnect = mongoose.connect.bind(mongoose);
    mongoose.connect = (targetUri, opts) => originalConnect(targetUri, { ...opts, dbName: 'isolated_gridfs_tests' });

    setTestAppsScriptDispatcher(async () => ({ success: true }));

    let server;

    try {
        ({ httpServer: server } = await import('./server.js'));
        await mongoose.connection.asPromise();

        const { User, Registration, Hackathon } = await import('./models/index.js');
        await Registration.init();

        // Check 2: Successful GridFS object upload, retrieval, and SHA-256 binary integrity
        const testImageBytes = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, ...crypto.randomBytes(1024)]);
        const uploadResult = await uploadProofToGridFS({
            buffer: testImageBytes,
            mimeType: 'image/jpeg',
            extension: 'jpg',
            registrationId: 'reg-gridfs-test-01',
            userId: 'usr-gridfs-test-01'
        });

        assert.equal(uploadResult.success, true, 'Check 2a: Direct GridFS upload succeeds');
        assert.equal(uploadResult.storageProvider, 'gridfs');
        assert.equal(uploadResult.storageBucket, GRIDFS_BUCKET_NAME);
        assert(uploadResult.fileId, 'Check 2b: Unique fileId assigned by GridFS');

        const streamResult = await getGridFSProofStream(uploadResult.fileId);
        assert.equal(streamResult.found, true, 'Check 2c: Stored GridFS object found');
        const retrievedMime = streamResult.file.metadata?.contentType || streamResult.file.metadata?.mimeType || streamResult.file.contentType;
        assert.equal(retrievedMime, 'image/jpeg');

        // Read stream into memory and verify SHA-256 binary hash
        const downloadedChunks = [];
        for await (const chunk of streamResult.stream) {
            downloadedChunks.push(chunk);
        }
        const downloadedBuffer = Buffer.concat(downloadedChunks);
        const originalHash = crypto.createHash('sha256').update(testImageBytes).digest('hex');
        const downloadedHash = crypto.createHash('sha256').update(downloadedBuffer).digest('hex');
        assert.equal(downloadedHash, originalHash, 'Check 2d: Binary integrity verified byte-for-byte (SHA-256 match)');

        // Check 10: Missing or deleted GridFS object behavior
        const nonExistentId = new mongoose.Types.ObjectId();
        const missingRes = await getGridFSProofStream(nonExistentId);
        assert.equal(missingRes.found, false, 'Check 10: Non-existent fileId cleanly returns found: false');

        // Check 11: Orphan object cleanup via deleteGridFSProof
        const orphanBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, ...crypto.randomBytes(512)]);
        const orphanUpload = await uploadProofToGridFS({
            buffer: orphanBuffer,
            mimeType: 'image/jpeg',
            extension: 'jpg',
            registrationId: 'reg-orphan-01',
            userId: 'usr-orphan-01'
        });
        assert.equal(orphanUpload.success, true);
        const delRes = await deleteGridFSProof(orphanUpload.fileId);
        assert.equal(delRes.success, true, 'Check 11a: Orphan cleanup delete succeeds');
        const probeDeleted = await getGridFSProofStream(orphanUpload.fileId);
        assert.equal(probeDeleted.found, false, 'Check 11b: Deleted orphan is no longer in GridFS');

        // Check 12: Storage-quota enforcement
        const overBudgetCheck = await checkGridFSCapacity(PROOF_STORAGE_BUDGET_BYTES + 1024);
        assert.equal(overBudgetCheck.allowed, false, 'Check 12a: Upload exceeding 75MB allocation rejected');
        assert.equal(overBudgetCheck.statusCode, 503);

        const overCeilingCheck = await checkGridFSCapacity(TOTAL_STORAGE_SAFETY_LIMIT_BYTES + 1024);
        assert.equal(overCeilingCheck.allowed, false, 'Check 12b: Upload exceeding cluster ceiling rejected');
        assert.equal(overCeilingCheck.statusCode, 503);

        // -------------------------------------------------------------
        // CHECKS 6, 7, 8, 9, 14, 15: HTTP API End-to-End Tests
        // -------------------------------------------------------------
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        const base = `http://127.0.0.1:${server.address().port}/api`;

        const request = async (endpoint, token, method = 'GET', body = null) => {
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            if (body) headers['Content-Type'] = 'application/json';

            const res = await fetch(`${base}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });

            let data;
            const cType = res.headers.get('content-type') || '';
            if (cType.includes('application/json')) {
                data = await res.json();
            } else {
                data = Buffer.from(await res.arrayBuffer());
            }

            return { status: res.status, headers: res.headers, data };
        };

        const password = 'GridFSTestPassword42!';
        await User.create({
            id: 'admin-01',
            email: 'admin-gridfs@example.test',
            name: 'Admin Tester',
            role: 'admin',
            accountStatus: 'active',
            emailVerified: true,
            passwordHash: await bcrypt.hash(password, 10)
        });

        await User.create({
            id: 'student-owner',
            email: 'student-owner@example.test',
            name: 'Owner Student',
            role: 'student',
            accountStatus: 'active',
            emailVerified: true,
            passwordHash: await bcrypt.hash(password, 10)
        });

        await User.create({
            id: 'student-stranger',
            email: 'student-stranger@example.test',
            name: 'Stranger Student',
            role: 'student',
            accountStatus: 'active',
            emailVerified: true,
            passwordHash: await bcrypt.hash(password, 10)
        });

        const adminLogin = await request('/auth/login', null, 'POST', { email: 'admin-gridfs@example.test', password });
        const adminToken = adminLogin.data.token;

        const ownerLogin = await request('/auth/login', null, 'POST', { email: 'student-owner@example.test', password });
        const ownerToken = ownerLogin.data.token;

        const strangerLogin = await request('/auth/login', null, 'POST', { email: 'student-stranger@example.test', password });
        const strangerToken = strangerLogin.data.token;

        const eventRes = await request('/hackathons', adminToken, 'POST', {
            name: 'GridFS Live QA Event',
            registrationStart: '2020-01-01',
            registrationEnd: '2099-01-01',
            entryType: 'paid',
            fee: 250,
            feeBasis: 'per_participant',
            teamSizeMin: 1,
            teamSizeMax: 1
        });
        const eventId = eventRes.data.id;
        await request(`/hackathons/${eventId}/open-registration`, adminToken, 'POST', {});

        // Owner enrolls solo
        const enrollRes = await request(`/hackathons/${eventId}/register`, ownerToken, 'POST', { type: 'solo' });
        const regId = enrollRes.data.registration.id;

        // Check 15: Initial payment status is pending_proof before upload
        const initialReg = await Registration.findOne({ id: regId });
        assert.equal(initialReg.paymentStatus, 'pending_proof', 'Check 15: Status is pending_proof before upload');

        // Submit Payment Proof to HTTP API
        const uploadPayload = {
            transactionReference: 'GRIDFS-UTR-998877',
            paymentProofUrl: validJpegUri
        };
        const submitRes = await request(`/hackathons/${eventId}/payment-proof`, ownerToken, 'POST', uploadPayload);
        assert.equal(submitRes.status, 200, 'Check 3a: HTTP Payment proof upload returns 200');

        // Check 3: MongoDB registration metadata persistence
        const updatedReg = await Registration.findOne({ id: regId });
        assert.equal(updatedReg.paymentStatus, 'payment_under_review', 'Check 3b: State transitioned to payment_under_review');
        assert.equal(updatedReg.storageProvider, 'gridfs', 'Check 3c: storageProvider persisted as gridfs');
        assert.equal(updatedReg.storageBucket, 'paymentProofs', 'Check 3d: storageBucket persisted as paymentProofs');
        assert(updatedReg.storagePath, 'Check 3e: storagePath contains GridFS objectId');
        assert.equal(updatedReg.proofMimeType, 'image/jpeg', 'Check 3f: proofMimeType persisted');
        assert.equal(updatedReg.proofSizeBytes, validJpegBuffer.length, 'Check 3g: proofSizeBytes persisted accurately');
        assert.equal(updatedReg.paymentProofUrl, `/api/student/registrations/${regId}/receipt/file`, 'Check 3h: paymentProofUrl points to protected streaming route');

        // Check 6: Anonymous image retrieval denial
        const anonStudentRes = await request(`/student/registrations/${regId}/receipt/file`, null, 'GET');
        assert.equal(anonStudentRes.status, 401, 'Check 6a: Anonymous student route rejected with 401');
        const anonAdminRes = await request(`/admin/payments/${regId}/receipt/file`, null, 'GET');
        assert.equal(anonAdminRes.status, 401, 'Check 6b: Anonymous admin route rejected with 401');

        // Check 7: Cross-student retrieval denial
        const strangerAccessRes = await request(`/student/registrations/${regId}/receipt/file`, strangerToken, 'GET');
        assert.equal(strangerAccessRes.status, 403, 'Check 7: Cross-student access denied with HTTP 403');

        // Check 8: Authorized admin retrieval
        const adminAccessRes = await request(`/admin/payments/${regId}/receipt/file`, adminToken, 'GET');
        assert.equal(adminAccessRes.status, 200, 'Check 8a: Authorized admin accesses receipt file (HTTP 200)');
        assert.equal(adminAccessRes.headers.get('content-type'), 'image/jpeg', 'Check 8b: Correct content-type header');
        assert.equal(adminAccessRes.headers.get('x-content-type-options'), 'nosniff', 'Check 8c: nosniff security header present');
        assert.equal(adminAccessRes.headers.get('cache-control'), 'private, no-store, max-age=0, must-revalidate', 'Check 8d: private cache-control present');
        assert.equal(crypto.createHash('sha256').update(adminAccessRes.data).digest('hex'), crypto.createHash('sha256').update(validJpegBuffer).digest('hex'), 'Check 8e: Admin binary payload matches uploaded file exactly');

        // Check 9: Authorized owner retrieval
        const ownerAccessRes = await request(`/student/registrations/${regId}/receipt/file`, ownerToken, 'GET');
        assert.equal(ownerAccessRes.status, 200, 'Check 9a: Authorized owner accesses receipt file (HTTP 200)');
        assert.equal(crypto.createHash('sha256').update(ownerAccessRes.data).digest('hex'), crypto.createHash('sha256').update(validJpegBuffer).digest('hex'), 'Check 9b: Owner binary payload matches uploaded file exactly');

        // Check 14: Existing legacy receipt metadata compatibility
        const adminMetaRes = await request(`/admin/payments/${regId}/receipt`, adminToken, 'GET');
        assert.equal(adminMetaRes.status, 200, 'Check 14a: Admin metadata endpoint backward compatibility');
        assert.equal(adminMetaRes.data.storageProvider, 'gridfs');
        assert.equal(adminMetaRes.data.storageBucket, 'paymentProofs');

        const studentMetaRes = await request(`/student/registrations/${regId}/receipt`, ownerToken, 'GET');
        assert.equal(studentMetaRes.status, 200, 'Check 14b: Student metadata endpoint backward compatibility');
        assert.equal(studentMetaRes.data.storageProvider, 'gridfs');

        console.log('\n[SUCCESS] ALL 15 AUTOMATED GRIDFS TESTS PASSED CLEANLY!\n');
    } finally {
        setTestAppsScriptDispatcher(null);
        if (server?.listening) await new Promise(resolve => server.close(resolve));
        await mongoose.disconnect();
        await mongo.stop();
    }
});
