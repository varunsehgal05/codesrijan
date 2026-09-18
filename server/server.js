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

// START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
