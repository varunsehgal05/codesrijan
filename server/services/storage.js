import crypto from 'crypto';
import mongoose from 'mongoose';
import { getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { firebaseAdminApp } from '../middleware/auth.js';

// Strict MIME type whitelist
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp'
]);

// Maximum file size: 5 Megabytes
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Validates file binary structure, size, and magic bytes.
 * Rejects SVG, HTML, scripts, executables, and oversized uploads.
 */
export function validatePaymentProofFile(dataUriOrBuffer, fallbackMime = null) {
    let buffer;
    let mimeType = fallbackMime;

    if (typeof dataUriOrBuffer === 'string') {
        const matches = dataUriOrBuffer.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
            mimeType = matches[1].toLowerCase().trim();
            try {
                buffer = Buffer.from(matches[2], 'base64');
            } catch (err) {
                return { valid: false, statusCode: 400, error: 'Malformed base64 encoding in payment proof image.' };
            }
        } else {
            return { valid: false, statusCode: 400, error: 'Invalid image format. Expected data URI or valid binary buffer.' };
        }
    } else if (Buffer.isBuffer(dataUriOrBuffer)) {
        buffer = dataUriOrBuffer;
    } else {
        return { valid: false, statusCode: 400, error: 'Invalid input: expected base64 data URI string or Buffer.' };
    }

    if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
        return {
            valid: false,
            statusCode: 400,
            error: 'Disallowed file format. Only JPEG, PNG, and WebP raster images are accepted. SVG and vector formats are strictly prohibited.'
        };
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
        return {
            valid: false,
            statusCode: 413,
            error: `Payment proof attachment exceeds maximum allowed size (5MB). Actual size: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB`
        };
    }

    if (buffer.length < 32) {
        return {
            valid: false,
            statusCode: 400,
            error: 'Corrupted image file: payload too small to be a valid image.'
        };
    }

    // Binary Magic Number / Signature Verification
    if (mimeType === 'image/jpeg') {
        if (buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
            return { valid: false, statusCode: 400, error: 'Binary signature mismatch: File content is not a valid JPEG image.' };
        }
    } else if (mimeType === 'image/png') {
        if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) {
            return { valid: false, statusCode: 400, error: 'Binary signature mismatch: File content is not a valid PNG image.' };
        }
    } else if (mimeType === 'image/webp') {
        const riffHeader = buffer.toString('ascii', 0, 4);
        const webpHeader = buffer.toString('ascii', 8, 12);
        if (riffHeader !== 'RIFF' || webpHeader !== 'WEBP') {
            return { valid: false, statusCode: 400, error: 'Binary signature mismatch: File content is not a valid WebP image.' };
        }
    }

    const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/png' ? 'png' : 'webp';

    return {
        valid: true,
        buffer,
        mimeType,
        extension,
        sizeBytes: buffer.length
    };
}

/**
 * Uploads payment proof buffer to Firebase Cloud Storage using server-side Admin credentials.
 * If Firebase Storage is unprovisioned (e.g. requires Blaze plan on Google Cloud),
 * it returns clear diagnostic status and does not corrupt the record.
 */
export async function uploadProofToFirebaseStorage({ buffer, mimeType, extension, registrationId, userId }) {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'codesrijan-450d0.firebasestorage.app';

    const app = firebaseAdminApp || (getApps().length > 0 ? getApps()[0] : null);
    if (!app) {
        return {
            success: false,
            error: 'Firebase Admin SDK is not initialized. Storage credentials missing.',
            storageProvider: 'none'
        };
    }

    try {
        const storage = getStorage(app);
        const bucket = storage.bucket(bucketName);

        // Verify bucket existence
        const [bucketExists] = await bucket.exists().catch(err => {
            console.warn('[STORAGE] Bucket existence probe failed:', err.message);
            return [false];
        });

        if (!bucketExists) {
            return {
                success: false,
                error: `Firebase Storage bucket "${bucketName}" is not provisioned or requires Google Cloud billing activation.`,
                storageProvider: 'unprovisioned'
            };
        }

        // Unique, traversal-proof object name
        const randomToken = crypto.randomBytes(8).toString('hex');
        const objectPath = `payment-proofs/${registrationId}-${Date.now()}-${randomToken}.${extension}`;
        const file = bucket.file(objectPath);

        await file.save(buffer, {
            metadata: {
                contentType: mimeType,
                cacheControl: 'private, no-cache, no-store, must-revalidate',
                metadata: {
                    registrationId,
                    userId,
                    uploadedAt: new Date().toISOString()
                }
            },
            resumable: false,
            validation: 'crc32c'
        });

        return {
            success: true,
            storageProvider: 'firebase',
            storageBucket: bucketName,
            storagePath: objectPath,
            sizeBytes: buffer.length,
            mimeType
        };
    } catch (err) {
        console.error('[FIREBASE STORAGE ERROR]', err.message);
        return {
            success: false,
            error: err.message,
            storageProvider: 'failed'
        };
    }
}

