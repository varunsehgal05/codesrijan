import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Hackathon, ProblemStatement, Setting } from './models/index.js';

dotenv.config();

const SEED = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // 1. Seed Hackathon
        const hId = 'hack-codesrijan-2026';
        await Hackathon.deleteMany({ id: hId });
        await Hackathon.create({
            id: hId,
            name: "CodeSrijan 2026",
            slug: "codesrijan-2026",
            description: "The ultimate student-run hackathon celebrating innovation and neo-brutalist engineering.",
            theme: "Build for the Future",
            startDate: new Date(Date.now() - 86400000 * 2), // started 2 days ago
            endDate: new Date(Date.now() + 86400000 * 5), // ends in 5 days
            status: "active",
            teamSizeMin: 2,
            teamSizeMax: 4,
            eligibilityRules: "Open to all enrolled students.",
            hackathonRules: "No plagiarism. Must use at least one AI API.",
            createdBy: "admin-seed"
        });
        console.log('Seeded Hackathon.');

        // 2. Seed Problem Statements
        await ProblemStatement.deleteMany({ hackathonId: hId });
        const problems = [
            {
                id: 'prob-1',
                hackathonId: hId,
                title: 'AI Accessibility Assistant',
                description: 'Build a tool that helps visually impaired users navigate the web using computer vision and LLMs.',
                domain: 'AI/ML',
                difficulty: 'Hard',
                tags: ['ai', 'accessibility', 'web'],
                isPublished: true
            },
            {
                id: 'prob-2',
                hackathonId: hId,
                title: 'Sustainable Commute Tracker',
                description: 'Create an app that tracks and gamifies carbon-neutral commuting for college students.',
                domain: 'App Dev',
                difficulty: 'Medium',
                tags: ['mobile', 'sustainability'],
                isPublished: true
            },
            {
                id: 'prob-3',
                hackathonId: hId,
                title: 'Neo-Brutalist UI Component Library',
                description: 'Design and build an open-source React component library utilizing Neo-Brutalist design principles.',
                domain: 'Web Dev',
                difficulty: 'Medium',
                tags: ['react', 'ui/ux', 'css'],
                isPublished: true
            }
        ];
        await ProblemStatement.insertMany(problems);
        console.log('Seeded Problem Statements.');

        // 3. Ensure Current Hackathon Setting is updated
        await Setting.findOneAndUpdate(
            { key: 'currentHackathonId' },
            { value: hId, description: "Active hackathon displayed on homepage" },
            { upsert: true }
        );
        console.log('Updated Settings.');

        console.log('Seed Complete!');
        process.exit(0);
    } catch (e) {
        console.error('Seed Failed:', e);
        process.exit(1);
    }
};

SEED();
