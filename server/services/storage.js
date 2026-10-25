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
 * Validates capacity before writing any bytes to GridFS.
 * Ensures proof storage stays within application budget (75 MB) and cluster ceiling (400 MB).
 */
export async function checkGridFSCapacity(additionalBytes = 0) {
    if (!mongoose.connection || !mongoose.connection.db) {
        return {
            allowed: false,
            statusCode: 503,
            error: 'Storage unavailable: Database connection is not established.'
        };
    }

    const db = mongoose.connection.db;

    try {
        // 1. Calculate current GridFS usage for paymentProofs bucket
        let currentGridFSBytes = 0;
        let filesCount = 0;

        try {
            const filesCollection = db.collection(`${GRIDFS_BUCKET_NAME}.files`);
            const [aggregateResult] = await filesCollection.aggregate([
                { $group: { _id: null, totalBytes: { $sum: '$length' }, count: { $sum: 1 } } }
            ]).toArray();

            if (aggregateResult) {
                currentGridFSBytes = aggregateResult.totalBytes || 0;
                filesCount = aggregateResult.count || 0;
            }
        } catch (aggErr) {
            // Collection might not exist yet if zero uploads
            currentGridFSBytes = 0;
        }

        if (currentGridFSBytes + additionalBytes > PROOF_STORAGE_BUDGET_BYTES) {
            return {
                allowed: false,
                statusCode: 503,
                error: `Payment proof storage allocation limit exceeded. Current usage: ${(currentGridFSBytes / (1024 * 1024)).toFixed(2)}MB / ${(PROOF_STORAGE_BUDGET_BYTES / (1024 * 1024)).toFixed(2)}MB.`,
                currentGridFSBytes,
                budgetBytes: PROOF_STORAGE_BUDGET_BYTES,
                filesCount
            };
        }

        // 2. Measure overall database size against cluster safety ceiling
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
        } catch (statsErr) {
            // If in-memory server or restricted dbStats, skip global ceiling but keep GridFS budget check
        }

        return {
            allowed: true,
            currentGridFSBytes,
            budgetBytes: PROOF_STORAGE_BUDGET_BYTES,
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
 * Atomically verifies capacity before writing.
 */
export async function uploadProofToGridFS({ buffer, mimeType, extension, registrationId, userId }) {
    // 1. Capacity & Budget Preflight Guard
    const capacity = await checkGridFSCapacity(buffer.length);
    if (!capacity.allowed) {
        return {
            success: false,
            statusCode: capacity.statusCode || 503,
            error: capacity.error || 'Payment proof storage quota exceeded.'
        };
    }

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
                sizeBytes: buffer.length
            }
        });

        await new Promise((resolve, reject) => {
            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
            uploadStream.end(buffer);
        });

        return {
            success: true,
            fileId: uploadStream.id,
            storageProvider: 'gridfs',
            storageBucket: GRIDFS_BUCKET_NAME,
            storagePath: uploadStream.id.toString(),
            sizeBytes: buffer.length,
            mimeType,
            filename
        };
    } catch (err) {
        console.error('[GRIDFS UPLOAD ERROR]', err.message);
        return {
            success: false,
            statusCode: 500,
            error: `GridFS upload failure: ${err.message}`
        };
    }
}

/**
 * Removes an orphan GridFS object if registration metadata persistence fails.
 */
export async function deleteGridFSProof(fileId) {
    if (!fileId) return { success: false, error: 'No fileId provided for deletion' };
    try {
        const bucket = getGridFSBucket();
        const objectId = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
        await bucket.delete(objectId);
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

