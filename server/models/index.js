import mongoose from 'mongoose';

// 1. Users Collection
const userSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: { type: String, enum: ['student', 'judge', 'mentor', 'admin'], default: 'student' },
    profileImage: String,
    college: String,
    branch: String,
    year: String,
    bio: String,
    skills: [String],
    techStack: [String],
    github: String,
    linkedin: String,
    portfolio: String,

    // Epic 5 Auth Overhaul
    accountStatus: { type: String, enum: ['pending_verification', 'active', 'suspended', 'disabled'], default: 'pending_verification' },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: Date,
    recruitmentStatus: { type: String, enum: ['looking_for_team', 'open_to_invites', 'in_team', 'not_available'], default: 'looking_for_team' },
    lastLoginAt: Date,
    teamId: String, // Quick reference
    
    // Admin / Staff Assignments (Judges & Mentors)
    assignedHackathons: [String],
    assignedCategories: [String],
    assignedTeams: [String]
}, { timestamps: true });

// 2. Hackathons Collection
const hackathonSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: String,
    slug: String,
    description: String,
    theme: String,
    banner: String,
    logo: String,
    venue: String,
    startDate: Date,
    endDate: Date,
    registrationStart: Date,
    registrationEnd: Date,
    submissionDeadline: Date,
    evaluationDeadline: Date,
    resultDate: Date,
    teamSizeMin: Number,
    teamSizeMax: Number,
    status: { type: String, enum: ['draft', 'registration_open', 'registration_closed', 'active', 'submission_open', 'evaluation', 'completed', 'cancelled'], default: 'draft' },

    // Eligibility
    eligibleColleges: [String],
    eligibleBranches: [String],
    eligibleAcademicYears: [String],
    eligibilityRules: String,

    // Detailed Rules
    hackathonRules: String,
    submissionRules: String,
    codeOfConduct: String,

    createdBy: String
}, { timestamps: true });

// 3. Registrations Collection
const registrationSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: { type: String, required: true },
    userId: { type: String, required: true },
    registrationNumber: String,
    college: String,
    branch: String,
    year: String,
    status: { type: String, default: 'pending' },
    verifiedAt: Date
}, { timestamps: true });

// Prevent generic registration duplication at Database Level
registrationSchema.index({ hackathonId: 1, userId: 1 }, { unique: true });

// 4. Problem Statements Collection
const problemStatementSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: String,
    title: String,
    slug: String,
    description: String,
    fullDescription: String,
    domain: String,
    difficulty: String,
    tags: [String],
    requirements: [String],
    constraints: [String],
    resources: [String],
    pdfUrl: String,
    organization: String,
    isPublished: Boolean,
    isLocked: Boolean,
    createdBy: String
}, { timestamps: true });

// 5. Teams Collection
const teamSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: String,
    name: String,
    slug: String,
    logo: String,
    description: String,
    leaderId: String,
    memberIds: [String],
    problemStatementId: String,
    maxMembers: Number,
    recruitmentOpen: Boolean,
    status: { type: String, enum: ['forming', 'active', 'submitted', 'disqualified', 'completed'], default: 'forming' },
    // Backwards compat fields for current frontend
    repositoryUrl: String,
    demoUrl: String,
    githubLink: String,
    figmaLink: String,
    demoLink: String,
    isSubmitted: { type: Boolean, default: false },
    bonusPoints: { type: Number, default: 0 },
    penaltyPoints: { type: Number, default: 0 }
}, { timestamps: true });

// 6. Team Invitations Collection
const teamInvitationSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    teamId: String,
    senderId: String,
    receiverId: String,
    message: String,
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled', 'expired'], default: 'pending' },
    respondedAt: Date
}, { timestamps: true });

// 7. Team Join Requests Collection
const teamJoinRequestSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    teamId: String,
    userId: String,
    message: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
    respondedAt: Date
}, { timestamps: true });

// 8. Projects Collection
const projectSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: String,
    teamId: String,
    problemStatementId: String,
    name: String,
    slug: String,
    shortDescription: String,
    description: String,
    solution: String,
    features: [String],
    technologies: [String],
    futureScope: String,
    challenges: String,
    aiUsage: String,
    githubUrl: String,
    liveDemoUrl: String,
    figmaUrl: String,
    status: { type: String, enum: ['draft', 'in_progress', 'ready_for_submission', 'submitted', 'under_evaluation', 'evaluated'], default: 'draft' },
    progress: Number
}, { timestamps: true });

