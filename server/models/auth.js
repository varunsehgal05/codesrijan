import mongoose from 'mongoose';

// 1. Sessions Collection (For long-lived auth JWT/Cookie state storage)
const sessionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    sessionTokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    lastUsedAt: Date,
    ipAddress: String,
    userAgent: String,
    revokedAt: Date
}, { timestamps: true });

// 2. Email Verifications Collection (Registration Only)
const emailVerificationSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: Date
}, { timestamps: true });

// 3. Password Reset Tokens Collection
const passwordResetTokenSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: Date
}, { timestamps: true });

// 4. Security Events (Audit Log)
const securityEventSchema = new mongoose.Schema({
    userId: String,
    event: { type: String, required: true }, // 'login_success', 'password_reset', 'registration'
    ipAddress: String,
    metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
export const EmailVerification = mongoose.models.EmailVerification || mongoose.model('EmailVerification', emailVerificationSchema);
export const PasswordResetToken = mongoose.models.PasswordResetToken || mongoose.model('PasswordResetToken', passwordResetTokenSchema);
export const SecurityEvent = mongoose.models.SecurityEvent || mongoose.model('SecurityEvent', securityEventSchema);

export default { Session, EmailVerification, PasswordResetToken, SecurityEvent };
