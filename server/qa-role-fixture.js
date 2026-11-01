// Disposable browser fixture. No production connection or external deliveries.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, Team, Hackathon, Project, Submission, MentorRequest } from './models/index.js';
import { MentorAssignment, JudgeAssignment, EvaluationCriteria } from './models/tertiary.js';
import { Session } from './models/auth.js';
import { setTestAppsScriptDispatcher, setTestTransporter } from './services/email.js';

const db = await MongoMemoryServer.create({ binary: { systemBinary: process.env.MONGOMS_SYSTEM_BINARY || path.join(os.homedir(), '.cache/mongodb-binaries/mongod-x64-win32-8.2.6.exe') } });
process.env.MONGO_URI = db.getUri('codesrijan_browser_roles');
process.env.MONGO_DB_NAME = 'codesrijan_browser_roles';
process.env.SEED_ADMIN_PASSWORD = '';
process.env.SEED_STUDENT_PASSWORD = '';
setTestAppsScriptDispatcher(async () => ({ success: true }));
setTestTransporter({ sendMail: async () => ({ messageId: 'mock' }) });
await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME });
const { httpServer } = await import('./server.js');
const identities = {};
for (const role of ['mentor', 'judge', 'student', 'admin']) {
    const user = await User.create({ id: `qa-${role}`, name: `QA ${role}`, email: `${role}@example.invalid`, role, accountStatus: 'active', emailVerified: true, ...(role === 'student' ? { teamId: 'qa-team' } : {}) });
    const token = crypto.randomBytes(32).toString('hex');
    await Session.create({ userId: user.id, sessionTokenHash: crypto.createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 4 * 3600000) });
    identities[role] = { user: { id: user.id, name: user.name, email: user.email, role, teamId: user.teamId }, token };
}
await Hackathon.create({ id: 'qa-event', name: 'Isolated Role QA', status: 'evaluation', evaluationDeadline: new Date(Date.now() + 86400000) });
await Team.create({ id: 'qa-team', name: 'QA Assigned Squad', hackathonId: 'qa-event', leaderId: 'qa-student', memberIds: ['qa-student'], isSubmitted: true });
await Project.create({ id: 'qa-project', teamId: 'qa-team', hackathonId: 'qa-event', name: 'Role QA prototype', description: 'Safe local browser fixture.', technologies: ['React', 'Node.js'], status: 'submitted' });
await Submission.create({ id: 'qa-submission', projectId: 'qa-project', teamId: 'qa-team', hackathonId: 'qa-event', projectTitle: 'Role QA prototype', description: 'Safe local browser fixture.', technologies: ['React', 'Node.js'], githubUrl: 'https://github.com/example/project', status: 'submitted' });
await MentorAssignment.create({ id: 'qa-mentor-assignment', mentorId: 'qa-mentor', teamId: 'qa-team', hackathonId: 'qa-event', status: 'assigned' });
await JudgeAssignment.create({ id: 'qa-judge-assignment', judgeId: 'qa-judge', projectId: 'qa-project', hackathonId: 'qa-event', status: 'assigned' });
await MentorRequest.create({ id: 'qa-request', teamId: 'qa-team', hackathonId: 'qa-event', requestedBy: 'qa-student', topic: 'Deployment review', description: 'Review our safe local prototype.', priority: 'high', status: 'pending' });
await EvaluationCriteria.create([{ id: 'qa-innovation', hackathonId: 'qa-event', name: 'Innovation', minScore: 0, maxScore: 10, weight: 40, order: 0 }, { id: 'qa-execution', hackathonId: 'qa-event', name: 'Execution', minScore: 0, maxScore: 10, weight: 60, order: 1 }]);
const fixturePath = path.join(os.tmpdir(), 'codesrijan-role-fixture.local.json');
await fs.writeFile(fixturePath, JSON.stringify(identities));
await new Promise(resolve => httpServer.listen(Number(process.env.QA_PORT || 5012), '127.0.0.1', resolve));
console.log(`Disposable role fixture ready on 127.0.0.1:${httpServer.address().port}. Identities saved to ${fixturePath}; do not log their contents.`);
async function stop() { await new Promise(resolve => httpServer.close(resolve)); await mongoose.disconnect(); await db.stop(); await fs.rm(fixturePath, { force: true }); process.exit(0); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
