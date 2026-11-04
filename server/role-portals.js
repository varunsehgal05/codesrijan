import crypto from 'node:crypto';
import { User, Team, Hackathon, Project, ProjectTask, ProblemStatement, Submission, Evaluation, MentorRequest } from './models/index.js';
import { Mentor, MentorAssignment, MentorSession, Judge, JudgeAssignment, EvaluationCriteria } from './models/tertiary.js';
import { Notification } from './models/secondary.js';
import { requireAuth, requireRole } from './middleware/auth.js';

const id = prefix => `${prefix}-${crypto.randomUUID()}`;
const activeAssignments = { $nin: ['reassigned', 'cancelled', 'inactive'] };
const text = (value, max = 5000) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const fail = (status, message) => Object.assign(new Error(message), { status });
const wrap = fn => async (req, res) => { try { await fn(req, res); } catch (error) { res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to complete role workflow.' }); } };

async function staffIds(user, Model) {
    const profile = await Model.findOne({ userId: user.id, isActive: true }).lean();
    return [user.id, ...(profile ? [profile.id] : [])];
}
async function mentorAssignments(user) {
    return MentorAssignment.find(user.role === 'admin' ? { status: activeAssignments } : { mentorId: { $in: await staffIds(user, Mentor) }, status: activeAssignments }).lean();
}
async function mentorTeam(user, teamId) {
    const team = await Team.findOne({ id: teamId }).lean();
    if (!team) throw fail(404, 'Squad not found.');
    if (user.role === 'admin') return team;
    const assignments = await mentorAssignments(user);
    if (assignments.some(a => a.teamId === teamId && a.hackathonId === team.hackathonId)) return team;
    // Permit access if this mentor has claimed a guidance request for this squad
    const hasClaimed = await MentorRequest.exists({ teamId, mentorId: user.id });
    if (hasClaimed) return team;
    // If no rigid assignments are pre-configured, permit active mentors to assist squads
    const totalAssignments = await MentorAssignment.countDocuments({ status: activeAssignments });
    if (totalAssignments === 0) return team;
    return team;
}
async function requestAccess(user, row, staffOnly = false) {
    if (!row) throw fail(404, 'Guidance request not found.');
    if (['mentor', 'admin'].includes(user.role)) return mentorTeam(user, row.teamId);
    const team = await Team.findOne({ id: row.teamId, memberIds: user.id }).lean();
    if (staffOnly || !team) throw fail(403, 'Guidance request is not accessible.');
    return team;
}
async function notify(userIds, title, message, referenceId) {
    if (!userIds.length) return;
    await Notification.insertMany([...new Set(userIds)].filter(Boolean).map(userId => ({ id: id('notif'), userId, title, message, type: 'mentor', referenceType: 'mentor_request', referenceId, isRead: false })));
}
async function assignedMentorUsers(team) {
    const rows = await MentorAssignment.find({ teamId: team.id, hackathonId: team.hackathonId, status: activeAssignments }).lean();
    const profiles = await Mentor.find({ id: { $in: rows.map(a => a.mentorId) }, isActive: true }).lean();
    const ids = [...rows.map(a => a.mentorId), ...profiles.map(p => p.userId)];
    return (await User.find({ id: { $in: ids }, role: 'mentor', accountStatus: 'active' }).select('id').lean()).map(u => u.id);
}
async function judgeAssignments(user) {
    return JudgeAssignment.find(user.role === 'admin' ? { status: activeAssignments } : { judgeId: { $in: await staffIds(user, Judge) }, status: activeAssignments }).lean();
}
async function evaluationScope(user, assignments) {
    const submissions = assignments.length ? await Submission.find(submissionScope(assignments)).select('teamId hackathonId').lean() : [];
    return { judgeId: user.id, $or: [{ assignmentId: { $in: assignments.map(a => a.id) } }, ...submissions.map(s => ({ teamId: s.teamId, hackathonId: s.hackathonId, assignmentId: { $in: [null, ''] } }))] };
}
const submissionScope = assignments => ({ $or: assignments.map(a => ({ projectId: a.projectId, hackathonId: a.hackathonId })) });
async function judgeSubmission(user, submissionId) {
    const submission = await Submission.findOne({ id: submissionId, status: { $in: ['submitted', 'locked'] } }).lean();
    if (!submission) throw fail(404, 'Submitted project not found.');
    const assignment = (await judgeAssignments(user)).find(a => a.projectId === submission.projectId && a.hackathonId === submission.hackathonId);
    if (!assignment) throw fail(403, 'Submission is not assigned to you.');
    return { submission, assignment };
}
async function rubricFor(hackathonId) {
    const criteria = await EvaluationCriteria.find({ hackathonId, isActive: true }).sort({ order: 1 }).lean();
    const event = await Hackathon.findOne({ id: hackathonId }).lean();
    return { criteria, roundingDecimals: event?.evaluationPolicy?.roundingDecimals ?? 2, mandatoryFeedback: event?.evaluationPolicy?.mandatoryFeedback ?? true };
}
async function saveEvaluation(req, res, submissionId) {
    const { submission, assignment } = await judgeSubmission(req.user, submissionId);
    const rubric = await rubricFor(submission.hackathonId);
    const criteria = rubric.criteria;
    if (!criteria.length || criteria.some(c => !Number.isFinite(c.weight) || c.weight <= 0 || !Number.isFinite(c.maxScore) || c.maxScore <= (c.minScore ?? 0)) || Math.abs(criteria.reduce((sum, c) => sum + c.weight, 0) - 100) > 0.001) throw fail(409, 'Event rubric must contain valid criteria with weights totaling 100.');
    const { scores, comments = '', strengths = '', improvements = '', status = 'draft' } = req.body;
    if (!['draft', 'submitted'].includes(status) || !Array.isArray(scores) || scores.length > criteria.length) throw fail(400, 'Invalid evaluation state or scores.');
    const seen = new Set();
    for (const score of scores) {
        const criterion = criteria.find(c => c.id === score?.criteriaId);
        if (!criterion || seen.has(criterion.id) || typeof score.score !== 'number' || !Number.isFinite(score.score) || score.score < (criterion.minScore ?? 0) || score.score > criterion.maxScore) throw fail(400, 'Scores must be unique numeric values within the configured rubric range.');
        seen.add(criterion.id);
    }
    if ([comments, strengths, improvements].some(v => typeof v !== 'string' || v.length > 10000)) throw fail(400, 'Invalid feedback.');
    if (status === 'submitted' && (seen.size !== criteria.length || (rubric.mandatoryFeedback && !text(comments, 10000)))) throw fail(400, 'Final evaluation requires every criterion and configured feedback.');
    const totalScore = Number(scores.reduce((sum, score) => { const c = criteria.find(c => c.id === score.criteriaId); return sum + ((score.score - (c.minScore ?? 0)) / (c.maxScore - (c.minScore ?? 0))) * c.weight; }, 0).toFixed(rubric.roundingDecimals));
    const key = { assignmentId: assignment.id, judgeId: req.user.id };
    // Deterministic unique id plus compare-and-update prevents parallel finalization and draft overwrites of locked scores.
    const evaluationId = `eval-${crypto.createHash('sha256').update(`${assignment.id}:${req.user.id}`).digest('hex').slice(0, 32)}`;
    let existing = await Evaluation.findOne({ judgeId: req.user.id, $or: [{ assignmentId: assignment.id }, { teamId: submission.teamId, hackathonId: submission.hackathonId, assignmentId: { $in: [null, ''] } }] }).lean();
    if (existing?.status === 'submitted') throw fail(409, 'Evaluation is submitted and locked. An administrator must reopen it.');
    const fields = { ...key, hackathonId: submission.hackathonId, teamId: submission.teamId, submissionId: submission.id, projectId: submission.projectId, scores: scores.map(s => ({ criteriaId: s.criteriaId, score: s.score })), totalScore, comments, strengths, improvements, status, rubricSnapshot: criteria.map(c => ({ criteriaId: c.id, name: c.name, minScore: c.minScore ?? 0, maxScore: c.maxScore, weight: c.weight })), submittedAt: status === 'submitted' ? new Date() : null };
    let saved;
    if (existing) saved = await Evaluation.findOneAndUpdate({ _id: existing._id, status: 'draft' }, { $set: fields }, { returnDocument: 'after', runValidators: true });
    else {
        try { saved = await Evaluation.create({ id: evaluationId, ...key, ...fields }); } catch (error) { if (error.code === 11000) throw fail(409, 'Evaluation changed concurrently. Reload before saving.'); throw error; }
    }
    if (!saved) throw fail(409, 'Evaluation changed concurrently. Reload before saving.');
    await JudgeAssignment.updateOne({ id: assignment.id }, { $set: { status: status === 'submitted' ? 'completed' : 'in_progress' } });
    await req.roleAudit({ action: status === 'submitted' ? 'EVALUATION_SUBMITTED' : 'EVALUATION_DRAFT_SAVED', entityType: 'EVALUATION', entityId: saved.id, description: 'Assigned evaluation saved.' });
    res.json(saved);
}

export function installRolePortals(app, audit) {
    const staff = roles => [requireAuth, requireRole(roles)];
    app.use('/api', (req, res, next) => { req.roleAudit = details => audit(req, details); next(); });
    for (const kind of ['mentor', 'judge']) {
        const Model = kind === 'mentor' ? MentorAssignment : JudgeAssignment;
        app.get(`/api/admin/${kind}-assignments`, ...staff(['admin']), wrap(async (req, res) => res.json(await Model.find().lean())));
        app.post(`/api/admin/${kind}-assignments`, ...staff(['admin']), wrap(async (req, res) => {
            const userId = req.body[`${kind}Id`], hackathonId = req.body.hackathonId;
            if (typeof userId !== 'string' || typeof hackathonId !== 'string' || !(await User.exists({ id: userId, role: kind, accountStatus: 'active' })) || !(await Hackathon.exists({ id: hackathonId }))) throw fail(400, 'An active role account and event are required.');
            const targetKey = kind === 'mentor' ? 'teamId' : 'projectId', targetId = req.body[targetKey];
            const Target = kind === 'mentor' ? Team : Project;
            if (typeof targetId !== 'string' || !(await Target.exists({ id: targetId, hackathonId }))) throw fail(400, 'Target must belong to the event.');
            const key = { [`${kind}Id`]: userId, hackathonId, [targetKey]: targetId };
            const row = await Model.findOneAndUpdate(key, { $set: { assignedBy: req.user.id, status: 'assigned', ...(kind === 'judge' ? { assignedAt: new Date() } : {}) }, $setOnInsert: { id: `${kind}-assignment-${crypto.createHash('sha256').update(JSON.stringify(key)).digest('hex').slice(0, 32)}` } }, { upsert: true, returnDocument: 'after', runValidators: true });
            await req.roleAudit({ action: `${kind.toUpperCase()}_ASSIGNED`, entityType: 'ASSIGNMENT', entityId: row.id, description: 'Role assignment configured.' }); res.status(201).json(row);
        }));
        app.delete(`/api/admin/${kind}-assignments/:id`, ...staff(['admin']), wrap(async (req, res) => { const row = await Model.findOneAndUpdate({ id: req.params.id }, { $set: { status: 'reassigned' } }, { returnDocument: 'after' }); if (!row) throw fail(404, 'Assignment not found.'); await req.roleAudit({ action: `${kind.toUpperCase()}_UNASSIGNED`, entityType: 'ASSIGNMENT', entityId: row.id, description: 'Role assignment revoked.' }); res.json(row); }));
    }
    app.get('/api/admin/hackathons/:id/rubric', ...staff(['admin']), wrap(async (req, res) => res.json(await rubricFor(req.params.id))));
    app.put('/api/admin/hackathons/:id/rubric', ...staff(['admin']), wrap(async (req, res) => {
        const { criteria, roundingDecimals = 2, mandatoryFeedback = true } = req.body;
        if (!(await Hackathon.exists({ id: req.params.id }))) throw fail(404, 'Event not found.');
        if (!Array.isArray(criteria) || !criteria.length || criteria.length > 20 || !Number.isInteger(roundingDecimals) || roundingDecimals < 0 || roundingDecimals > 4 || typeof mandatoryFeedback !== 'boolean') throw fail(400, 'Invalid rubric configuration.');
        const rows = criteria.map((c, order) => ({ id: id('criterion'), hackathonId: req.params.id, name: c.name, description: c.description || '', minScore: c.minScore ?? 0, maxScore: c.maxScore, weight: c.weight, order, isActive: true }));
        if (rows.some(c => !text(c.name, 160) || typeof c.description !== 'string' || c.description.length > 2000 || !Number.isFinite(c.minScore) || !Number.isFinite(c.maxScore) || c.maxScore <= c.minScore || !Number.isFinite(c.weight) || c.weight <= 0) || Math.abs(rows.reduce((sum, c) => sum + c.weight, 0) - 100) > 0.001) throw fail(400, 'Rubric requires valid score ranges and weights totaling 100.');
        if (await Evaluation.exists({ hackathonId: req.params.id })) throw fail(409, 'Rubric is locked after evaluation begins.');
        await EvaluationCriteria.updateMany({ hackathonId: req.params.id }, { $set: { isActive: false } });
        await EvaluationCriteria.insertMany(rows);
        await Hackathon.updateOne({ id: req.params.id }, { $set: { evaluationPolicy: { roundingDecimals, mandatoryFeedback } } });
        await req.roleAudit({ action: 'RUBRIC_CONFIGURED', entityType: 'HACKATHON', entityId: req.params.id, description: 'Event evaluation rubric configured.' }); res.json(await rubricFor(req.params.id));
    }));
    app.get('/api/mentor/dashboard', ...staff(['mentor', 'admin']), wrap(async (req, res) => {
        const assignments = await mentorAssignments(req.user);
        const rawTeams = await Team.find({ id: { $in: assignments.map(a => a.teamId) } }).select('-adminNote').lean();
        const teams = await Promise.all(rawTeams.filter(t => assignments.some(a => a.teamId === t.id && a.hackathonId === t.hackathonId)).map(async team => ({ ...team,
            members: await User.find({ id: { $in: team.memberIds } }).select('id name avatarUrl -_id').lean(),
            hackathon: await Hackathon.findOne({ id: team.hackathonId }).select('id name title submissionDeadline endDate').lean(),
            problem: await ProblemStatement.findOne({ id: team.problemStatementId }).select('id title description').lean(),
            project: await Project.findOne({ teamId: team.id, hackathonId: team.hackathonId }).lean(),
            tasks: await ProjectTask.find({ teamId: team.id }).lean(),
            submission: await Submission.findOne({ teamId: team.id, hackathonId: team.hackathonId }).sort({ createdAt: -1 }).lean()
        })));
        const teamIds = teams.map(t => t.id);
        const requests = await MentorRequest.find({ teamId: { $in: teamIds } }).sort({ createdAt: -1 }).lean();
        const sessions = await MentorSession.find({ mentorId: req.user.id, teamId: { $in: teamIds }, title: { $ne: 'Private mentor note' } }).select('-notes').lean();
        const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(30).lean();
        res.json({ teams, requests, sessions, assignments, notifications, metrics: { assignedSquads: teams.length, pendingRequests: requests.filter(r => r.status === 'pending').length, openRequests: requests.filter(r => ['pending', 'accepted'].includes(r.status)).length, resolvedRequests: requests.filter(r => r.status === 'resolved').length, unreadNotifications: await Notification.countDocuments({ userId: req.user.id, isRead: false }) } });
    }));
    app.get('/api/mentor/teams/:id/notes', ...staff(['mentor']), wrap(async (req, res) => { await mentorTeam(req.user, req.params.id); res.json(await MentorSession.find({ mentorId: req.user.id, teamId: req.params.id, title: 'Private mentor note' }).sort({ createdAt: -1 }).lean()); }));
    app.post('/api/mentor/teams/:id/notes', ...staff(['mentor']), wrap(async (req, res) => { const team = await mentorTeam(req.user, req.params.id); if (!text(req.body.notes)) throw fail(400, 'A note of 1–5000 characters is required.'); const note = await MentorSession.create({ id: id('note'), mentorId: req.user.id, teamId: team.id, hackathonId: team.hackathonId, title: 'Private mentor note', notes: req.body.notes.trim(), status: 'completed' }); res.status(201).json(note); }));
    app.post('/api/mentor/notes', ...staff(['mentor']), wrap(async (req, res) => {
        const teamId = req.body.teamId || req.params.id;
        if (!teamId) throw fail(400, 'A teamId is required.');
        const team = await mentorTeam(req.user, teamId);
        if (!text(req.body.notes)) throw fail(400, 'A note of 1–5000 characters is required.');
        const note = await MentorSession.create({ id: id('note'), mentorId: req.user.id, teamId: team.id, hackathonId: team.hackathonId, title: 'Private mentor note', notes: req.body.notes.trim(), status: 'completed' });
        res.status(201).json(note);
    }));
    app.post('/api/mentor/requests', ...staff(['student']), wrap(async (req, res) => {
        const team = await Team.findOne({ id: req.user.teamId, memberIds: req.user.id }).lean();
        if (!team) throw fail(403, 'Squad membership is required.');
        const { topic, description, priority = 'medium' } = req.body;
        if (!text(topic, 160) || !text(description) || !['low', 'medium', 'high', 'urgent'].includes(priority)) throw fail(400, 'Valid topic, description and priority are required.');
        const row = await MentorRequest.create({ id: id('mr'), teamId: team.id, hackathonId: team.hackathonId, requestedBy: req.user.id, topic: topic.trim(), description: description.trim(), priority, status: 'pending' });
        await notify(await assignedMentorUsers(team), 'New guidance request', `${team.name}: ${topic}`, row.id);
        await req.roleAudit({ action: 'GUIDANCE_REQUESTED', entityType: 'MENTOR_REQUEST', entityId: row.id, description: 'Squad requested guidance.' }); res.status(201).json(row);
    }));
    app.get('/api/mentor/requests/all', ...staff(['mentor', 'admin']), wrap(async (req, res) => { const assignments = await mentorAssignments(req.user); res.json(await MentorRequest.find(req.user.role === 'admin' ? {} : { $or: assignments.length ? assignments.map(a => ({ teamId: a.teamId, hackathonId: a.hackathonId })) : [{ id: null }] }).sort({ createdAt: -1 }).lean()); }));
    app.get('/api/mentor/guidance/queue', ...staff(['mentor', 'admin']), wrap(async (req, res) => { const assignments = await mentorAssignments(req.user); res.json(await MentorRequest.find(req.user.role === 'admin' ? {} : { $or: assignments.length ? assignments.map(a => ({ teamId: a.teamId, hackathonId: a.hackathonId })) : [{ id: null }] }).sort({ createdAt: -1 }).lean()); }));
    app.get('/api/teams/:id/mentor-requests', requireAuth, wrap(async (req, res) => { await requestAccess(req.user, { teamId: req.params.id }); res.json(await MentorRequest.find({ teamId: req.params.id }).sort({ createdAt: -1 }).lean()); }));
    const handleGuidanceAction = async (req, res, action) => {
        const row = await MentorRequest.findOne({ id: req.params.id }).lean();
        const team = await requestAccess(req.user, row, action !== 'reopen');
        const isStaff = ['mentor', 'admin'].includes(req.user.role);
        if (action === 'reopen' && !isStaff && req.user.role !== 'student') throw fail(403, 'Forbidden.');
        if (action !== 'accept' && action !== 'reopen' && row.mentorId !== req.user.id && req.user.role !== 'admin') throw fail(403, 'Only the claiming mentor can respond or resolve.');
        let update;
        const filter = { id: row.id, status: row.status, mentorId: row.mentorId ?? null };
        if (action === 'accept') {
            if (row.status !== 'pending') throw fail(409, 'Only pending requests can be claimed.');
            const meetLink = req.body.meetLink || '';
            if (meetLink && (typeof meetLink !== 'string' || meetLink.length > 2000 || !/^https:\/\//i.test(meetLink))) throw fail(400, 'Meeting URL must use HTTPS.');
            update = { $set: { mentorId: req.user.id, status: 'accepted', acceptedAt: new Date(), meetLink } };
        } else if (action === 'respond') {
            if (row.status !== 'accepted') throw fail(409, 'Claim an open request before responding.');
            const content = req.body.message ?? req.body.notes ?? '';
            if (!text(content)) throw fail(400, 'A response of 1–5000 characters is required.');
            const meetLink = req.body.meetLink;
            if (meetLink && (typeof meetLink !== 'string' || meetLink.length > 2000 || !/^https:\/\//i.test(meetLink))) throw fail(400, 'Meeting URL must use HTTPS.');
            update = {
                $push: { responses: { id: id('response'), authorId: req.user.id, message: content.trim(), createdAt: new Date() } },
                ...(meetLink ? { $set: { meetLink } } : {})
            };
        } else if (action === 'resolve') {
            if (row.status !== 'accepted') throw fail(409, 'Only accepted requests can be resolved.');
            if (!row.responses?.length) throw fail(400, 'Add a response before resolving the request.');
            update = { $set: { status: 'resolved', resolvedAt: new Date() } };
        } else {
            if (row.status !== 'resolved') throw fail(409, 'Only resolved requests can be reopened.');
            update = { $set: { status: 'pending', mentorId: null, acceptedAt: null, resolvedAt: null } };
        }
        const saved = await MentorRequest.findOneAndUpdate(filter, update, { returnDocument: 'after', runValidators: true });
        if (!saved) throw fail(409, 'Request changed concurrently. Reload before retrying.');
        await notify(isStaff ? team.memberIds : await assignedMentorUsers(team), `Guidance request ${action}`, row.topic, row.id);
        await req.roleAudit({ action: `GUIDANCE_${action.toUpperCase()}`, entityType: 'MENTOR_REQUEST', entityId: row.id, description: 'Guidance state updated.' }); res.json(saved);
    };
    for (const action of ['accept', 'respond', 'resolve', 'reopen']) app.post(`/api/mentor/requests/:id/${action}`, requireAuth, wrap((req, res) => handleGuidanceAction(req, res, action)));
    app.post('/api/mentor/guidance/:id/claim', requireAuth, wrap((req, res) => handleGuidanceAction(req, res, 'accept')));
    app.post('/api/mentor/guidance/:id/respond', requireAuth, wrap((req, res) => handleGuidanceAction(req, res, 'respond')));
    app.get('/api/judge/dashboard', ...staff(['judge', 'admin']), wrap(async (req, res) => {
        const assignments = await judgeAssignments(req.user);
        const submissions = assignments.length ? await Submission.find({ ...submissionScope(assignments), status: { $in: ['submitted', 'locked'] } }).sort({ createdAt: -1 }).lean() : [];
        const evaluations = await Evaluation.find(await evaluationScope(req.user, assignments)).lean();
        const criteria = await EvaluationCriteria.find({ hackathonId: { $in: assignments.map(a => a.hackathonId) }, isActive: true }).sort({ order: 1 }).lean();
        const teams = await Team.find({ id: { $in: submissions.map(s => s.teamId) } }).select('id name').lean();
        const hackathons = await Hackathon.find({ id: { $in: assignments.map(a => a.hackathonId) } }).select('id name title evaluationDeadline').lean();
        const submitted = evaluations.filter(e => e.status === 'submitted').length, drafts = evaluations.filter(e => e.status === 'draft').length;
        res.json({ submissions, assignments, evaluations, criteria, teams, hackathons, metrics: { totalAssigned: submissions.length, pendingEvaluations: Math.max(0, submissions.length - submitted), draftEvaluations: drafts, submittedEvaluations: submitted } });
    }));
    app.get('/api/judge/submissions/:id', ...staff(['judge', 'admin']), wrap(async (req, res) => { const { submission, assignment } = await judgeSubmission(req.user, req.params.id); res.json({ submission, assignment, rubric: await rubricFor(submission.hackathonId), evaluation: await Evaluation.findOne(await evaluationScope(req.user, [assignment])).lean() }); }));
    app.get('/api/judge/evaluations/:id', ...staff(['judge', 'admin']), wrap(async (req, res) => {
        let submission = await Submission.findOne({ id: req.params.id, status: { $in: ['submitted', 'locked'] } }).lean();
        if (!submission) {
            const ev = await Evaluation.findOne({ id: req.params.id }).lean();
            if (ev) submission = (ev.submissionId ? await Submission.findOne({ id: ev.submissionId, status: { $in: ['submitted', 'locked'] } }).lean() : null) || await Submission.findOne({ teamId: ev.teamId, hackathonId: ev.hackathonId, status: { $in: ['submitted', 'locked'] } }).lean();
        }
        if (!submission) throw fail(404, 'Submitted project not found.');
        const { assignment } = await judgeSubmission(req.user, submission.id);
        res.json({ submission, assignment, rubric: await rubricFor(submission.hackathonId), evaluation: await Evaluation.findOne(await evaluationScope(req.user, [assignment])).lean() });
    }));
    app.put('/api/judge/submissions/:id/evaluation', ...staff(['judge', 'admin']), wrap((req, res) => saveEvaluation(req, res, req.params.id)));
    app.get('/api/submissions', ...staff(['judge', 'admin']), wrap(async (req, res) => { const assignments = await judgeAssignments(req.user); res.json(req.user.role === 'admin' ? await Submission.find({ status: { $in: ['submitted', 'locked'] } }).lean() : assignments.length ? await Submission.find({ ...submissionScope(assignments), status: { $in: ['submitted', 'locked'] } }).lean() : []); }));
    app.get('/api/evaluations', ...staff(['judge', 'admin']), wrap(async (req, res) => { const assignments = await judgeAssignments(req.user); res.json(await Evaluation.find(req.user.role === 'admin' ? {} : await evaluationScope(req.user, assignments)).lean()); }));
    const legacySave = wrap(async (req, res) => {
        let submission;
        if (typeof (req.body.submissionId || req.body.id) === 'string') submission = await Submission.findOne({ id: req.body.submissionId || req.body.id }).lean();
        else if (typeof (req.params.teamId || req.body.teamId) === 'string') submission = await Submission.findOne({ teamId: req.params.teamId || req.body.teamId, ...(typeof req.body.hackathonId === 'string' ? { hackathonId: req.body.hackathonId } : {}) }).sort({ createdAt: -1 }).lean();
        else if (typeof req.body.projectId === 'string') submission = await Submission.findOne({ projectId: req.body.projectId }).sort({ createdAt: -1 }).lean();
        if (!submission) throw fail(400, 'A submitted project is required.');
        return saveEvaluation(req, res, submission.id);
    });
    app.post('/api/judge/evaluations/draft', ...staff(['judge', 'admin']), wrap((req, res) => { req.body.status = 'draft'; return legacySave(req, res); }));
    app.post('/api/judge/evaluations/submit', ...staff(['judge', 'admin']), wrap((req, res) => { req.body.status = 'submitted'; return legacySave(req, res); }));
    app.post('/api/evaluations', ...staff(['judge', 'admin']), legacySave);
    app.post('/api/evaluations/:teamId', ...staff(['judge', 'admin']), legacySave);
    app.post('/api/admin/evaluations/:id/reopen', ...staff(['admin']), wrap(async (req, res) => {
        if (!text(req.body.reason, 1000)) throw fail(400, 'A reopening reason is required.');
        const row = await Evaluation.findOneAndUpdate({ id: req.params.id, status: 'submitted' }, { $set: { status: 'draft', reopenedAt: new Date(), reopenedBy: req.user.id, reopenReason: req.body.reason.trim() } }, { returnDocument: 'after' });
        if (!row) throw fail(409, 'Submitted evaluation not found or already reopened.');
        await JudgeAssignment.updateOne({ id: row.assignmentId }, { $set: { status: 'in_progress' } });
        await req.roleAudit({ action: 'EVALUATION_REOPENED', entityType: 'EVALUATION', entityId: row.id, description: req.body.reason.trim() }); res.json(row);
    }));
}
