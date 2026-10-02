const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = 'mongodb+srv://codesrijan_db_user:mbSBS100Zj9kE5pX@codesrijan-cluster.mrckx43.mongodb.net/codesrijan?appName=codesrijan-cluster';

async function seed() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected!');

    const db = mongoose.connection;

    console.log('Clearing old demo data...');
    await db.collection('users').deleteMany({ isDemo: true });
    await db.collection('hackathons').deleteMany({ isDemo: true });
    await db.collection('problems').deleteMany({ isDemo: true });
    await db.collection('teams').deleteMany({ isDemo: true });
    await db.collection('messages').deleteMany({ isDemo: true });
    await db.collection('supporttickets').deleteMany({ isDemo: true });
    await db.collection('announcements').deleteMany({ isDemo: true });
    await db.collection('evaluations').deleteMany({ isDemo: true });

    console.log('Seeding Users...');
    const passwordHash = await bcrypt.hash('DemoStudent#2026', 10);
    const adminHash = await bcrypt.hash('DemoAdmin#2026', 10);
    const mentorHash = await bcrypt.hash('DemoMentor#2026', 10);
    const judgeHash = await bcrypt.hash('DemoJudge#2026', 10);
    const recruiterHash = await bcrypt.hash('DemoRecruiter#2026', 10);

    const users = [
        { id: 'usr-demo-admin', name: 'CodeSrijan Demo Admin', email: 'admin.demo@codesrijan.test', passwordHash: adminHash, role: 'admin', isDemo: true, accountStatus: 'active' },
        { id: 'usr-demo-aarav', name: 'Aarav Sharma', email: 'student.aarav@codesrijan.test', passwordHash, role: 'student', bio: 'Full-stack developer exploring AI', skills: ['React', 'Node.js', 'MongoDB', 'System Design'], isDemo: true, accountStatus: 'active' },
        { id: 'usr-demo-priya', name: 'Priya Nair', email: 'student.priya@codesrijan.test', passwordHash, role: 'student', bio: 'Product designer focused on accessibility', skills: ['UI/UX', 'Figma', 'React', 'Research'], isDemo: true, accountStatus: 'active' },
        { id: 'usr-demo-arjun', name: 'Arjun Patel', email: 'student.arjun@codesrijan.test', passwordHash, role: 'student', skills: ['Python', 'AI/ML', 'FastAPI'], isDemo: true, accountStatus: 'active' },
        { id: 'usr-demo-meera', name: 'Meera Joshi', email: 'student.meera@codesrijan.test', passwordHash, role: 'student', skills: ['Product Design', 'Figma', 'Frontend', 'Accessibility'], isDemo: true, accountStatus: 'active' },
        { id: 'usr-demo-kabir', name: 'Kabir Verma', email: 'student.kabir@codesrijan.test', passwordHash, role: 'student', skills: ['Next.js', 'TypeScript', 'Cloud', 'DevOps'], isDemo: true, accountStatus: 'active' },
        { id: 'usr-demo-riya', name: 'Riya Singh', email: 'student.riya@codesrijan.test', passwordHash, role: 'student', skills: ['Marketing', 'Product Strategy', 'Presentation', 'Research'], isDemo: true, accountStatus: 'active' },
        { id: 'usr-demo-neha', name: 'Neha Kapoor', email: 'mentor.demo@codesrijan.test', passwordHash: mentorHash, role: 'mentor', skills: ['Product Design', 'System Architecture', 'AI Products'], isDemo: true, accountStatus: 'active' },
        { id: 'usr-demo-vikram', name: 'Dr. Vikram Rao', email: 'judge.vikram@codesrijan.test', passwordHash: judgeHash, role: 'judge', skills: ['AI/ML', 'Backend Systems', 'Innovation'], isDemo: true, accountStatus: 'active' },
        { id: 'usr-demo-ananya', name: 'Ananya Mehta', email: 'judge.ananya@codesrijan.test', passwordHash: judgeHash, role: 'judge', skills: ['UX Design', 'Product Design', 'Presentation'], isDemo: true, accountStatus: 'active' },
        { id: 'usr-demo-recruiter', name: 'Talent Team Demo', email: 'recruiter.demo@codesrijan.test', passwordHash: recruiterHash, role: 'recruiter', isDemo: true, accountStatus: 'active' }
    ];
    await db.collection('users').insertMany(users);

    console.log('Seeding Hackathons...');
    const hackathons = [
        { id: 'hack-demo-1', title: 'CodeSrijan Innovation Sprint 2026', slug: 'codesrijan-innovation-sprint-2026', description: 'A 72-hour innovation challenge.', status: 'Active', teamSize: { min: 2, max: 4 }, startDate: new Date('2026-10-10T09:00:00Z'), endDate: new Date('2026-10-13T09:00:00Z'), isDemo: true },
        { id: 'hack-demo-2', title: 'CodeSrijan AI Challenge 2026', slug: 'codesrijan-ai-challenge-2026', status: 'Upcoming', teamSize: { min: 2, max: 4 }, isDemo: true },
        { id: 'hack-demo-3', title: 'CodeSrijan Spring Hack 2026', slug: 'codesrijan-spring-hack-2026', status: 'Completed', teamSize: { min: 2, max: 4 }, isDemo: true }
    ];
    await db.collection('hackathons').insertMany(hackathons);

    console.log('Seeding Problems...');
    const problems = [
        { id: 'prob-demo-1', title: 'AI for Accessibility', difficulty: 'Easy', category: 'AI / Accessibility', description: 'Build an AI-powered experience that improves accessibility.', hackathonId: 'hack-demo-1', isPublished: true, isDemo: true },
        { id: 'prob-demo-2', title: 'Smart Campus Assistant', difficulty: 'Medium', category: 'AI / Education', hackathonId: 'hack-demo-1', isPublished: true, isDemo: true },
        { id: 'prob-demo-3', title: 'Climate Action Dashboard', difficulty: 'Medium', category: 'Sustainability', hackathonId: 'hack-demo-1', isPublished: true, isDemo: true },
        { id: 'prob-demo-4', title: 'Emergency Response Network', difficulty: 'Hard', category: 'Civic Technology', hackathonId: 'hack-demo-2', isPublished: true, isDemo: true },
        { id: 'prob-demo-5', title: 'Inclusive Financial Assistant', difficulty: 'Hard', category: 'FinTech', hackathonId: 'hack-demo-1', isPublished: false, isDemo: true }
    ];
    await db.collection('problems').insertMany(problems);

    console.log('Seeding Teams...');
    const teams = [
        { id: 'team-demo-alpha', name: 'Team Alpha', hackathonId: 'hack-demo-1', leaderId: 'usr-demo-aarav', members: ['usr-demo-aarav', 'usr-demo-priya', 'usr-demo-arjun', 'usr-demo-meera'], problemId: 'prob-demo-1', status: 'Active', isDemo: true, submission: { status: 'Submitted', githubUrl: 'https://github.com/codesrijan-demo/team-alpha', demoUrl: 'https://demo.codesrijan.test/accessai' } },
        { id: 'team-demo-nova', name: 'Team Nova', hackathonId: 'hack-demo-1', leaderId: 'usr-demo-kabir', members: ['usr-demo-kabir', 'usr-demo-riya'], problemId: 'prob-demo-2', status: 'Active', isDemo: true, submission: { status: 'Draft' } },
        { id: 'team-demo-pixel', name: 'PixelForge', hackathonId: 'hack-demo-1', leaderId: 'usr-demo-meera', members: ['usr-demo-meera', 'usr-demo-priya'], problemId: 'prob-demo-3', status: 'Active', isDemo: true },
        { id: 'team-demo-vertex', name: 'Vertex Labs', hackathonId: 'hack-demo-3', members: ['usr-demo-aarav', 'usr-demo-kabir'], status: 'Evaluated', isDemo: true, submission: { status: 'Evaluated' } }
    ];
    await db.collection('teams').insertMany(teams);

    console.log('Seeding Chat Messages & Support Tickets...');
    await db.collection('messages').insertMany([
        { id: 'msg-demo-1', senderId: 'usr-demo-aarav', receiverId: 'usr-demo-priya', content: 'Hey Priya, are you available to work on the Figma flow?', timestamp: new Date(), isDemo: true },
        { id: 'msg-demo-2', senderId: 'usr-demo-priya', receiverId: 'usr-demo-aarav', content: 'Yes, I will update the onboarding screens.', timestamp: new Date(), isDemo: true },
        { id: 'msg-demo-3', senderId: 'usr-demo-aarav', receiverId: 'usr-demo-admin', content: 'I need help changing our team problem statement.', timestamp: new Date(), isDemo: true }
    ]);

    await db.collection('supporttickets').insertMany([
        { id: 'CS-DEMO-1001', userId: 'usr-demo-aarav', subject: 'Unable to upload demo', category: 'Technical', priority: 'High', status: 'OPEN', messages: [{ sender: 'usr-demo-aarav', content: 'Help' }], isDemo: true },
        { id: 'CS-DEMO-1002', userId: 'usr-demo-priya', subject: 'How do I invite another teammate?', category: 'Team', priority: 'Normal', status: 'IN_PROGRESS', isDemo: true }
    ]);

    console.log('Seeding Announcements & Evaluations...');
    await db.collection('announcements').insertMany([
        { id: 'ann-demo-1', title: 'Welcome to CodeSrijan Innovation Sprint 2026', audience: 'Everyone', content: 'Good luck!', isPublished: true, isDemo: true }
    ]);

    await db.collection('evaluations').insertMany([
        { id: 'eval-demo-1', teamId: 'team-demo-vertex', judgeId: 'usr-demo-vikram', scores: { innovation: 18, technical: 17, ux: 19, impact: 17, presentation: 16 }, totalScore: 87, bonus: 10, penalty: 5, finalScore: 92, isDemo: true }
    ]);

    console.log('Database Seeding Complete!');
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
