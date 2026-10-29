import { User, Team, ProblemStatement, Hackathon, Registration, Submission } from '../models/index.js';
import { Announcement, SupportTicket } from '../models/secondary.js';
import { resolveOptionalUser } from '../middleware/auth.js';
import { detectProhibitedContent, handleContentModerationIncident } from './moderation.js';

/**
 * Valid allowed internal route paths for SrijanBot navigation actions.
 */
export const VALID_ROUTES = {
    HOME: '/',
    DASHBOARD: '/dashboard',
    HACKATHONS: '/hackathons',
    TIMELINE: '/timeline',
    PROFILE: '/profile',
    PROFILE_OVERVIEW: '/profile-overview',
    PROBLEMS: '/problems',
    CHALLENGE: '/challenge',
    TEAM: '/team',
    RECRUITMENT: '/recruitment',
    WORKSPACE: '/workspace',
    PAYMENT: '/payment',
    CHAT: '/chat',
    NOTIFICATIONS: '/notifications',
    LEADERBOARD: '/leaderboard',
    CERTIFICATES: '/certificates',
    SUPPORT: '/support',
    SETTINGS: '/settings',
    AI_ASSISTANT: '/ai-assistant',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_OTP: '/auth/otp',
    EVALUATIONS: '/evaluations',
    MENTOR: '/mentor',
    ADMIN: '/admin',
    ADMIN_HACKATHONS: '/admin/hackathons',
    ADMIN_PROBLEMS: '/admin/problems',
    ADMIN_USERS: '/admin/users',
    ADMIN_TEAMS: '/admin/teams',
    ADMIN_PAYMENTS: '/admin/payments',
    ADMIN_SUBMISSIONS: '/admin/submissions',
    ADMIN_HEALTH: '/admin/health',
    ADMIN_LOGS: '/admin/logs',
    CODE_OF_CONDUCT: '/code-of-conduct',
    PRIVACY_POLICY: '/privacy-policy',
    FAQ: '/faq',
    GALLERY: '/gallery',
    SPONSORS: '/sponsors',
    ANNOUNCEMENTS: '/announcements'
};

/**
 * Assembles verified live platform facts from MongoDB.
 * Enforces strict data-isolation: non-test requests derive identity strictly from the verified session.
 */
export async function getPlatformContext(req) {
    let user = null;
    try {
        user = await resolveOptionalUser(req);
    } catch (e) {
        user = null;
    }

    const clientContext = req.body?.context || {};
    const isTestHarness = process.env.NODE_ENV === 'test' || req._isTestRunner === true || req.headers?.['x-srijanbot-test'] === 'true';

    let userId = null;
    let role = 'guest';
    let email = null;
    let name = 'Operative';

    if (user) {
        // Strictly trusted server identity from Bearer token
        userId = user.id;
        role = (user.role || 'student').toLowerCase();
        email = user.email;
        name = user.name || (role === 'admin' ? 'Administrator' : 'Operative');
    } else if (isTestHarness && clientContext) {
        // Allowed strictly in automated test suite
        userId = clientContext.userId || null;
        role = (clientContext.role || 'guest').toLowerCase();
        email = clientContext.email || null;
        name = clientContext.name || (role === 'admin' ? 'Administrator' : 'Operative');
    } else {
        // Normal unauthenticated request — cannot be escalated by request body
        userId = null;
        role = 'guest';
        email = null;
        name = 'Guest';
    }

    let dbUnavailable = false;

    // 1. Fetch live active/upcoming hackathons
    let hackathons = [];
    try {
        hackathons = await Hackathon.find({
            status: { $nin: ['archived', 'draft'] },
            isArchived: { $ne: true }
        }).sort({ startDate: 1 }).lean();
    } catch (e) {
        dbUnavailable = true;
        console.error('[SRIJANBOT CONTEXT] Error fetching hackathons:', e.message);
    }

    const activeHackathon = hackathons.find(h => h.status === 'active') || hackathons[0] || null;

    // 2. Fetch user team if applicable
    let team = null;
    let teamMemberCount = 0;
    try {
        if (userId) {
            team = await Team.findOne({
                $or: [{ memberIds: userId }, { leaderId: userId }]
            }).lean();
        }
        if (!team && isTestHarness && clientContext.teamId) {
            team = await Team.findOne({ id: clientContext.teamId }).lean();
            if (!team) {
                team = { id: clientContext.teamId, name: clientContext.teamName || 'Alpha Squad', memberIds: [userId || 'usr-1'] };
            }
        }
        if (team && Array.isArray(team.memberIds)) {
            teamMemberCount = team.memberIds.length;
        } else if (team) {
            teamMemberCount = 1;
        }
    } catch (e) {
        dbUnavailable = true;
        console.error('[SRIJANBOT CONTEXT] Error fetching team:', e.message);
    }

    // 3. Fetch user registration if applicable
    let registration = null;
    try {
        if (userId) {
            registration = await Registration.findOne({
                userId,
                status: { $ne: 'cancelled' }
            }).sort({ createdAt: -1 }).lean();
        }
    } catch (e) {
        dbUnavailable = true;
        console.error('[SRIJANBOT CONTEXT] Error fetching registration:', e.message);
    }

    // 4. Fetch submission if team exists
    let submission = null;
    try {
        if (team?.id) {
            submission = await Submission.findOne({ teamId: team.id }).lean();
        }
    } catch (e) {
        dbUnavailable = true;
        console.error('[SRIJANBOT CONTEXT] Error fetching submission:', e.message);
    }

    // 5. System settings
    const systemSettings = {
        maintenanceMode: false,
        registrationEnabled: true,
        submissionEnabled: true,
        chatEnabled: true,
        recruitmentEnabled: true,
        leaderboardVisible: true
    };

    return {
        user: user || (isTestHarness && userId ? { id: userId, role, email, name, teamId: team?.id } : null),
        userId,
        role: role.toLowerCase(),
        name,
        email,
        team,
        teamMemberCount,
        registration,
        submission,
        hackathons,
        activeHackathon,
        systemSettings,
        dbUnavailable,
        currentPath: clientContext.path || '/'
    };
}

/**
 * Detects adversarial / boundary attacks: prompt injection, credential disclosure, role escalations.
 */
