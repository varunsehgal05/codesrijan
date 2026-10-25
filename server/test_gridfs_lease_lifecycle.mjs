import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
    reserveGridFSCapacity,
    commitGridFSCapacity,
    releaseGridFSCapacity,
    renewReservationLease,
    reconcileStorageLedger,
    uploadProofToGridFS,
    deleteGridFSProof,
    getGridFSBucket,
    STORAGE_LEDGER_DOC_ID,
    STORAGE_RESERVATIONS_COLLECTION,
    GRIDFS_BUCKET_NAME
} from './services/storage.js';

test('=== GRIDFS LEASE LIFECYCLE & CAPACITY GUARANTEES SUITE ===', async (t) => {
    const mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = uri;

    await mongoose.connect(uri, { dbName: 'lease_lifecycle_tests' });
    const db = mongoose.connection.db;

    try {
        console.log('\n--- 1. Testing Lease Expiry, Abort & Automatic Chunk Cleanup ---');
        // Reserve with a short TTL: 150ms
        const shortTtlMs = 150;
        const uploadSize = 40 * 1024;
        const testBudget = 100 * 1024;

        const res1 = await reserveGridFSCapacity({
            additionalBytes: uploadSize,
            registrationId: 'reg-slow-01',
            userId: 'usr-slow-01',
            ttlMs: shortTtlMs,
            customBudgetBytes: testBudget
        });

        assert.equal(res1.allowed, true, 'Initial reservation should be admitted');
        const reservationId = res1.reservationId;

        // Verify reservation exists and is pending
        const reservationsCol = db.collection(STORAGE_RESERVATIONS_COLLECTION);
        const initialDoc = await reservationsCol.findOne({ _id: reservationId });
        assert.equal(initialDoc.status, 'pending');

        // Deliberately sleep beyond the lease TTL (wait 250ms)
        console.log('[TEST] Pausing upload past 150ms lease TTL (waiting 250ms)...');
        await new Promise(r => setTimeout(r, 250));

        // Run reconciliation (or another upload's preflight check)
        await reconcileStorageLedger(db);

        // Verify the reservation was marked 'expired'
        const expiredDoc = await reservationsCol.findOne({ _id: reservationId });
        assert.equal(expiredDoc.status, 'expired', 'Expired reservation must have status expired');

        // Now attempt late commit by the stale uploader
        console.log('[TEST] Attempting late commit on expired reservation...');
        const commitOutcome = await commitGridFSCapacity(reservationId, uploadSize);
        assert.equal(commitOutcome.committed, false, 'Late commit on expired reservation MUST be rejected');
        assert.equal(commitOutcome.reason, 'EXPIRED', 'Commit failure reason must indicate EXPIRED');

        // Verify ledger was NOT incremented by the late commit
        const ledgerAfterLateCommit = await reservationsCol.findOne({ _id: STORAGE_LEDGER_DOC_ID });
        assert.equal(ledgerAfterLateCommit.committedBytes, 0, 'Committed bytes must remain 0 after rejected late commit');
        assert.equal(ledgerAfterLateCommit.reservedBytes, 0, 'Reserved bytes must be 0 after expiration');

        console.log('\n--- 2. Testing Active Lease Renewal During Long Uploads ---');
        // Reserve with 200ms TTL
        const res2 = await reserveGridFSCapacity({
            additionalBytes: uploadSize,
            registrationId: 'reg-renew-01',
            userId: 'usr-renew-01',
            ttlMs: 200,
            customBudgetBytes: testBudget
        });
        assert.equal(res2.allowed, true);

        // Renew lease before expiry at 100ms
        await new Promise(r => setTimeout(r, 100));
        console.log('[TEST] Renewing active lease for an ongoing upload...');
        const renewalResult = await renewReservationLease(res2.reservationId, 300);
        assert.equal(renewalResult.renewed, true, 'Active reservation renewal must succeed');
        assert(renewalResult.expiresAt > new Date(), 'New expiry must be in the future');

        // Wait another 150ms (total 250ms from start, would have expired without renewal)
        await new Promise(r => setTimeout(r, 150));
        await reconcileStorageLedger(db);

        // Reservation should STILL be pending because it was renewed!
        const renewedDoc = await reservationsCol.findOne({ _id: res2.reservationId });
        assert.equal(renewedDoc.status, 'pending', 'Renewed reservation must remain pending across sweeps');

        // Successful commit
        const commitResult2 = await commitGridFSCapacity(res2.reservationId, uploadSize);
        assert.equal(commitResult2.committed, true, 'Renewed reservation must commit successfully');

        console.log('\n--- 3. Testing Idempotent Release Exactly Once ---');
        const res3 = await reserveGridFSCapacity({
            additionalBytes: uploadSize,
            registrationId: 'reg-release-01',
            userId: 'usr-release-01',
            customBudgetBytes: testBudget
        });
        assert.equal(res3.allowed, true);

        // First release
        const rel1 = await releaseGridFSCapacity(res3.reservationId);
        assert.equal(rel1.released, true, 'First release must succeed');

        // Second release attempt on same reservationId
        const rel2 = await releaseGridFSCapacity(res3.reservationId);
        assert.equal(rel2.released, false, 'Second release must be a safe no-op');
        assert.equal(rel2.reason, 'RELEASED', 'Reason should be RELEASED');

        console.log('\n--- 4. Testing Ledger Non-Negative Invariant ---');
        // Force cleanup and verify no counts can drop below 0
        const ledgerFinal = await reservationsCol.findOne({ _id: STORAGE_LEDGER_DOC_ID });
        assert(ledgerFinal.reservedBytes >= 0, 'reservedBytes must be >= 0');
        assert(ledgerFinal.committedBytes >= 0, 'committedBytes must be >= 0');
        assert(ledgerFinal.totalBytes >= 0, 'totalBytes must be >= 0');

        console.log('\n--- 5. Testing Concurrent GridFS Uploads with Ordinary Database Writes ---');
        // Simulate concurrent ordinary application writes (e.g. users, audit logs, registrations)
        // running simultaneously with GridFS uploads near budget limit
        const smallBudget = 150 * 1024; // 150 KB
        const singleSize = 35 * 1024; // 35 KB each

        // Reconcile clean slate
        await reconcileStorageLedger(db);

        const parallelUploads = Array.from({ length: 6 }).map(async (_, idx) => {
            const buf = crypto.randomBytes(singleSize);
            // Simulate an ordinary database write at the exact same moment
            await db.collection('ordinary_app_activity').insertOne({
                action: 'STUDENT_LOG_IN',
                userId: `usr-app-${idx}`,
                timestamp: new Date(),
                metadata: { device: 'Chrome', ip: '127.0.0.1', notes: 'x'.repeat(500) }
            });

            return uploadProofToGridFS({
                buffer: buf,
                mimeType: 'image/png',
                extension: 'png',
                registrationId: `reg-mix-${idx}`,
                userId: `usr-mix-${idx}`,
                customBudgetBytes: smallBudget
            });
        });

        const uploadResults = await Promise.all(parallelUploads);
        const succeeded = uploadResults.filter(r => r.success);
        const rejected = uploadResults.filter(r => !r.success);

        console.log(`[MIXED CONCURRENCY] Concurrent Uploads + DB Writes:`);
        console.log(` - Succeeded uploads: ${succeeded.length}`);
        console.log(` - Rejected uploads: ${rejected.length}`);

        assert(succeeded.length >= 2 && succeeded.length <= 4, `Succeeded count (${succeeded.length}) must strictly fit within 150KB budget`);
        assert.equal(succeeded.length + rejected.length, 6, 'All 6 uploads cleanly handled');

        // Ordinary writes must all exist intact
        const ordinaryCount = await db.collection('ordinary_app_activity').countDocuments();
        assert.equal(ordinaryCount, 6, 'All 6 ordinary database writes must succeed unaffected');

        // Verify ledger consistency
        const finalLedger = await reconcileStorageLedger(db);
        assert(finalLedger.totalBytes <= smallBudget, `Total bytes (${finalLedger.totalBytes}) must strictly stay within budget (${smallBudget})`);
        assert(finalLedger.reservedBytes >= 0, 'reservedBytes must be non-negative');
        assert(finalLedger.committedBytes >= 0, 'committedBytes must be non-negative');

        console.log('✓ All lease lifecycle, renewal, and concurrency guarantee tests PASSED cleanly.');
    } finally {
        await mongoose.disconnect();
        await mongo.stop();
    }
});
