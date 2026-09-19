import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import dns from 'dns';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Mongoose Models
import { User, Hackathon, Team, Registration, Submission, Project, Evaluation, TeamJoinRequest, TeamInvitation, RecruitmentProfile } from './models/index.js';
import { Session, EmailVerification } from './models/auth.js';
import { Announcement, CalendarEvent } from './models/secondary.js';

async function seedDatabase() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URI, { dbName: 'codesrijan' });
        console.log("Connected Successfully. Seeding initial structures...");

        // 1. Initial User (Admin)
        await User.findOneAndUpdate(
            { email: 'admin@codesrijan.com' },
            {
                id: 'admin-001',
                name: 'System Administrator',
                email: 'admin@codesrijan.com',
                role: 'admin',
                accountStatus: 'active',
                emailVerified: true
            },
            { upsert: true }
        );

        // 2. Initial Hackathon Structure
        await Hackathon.findOneAndUpdate(
            { id: 'codesrijan-2026' },
            {
                id: 'codesrijan-2026',
                name: 'CodeSrijan 2026',
                status: 'registration_open',
                registrationStart: new Date(),
                registrationEnd: new Date(Date.now() + 864000000),
                hackathonStart: new Date(Date.now() + 864000000),
                hackathonEnd: new Date(Date.now() + 864000000 * 2),
                description: 'The ultimate production battleground.',
            },
            { upsert: true }
        );

        // 3. Dummy Session just to force collection
        await Session.findOneAndUpdate(
            { userId: 'admin-001' },
            {
                userId: 'admin-001',
                sessionTokenHash: crypto.createHash('sha256').update('dummy-token').digest('hex'),
                expiresAt: new Date(Date.now() + 100000)
            },
            { upsert: true }
        );

        console.log("Injection complete. Check MongoDB Atlas for `codesrijan` DB and resulting Collections.");
        process.exit(0);

    } catch (e) {
        console.error("Ignition Failed:", e);
        process.exit(1);
    }
}

seedDatabase();