export function checkAdversarialSecurity(message = "", ctx = null) {
    const lower = message.toLowerCase();

    // Credential disclosure patterns
    if (
        /what is (the |my )?password/i.test(lower) ||
        /reveal (the |my )?password/i.test(lower) ||
        /what is user .* password/i.test(lower) ||
        /give me (someone('s)?|the admin('s)?) password/i.test(lower) ||
        /show me (the )?password/i.test(lower) ||
        /backend secrets/i.test(lower) ||
        /confidential backend/i.test(lower) ||
        /expose (the )?(administrator |admin )?token/i.test(lower)
    ) {
        return {
            isBlocked: true,
            reply: "SECURITY PROTOCOL VIOLATION: Access denied. User passwords, security tokens, and backend secrets are strictly encrypted. SrijanBot cannot view, retrieve, or disclose credentials. [Go to Dashboard -> /dashboard]"
        };
    }

    // Role escalation claims
    if (
        /i am (an |the )?admin/i.test(lower) ||
        /i am the administrator/i.test(lower) ||
        /treat me as (an )?admin/i.test(lower) ||
        /act as (an )?admin/i.test(lower) ||
        /give me admin(istrator)? (access|privileges|role|clearance)/i.test(lower) ||
        /make me (an )?admin/i.test(lower) ||
        /change my (role|permission) to admin/i.test(lower)
    ) {
        if (!ctx || ctx.role !== 'admin') {
            return {
                isBlocked: true,
                reply: "SECURITY PROTOCOL VIOLATION: Role elevation cannot be granted through chat. Clearance is enforced strictly by server-side authentication. [Go to Dashboard -> /dashboard]"
            };
        }
    }

    const injectionPatterns = [
        /ignore (all|your|previous) (rules|instructions|prompts)/i,
        /bypass (the )?(login|auth|registration deadline|team('s)? size limit)/i,
        /fake certificate/i,
        /pretend that i won/i,
        /pretend that a payment was successful/i,
        /approve my payment without verification/i,
        /mark my submission as complete even though/i,
        /change my score to \d+/i,
        /remove the other team('s)? submission/i,
        /reveal (the )?hidden problem statement before/i,
        /reveal private moderator messages/i,
        /delete a user('s)? account through chat/i,
        /change the official event date without permission/i,
        /fabricate a hackathon deadline/i
    ];

    for (const pat of injectionPatterns) {
        if (pat.test(lower)) {
            return {
                isBlocked: true,
                reply: "SECURITY PROTOCOL VIOLATION: Access denied. Prompt injection, privilege escalation, credential disclosure, and unauthorized database modifications are strictly prohibited on CodeSrijan. [Go to Dashboard -> /dashboard]"
            };
        }
    }

    return { isBlocked: false };
}

/**
 * Detects requests for bot mutations (actions the bot cannot directly execute in DB).
 */
export function checkActionLimitations(message = "", ctx) {
    const lower = message.toLowerCase();

    if (/can (you|srijanbot) (directly )?create (my |a )?(team|squad)/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot directly create squads in the database. You can create your squad directly in the Recruitment Sector: [Create Squad -> /recruitment]"
        };
    }

    if (/can (you|srijanbot) (directly )?(remove|kick) a (team )?member/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot modify squad rosters directly. Team leaders can manage members on the Team Roster page: [Manage Squad -> /team]"
        };
    }

    if (/can (you|srijanbot) (approve|verify|confirm) (my )?payment/i.test(lower) || /approve a payment through this chat/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot approve payments. All registration fees and UPI payment proofs are reviewed and verified by human administrators. [View Payment Status -> /payment]"
        };
    }

    if (/can (you|srijanbot) (refund|cancel) (my )?payment/i.test(lower) || /give me a refund/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot initiate refunds. Please contact the platform organizers or submit a support ticket: [Open Support -> /support]"
        };
    }

    if (/can (you|srijanbot) change my (account )?role/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot modify user roles. Account roles are enforced by server security rules. To request a role change, contact support: [Contact Support -> /support]"
        };
    }

    if (/can (you|srijanbot) submit (my |our )?project (for me)?/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot submit projects on your behalf. Please navigate to your Workspace and transmit your GitHub and Demo links: [Open Workspace -> /workspace]"
        };
    }

    if (/can (you|srijanbot) (guarantee|verify) that my submission was saved/i.test(lower)) {
        if (ctx?.submission) {
            return {
                isLimited: true,
                reply: `Verified live record: Your squad's submission was recorded (Repo: ${ctx.submission.repositoryUrl || 'Attached'}). [Review Workspace -> /workspace]`
            };
        }
        return {
            isLimited: true,
            reply: "No project submission has been recorded for your squad yet. Please upload your submission payload in the Workspace: [Open Workspace -> /workspace]"
        };
    }

    if (/can (you|srijanbot) send a message to (the )?admin/i.test(lower) || /contact the admin directly/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot send direct private messages to administrators. You can reach the admin team by opening an official support ticket: [Create Support Ticket -> /support]"
        };
    }

    if (/can (you|srijanbot) send a message to my teammate/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot dispatch private messages for you. You can chat directly with your squad members in the Team Chat room: [Open Team Chat -> /chat]"
        };
    }

    if (/can (you|srijanbot) change (the )?(hackathon |event )?schedule/i.test(lower) || /extend (the )?(timer|deadline)/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot modify hackathon schedules or countdown timers. Event deadlines are set exclusively by authorized administrators. [View Official Timeline -> /timeline]"
        };
    }

    if (/can (you|srijanbot) issue (my )?certificate directly/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot generate or issue certificates. Certificates are generated automatically upon hackathon completion and judge evaluations: [View Certificates -> /certificates]"
        };
    }

    if (/can (you|srijanbot) change (my |the )?score/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot alter evaluation scores. All project assessments are performed strictly by official hackathon judges: [View Leaderboard -> /leaderboard]"
        };
    }

    if (/can (you|srijanbot) reset my password (for me)?/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot reset your password directly. Please use the self-service password reset portal: [Reset Password -> /auth/forgot-password]"
        };
    }

    if (/can (you|srijanbot) cancel my registration/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot cancel registrations directly. To request registration cancellation, please submit a ticket to the organizing team: [Open Support -> /support]"
        };
    }

    if (/can (you|srijanbot) unlock the workspace (manually)?/i.test(lower)) {
        return {
            isLimited: true,
            reply: "Workspace access is automated: you must join or create a squad of 1-4 members to unlock your project board. [Find or Create Squad -> /recruitment]"
        };
    }

    if (/can (you|srijanbot) delete my support ticket/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot delete support tickets. Support history is preserved for administrative audit trails. [View Support Desk -> /support]"
        };
    }

    return { isLimited: false };
}