// --- GridFS Private Storage Adapter (Atlas $0/month Option A) ---
export const GRIDFS_BUCKET_NAME = 'paymentProofs';
export const STORAGE_RESERVATIONS_COLLECTION = 'storage_reservations';
export const STORAGE_LEDGER_DOC_ID = 'gridfs_paymentProofs_usage';

// Conservative payment-proof storage budget: 75 MB default (leaves ~292 MB free headroom on M0 cluster)
export const PROOF_STORAGE_BUDGET_BYTES = parseInt(process.env.PROOF_STORAGE_BUDGET_BYTES || (75 * 1024 * 1024), 10);

// Cluster hard safety ceiling: 400 MB of 512 MB (leaves at least 112 MB reserve for DB indexes & app docs)
export const TOTAL_STORAGE_SAFETY_LIMIT_BYTES = parseInt(process.env.TOTAL_STORAGE_SAFETY_LIMIT_BYTES || (400 * 1024 * 1024), 10);

/**
 * Returns a GridFSBucket instance using the active Mongoose database connection.
 */
export function getGridFSBucket(bucketName = GRIDFS_BUCKET_NAME) {
    if (!mongoose.connection || !mongoose.connection.db) {
        throw new Error('Database connection is not ready. GridFS bucket cannot be initialized.');
    }
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName });
}

/**
 * Reconciles storage ledger against actual GridFS files collection and active reservations.
 * Purges expired pending reservations and guarantees cross-instance consistency.
 */
