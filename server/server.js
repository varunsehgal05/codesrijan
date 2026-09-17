import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    dbName: 'codesrijan'
}).then(() => console.log('MongoDB Connected to keyspace codesrijan')).catch(err => console.error(err));

// --- Schemas ---
const userSchema = new mongoose.Schema({
    id: String,
    name: String,
    email: String,
    role: String,
    teamId: String
});
const User = mongoose.model('User', userSchema);

const teamSchema = new mongoose.Schema({
    id: String,
    name: String,
    leaderId: String,
    problemId: String,
    repositoryUrl: String,
    demoUrl: String,
    isSubmitted: Boolean,
    members: [String]
});
const Team = mongoose.model('Team', teamSchema);

const problemSchema = new mongoose.Schema({
    id: String,
    title: String,
    category: String,
    difficulty: String,
    sponsor: String,
    description: String,
    prizePool: Number
});
const Problem = mongoose.model('Problem', problemSchema);

// --- Routes ---

// USERS
app.get('/api/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});
app.post('/api/users', async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.json(user);
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
    const problems = await Problem.find();
    res.json(problems);
});
app.post('/api/problems', async (req, res) => {
    const problem = new Problem(req.body);
    await problem.save();
    res.json(problem);
});

// START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
