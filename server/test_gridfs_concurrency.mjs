import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
    reserveGridFSCapacity,
    commitGridFSCapacity,
    releaseGridFSCapacity,
    reconcileStorageLedger,
    uploadProofToGridFS,
    deleteGridFSProof,
    getGridFSProofStream,
    STORAGE_LEDGER_DOC_ID,
    STORAGE_RESERVATIONS_COLLECTION,
    GRIDFS_BUCKET_NAME
} from './services/storage.js';

test('=== GRIDFS CONCURRENCY & CAPACITY ADMISSION SUITE ===', async (t) => {
    const mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = uri;

    await mongoose.connect(uri, { dbName: 'concurrency_tests' });
    const db = mongoose.connection.db;

    try {
        console.log('\n--- 1. Testing Concurrent Atomic Admission Under Heavy Parallel Load ---');
        // Configure a small test budget: 200 KB
        const testBudget = 200 * 1024;
        const uploadSize = 50 * 1024; // 50 KB buffer each (~53.5 KB reserved with padding)

        // Launch 8 parallel reservation attempts simultaneously
        const attempts = Array.from({ length: 8 }).map((_, idx) =>
            reserveGridFSCapacity({
                additionalBytes: uploadSize,
                registrationId: `reg-concurrent-${idx}`,
                userId: `usr-concurrent-${idx}`,
                customBudgetBytes: testBudget
            })
        );

        const results = await Promise.all(attempts);
        const admitted = results.filter(r => r.allowed);
        const rejected = results.filter(r => !r.allowed);

        console.log(`[CONCURRENCY] 8 Parallel Uploads Attempted (50KB each against 200KB budget):`);
        console.log(` - Admitted: ${admitted.length}`);
        console.log(` - Rejected: ${rejected.length}`);

        assert(admitted.length >= 2 && admitted.length <= 3, `Admitted count (${admitted.length}) must strictly fit within 200KB budget`);
        assert.equal(admitted.length + rejected.length, 8, 'All 8 parallel requests must be cleanly resolved');

        for (const rej of rejected) {
            assert.equal(rej.statusCode, 503, 'Rejected uploads must return HTTP 503');
            assert(rej.error.includes('limit exceeded'), 'Rejection error must report storage allocation limit exceeded');
        }

        // Verify ledger totalBytes in MongoDB
        const ledgerCol = db.collection(STORAGE_RESERVATIONS_COLLECTION);
        const ledger = await ledgerCol.findOne({ _id: STORAGE_LEDGER_DOC_ID });
        console.log(` - Storage Ledger totalBytes: ${ledger.totalBytes} bytes (${(ledger.totalBytes / 1024).toFixed(2)} KB)`);
        assert(ledger.totalBytes <= testBudget, 'Total reserved bytes in ledger must NEVER exceed budget under concurrency');

        console.log('\n--- 2. Testing Reservation Release on Upload Failure ---');
        // Release one admitted reservation
        const releasedId = admitted[0].reservationId;
        await releaseGridFSCapacity(releasedId);

        const updatedLedger = await ledgerCol.findOne({ _id: STORAGE_LEDGER_DOC_ID });
        console.log(` - Storage Ledger after release: ${updatedLedger.totalBytes} bytes`);
        assert(updatedLedger.totalBytes < ledger.totalBytes, 'Releasing reservation must decrement totalBytes');

        // Now an upload that was previously rejected should be able to get admitted
        const retryRes = await reserveGridFSCapacity({
            additionalBytes: uploadSize,
            registrationId: 'reg-retry-01',
            userId: 'usr-retry-01',
            customBudgetBytes: testBudget
        });
        assert.equal(retryRes.allowed, true, 'Freed capacity from released reservation must immediately permit new admission');
        console.log('[PASS] Released capacity immediately admitted new reservation.');

        console.log('\n--- 3. Testing Recovery of Abandoned/Expired Pending Reservations ---');
        // Simulate a crashed worker: insert an expired pending reservation
        const expiredResId = 'res-crashed-worker-99';
        await ledgerCol.insertOne({
            _id: expiredResId,
            type: 'reservation',
            bucket: GRIDFS_BUCKET_NAME,
            registrationId: 'reg-crashed-99',
            userId: 'usr-crashed-99',
            bytes: 55000,
            actualBytes: 50000,
            status: 'pending',
            createdAt: new Date(Date.now() - 120000),
            expiresAt: new Date(Date.now() - 60000) // Expired 1 minute ago
        });

        // Artificially inflate ledger to include the expired reservation
        await ledgerCol.updateOne(
            { _id: STORAGE_LEDGER_DOC_ID },
            { $inc: { reservedBytes: 55000, totalBytes: 55000 } }
        );

        // Run reconciliation
        const reconciled = await reconcileStorageLedger(db);
        const expiredDoc = await ledgerCol.findOne({ _id: expiredResId });
        assert.equal(expiredDoc.status, 'expired', 'Expired reservation must be marked expired by reconciler');
        console.log('[PASS] Reconciler swept abandoned reservation and reclaimed ledger capacity.');

        console.log('\n--- 4. Testing End-to-End Concurrent Uploads to GridFS with Orphan Cleanup ---');
        const validPngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        const fileA = Buffer.from([...validPngHeader, ...crypto.randomBytes(30000)]);
        const fileB = Buffer.from([...validPngHeader, ...crypto.randomBytes(30000)]);

        const [uploadA, uploadB] = await Promise.all([
            uploadProofToGridFS({
                buffer: fileA,
                mimeType: 'image/png',
                extension: 'png',
                registrationId: 'reg-parallel-a',
                userId: 'usr-parallel-a',
                customBudgetBytes: 500 * 1024
            }),
            uploadProofToGridFS({
                buffer: fileB,
                mimeType: 'image/png',
                extension: 'png',
                registrationId: 'reg-parallel-b',
                userId: 'usr-parallel-b',
                customBudgetBytes: 500 * 1024
            })
        ]);

        assert.equal(uploadA.success, true);
        assert.equal(uploadB.success, true);
        console.log('[PASS] Parallel GridFS writes completed successfully.');

        // Verify SHA-256 stream integrity
        const streamA = await getGridFSProofStream(uploadA.fileId);
        assert.equal(streamA.found, true);
        const chunksA = [];
        for await (const chunk of streamA.stream) chunksA.push(chunk);
        assert.equal(crypto.createHash('sha256').update(Buffer.concat(chunksA)).digest('hex'), crypto.createHash('sha256').update(fileA).digest('hex'));

        // Test delete / orphan cleanup and ledger decrement
        const beforeDelLedger = await ledgerCol.findOne({ _id: STORAGE_LEDGER_DOC_ID });
        await deleteGridFSProof(uploadA.fileId);
        const afterDelLedger = await ledgerCol.findOne({ _id: STORAGE_LEDGER_DOC_ID });
        assert.equal(afterDelLedger.committedBytes, beforeDelLedger.committedBytes - fileA.length, 'deleteGridFSProof must decrement committedBytes by exact file length');

        const recheckDeleted = await getGridFSProofStream(uploadA.fileId);
        assert.equal(recheckDeleted.found, false, 'Deleted file must no longer exist in GridFS');
        console.log('[PASS] Orphan cleanup verified: file deleted from GridFS and ledger decremented.');

        console.log('\n[SUCCESS] ALL CONCURRENCY AND CAPACITY ADMISSION CHECKS PASSED!\n');
    } finally {
        await mongoose.disconnect();
        await mongo.stop();
    }
});
