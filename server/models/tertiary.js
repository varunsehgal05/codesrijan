import mongoose from 'mongoose';

// 25. Project Tasks
const projectTaskSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    projectId: String,
    title: String,
    description: String,
    assignedTo: String,
    createdBy: String,
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['todo', 'in_progress', 'review', 'completed'], default: 'todo' },
    dueDate: Date
}, { timestamps: true });

// 26. Project Milestones
const projectMilestoneSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    projectId: String,
    title: String,
    description: String,
    dueDate: Date,
    status: String,
    completedAt: Date
}, { timestamps: true });

// 27. Project Files (Metadata instead of raw binary)
const projectFileSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    projectId: String,
    uploadedBy: String,
    fileName: String,
    fileType: String,
    fileSize: Number,
    fileUrl: String,
    storageProvider: String,
    folder: String,
    version: Number
}, { timestamps: true });

// 28. Judges
const judgeSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    userId: String,
    organization: String,
    designation: String,
    expertise: [String],
    bio: String,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 29. Judge Assignments
const judgeAssignmentSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: String,
    judgeId: String,
    projectId: String,
    assignedBy: String,
    status: { type: String, enum: ['assigned', 'in_progress', 'completed', 'reassigned'], default: 'assigned' },
    assignedAt: Date,
    deadline: Date
}, { timestamps: true });

// 30. Evaluation Criteria
const evaluationCriteriaSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: String,
    name: String,
    description: String,
    maxScore: Number,
    weight: Number,
    order: Number,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 31. Mentors
const mentorSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    userId: String,
    organization: String,
    designation: String,
    expertise: [String],
    bio: String,
    availability: String,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 32. Mentor Assignments
const mentorAssignmentSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: String,
    mentorId: String,
    teamId: String,
    assignedBy: String,
    status: String
}, { timestamps: true });

// 33. Mentor Sessions
const mentorSessionSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    mentorId: String,
    teamId: String,
    hackathonId: String,
    title: String,
    description: String,
    date: Date,
    startTime: String,
    endTime: String,
    meetingUrl: String,
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'], default: 'scheduled' },
    notes: String
}, { timestamps: true });

// 34. Gallery
const gallerySchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: String,
    title: String,
    description: String,
    mediaUrl: String,
    mediaType: String,
    album: String,
    uploadedBy: String
}, { timestamps: true });

// 35. FAQs
const faqSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: String,
    question: String,
    answer: String,
    category: { type: String, enum: ['registration', 'teams', 'problems', 'submission', 'judging', 'certificates', 'technical', 'general'] },
    order: Number,
    isPublished: { type: Boolean, default: true }
}, { timestamps: true });


// Export Models
export const ProjectTask = mongoose.models.ProjectTask || mongoose.model('ProjectTask', projectTaskSchema);
export const ProjectMilestone = mongoose.models.ProjectMilestone || mongoose.model('ProjectMilestone', projectMilestoneSchema);
export const ProjectFile = mongoose.models.ProjectFile || mongoose.model('ProjectFile', projectFileSchema);
export const Judge = mongoose.models.Judge || mongoose.model('Judge', judgeSchema);
export const JudgeAssignment = mongoose.models.JudgeAssignment || mongoose.model('JudgeAssignment', judgeAssignmentSchema);
export const EvaluationCriteria = mongoose.models.EvaluationCriteria || mongoose.model('EvaluationCriteria', evaluationCriteriaSchema);
export const Mentor = mongoose.models.Mentor || mongoose.model('Mentor', mentorSchema);
export const MentorAssignment = mongoose.models.MentorAssignment || mongoose.model('MentorAssignment', mentorAssignmentSchema);
export const MentorSession = mongoose.models.MentorSession || mongoose.model('MentorSession', mentorSessionSchema);
export const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema);
export const FAQ = mongoose.models.FAQ || mongoose.model('FAQ', faqSchema);

export default {
    ProjectTask, ProjectMilestone, ProjectFile, Judge, JudgeAssignment, EvaluationCriteria, Mentor, MentorAssignment, MentorSession, Gallery, FAQ
};
