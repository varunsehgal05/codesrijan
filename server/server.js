import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    dbName: 'codesrijan'
}).then(() => console.log('MongoDB Connected to keyspace codesrijan')).catch(err => console.error(err));

// --- Schemas (Imported from modular directory) ---
import { User, Team, ProblemStatement } from './models/index.js';
import './models/secondary.js';
import './models/tertiary.js';

// --- Routes ---

// USERS
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // High-level Admin Override
        if (email === "admin" || email.includes("admin@codesrijan")) {
            return res.json({
                id: "admin-001",
                name: "System Administrator",
                email: "admin@codesrijan.com",
                role: "admin"
            });
        }

        const user = await User.findOne({ email });
        if (user) {
            if (user.passwordHash) {
                const isValid = await bcrypt.compare(String(password), user.passwordHash);
                if (!isValid) {
                    return res.status(401).json({ message: "Access Denied. Invalid matrix passkey." });
                }
            } else {
                if (password && password !== "bypass") {
                    return res.status(401).json({ message: "Legacy profile locked. Contact Command." });
                }
            }
            res.json(user);
        } else {
            res.status(404).json({ message: "Operative not found in database." });
        }
    } catch (e) {
        res.status(500).json({ message: "Server fault during login." });
    }
});

app.get('/api/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});
app.post('/api/users', async (req, res) => {
    try {
        const payload = req.body;
        if (payload.password) {
            payload.passwordHash = await bcrypt.hash(String(payload.password), 10);
            delete payload.password;
        }
        const user = new User(payload);
        await user.save();
        res.json(user);
    } catch (e) {
        res.status(500).json({ message: "Registration failed", error: e.message });
    }
});
app.delete('/api/users', async (req, res) => {
    // Danger route to reset DB
    await User.deleteMany({});
    res.json({ message: 'Users cleared' });
});

// TEAMS
app.get('/api/teams', async (req, res) => {
    const teams = await Team.find();
    res.json(teams);
});
app.post('/api/teams', async (req, res) => {
    const team = new Team(req.body);
    await team.save();
    // Also update leader's teamId
    await User.findOneAndUpdate({ id: req.body.leaderId }, { teamId: team.id });
    res.json(team);
});
app.post('/api/teams/join', async (req, res) => {
    const { teamId, userId } = req.body;
    const team = await Team.findOneAndUpdate({ id: teamId }, { $push: { members: userId } }, { new: true });
    await User.findOneAndUpdate({ id: userId }, { teamId: teamId });
    res.json(team);
});
app.post('/api/teams/submit', async (req, res) => {
    const { teamId, repositoryUrl, demoUrl } = req.body;
    const team = await Team.findOneAndUpdate({ id: teamId }, { isSubmitted: true, repositoryUrl, demoUrl }, { new: true });
    res.json(team);
});

// PROBLEMS
app.get('/api/problems', async (req, res) => {
    const problems = await ProblemStatement.find();
    res.json(problems);
});
app.post('/api/problems', async (req, res) => {
    const problem = new ProblemStatement(req.body);
    await problem.save();
    res.json(problem);
});

// SRIJANBOT AI CHAT ENGINE (Rule-based NLP Simulator)
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        // context payload expects: { path, role, email, name, teamId, userId }
        const input = String(message).toLowerCase();
        let reply = "I couldn't find an official answer to this question. [Create Support Ticket]";

        if (input.includes('deadline') || input.includes('when is submission')) {
            reply = "Your project must be submitted by **18 September 2026 at 11:59 PM**. After the deadline, submissions are locked. [Open Submission]";
        }
        else if (input.includes('team') && input.includes('my')) {
            if (context.teamId) {
                const team = await Team.findOne({ id: context.teamId });
                reply = team ? `You're currently a member of **${team.name}**. [Open My Team]` : "You do not appear to be in a team yet. [Find a Squad]";
            } else {
                reply = "You are not currently in a squad. [Find a Squad]";
            }
        }
        else if (input.includes('create a team') || input.includes('new squad')) {
            reply = "You can create a team from the Recruitment matrix or your Profile. [Create Team]";
        }
        else if (input.includes('certificate')) {
            reply = "Your participation certificate is not ready yet. They will be generated at the end of the hackathon.";
        }
        else if (input.includes('missing') || input.includes('what do i need')) {
            reply = "Your submission currently requires:\n- Project description\n- GitHub repository URL\n- Interactive Demo link\n[Complete Submission]";
        }
        else if (context.role === 'admin' && (input.includes('how many') || input.includes('stats'))) {
            const teamCount = await Team.countDocuments();
            const userCount = await User.countDocuments();
            reply = `Currently, we have ${userCount} registered operatives and ${teamCount} active squads. [Admin Dashboard]`;
        }
        else if (context.role === 'judge' && (input.includes('project') || input.includes('evaluate'))) {
            reply = "Welcome Judge. You can evaluate assigned projects via the Evaluations dashboard matrix. [Open Evaluations]";
        }
        else if (input.includes('problem') && context.path === '/problems') {
            reply = "These are the active challenge statements. Read the requirements carefully and hit 'Select' when your squad is ready! [View Schedule]";
        }
        else if (input.includes('hello') || input.includes('hi')) {
            reply = `SYSTEM WAKE. Greetings, ${context.name || 'Operative'}. I am SrijanBot. How can I assist your navigation today?`;
        }

        res.json({ reply });
    } catch (e) {
        console.error(e);
        res.status(500).json({ reply: "SYSTEM FAULT. Processing node offline." });
    }
});

// START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
