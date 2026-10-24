import crypto from 'crypto';
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
