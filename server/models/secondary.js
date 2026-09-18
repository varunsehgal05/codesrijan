import mongoose from 'mongoose';

// 12. Bookmarks
const bookmarkSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    userId: String,
    problemId: String
}, { timestamps: true });

// 13. Bookmarked Profiles
const bookmarkedProfileSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    userId: String,
    profileUserId: String
}, { timestamps: true });

// 14. Recruitment Invitations
const recruitmentInvitationSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    senderId: String,
    receiverId: String,
    teamId: String,
    hackathonId: String,
    message: String,
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled', 'expired'], default: 'pending' }
}, { timestamps: true });

// 15. Conversations (Chat Framework)
const conversationSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    type: { type: String, enum: ['direct', 'team', 'mentor', 'judge'] },
    participantIds: [String],
    teamId: String,
    projectId: String,
    hackathonId: String,
    lastMessageId: String,
    lastMessageAt: Date
}, { timestamps: true });

// 16. Messages (Chat Framework)
const messageSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    conversationId: String,
    senderId: String,
    message: String,
    attachments: [String],
    replyTo: String,
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// 17. Notifications
const notificationSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    userId: String,
    type: String, // e.g., 'team_invitation', 'announcement', 'evaluation'
    title: String,
    message: String,
    referenceType: String,
    referenceId: String,
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

// 18. Announcements
const announcementSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: String,
    title: String,
    content: String,
    type: String,
    targetAudience: { type: String, enum: ['everyone', 'students', 'judges', 'mentors', 'specific_teams'], default: 'everyone' },
    targetIds: [String],
    isPinned: { type: Boolean, default: false },
    publishAt: Date,
    createdBy: String
}, { timestamps: true });

// 19. Calendars / Events
const calendarEventSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: String,
    title: String,
    description: String,
    type: { type: String, enum: ['registration', 'hackathon', 'submission', 'mentor_session', 'presentation', 'evaluation', 'announcement'] },
    startDate: Date,
    endDate: Date,
    location: String,
    meetingUrl: String,
    createdBy: String,
    targetAudience: String
}, { timestamps: true });

// 20. Certificates
const certificateSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: String,
    userId: String,
    teamId: String,
    type: { type: String, enum: ['participation', 'winner', 'runner_up', 'special_mention', 'judge', 'mentor', 'organizer'] },
    certificateNumber: String,
    verificationCode: String,
    certificateUrl: String,
    qrCodeUrl: String,
    status: String,
    issuedAt: Date
}, { timestamps: true });

// 21. Sponsors
const sponsorSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hackathonId: String,
    name: String,
    logo: String,
    description: String,
    website: String,
    tier: String,
    order: Number,
    isPublished: { type: Boolean, default: true }
}, { timestamps: true });

// 22. Support Tickets
const supportTicketSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    userId: String,
    hackathonId: String,
    subject: String,
    description: String,
    category: String,
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    assignedTo: String,
    attachments: [String],
    resolvedAt: Date
}, { timestamps: true });

// 23. Activity Logs (Admin Audit)
const activityLogSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    userId: String,
    role: String,
    action: String,
    entityType: String,
    entityId: String,
    description: String,
    ipAddress: String,
    userAgent: String
}, { timestamps: true });

// 24. System Settings
const systemSettingSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    value: mongoose.Schema.Types.Mixed,
    description: String,
    updatedBy: String
}, { timestamps: true });

// Export Models
export const Bookmark = mongoose.models.Bookmark || mongoose.model('Bookmark', bookmarkSchema);
export const BookmarkedProfile = mongoose.models.BookmarkedProfile || mongoose.model('BookmarkedProfile', bookmarkedProfileSchema);
export const RecruitmentInvitation = mongoose.models.RecruitmentInvitation || mongoose.model('RecruitmentInvitation', recruitmentInvitationSchema);
export const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
export const CalendarEvent = mongoose.models.CalendarEvent || mongoose.model('CalendarEvent', calendarEventSchema);
export const Certificate = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);
export const Sponsor = mongoose.models.Sponsor || mongoose.model('Sponsor', sponsorSchema);
export const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
export const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
export const SystemSetting = mongoose.models.SystemSetting || mongoose.model('SystemSetting', systemSettingSchema);

export default {
    Bookmark, BookmarkedProfile, RecruitmentInvitation, Conversation, Message, Notification, Announcement, CalendarEvent, Certificate, Sponsor, SupportTicket, ActivityLog, SystemSetting
};