export async function reconcileStorageLedger(db = mongoose.connection?.db) {
    if (!db) return null;

    try {
        const reservationsCol = db.collection(STORAGE_RESERVATIONS_COLLECTION);
        const now = new Date();

        // 1. Mark expired pending reservations based on lease expiration
        await reservationsCol.updateMany(
            { type: 'reservation', status: 'pending', expiresAt: { $lt: now } },
            { $set: { status: 'expired', expiredAt: now, updatedAt: now } }
        );

        // 2. Measure actual committed bytes in GridFS files collection
        let actualCommittedBytes = 0;
        let filesCount = 0;
        try {
            const filesCollection = db.collection(`${GRIDFS_BUCKET_NAME}.files`);
            const [aggregateResult] = await filesCollection.aggregate([
                { $group: { _id: null, totalBytes: { $sum: '$length' }, count: { $sum: 1 } } }
            ]).toArray();
            if (aggregateResult) {
                actualCommittedBytes = aggregateResult.totalBytes || 0;
                filesCount = aggregateResult.count || 0;
            }
        } catch {
            actualCommittedBytes = 0;
        }

        // 3. Sum active unexpired reservations strictly
        let activeReservedBytes = 0;
        try {
            const [activeRes] = await reservationsCol.aggregate([
                { $match: { type: 'reservation', status: 'pending', expiresAt: { $gte: now } } },
                { $group: { _id: null, totalReserved: { $sum: '$bytes' } } }
            ]).toArray();
            if (activeRes) {
                activeReservedBytes = activeRes.totalReserved || 0;
            }
        } catch {
            activeReservedBytes = 0;
        }

        const totalBytes = actualCommittedBytes + activeReservedBytes;

        // 4. Update / Upsert single ledger tracking document with non-negative constraints
        const ledger = await reservationsCol.findOneAndUpdate(
            { _id: STORAGE_LEDGER_DOC_ID },
            {
                $set: {
                    committedBytes: Math.max(0, actualCommittedBytes),
                    reservedBytes: Math.max(0, activeReservedBytes),
                    totalBytes: Math.max(0, totalBytes),
                    filesCount: Math.max(0, filesCount),
                    lastReconciledAt: now,
                    updatedAt: now
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        return ledger;
    } catch (err) {
        console.error('[STORAGE LEDGER RECONCILE ERROR]', err.message);
        return null;
    }
}

/**
 * Concurrency-safe atomic capacity reservation across all server instances.
 * Uses atomic findOneAndUpdate with $expr condition to eliminate TOCTOU races.
 */
export async function reserveGridFSCapacity({ additionalBytes, registrationId, userId, ttlMs = 60000, customBudgetBytes = null }) {
    if (!mongoose.connection || !mongoose.connection.db) {
        return {
            allowed: false,
            statusCode: 503,
            error: 'Storage unavailable: Database connection is not established.'
        };
    }

    const db = mongoose.connection.db;
    const reservationsCol = db.collection(STORAGE_RESERVATIONS_COLLECTION);
    const budgetLimit = customBudgetBytes || PROOF_STORAGE_BUDGET_BYTES;

    // 1. Enforce overall cluster ceiling using dbStats as an admission preflight safeguard
    try {
        const stats = await db.command({ dbStats: 1 });
        const totalDbBytes = (stats.storageSize || stats.dataSize || 0) + (stats.indexSize || 0);
        if (totalDbBytes + additionalBytes > TOTAL_STORAGE_SAFETY_LIMIT_BYTES) {
            return {
                allowed: false,
                statusCode: 503,
                error: `Atlas cluster storage ceiling safety gate reached (${(totalDbBytes / (1024 * 1024)).toFixed(2)}MB / ${(TOTAL_STORAGE_SAFETY_LIMIT_BYTES / (1024 * 1024)).toFixed(2)}MB). Writes suspended to safeguard database.`,
                totalDbBytes,
                ceilingBytes: TOTAL_STORAGE_SAFETY_LIMIT_BYTES
            };
        }
    } catch {
        // Fallback for mock/in-memory environments without dbStats
    }

    // Reservation includes conservative BSON chunk & index padding (1.05x + 1KB)
    const reservationBytes = Math.ceil(additionalBytes * 1.05) + 1024;
    const reservationId = `res-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const expiresAt = new Date(Date.now() + ttlMs);

    // Ensure ledger document exists before atomic increment using atomic $setOnInsert
    await reservationsCol.updateOne(
        { _id: STORAGE_LEDGER_DOC_ID },
        {
            $setOnInsert: {
                committedBytes: 0,
                reservedBytes: 0,
                totalBytes: 0,
                filesCount: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        },
        { upsert: true }
    );

    // Attempt atomic conditional increment
    let admitted = await reservationsCol.findOneAndUpdate(
        {
            _id: STORAGE_LEDGER_DOC_ID,
            $expr: {
                $lte: [
                    { $add: [{ $ifNull: ['$totalBytes', 0] }, reservationBytes] },
                    budgetLimit
                ]
            }
        },
        {
            $inc: { reservedBytes: reservationBytes, totalBytes: reservationBytes },
            $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
    );

    // If initial admission failed, check if expired reservations exist to reclaim, then retry once
    if (!admitted) {
        const hasExpired = await reservationsCol.countDocuments({
            type: 'reservation',
            status: 'pending',
            expiresAt: { $lt: new Date() }
        });

        if (hasExpired > 0) {
            await reconcileStorageLedger(db);
            admitted = await reservationsCol.findOneAndUpdate(
                {
                    _id: STORAGE_LEDGER_DOC_ID,
                    $expr: {
                        $lte: [
                            { $add: [{ $ifNull: ['$totalBytes', 0] }, reservationBytes] },
                            budgetLimit
                        ]
                    }
                },
                {
                    $inc: { reservedBytes: reservationBytes, totalBytes: reservationBytes },
                    $set: { updatedAt: new Date() }
                },
                { returnDocument: 'after' }
            );
        }
    }

    if (!admitted) {
        const currentUsage = await reservationsCol.findOne({ _id: STORAGE_LEDGER_DOC_ID });
        const currentTotal = currentUsage?.totalBytes || 0;
        return {
            allowed: false,
            statusCode: 503,
            error: `Payment proof storage allocation limit exceeded. Current usage + active reservations: ${(currentTotal / (1024 * 1024)).toFixed(2)}MB / ${(budgetLimit / (1024 * 1024)).toFixed(2)}MB.`,
            currentBytes: currentTotal,
            budgetBytes: budgetLimit
        };
    }

    // Record the individual reservation document with active pending state
    await reservationsCol.insertOne({
        _id: reservationId,
        type: 'reservation',
        bucket: GRIDFS_BUCKET_NAME,
        registrationId,
        userId,
        bytes: reservationBytes,
        actualBytes: additionalBytes,
        status: 'pending',
        createdAt: new Date(),
        expiresAt
    });

    return {
        allowed: true,
        reservationId,
        reservationBytes,
        currentTotalBytes: admitted.totalBytes
    };
}

/**
 * Renews an active reservation lease for an ongoing in-flight upload.
 * Can only succeed if the reservation is still in 'pending' status and unexpired.
 */
export async function renewReservationLease(reservationId, extensionMs = 60000) {
    if (!mongoose.connection || !mongoose.connection.db || !reservationId) {
        return { renewed: false, reason: 'NO_DB_OR_RESERVATION_ID' };
    }

    try {
        const db = mongoose.connection.db;
        const reservationsCol = db.collection(STORAGE_RESERVATIONS_COLLECTION);
        const now = new Date();
        const newExpiry = new Date(Date.now() + extensionMs);

        // Atomic check-and-set: only renew if currently 'pending' AND not yet expired
        const renewedDoc = await reservationsCol.findOneAndUpdate(
            {
                _id: reservationId,
                status: 'pending',
                expiresAt: { $gt: now }
            },
            {
                $set: {
                    expiresAt: newExpiry,
                    updatedAt: now
                }
            },
            { returnDocument: 'after' }
        );

        if (!renewedDoc) {
            return { renewed: false, reason: 'EXPIRED_OR_NOT_PENDING' };
        }

        return { renewed: true, expiresAt: newExpiry };
    } catch (err) {
        console.error('[RENEW RESERVATION LEASE ERROR]', err.message);
        return { renewed: false, error: err.message };
    }
}

/**
 * Commits a reservation upon successful GridFS write.
 * Uses atomic CAS so only a pending reservation can be committed (fencing against expired writes).
 */
export async function commitGridFSCapacity(reservationId, actualFileBytes) {
    if (!mongoose.connection || !mongoose.connection.db || !reservationId) {
        return { committed: false, reason: 'NO_DB_OR_RESERVATION_ID' };
    }

    try {
        const db = mongoose.connection.db;
        const reservationsCol = db.collection(STORAGE_RESERVATIONS_COLLECTION);
        const now = new Date();

        // Atomic check-and-set: only a 'pending' reservation can transition to 'committed'
        const resDoc = await reservationsCol.findOneAndUpdate(
            { _id: reservationId, status: 'pending' },
            {
                $set: {
                    status: 'committed',
                    committedBytes: actualFileBytes,
                    committedAt: now,
                    updatedAt: now
                }
            },
            { returnDocument: 'before' }
        );

        if (!resDoc) {
            // Either already committed, released, or expired
            const existing = await reservationsCol.findOne({ _id: reservationId });
            return {
                committed: false,
                reason: existing ? existing.status.toUpperCase() : 'NOT_FOUND'
            };
        }

        const reservedBytes = resDoc.bytes || actualFileBytes;
        const delta = actualFileBytes - reservedBytes;

        // Atomically update ledger, guaranteeing values never drop below 0
        await reservationsCol.updateOne(
            { _id: STORAGE_LEDGER_DOC_ID },
            [
                {
                    $set: {
                        reservedBytes: { $max: [0, { $subtract: [{ $ifNull: ['$reservedBytes', 0] }, reservedBytes] }] },
                        committedBytes: { $add: [{ $ifNull: ['$committedBytes', 0] }, actualFileBytes] },
                        totalBytes: { $max: [0, { $add: [{ $ifNull: ['$totalBytes', 0] }, delta] }] },
                        filesCount: { $add: [{ $ifNull: ['$filesCount', 0] }, 1] },
                        updatedAt: now
                    }
                }
            ]
        );

        return { committed: true, committedBytes: actualFileBytes };
    } catch (err) {
        console.error('[COMMIT RESERVATION ERROR]', err.message);
        return { committed: false, error: err.message };
    }
}

/**
 * Releases a reservation upon upload failure or cancellation.
 * Uses atomic CAS so release happens exactly once.
 */
export async function releaseGridFSCapacity(reservationId) {
    if (!mongoose.connection || !mongoose.connection.db || !reservationId) {
        return { released: false, reason: 'NO_DB_OR_RESERVATION_ID' };
    }

    try {
        const db = mongoose.connection.db;
        const reservationsCol = db.collection(STORAGE_RESERVATIONS_COLLECTION);
        const now = new Date();

        // Atomic check-and-set: only a 'pending' reservation can transition to 'released'
        const resDoc = await reservationsCol.findOneAndUpdate(
            { _id: reservationId, status: 'pending' },
            {
                $set: {
                    status: 'released',
                    releasedAt: now,
                    updatedAt: now
                }
            },
            { returnDocument: 'before' }
        );

        if (!resDoc) {
            // Already released, committed, or expired -> safe idempotent no-op
            const existing = await reservationsCol.findOne({ _id: reservationId });
            return {
                released: false,
                reason: existing ? existing.status.toUpperCase() : 'NOT_FOUND'
            };
        }

        const reservedBytes = resDoc.bytes || 0;

        // Atomically decrement ledger, guaranteeing values never drop below 0
        await reservationsCol.updateOne(
            { _id: STORAGE_LEDGER_DOC_ID },
            [
                {
                    $set: {
                        reservedBytes: { $max: [0, { $subtract: [{ $ifNull: ['$reservedBytes', 0] }, reservedBytes] }] },
                        totalBytes: { $max: [0, { $subtract: [{ $ifNull: ['$totalBytes', 0] }, reservedBytes] }] },
                        updatedAt: now
                    }
                }
            ]
        );

        return { released: true, releasedBytes: reservedBytes };
    } catch (err) {
        console.error('[RELEASE RESERVATION ERROR]', err.message);
        return { released: false, error: err.message };
    }
}

/**
 * Validates capacity before writing any bytes to GridFS.
 * Ensures proof storage stays within application budget (75 MB) and cluster ceiling (400 MB).
 */
export async function checkGridFSCapacity(additionalBytes = 0, customBudgetBytes = null) {
    if (!mongoose.connection || !mongoose.connection.db) {
        return {
            allowed: false,
            statusCode: 503,
            error: 'Storage unavailable: Database connection is not established.'
        };
    }

    const db = mongoose.connection.db;
    const budgetLimit = customBudgetBytes || PROOF_STORAGE_BUDGET_BYTES;

    try {
        // Reconcile and inspect ledger
        const ledger = await reconcileStorageLedger(db);
        const currentTotalBytes = ledger?.totalBytes || 0;
        const currentGridFSBytes = ledger?.committedBytes || 0;
        const filesCount = ledger?.filesCount || 0;

        if (currentTotalBytes + additionalBytes > budgetLimit) {
            return {
                allowed: false,
                statusCode: 503,
                error: `Payment proof storage allocation limit exceeded. Current usage: ${(currentTotalBytes / (1024 * 1024)).toFixed(2)}MB / ${(budgetLimit / (1024 * 1024)).toFixed(2)}MB.`,
                currentGridFSBytes: currentTotalBytes,
                budgetBytes: budgetLimit,
                filesCount
            };
        }

        // Measure overall database size against cluster safety ceiling
        let totalDbBytes = 0;
        try {
            const stats = await db.command({ dbStats: 1 });
            totalDbBytes = (stats.storageSize || stats.dataSize || 0) + (stats.indexSize || 0);

            if (totalDbBytes + additionalBytes > TOTAL_STORAGE_SAFETY_LIMIT_BYTES) {
                return {
                    allowed: false,
                    statusCode: 503,
                    error: `Atlas cluster storage ceiling safety gate reached (${(totalDbBytes / (1024 * 1024)).toFixed(2)}MB / ${(TOTAL_STORAGE_SAFETY_LIMIT_BYTES / (1024 * 1024)).toFixed(2)}MB). Writes suspended to safeguard database.`,
                    totalDbBytes,
                    ceilingBytes: TOTAL_STORAGE_SAFETY_LIMIT_BYTES
                };
            }
        } catch {
            // Fallback for mock/in-memory environments without dbStats
        }

        return {
            allowed: true,
            currentGridFSBytes,
            budgetBytes: budgetLimit,
            totalDbBytes,
            filesCount
        };
    } catch (err) {
        return {
            allowed: false,
            statusCode: 500,
            error: `Failed to evaluate storage capacity: ${err.message}`
        };
    }
}

/**
 * Streams payment proof buffer into private GridFS bucket.
 * Concurrency-safely reserves capacity before writing chunks, commits upon success,
 * and releases on error.
 */
export async function uploadProofToGridFS({ buffer, mimeType, extension, registrationId, userId, customBudgetBytes = null, ttlMs = 60000 }) {
    // 1. Concurrency-Safe Atomic Capacity Reservation Guard
    const reservation = await reserveGridFSCapacity({
        additionalBytes: buffer.length,
        registrationId,
        userId,
        customBudgetBytes,
        ttlMs
    });

    if (!reservation.allowed) {
        return {
            success: false,
            statusCode: reservation.statusCode || 503,
            error: reservation.error || 'Payment proof storage quota exceeded.'
        };
    }

    let uploadStreamId = null;

    try {
        const bucket = getGridFSBucket();
        const randomToken = crypto.randomBytes(8).toString('hex');
        const filename = `proof-${registrationId}-${Date.now()}-${randomToken}.${extension}`;

        const uploadStream = bucket.openUploadStream(filename, {
            metadata: {
                contentType: mimeType,
                mimeType,
                registrationId,
                userId,
                uploadedAt: new Date().toISOString(),
                sizeBytes: buffer.length,
                reservationId: reservation.reservationId
            }
        });

        uploadStreamId = uploadStream.id;

        await new Promise((resolve, reject) => {
            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
            uploadStream.end(buffer);
        });

        // 2. Commit the capacity reservation upon successful write with atomic fencing check
        const commitResult = await commitGridFSCapacity(reservation.reservationId, buffer.length);

        if (!commitResult || !commitResult.committed) {
            // Reservation lease expired or was invalidated during write!
            // Clean up the written chunks immediately so no orphaned storage leaks occur.
            try {
                await bucket.delete(uploadStreamId);
            } catch (cleanupErr) {
                console.error('[GRIDFS LEASE ABORT CLEANUP ERROR]', cleanupErr.message);
            }

            return {
                success: false,
                statusCode: 503,
                error: 'Payment proof upload aborted: Storage reservation lease expired before write completion.'
            };
        }

        return {
            success: true,
            fileId: uploadStream.id,
            storageProvider: 'gridfs',
            storageBucket: GRIDFS_BUCKET_NAME,
            storagePath: uploadStream.id.toString(),
            sizeBytes: buffer.length,
            mimeType,
            filename,
            reservationId: reservation.reservationId
        };
    } catch (err) {
        console.error('[GRIDFS UPLOAD ERROR]', err.message);
        // Release reservation exactly once on failure
        await releaseGridFSCapacity(reservation.reservationId);
        // Clean up any partially created stream if possible
        if (uploadStreamId) {
            try {
                const bucket = getGridFSBucket();
                await bucket.delete(uploadStreamId);
            } catch { /* ignore cleanup error */ }
        }
        return {
            success: false,
            statusCode: 500,
            error: `GridFS upload failure: ${err.message}`
        };
    }
}

/**
 * Removes an orphan GridFS object and updates storage ledger.
 */
export async function deleteGridFSProof(fileId) {
    if (!fileId) return { success: false, error: 'No fileId provided for deletion' };
    try {
        const bucket = getGridFSBucket();
        const objectId = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
        
        // Find file length to adjust ledger accurately
        const files = await bucket.find({ _id: objectId }).limit(1).toArray();
        const fileLength = files?.[0]?.length || 0;

        await bucket.delete(objectId);

        // Adjust ledger with safe non-negative updates
        if (mongoose.connection?.db && fileLength > 0) {
            const reservationsCol = mongoose.connection.db.collection(STORAGE_RESERVATIONS_COLLECTION);
            await reservationsCol.updateOne(
                { _id: STORAGE_LEDGER_DOC_ID },
                [
                    {
                        $set: {
                            committedBytes: { $max: [0, { $subtract: [{ $ifNull: ['$committedBytes', 0] }, fileLength] }] },
                            totalBytes: { $max: [0, { $subtract: [{ $ifNull: ['$totalBytes', 0] }, fileLength] }] },
                            filesCount: { $max: [0, { $subtract: [{ $ifNull: ['$filesCount', 0] }, 1] }] },
                            updatedAt: new Date()
                        }
                    }
                ]
            );
        }

        return { success: true };
    } catch (err) {
        console.error('[GRIDFS ORPHAN CLEANUP ERROR]', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Retrieves a download stream for a private GridFS file.
 */
export async function getGridFSProofStream(fileId) {
    if (!fileId) return { found: false, error: 'No fileId provided' };
    try {
        const bucket = getGridFSBucket();
        const objectId = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
        const files = await bucket.find({ _id: objectId }).limit(1).toArray();
        if (!files || files.length === 0) {
            return { found: false, error: 'GridFS object not found' };
        }
        const file = files[0];
        const stream = bucket.openDownloadStream(objectId);
        return {
            found: true,
            file,
            stream
        };
    } catch (err) {
        return { found: false, error: err.message };
    }
}