// 9. Submissions Collection
const submissionSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: String,
    projectId: String,
    teamId: String,
    submittedBy: String,
    version: Number,
    projectTitle: String,
    description: String,
    solution: String,
    features: [String],
    technologies: [String],
    githubUrl: String,
    liveDemoUrl: String,
    figmaUrl: String,
    demoVideoUrl: String,
    presentationUrl: String,
    documentationUrl: String,
    screenshots: [String],
    zipUrl: String,
    aiUsage: String,
    futureScope: String,
    status: { type: String, enum: ['draft', 'ready', 'submitted', 'locked', 'withdrawn'], default: 'submitted' },
    lockedAt: Date
}, { timestamps: true });

// 10. Evaluations Collection
const evaluationSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: String,
    teamId: String,
    judgeId: String,
    assignmentId: String,
    scores: [{ criteriaId: String, score: Number }],
    totalScore: Number,
    comments: String,
    strengths: String,
    improvements: String,
    status: { type: String, enum: ['draft', 'submitted'], default: 'submitted' }
}, { timestamps: true });

// 11. Recruitment Profiles Collection
const recruitmentProfileSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    userId: String,
    hackathonId: String,
    headline: String,
    bio: String,
    skills: [String],
    techStack: [String],
    experience: String,
    preferredRoles: [String],
    preferredDomains: [String],
    availability: String,
    lookingFor: String,
    portfolio: String,
    github: String,
    linkedin: String,
    isVisible: { type: Boolean, default: true }
}, { timestamps: true });

// 12. Certificates Collection
const certificateSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    userId: String,
    userName: String,
    teamId: String,
    hackathonId: String,
    type: { type: String, enum: ['participation', 'winner', 'runner_up', 'special_mention'], default: 'participation' },
    issuedBy: String,
    issueDate: { type: Date, default: Date.now },
    metadata: Object
}, { timestamps: true });


// Epic 4: Project Tasks
const projectTaskSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    teamId: String,
    title: String,
    description: String,
    status: { type: String, enum: ['todo', 'in-progress', 'review', 'completed'], default: 'todo' },
    assignedTo: String, // userId
    createdBy: String,
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' }
}, { timestamps: true });

// 13. Settings Collection
const settingSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    value: mongoose.Schema.Types.Mixed,
    description: String,
    updatedBy: String
}, { timestamps: true });

// 14. Conversations and Messages (Chat)
const conversationSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    type: { type: String, enum: ['direct', 'group', 'team', 'support'], default: 'direct' },
    participantIds: [String],
    teamId: String,
    hackathonId: String,
    lastMessageAt: Date,
    title: String
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    conversationId: String,
    senderId: String,
    message: String,
    messageType: { type: String, default: 'text' },
    readBy: [String]
}, { timestamps: true });

// 15. Support Tickets
const supportTicketSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    userId: String,
    subject: String,
    category: String,
    priority: { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },
    status: { type: String, enum: ['open', 'in_progress', 'waiting', 'resolved', 'closed'], default: 'open' },
    assignedTo: String,
    conversationId: String
}, { timestamps: true });

// 16. Notifications Collection
const notificationSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    userId: String,
    title: String,
    message: String,
    type: { type: String, enum: ['team_invite', 'join_request', 'system', 'evaluation', 'mentor'], default: 'system' },
    relatedId: String,
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

// Export logic (prevent overwrite if extremely frequent hot reloading)
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Hackathon = mongoose.models.Hackathon || mongoose.model('Hackathon', hackathonSchema);
export const Registration = mongoose.models.Registration || mongoose.model('Registration', registrationSchema);
export const ProblemStatement = mongoose.models.ProblemStatement || mongoose.model('ProblemStatement', problemStatementSchema);
export const Team = mongoose.models.Team || mongoose.model('Team', teamSchema);
export const TeamInvitation = mongoose.models.TeamInvitation || mongoose.model('TeamInvitation', teamInvitationSchema);
export const TeamJoinRequest = mongoose.models.TeamJoinRequest || mongoose.model('TeamJoinRequest', teamJoinRequestSchema);
export const ProjectTask = mongoose.models.ProjectTask || mongoose.model('ProjectTask', projectTaskSchema);
export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
export const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);
export const Evaluation = mongoose.models.Evaluation || mongoose.model('Evaluation', evaluationSchema);
export const RecruitmentProfile = mongoose.models.RecruitmentProfile || mongoose.model('RecruitmentProfile', recruitmentProfileSchema);
export const Certificate = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);
export const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
export const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default {
    User, Hackathon, Registration, ProblemStatement, Team, TeamInvitation, TeamJoinRequest, Project, Submission, Evaluation, RecruitmentProfile, Certificate, Setting, Conversation, Message, SupportTicket, Notification
};