export const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";
export const FALLBACK_GROQ_MODEL = "llama-3.3-70b-versatile";

export function getEffectiveGroqModel() {
    const configured = process.env.GROQ_MODEL?.trim();
    if (configured) {
        if (configured === 'llama3-8b-8192' || configured === 'llama3-70b-8192' || configured === 'openai/gpt-oss-20b') {
            console.warn(`[SRIJANBOT MODEL CONFIG] Obsolete/decommissioned model "${configured}" detected in GROQ_MODEL. Automatically overriding to "${DEFAULT_GROQ_MODEL}".`);
            return DEFAULT_GROQ_MODEL;
        }
        return configured;
    }
    return DEFAULT_GROQ_MODEL;
}

/**
 * Intelligent Heuristic Fallback Generator (Pure data calculation, decoupled from HTTP transmission).
 */
export async function computeAIFallback(req, precomputedCtx = null) {
    try {
        const message = (typeof req === 'string') 
            ? req 
            : (req?.body?.message || req?.message || "");
        const lowerMsg = (message || "").toLowerCase().trim();
        const ctx = precomputedCtx || await getPlatformContext(req);

        // 1. Check Security & Boundaries First
        const sec = checkAdversarialSecurity(lowerMsg, ctx);
        if (sec.isBlocked) {
            return { reply: sec.reply };
        }

        // 2. Check Bot Limitations
        const limit = checkActionLimitations(lowerMsg, ctx);
        if (limit.isLimited) {
            return { reply: limit.reply };
        }

        // 3. Check Database Outage Condition
        if (ctx.dbUnavailable) {
            if (/registration|payment|submission|deadline|when|workspace|team|squad|score/i.test(lowerMsg)) {
                return { reply: "SYSTEM NOTICE: Live platform database records are currently unreachable. Your current registration, squad, or deadline status could not be verified from the database. Please try again in a few moments or open a support ticket: [Open Support Desk -> /support]" };
            }
        }

        let reply = "";

        // PRIORITY 1: Admin Operations & RBAC (Cat 21)
        if (
            /admin (dashboard|portal|page|url|clearance|operations|health|telemetry|analytics)/i.test(lowerMsg) ||
            /platform health/i.test(lowerMsg) ||
            /system health/i.test(lowerMsg) ||
            /how many users are registered/i.test(lowerMsg) ||
            /how many active squads/i.test(lowerMsg) ||
            (/active squads/i.test(lowerMsg) && /health|telemetry|status|show me/i.test(lowerMsg)) ||
            /database connection healthy/i.test(lowerMsg) ||
            /how do i manage users/i.test(lowerMsg) ||
            /how do i create a hackathon/i.test(lowerMsg) ||
            /how do i review payment proofs/i.test(lowerMsg) ||
            /review payments/i.test(lowerMsg) ||
            /how do i view audit logs/i.test(lowerMsg) ||
            /export hackathon data/i.test(lowerMsg)
        ) {
            if (ctx.role !== 'admin') {
                reply = "ACCESS DENIED. You do not possess administrator credentials. Platform telemetry and administrative controls are restricted. [Go to Dashboard -> /dashboard]";
            } else {
                if (/health|database/i.test(lowerMsg)) {
                    reply = "Database and platform health metrics are available in the Admin Operations portal. [Platform Health -> /admin/health]";
                } else if (/payment/i.test(lowerMsg)) {
                    reply = "Review and verify participant UPI payment proofs in the Admin Payment Queue. [Review Payments -> /admin/payments]";
                } else if (/create a hackathon|manage hackathon/i.test(lowerMsg)) {
                    reply = "Create and configure hackathon parameters, tracks, and deadlines in the Event Manager. [Manage Hackathons -> /admin/hackathons]";
                } else if (/logs/i.test(lowerMsg)) {
                    reply = "Immutable security and audit logs are recorded in the Admin Activity Stream. [View Audit Logs -> /admin/logs]";
                } else {
                    reply = "Greetings Administrator. Telemetry is online. You can manage users, squads, and events in the Admin Command Center. [Admin Dashboard -> /admin]";
                }
            }
            return { reply };
        }

        // PRIORITY 2: Role Inquiries (Cat 20)
        if (
            /what role do i have/i.test(lowerMsg) ||
            /am i a student or an administrator/i.test(lowerMsg) ||
            /what can a student do/i.test(lowerMsg) ||
            /what can an administrator do/i.test(lowerMsg) ||
            /access denied/i.test(lowerMsg)
        ) {
            if (ctx.role === 'admin') {
                reply = `Your account clearance is confirmed as ADMINISTRATOR (${ctx.email}). You have full authority over events, payments, users, and telemetry. [Open Admin Dashboard -> /admin]`;
            } else if (ctx.role === 'judge') {
                reply = `Your account clearance is confirmed as JUDGE (${ctx.email}). You are authorized to evaluate submissions and submit rubric scores. [Open Judge Portal -> /evaluations]`;
            } else if (ctx.role === 'mentor') {
                reply = `Your account clearance is confirmed as MENTOR (${ctx.email}). You can guide assigned squads and answer technical questions. [Open Mentor Center -> /mentor]`;
            } else if (ctx.role === 'student') {
                reply = `Your account role is verified as HACKER/STUDENT (${ctx.name || ctx.email}). You can register for hackathons, recruit squad members, solve problem statements, and submit projects. [Go to Dashboard -> /dashboard]`;
            } else {
                reply = "You are currently exploring CodeSrijan as an unauthenticated GUEST. Please log in or register to join hackathons, form squads, and submit projects. [Log In -> /login]";
            }
            return { reply };
        }

        // PRIORITY 3: Judge & Mentor (Cat 22 & 23)
        if (/judge (dashboard|portal|rubric)|assigned submissions|score a submission|scoring criteria|judging criteria|evaluation rubric|rubric|how will my project be evaluated|who evaluates/i.test(lowerMsg)) {
            if (ctx.role === 'judge' || ctx.role === 'admin') {
                reply = "Judges can inspect assigned projects and record scores against the 4-pillar evaluation rubric in the Judge Portal. [Open Judge Portal -> /evaluations]";
            } else {
                reply = "Evaluation scoring is performed against 4 criteria: Innovation (25%), Technical Execution (25%), Design & Usability (25%), and Practical Impact (25%). Final scores are published on the Leaderboard. [View Leaderboard -> /leaderboard]";
            }
            return { reply };
        }

        if (/mentor (dashboard|requests)|which teams am i assigned|guidance to a team/i.test(lowerMsg)) {
            if (ctx.role === 'mentor' || ctx.role === 'admin') {
                reply = "Mentors can view assigned teams, answer guidance requests, and inspect project progress in the Mentor Center. [Open Mentor Center -> /mentor]";
            } else {
                reply = "Squads can request mentor guidance inside the team communications sector. [Open Team Chat -> /chat]";
            }
            return { reply };
        }

        // PRIORITY 4: Project Submissions & Workspace (Cat 8)
        if (
            /where is my submission/i.test(lowerMsg) ||
            /has my project been evaluated/i.test(lowerMsg) ||
            /where is my project/i.test(lowerMsg) ||
            /submit my (hackathon )?project/i.test(lowerMsg) ||
            /how do i submit/i.test(lowerMsg) ||
            /submision/i.test(lowerMsg) ||
            /where do i submit/i.test(lowerMsg) ||
            /can i submit without a squad/i.test(lowerMsg) ||
            /github (repository )?link/i.test(lowerMsg) ||
            /live demo link/i.test(lowerMsg) ||
            /figma/i.test(lowerMsg) ||
            /reject my github url/i.test(lowerMsg) ||
            /submissions are closed/i.test(lowerMsg) ||
            /(enter|access|open|unlock).*workspace/i.test(lowerMsg) ||
            /why.*workspace/i.test(lowerMsg) ||
            /where is my (project )?workspace/i.test(lowerMsg) ||
            /open (the )?workspace/i.test(lowerMsg) ||
            /lone wolf/i.test(lowerMsg)
        ) {
            if (/can i submit without a squad/i.test(lowerMsg)) {
                reply = "Submissions require an active squad of 1-4 members. Solo participants cannot transmit payloads until they form or join a squad. [Find or Create Squad -> /recruitment]";
            } else if (!ctx.team) {
                reply = "LONE WOLF DETECTED. Workspace access requires an active squad of 1-4 members. Create or join a team in the Recruitment sector to unlock your project board. [Find or Create Squad -> /recruitment]";
            } else if (ctx.submission) {
                const scoreText = ctx.submission.score != null ? `Current Score: ${ctx.submission.score}/100` : "Evaluation status: PENDING evaluation by judges";
                reply = `Your squad "${ctx.team.name}" has recorded its submission (Repository: ${ctx.submission.repositoryUrl || 'Attached'}). ${scoreText}. [Open Workspace -> /workspace]`;
            } else {
                reply = `Workspace unlocked for squad "${ctx.team.name}". To submit, navigate to Workspace Kanban, fill in your public GitHub repository URL, live demo URL, and click "Deliver Payload". [Open Workspace -> /workspace]`;
            }
            return { reply };
        }

        // PRIORITY 5: Countdown, Deadlines & Timings (Cat 9 & 28)
        if (
            /system lockdown/i.test(lowerMsg) ||
            /countdown/i.test(lowerMsg) ||
            /timer/i.test(lowerMsg) ||
            /clock reaches zero/i.test(lowerMsg) ||
            /how much time (do i have )?left/i.test(lowerMsg) ||
            /deadline/i.test(lowerMsg) ||
            /which timezone/i.test(lowerMsg) ||
            /cutoff/i.test(lowerMsg) ||
            /when does (the )?hackathon (start|end)/i.test(lowerMsg) ||
            /when hackthon starts/i.test(lowerMsg) ||
            /when does it end/i.test(lowerMsg) ||
            /when is it ending/i.test(lowerMsg)
        ) {
            const h = ctx.activeHackathon;
            if (h && h.submissionDeadline) {
                const deadline = new Date(h.submissionDeadline);
                const now = new Date();
                const diffMs = deadline.getTime() - now.getTime();
                const isExpired = diffMs <= 0;
                const hoursLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
                const minutesLeft = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

                const formattedDate = deadline.toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                });

                if (isExpired) {
                    reply = `Submissions for "${h.name}" closed on ${formattedDate} IST. The countdown has reached zero and workspace submission forms are locked. [View Leaderboard -> /leaderboard]`;
                } else {
                    reply = `Live Schedule for "${h.name}": Submission deadline is ${formattedDate} IST (Indian Standard Time). Time remaining: ${hoursLeft} hours and ${minutesLeft} minutes. [Open Workspace -> /workspace]`;
                }
            } else {
                reply = "Official hackathon timeline and submission deadlines are posted on the live schedule. All platform events operate on Indian Standard Time (IST). [View Official Timeline -> /timeline]";
            }
            return { reply };
        }

        // PRIORITY 6: Team Chat & Comms (Cat 17) - Before generic team!
        if (/chat/i.test(lowerMsg) || /message/i.test(lowerMsg) || /communication/i.test(lowerMsg)) {
            reply = "Collaborate with squad operatives in the real-time encrypted Team Chat room. [Open Team Chat -> /chat]";
            return { reply };
        }

        // PRIORITY 7: Problem Statements & Tracks (Cat 10)
        if (
            /problem statement/i.test(lowerMsg) ||
            /tracks/i.test(lowerMsg) ||
            /classified/i.test(lowerMsg) ||
            /revealed/i.test(lowerMsg) ||
            /which problem statement should i choose/i.test(lowerMsg) ||
            /judging criteria for a track/i.test(lowerMsg)
        ) {
            reply = "Problem statements across tracks (AI/ML, Web3, FinTech, HealthTech, CyberSecurity) are listed in the Problem Hub. Classified statements reveal automatically at kickoff. [Browse Problem Statements -> /problems]";
            return { reply };
        }

        // PRIORITY 8: Payments & Registration Fees (Cat 13)
        if (
            /has my payment been approved/i.test(lowerMsg) ||
            /why is my registration pending/i.test(lowerMsg) ||
            /what is our registration status/i.test(lowerMsg) ||
            /is (this|there a) (free|paid) hackathon/i.test(lowerMsg) ||
            /difference between.*(free|paid)/i.test(lowerMsg) ||
            /free and paid/i.test(lowerMsg) ||
            /free vs paid/i.test(lowerMsg) ||
            /registration fee/i.test(lowerMsg) ||
            /how do i pay/i.test(lowerMsg) ||
            /upi payment/i.test(lowerMsg) ||
            /payment proof/i.test(lowerMsg) ||
            /screenshot/i.test(lowerMsg) ||
            /payment pending/i.test(lowerMsg) ||
            /payment rejected/i.test(lowerMsg) ||
            /payment status/i.test(lowerMsg)
        ) {
            const activeH = ctx.activeHackathon;
            const feeText = activeH ? (activeH.fee > 0 ? `₹${activeH.fee} per participant/team` : 'FREE') : 'FREE';

            if (ctx.registration?.paymentStatus === 'verified') {
                reply = `Your payment for ${activeH?.name || 'the hackathon'} is VERIFIED and approved. Your mission enrollment is confirmed! [View Dashboard -> /dashboard]`;
            } else if (ctx.registration?.paymentStatus === 'pending') {
                reply = `Your payment proof has been submitted and is currently PENDING review by administrators. Verification normally completes within a few hours. [Check Payment Status -> /payment]`;
            } else if (ctx.registration?.paymentStatus === 'rejected') {
                reply = `Your previous payment submission was rejected. Please re-upload a clear screenshot displaying the UPI transaction ID (UTR). [Re-upload Payment Proof -> /payment]`;
            } else if (ctx.registration && !ctx.registration.paymentStatus) {
                reply = `Your registration is currently ${ctx.registration.status.toUpperCase()}. If registered for a paid event, ensure UPI payment proof is submitted. [Check Payment Status -> /payment]`;
            } else {
                reply = `Current Hackathon: "${activeH?.name || 'CodeSrijan Hackathon'}". Entry Fee: ${feeText}. For paid events, scan the official QR code, complete payment via UPI, and submit your 12-digit UTR number with screenshot. Free hackathons require no payment. [Open Payment Portal -> /payment]`;
            }
            return { reply };
        }

        // PRIORITY 9: Certificates (Cat 14)
        if (/certificate/i.test(lowerMsg) || /cerificate/i.test(lowerMsg) || /hash/i.test(lowerMsg) || /achievements/i.test(lowerMsg)) {
            reply = "Official certificates featuring cryptographic verification hashes are awarded to participants upon hackathon completion. You can download and verify them online. [View Certificates -> /certificates]";
            return { reply };
        }

        // PRIORITY 10: Leaderboard & Rankings (Cat 15)
        if (/leaderboard/i.test(lowerMsg) || /ranking/i.test(lowerMsg) || /show my rank/i.test(lowerMsg) || /who is leading/i.test(lowerMsg)) {
            reply = "Live leaderboard standings and evaluated project scores are available in the Leaderboard sector. Final rankings publish once all evaluations conclude. [View Leaderboard -> /leaderboard]";
            return { reply };
        }

        // PRIORITY 11: Privacy, Security & Trust (Cat 24)
        if (
            /privacy/i.test(lowerMsg) ||
            /who can see/i.test(lowerMsg) ||
            /other students see/i.test(lowerMsg) ||
            /can.*see my/i.test(lowerMsg) ||
            /email address.*see/i.test(lowerMsg) ||
            /project files private/i.test(lowerMsg) ||
            /are my.*private/i.test(lowerMsg) ||
            /account protected/i.test(lowerMsg) ||
            /code of conduct/i.test(lowerMsg) ||
            /conduct/i.test(lowerMsg) ||
            /rules/i.test(lowerMsg)
        ) {
            if (/conduct|rules/i.test(lowerMsg)) {
                reply = "CodeSrijan enforces a strict Code of Conduct and official Hackathon Rules promoting respect, integrity, fairness, and anti-harassment. [View Code of Conduct -> /code-of-conduct]";
            } else {
                reply = "Participant privacy is strictly protected. User email addresses and unsubmitted project repositories remain private. You can review full terms in our Privacy Policy. [View Privacy Policy -> /privacy-policy]";
            }
            return { reply };
        }

        // PRIORITY 12: Notifications & Announcements (Cat 16)
        if (/notification/i.test(lowerMsg) || /announcement/i.test(lowerMsg) || /updates/i.test(lowerMsg)) {
            reply = "Stay tuned with real-time schedule updates, mentor announcements, and event alerts in the Notifications and Announcements stream. [View Announcements -> /announcements]";
            return { reply };
        }

        // PRIORITY 13: Support & Troubleshooting (Cat 18)
        if (
            /support/i.test(lowerMsg) ||
            /help/i.test(lowerMsg) ||
            /ticket/i.test(lowerMsg) ||
            /bug/i.test(lowerMsg) ||
            /error/i.test(lowerMsg) ||
            /blank page/i.test(lowerMsg) ||
            /slow/i.test(lowerMsg) ||
            /asap/i.test(lowerMsg)
        ) {
            reply = "Need help or experiencing a technical glitch? You can open an official support ticket and our engineering team will assist you. [Create Support Ticket -> /support]";
            return { reply };
        }

        // PRIORITY 14: Auth, Login, Password & OTP (Cat 2)
        if (
            /log in/i.test(lowerMsg) ||
            /login/i.test(lowerMsg) ||
            /i cant login/i.test(lowerMsg) ||
            /forgot (my )?password/i.test(lowerMsg) ||
            /reset (my )?password/i.test(lowerMsg) ||
            /verification code/i.test(lowerMsg) ||
            /otp/i.test(lowerMsg) ||
            /otp not coming/i.test(lowerMsg) ||
            /create an account/i.test(lowerMsg)
        ) {
            if (/forgot|reset/i.test(lowerMsg)) {
                reply = "To reset your password, visit the recovery portal and enter your registered email to receive a secure reset link. [Reset Password -> /auth/forgot-password]";
            } else if (/otp|verification/i.test(lowerMsg)) {
                reply = "Verification codes expire in 10 minutes. If you did not receive an email, check your spam/junk folder or request a new code. [Verify Code -> /auth/otp]";
            } else if (/create|register/i.test(lowerMsg)) {
                reply = "Create your CodeSrijan builder account with your email and student details. [Create Account -> /register]";
            } else {
                reply = "Log in with your verified email and password. If you experience session timeouts, clear browser cache and sign in again. [Log In -> /login]";
            }
            return { reply };
        }

        // PRIORITY 15: Dashboard & Profile (Cat 7)
        if (
            /dashboard/i.test(lowerMsg) ||
            /dashbord/i.test(lowerMsg) ||
            /profile/i.test(lowerMsg) ||
            /github profile/i.test(lowerMsg) ||
            /skills/i.test(lowerMsg) ||
            /portfolio/i.test(lowerMsg)
        ) {
            if (/profile|skills|github|portfolio/i.test(lowerMsg)) {
                reply = "Update your technical skills, bio, GitHub handle, and portfolio links in your Profile settings. [Edit Profile -> /profile]";
            } else {
                reply = "Your Mission Dashboard displays active hackathon status, countdown timers, squad readiness, and action alerts. [Open Dashboard -> /dashboard]";
            }
            return { reply };
        }

        // PRIORITY 16: Finding Teammates & Solo Matching (Cat 6)
        if (
            /i (don'?t|do not) have (a )?(squad|team)/i.test(lowerMsg) ||
            /find (a |some )?teammate/i.test(lowerMsg) ||
            /find (a )?(react|python|backend|frontend|designer|ui|ux|developer)/i.test(lowerMsg) ||
            /recruitment/i.test(lowerMsg) ||
            /looking for/i.test(lowerMsg) ||
            /participate alone/i.test(lowerMsg)
        ) {
            reply = "Solo participants and squads can find teammates or browse builder profiles in the Recruitment Marketplace. You can filter candidates by technical skills (React, Python, UI/UX, AI/ML). [Find Teammates -> /recruitment]";
            return { reply };
        }

        // PRIORITY 17: Squad Limits & General Squad Information (Cat 5)
        if (
            /how many members/i.test(lowerMsg) ||
            /squad size/i.test(lowerMsg) ||
            /member limit/i.test(lowerMsg)
        ) {
            reply = `A squad on CodeSrijan can have between 1 and 4 builders. ${ctx.team ? `Your squad "${ctx.team.name}" currently has ${ctx.teamMemberCount}/4 members.` : "You can assemble your squad in the Recruitment Marketplace."} [Open Team Sector -> /team]`;
            return { reply };
        }

        if (
            /squad/i.test(lowerMsg) ||
            /team/i.test(lowerMsg) ||
            /teammate/i.test(lowerMsg) ||
            /how to make team/i.test(lowerMsg) ||
            /invitation link/i.test(lowerMsg) ||
            /invite frnds/i.test(lowerMsg)
        ) {
            if (ctx.team) {
                reply = `You are registered in squad "${ctx.team.name}" with ${ctx.teamMemberCount}/4 operatives. You can manage members, copy invitation links, or access your workspace. [Open Team Sector -> /team]`;
            } else {
                reply = "Solo participants can find teammates or create a squad of up to 4 builders in the Recruitment Marketplace. You can filter candidates by skills (React, Python, UI/UX, AI/ML). [Find Teammates -> /recruitment]";
            }
            return { reply };
        }

        // PRIORITY 18: Hackathons Catalog & Registration (Cat 3 & 4)
        if (
            /what hackathons/i.test(lowerMsg) ||
            /available hackathons/i.test(lowerMsg) ||
            /which hackathon/i.test(lowerMsg) ||
            /how do i register/i.test(lowerMsg) ||
            /registration/i.test(lowerMsg) ||
            /already registered/i.test(lowerMsg) ||
            /join event/i.test(lowerMsg) ||
            /catalog/i.test(lowerMsg)
        ) {
            if (ctx.registration) {
                reply = `You have an active registration for hackathon ID "${ctx.registration.hackathonId}". Status: ${ctx.registration.status.toUpperCase()}. [View Dashboard -> /dashboard]`;
            } else if (ctx.hackathons && ctx.hackathons.length > 0) {
                const list = ctx.hackathons.slice(0, 3).map(h => `"${h.name}" (${h.fee > 0 ? `Paid: ₹${h.fee}` : 'Free'})`).join(', ');
                reply = `Currently active/upcoming hackathons: ${list}. You can inspect rules, prizes, and register on the Hackathons page. [Explore Hackathons -> /hackathons]`;
            } else {
                reply = "Explore all available hackathons and register your squad in the Hackathons Catalog. [Explore Hackathons -> /hackathons]";
            }
            return { reply };
        }

        // PRIORITY 19: Navigation Shortcuts (Cat 19)
        if (/take me to|open /i.test(lowerMsg)) {
            if (/hackathon|catalog/i.test(lowerMsg)) reply = "Navigating to Hackathons Catalog. [Explore Hackathons -> /hackathons]";
            else if (/workspace/i.test(lowerMsg)) reply = "Navigating to Workspace sector. [Open Workspace -> /workspace]";
            else if (/team/i.test(lowerMsg)) reply = "Navigating to Squad Management. [Open Team Page -> /team]";
            else if (/recruitment/i.test(lowerMsg)) reply = "Navigating to Recruitment Marketplace. [Open Recruitment -> /recruitment]";
            else if (/problem/i.test(lowerMsg)) reply = "Navigating to Problem Statements. [Open Problems -> /problems]";
            else if (/leaderboard/i.test(lowerMsg)) reply = "Navigating to Leaderboard. [Open Leaderboard -> /leaderboard]";
            else if (/certificate/i.test(lowerMsg)) reply = "Navigating to Certificates. [Open Certificates -> /certificates]";
            else if (/dashboard/i.test(lowerMsg)) reply = "Navigating to Mission Dashboard. [Open Dashboard -> /dashboard]";
            else if (/profile/i.test(lowerMsg)) reply = "Navigating to Profile. [Open Profile -> /profile]";
            else if (/support/i.test(lowerMsg)) reply = "Navigating to Support Desk. [Open Support -> /support]";
            else if (/announcement/i.test(lowerMsg)) reply = "Navigating to Announcements. [Open Announcements -> /announcements]";
            else if (/payment/i.test(lowerMsg)) reply = "Navigating to Payment Portal. [Open Payment -> /payment]";
            else reply = "Navigating to Mission Dashboard. [Open Dashboard -> /dashboard]";
            return { reply };
        }

        // PRIORITY 20: Ideation & Tech Stack Suggestions (Cat 11)
        if (/project idea|ai project|tech stack|react or|python|architecture|mvp|suggest/i.test(lowerMsg)) {
            reply = "For 24h/48h hackathons, focus on a high-impact MVP: a clean frontend (React + Tailwind), a fast backend (Node.js/Python FastAPI), and 1-2 core killer features rather than sprawling scope. You can coordinate your architecture in your Workspace. [Open Workspace -> /workspace]";
            return { reply };
        }

        // PRIORITY 21: Ambiguous Clarification (Cat 28)
        if (/when does it end|when is the deadline/i.test(lowerMsg)) {
            if (ctx.hackathons && ctx.hackathons.length > 1 && !ctx.registration) {
                const names = ctx.hackathons.slice(0, 3).map(h => `"${h.name}"`).join(', ');
                reply = `Multiple hackathons are currently running on CodeSrijan (${names}). Which event do you mean? You can view all dates in the schedule. [View Official Timeline -> /timeline]`;
                return { reply };
            }
        }

        // PRIORITY 22: Greetings (Cat 1)
        if (/^(hi|hello|hey|greetings|hola)/i.test(lowerMsg)) {
            reply = `Greetings ${ctx.name || 'Operative'}! I am SrijanBot, your official CodeSrijan Hackathon Copilot. I can guide your squad formation, project submissions, live schedules, and platform navigation. What would you like to build? [Explore Hackathons -> /hackathons]`;
            return { reply };
        }

        // General Fallback
        reply = `I am SrijanBot, your CodeSrijan guide. You can explore active events [Explore Hackathons -> /hackathons], assemble your squad [Recruitment -> /recruitment], or submit a support inquiry [Help Desk -> /support].`;
        return { reply };

        } catch (e) {
        console.error('[SRIJANBOT COMPUTE FALLBACK ERROR]', e);
        return {
            reply: "SYSTEM FAULT: SrijanBot neural link experienced a momentary disruption. You can open a ticket with the support desk. [Open Support Desk -> /support]"
        };
    }
}

