import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { Hackathon } from './models/index.js';
import { CalendarEvent } from './models/secondary.js';

test('Timeline Schedule API Unit Test', async (t) => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), { dbName: 'test_timeline' });

    // Seed test hackathons
    const now = new Date();
    const h1 = await Hackathon.create({
        id: 'hack-free-1792862581267',
        name: 'CodeSrijan Impact Challenge — Free Edition',
        entryType: 'free',
        mode: 'online',
        startDate: new Date(now.getTime() + 7 * 86400000),
        endDate: new Date(now.getTime() + 9 * 86400000),
        registrationStart: new Date(now.getTime() - 2 * 86400000),
        registrationEnd: new Date(now.getTime() + 6 * 86400000),
        submissionDeadline: new Date(now.getTime() + 8.5 * 86400000),
        venue: 'CodeSrijan Discord Stage'
    });

    const h2 = await Hackathon.create({
        id: 'hack-paid-1792862582632',
        name: 'CodeSrijan 24-Hour Innovation Hackathon',
        entryType: 'paid',
        mode: 'offline',
        startDate: new Date(now.getTime() + 14 * 86400000),
        endDate: new Date(now.getTime() + 15 * 86400000),
        registrationStart: new Date(now.getTime() - 5 * 86400000),
        registrationEnd: new Date(now.getTime() + 13 * 86400000),
        submissionDeadline: new Date(now.getTime() + 14.8 * 86400000),
        venue: 'Main Campus Innovation Lab'
    });

    // Create Express App using the timeline logic
    const app = express();
    app.use(express.json());

    app.get('/api/timeline', async (req, res) => {
        try {
            const { hackathonId } = req.query;
            const calendarEvents = await CalendarEvent.find(hackathonId ? { hackathonId } : {}).lean();
            const hackathonFilter = { isArchived: { $ne: true } };
            if (hackathonId) hackathonFilter.id = hackathonId;
            const hackathons = await Hackathon.find(hackathonFilter).sort({ startDate: 1 }).lean();

            const curTime = new Date();
            const scheduleMilestones = [];

            for (const h of hackathons) {
                const hStart = new Date(h.startDate || (Date.now() + 86400000));
                const hEnd = new Date(h.endDate || (hStart.getTime() + 24 * 3600000));
                const regStart = new Date(h.registrationStart || (hStart.getTime() - 14 * 86400000));
                const regEnd = new Date(h.registrationEnd || h.startDate || (hStart.getTime() - 2 * 3600000));
                const subDeadline = new Date(h.submissionDeadline || (hEnd.getTime() - 2 * 3600000));
                const evalDeadline = new Date(h.evaluationDeadline || (hEnd.getTime() - 3600000));
                const resultDate = new Date(h.resultDate || hEnd);

                const hackDuration = Math.max(3600000, subDeadline.getTime() - hStart.getTime());
                const venueLocation = h.venue || (h.mode === 'offline' ? 'Main Campus Auditorium' : 'CodeSrijan Virtual Arena & Stage');
                const meetUrl = (h.mode === 'online' || !h.venue) ? 'https://meet.google.com/codesrijan-hackathon' : undefined;

                const milestones = [
                    { phaseKey: 'registration', phaseNumber: 1, title: 'Registration Window', category: 'Registration', startDate: regStart, endDate: regEnd, location: 'Online Portal', meetingUrl: undefined },
                    { phaseKey: 'team_formation', phaseNumber: 2, title: 'Team Formation & Roster Lock', category: 'Teams', startDate: regStart, endDate: new Date(Math.min(regEnd.getTime(), hStart.getTime())), location: 'Squad Directorate', meetingUrl: undefined },
                    { phaseKey: 'opening_ceremony', phaseNumber: 3, title: 'Opening Ceremony & Keynote Briefing', category: 'Kickoff', startDate: hStart, endDate: new Date(hStart.getTime() + 3600000), location: venueLocation, meetingUrl: meetUrl },
                    { phaseKey: 'hacking_begins', phaseNumber: 4, title: 'Hacking Begins & Git Repositories Live', category: 'Development', startDate: new Date(hStart.getTime() + 3600000), endDate: subDeadline, location: venueLocation, meetingUrl: meetUrl },
                    { phaseKey: 'checkpoint_1', phaseNumber: 5, title: 'Checkpoint 1: Idea Validation & Architecture Review', category: 'Mentorship', startDate: new Date(hStart.getTime() + Math.max(3600000, hackDuration * 0.25)), endDate: new Date(hStart.getTime() + Math.max(3600000, hackDuration * 0.25) + 7200000), location: 'Mentor Command Center & Discord', meetingUrl: meetUrl },
                    { phaseKey: 'checkpoint_2', phaseNumber: 6, title: 'Checkpoint 2: Prototype Validation & Mentor Sync', category: 'Mentorship', startDate: new Date(hStart.getTime() + Math.max(7200000, hackDuration * 0.65)), endDate: new Date(hStart.getTime() + Math.max(7200000, hackDuration * 0.65) + 7200000), location: 'Mentor Command Center & Discord', meetingUrl: meetUrl },
                    { phaseKey: 'submission_deadline', phaseNumber: 7, title: 'Submission Deadline & Code Freeze', category: 'Submission', startDate: new Date(subDeadline.getTime() - 7200000), endDate: subDeadline, location: 'Workspace Submission Vault', meetingUrl: undefined },
                    { phaseKey: 'pitch_round', phaseNumber: 8, title: 'Pitch Round & Technical Demonstrations', category: 'Presentation', startDate: subDeadline, endDate: new Date(subDeadline.getTime() + Math.min(7200000, (hEnd.getTime() - subDeadline.getTime()) * 0.5)), location: venueLocation, meetingUrl: meetUrl },
                    { phaseKey: 'judging', phaseNumber: 9, title: 'Judging & Rubric Evaluation', category: 'Evaluation', startDate: new Date(subDeadline.getTime() + 1800000), endDate: evalDeadline, location: 'Judge Command Center', meetingUrl: undefined },
                    { phaseKey: 'grand_finale', phaseNumber: 10, title: 'Grand Finale & Award Ceremony', category: 'Finale', startDate: new Date(hEnd.getTime() - 3600000), endDate: resultDate, location: venueLocation, meetingUrl: meetUrl }
                ];

                let hasActive = false;
                for (const m of milestones) {
                    if (curTime > m.endDate) {
                        m.status = 'completed';
                    } else if (curTime >= m.startDate && curTime <= m.endDate) {
                        m.status = 'ongoing';
                        if (!hasActive) {
                            m.isCurrentPhase = true;
                            hasActive = true;
                        }
                    } else {
                        m.status = 'upcoming';
                    }
                }
                if (!hasActive) {
                    const next = milestones.find(m => m.status === 'upcoming');
                    if (next) next.isCurrentPhase = true;
                }

                for (const m of milestones) {
                    scheduleMilestones.push({
                        id: `${h.id}-${m.phaseKey}`,
                        hackathonId: h.id,
                        hackathonName: h.name,
                        entryType: h.entryType,
                        ...m
                    });
                }
            }

            scheduleMilestones.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            res.json(scheduleMilestones);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    await t.test('1. GET /api/timeline returns 20 milestones for 2 hackathons (10 each)', async () => {
        const res = await fetch(`${baseUrl}/api/timeline`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(Array.isArray(data), true);
        assert.equal(data.length, 20);

        // Verify the 10 milestone phase keys
        const phases = data.filter(m => m.hackathonId === 'hack-free-1792862581267').map(m => m.phaseKey);
        const expected = [
            'registration', 'team_formation', 'opening_ceremony', 'hacking_begins',
            'checkpoint_1', 'checkpoint_2', 'submission_deadline', 'pitch_round',
            'judging', 'grand_finale'
        ];
        assert.deepEqual(phases, expected);
    });

    await t.test('2. GET /api/timeline?hackathonId=hack-free-1792862581267 returns exactly 10 milestones for free hackathon', async () => {
        const res = await fetch(`${baseUrl}/api/timeline?hackathonId=hack-free-1792862581267`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.length, 10);
        for (const item of data) {
            assert.equal(item.hackathonId, 'hack-free-1792862581267');
            assert.ok(item.startDate);
            assert.ok(item.endDate);
            assert.ok(['completed', 'ongoing', 'upcoming'].includes(item.status));
        }
    });

    await t.test('3. Verify ongoing phase detection', async () => {
        const res = await fetch(`${baseUrl}/api/timeline?hackathonId=hack-free-1792862581267`);
        const data = await res.json();
        const ongoing = data.filter(m => m.status === 'ongoing');
        assert.ok(ongoing.length >= 1, 'At least Registration or Team Formation is ongoing');
        const current = data.find(m => m.isCurrentPhase);
        assert.ok(current, 'Current phase must be designated');
    });

    await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
    await mongod.stop();
});