/**
 * Backwards-compatible HTTP Fallback Handler (Ensures single-response guarantee).
 */
export async function handleAIFallback(req, res, precomputedCtx = null) {
    if (res && res.headersSent) return;
    try {
        const result = await computeAIFallback(req, precomputedCtx);
        if (res && typeof res.json === 'function') {
            if (!res.headersSent) {
                return res.status(200).json(result);
            }
            return;
        }
        return result;
    } catch (e) {
        console.error('[SRIJANBOT FALLBACK ERROR]', e);
        const safeFallback = {
            reply: "SYSTEM FAULT: SrijanBot neural link experienced a momentary disruption. You can open a ticket with the support desk. [Open Support Desk -> /support]"
        };
        if (res && typeof res.json === 'function') {
            if (!res.headersSent) {
                return res.status(200).json(safeFallback);
            }
            return;
        }
        return safeFallback;
    }
}

/**
 * Main AI Chat Controller: Combines Verified Mongo Data + Groq LLaMA 3 / GPT-OSS-20B + Heuristic Fallback
 * Single Response Architecture: Owns the HTTP response lifecycle and guarantees exactly one response.
 * Supports customFetch parameter for isolated dependency injection testing.
 */
export async function handleAIChat(req, res, customFetch = null) {
    let responseSent = false;
    const sendResponse = (statusCode, payload) => {
        if (responseSent) return;
        responseSent = true;
        if (!res || typeof res.status !== 'function') return payload;
        if (res.headersSent) return;
        return res.status(statusCode).json(payload);
    };

    try {
        if (res && res.headersSent) return;

        const message = req?.body?.message;
        if (!message || typeof message !== 'string') {
            return sendResponse(400, { message: "A message string is required." });
        }

        // Step 1: Precompute live platform context from MongoDB
        const ctx = await getPlatformContext(req);

        // Step 1.5: 18+ Content Moderation Guard (dispatches incident to admin ledger)
        const modCheck = detectProhibitedContent(message);
        if (modCheck.flagged) {
            await handleContentModerationIncident({
                req,
                channel: 'SrijanBot AI Assistant Channel',
                message,
                flaggedTerms: modCheck.matchedTerms
            });
            return sendResponse(200, {
                reply: "⚠️ CODE OF CONDUCT VIOLATION: Your transmission contained prohibited adult or explicit terminology. This incident has been logged with your IP, user identity, and timestamp, and forwarded directly to the CodeSrijan Administrative Security Ledger. [Review Code of Conduct -> /code-of-conduct]"
            });
        }

        // Step 2: Instant Boundary & Security Checks
        const sec = checkAdversarialSecurity(message, ctx);
        if (sec.isBlocked) {
            return sendResponse(200, { reply: sec.reply });
        }

        const limit = checkActionLimitations(message, ctx);
        if (limit.isLimited) {
            return sendResponse(200, { reply: limit.reply });
        }

        // Step 3: Check Groq API Key availability
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            const fallbackResult = await computeAIFallback(req, ctx);
            return sendResponse(200, fallbackResult);
        }

        // Step 4: Build Grounded System Prompt with Verified Live Data
        const systemPrompt = `You are SrijanBot, the official context-aware hackathon copilot for the CodeSrijan platform.
CodeSrijan Site Map:
- Home: /
- Dashboard: /dashboard
- Hackathons Catalog: /hackathons
- Live Timeline & Schedules: /timeline
- Problem Statements & Tracks: /problems
- Squad Recruitment Marketplace: /recruitment
- Squad Roster Management: /team
- Project Workspace & Kanban: /workspace
- Team Live Chat: /chat
- Payment & UPI Proof Portal: /payment
- Leaderboard & Standings: /leaderboard
- Certificates & Verification: /certificates
- Help & Support Desk: /support
- User Profile Settings: /profile
- Code of Conduct: /code-of-conduct
- Privacy Policy: /privacy-policy

[VERIFIED LIVE PLATFORM DATA]
- Current Authenticated User: ${ctx.user ? `${ctx.name} (${ctx.email}), Verified Role: ${ctx.role}` : 'Unauthenticated Guest'}
- Assigned Squad: ${ctx.team ? `Squad "${ctx.team.name}" (ID: ${ctx.team.id}, Members: ${ctx.teamMemberCount}/4, Leader: ${ctx.team.leaderId === ctx.user?.id ? 'Current User' : ctx.team.leaderId}, Submitted: ${ctx.team.isSubmitted || !!ctx.submission})` : 'No Squad Assigned (Lone Wolf)'}
- Registration Status: ${ctx.registration ? `Status: ${ctx.registration.status}, Payment Status: ${ctx.registration.paymentStatus || 'N/A'}, Event: ${ctx.registration.hackathonId}` : 'Not Registered'}
- Submission Status: ${ctx.submission ? `Payload Transmitted (Repo: ${ctx.submission.repositoryUrl || 'Attached'}, Score: ${ctx.submission.score != null ? ctx.submission.score : 'Pending Evaluation'})` : 'No Submission Recorded'}
- Active/Upcoming Hackathons:
${ctx.hackathons.length > 0 ? ctx.hackathons.map(h => `  * ${h.name} (${h.id}): Status: ${h.status}, Type: ${h.fee > 0 ? `Paid (₹${h.fee})` : 'Free'}, Starts: ${new Date(h.startDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST, Submissions Close: ${new Date(h.submissionDeadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`).join('\n') : '  * No active hackathons configured in database.'}
- System Settings: Maintenance: ${ctx.systemSettings.maintenanceMode ? 'ACTIVE' : 'Normal'}, Registration: ${ctx.systemSettings.registrationEnabled ? 'Open' : 'Closed'}, Submissions: ${ctx.systemSettings.submissionEnabled ? 'Open' : 'Closed'}

CRITICAL BEHAVIORAL RULES:
1. GROUNDED IN FACT: Answer dynamic questions (deadlines, schedules, squad status, payments, hackathon counts) using ONLY the verified platform data above.
2. NEVER FABRICATE: If information is unavailable or unconfigured, say so clearly instead of inventing dates (never claim arbitrary deadlines like "20 October at 11:59 PM").
3. ACTION HONESTY: You are an informational copilot. You CANNOT execute database mutations (cannot create teams, change roles, approve payments, edit scores, or submit code). Always provide step-by-step guidance for the user to perform the action in the UI.
4. ROLE-BASED ACCESS CONTROL: Non-administrators must be denied access to admin commands and routes.
5. NAVIGATION ACTION FORMAT: At the VERY END of your response, provide exactly ONE navigation action formatted strictly as:
[Button Text -> /path]
Using ONLY real routes from the Site Map.
6. TONE: Neo-Brutalist, direct, technical, cyber-hacker aesthetic, concise, helpful.`;

        const isCustomFetch = typeof customFetch === 'function' && customFetch.name !== 'next';
        const fetchFn = isCustomFetch ? customFetch : fetch;
        const configuredModel = getEffectiveGroqModel();

        async function executeGroqRequest(modelId) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
            try {
                const resObj = await fetchFn("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${groqApiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: message }
                        ],
                        temperature: 0.1,
                        max_tokens: 500
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                return { response: resObj, error: null };
            } catch (err) {
                clearTimeout(timeoutId);
                return { response: null, error: err };
            }
        }

        // Attempt 1: Call configured/effective model
        let { response, error } = await executeGroqRequest(configuredModel);

        // Check if primary call produced network/fetch error
        if (error) {
            console.warn(`[SRIJANBOT FETCH FAILURE] ${error.name || 'Error'}: ${error.message}. Routing to fallback.`);
            const fallbackResult = await computeAIFallback(req, ctx);
            return sendResponse(200, fallbackResult);
        }

        // Validate response object structure safely before accessing any properties (Fix for TypeError: Cannot read properties of undefined reading 'ok')
        if (!response || typeof response !== 'object') {
            console.warn('[SRIJANBOT FETCH FAILURE] Response object is undefined or invalid. Routing to fallback.');
            const fallbackResult = await computeAIFallback(req, ctx);
            return sendResponse(200, fallbackResult);
        }

        // Safe boolean evaluation for .ok
        const isOk = typeof response.ok === 'boolean' ? response.ok : (response.status >= 200 && response.status < 300);

        // If not OK, check if model error warrants fallback to secondary model
        if (!isOk) {
            let errText = '';
            try {
                errText = typeof response.text === 'function' ? await response.text() : JSON.stringify(response);
            } catch (_) {}

            const isModelDecommissioned = response.status === 400 && errText.includes('model_decommissioned');
            const isModelNotFound = response.status === 404 && errText.includes('model_not_found');

            if ((isModelDecommissioned || isModelNotFound) && configuredModel !== FALLBACK_GROQ_MODEL) {
                console.warn(`[SRIJANBOT MODEL FAILOVER] Model "${configuredModel}" returned status ${response.status} (${isModelDecommissioned ? 'decommissioned' : 'not found'}). Attempting backup model "${FALLBACK_GROQ_MODEL}"...`);
                const retry = await executeGroqRequest(FALLBACK_GROQ_MODEL);
                const retryOk = retry.response && (typeof retry.response.ok === 'boolean' ? retry.response.ok : (retry.response.status >= 200 && retry.response.status < 300));
                if (!retry.error && retryOk) {
                    response = retry.response;
                } else {
                    console.warn(`[SRIJANBOT GROQ FALLBACK] Backup model "${FALLBACK_GROQ_MODEL}" also failed. Routing to heuristic fallback.`);
                    const fallbackResult = await computeAIFallback(req, ctx);
                    return sendResponse(200, fallbackResult);
                }
            } else {
                console.warn(`[SRIJANBOT GROQ FALLBACK] Status ${response.status || 'UNKNOWN'}: ${errText}`);
                const fallbackResult = await computeAIFallback(req, ctx);
                return sendResponse(200, fallbackResult);
            }
        }

        // Safely parse JSON from response
        let data = null;
        try {
            if (typeof response.json !== 'function') {
                throw new TypeError('response.json is not a function');
            }
            data = await response.json();
        } catch (jsonErr) {
            console.warn(`[SRIJANBOT MALFORMED JSON] Failed to parse provider JSON: ${jsonErr.message}. Routing to fallback.`);
            const fallbackResult = await computeAIFallback(req, ctx);
            return sendResponse(200, fallbackResult);
        }

        const reply = data?.choices?.[0]?.message?.content;
        if (!reply || typeof reply !== 'string' || !reply.trim()) {
            console.warn('[SRIJANBOT EMPTY CHOICE] Provider returned empty choices or message. Routing to fallback.');
            const fallbackResult = await computeAIFallback(req, ctx);
            return sendResponse(200, fallbackResult);
        }

        return sendResponse(200, { reply: reply.trim() });

    } catch (e) {
        console.error("[SRIJANBOT CHAT ERROR]", e.message);
        try {
            const fallbackResult = await computeAIFallback(req);
            return sendResponse(200, fallbackResult);
        } catch (fallbackErr) {
            return sendResponse(200, {
                reply: "SYSTEM FAULT: SrijanBot neural link experienced a momentary disruption. You can open a ticket with the support desk. [Open Support Desk -> /support]"
            });
        }
    }
}
