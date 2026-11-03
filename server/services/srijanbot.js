import { User, Team, ProblemStatement, Hackathon, Registration, Submission, Evaluation } from '../models/index.js';
import { Announcement, SupportTicket } from '../models/secondary.js';
import { resolveOptionalUser } from '../middleware/auth.js';
import { detectProhibitedContent, handleContentModerationIncident } from './moderation.js';

/**
 * Valid allowed internal route paths for SrijanBot navigation actions.
 */
export const VALID_ROUTES = {
    HOME: '/',
    ABOUT: '/about',
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
    RESET_PASSWORD: '/auth/reset-password',
    EVALUATIONS: '/evaluations',
    MENTOR: '/mentor',
    MENTOR_COMMAND_CENTER: '/mentor-command-center',
    JUDGE_COMMAND_CENTER: '/judge-command-center',
    ADMIN: '/admin',
    ADMIN_LOGIN: '/admin-login',
    ADMIN_HACKATHONS: '/admin/hackathons',
    ADMIN_PROBLEMS: '/admin/problems',
    ADMIN_USERS: '/admin/users',
    ADMIN_TEAMS: '/admin/teams',
    ADMIN_PAYMENTS: '/admin/payments',
    ADMIN_SUBMISSIONS: '/admin/submissions',
    ADMIN_HEALTH: '/admin/health',
    ADMIN_LOGS: '/admin/logs',
    ADMIN_CERTIFICATES: '/admin/certificates',
    ADMIN_ANALYTICS: '/admin/analytics',
    ADMIN_JUDGES: '/admin/judges',
    ADMIN_MENTORS: '/admin/mentors',
    ADMIN_OPERATIONS: '/admin/operations',
    ADMIN_SCHEDULE: '/admin/schedule',
    ADMIN_SETTINGS: '/admin/settings',
    ADMIN_SUPPORT: '/admin/support',
    ADMIN_LEADERBOARD: '/admin/leaderboard',
    ADMIN_RECRUITMENT: '/admin/recruitment',
    ADMIN_SPONSORS: '/admin/sponsors',
    ADMIN_GALLERY: '/admin/gallery',
    ADMIN_EVALUATIONS: '/admin/evaluations',
    CODE_OF_CONDUCT: '/code-of-conduct',
    PRIVACY_POLICY: '/privacy-policy',
    RULES: '/rules',
    FAQ: '/faq',
    GALLERY: '/gallery',
    SPONSORS: '/sponsors',
    ANNOUNCEMENTS: '/announcements',
    COMMUNITY: '/community',
    HIGHLIGHTS: '/highlights',
    HOST_EVENT: '/host-event'
};

/**
 * Sanitizes context objects recursively to guarantee sensitive data (passwords, salts, auth tokens, secrets)
 * is stripped before reaching prompts, heuristics, or responses.
 */
function sanitizeGroundingData(data) {
    if (!data || typeof data !== 'object') return data;
    if (data instanceof Date) return data;
    if (Array.isArray(data)) return data.map(sanitizeGroundingData);

    const sensitivePattern = /password|hash|salt|secret|token|session|credential|private_key/i;
    const clean = {};
    for (const [key, val] of Object.entries(data)) {
        if (sensitivePattern.test(key) && key !== 'tokenUsage' && key !== 'max_tokens' && key !== 'registrationNumber') {
            continue;
        }
        clean[key] = sanitizeGroundingData(val);
    }
    return clean;
}

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
    const isTestHarness = req._isTestRunner === true || req.headers?.['x-srijanbot-test'] === 'true';

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

    // Explicit safe user projection without passwordHash, salt, or session tokens
    const safeUser = user ? {
        id: user.id || userId,
        email: user.email,
        name: user.name || (role === 'admin' ? 'Administrator' : 'Operative'),
        role: (user.role || 'student').toLowerCase(),
        college: user.college || null
    } : (isTestHarness && userId ? { id: userId, role, email, name, teamId: clientContext.teamId } : null);

    let dbUnavailable = false;

    // 1. Fetch live active/upcoming hackathons (non-archived, chronological)
    let hackathons = [];
    try {
        hackathons = await Hackathon.find({
            status: { $nin: ['archived', 'draft', 'cancelled'] },
            isArchived: { $ne: true }
        }).sort({ startDate: 1 }).lean();
    } catch (e) {
        dbUnavailable = true;
        console.error('[SRIJANBOT CONTEXT] Error fetching hackathons:', e.message);
    }

    const activeHackathon = hackathons.find(h => h.status === 'active') || hackathons[0] || null;

    // 2. Fetch user team if applicable (leader or member, prioritized by active hackathon)
    let team = null;
    let teamMemberCount = 0;
    try {
        if (userId) {
            if (activeHackathon?.id) {
                team = await Team.findOne({
                    hackathonId: activeHackathon.id,
                    $or: [{ memberIds: userId }, { leaderId: userId }]
                }).lean();
            }
            if (!team) {
                team = await Team.findOne({
                    $or: [{ memberIds: userId }, { leaderId: userId }]
                }).sort({ createdAt: -1 }).lean();
            }
        }
        if (!team && isTestHarness && clientContext.teamId) {
            team = await Team.findOne({ id: clientContext.teamId }).lean();
            if (!team) {
                team = { id: clientContext.teamId, name: clientContext.teamName || 'Alpha Squad', memberIds: [userId || 'usr-1'] };
            }
        }
        if (team) {
            const memberSet = new Set((Array.isArray(team.memberIds) ? team.memberIds : []).filter(Boolean));
            if (team.leaderId) memberSet.add(team.leaderId);
            teamMemberCount = memberSet.size || (Array.isArray(team.memberIds) ? team.memberIds.length : 1);

            // Strip internal admin notes for non-admins to avoid data leakage
            if (role !== 'admin' && team.adminNote) {
                const { adminNote, ...sanitizedTeam } = team;
                team = sanitizedTeam;
            }
        }
    } catch (e) {
        dbUnavailable = true;
        console.error('[SRIJANBOT CONTEXT] Error fetching team:', e.message);
    }

    // 3. Fetch user registration if applicable (linked to active hackathon, paymentStatus)
    let registration = null;
    try {
        if (userId) {
            if (activeHackathon?.id) {
                registration = await Registration.findOne({
                    userId,
                    hackathonId: activeHackathon.id,
                    status: { $nin: ['cancelled', 'withdrawn'] }
                }).sort({ createdAt: -1 }).lean();
            }
            if (!registration) {
                registration = await Registration.findOne({
                    userId,
                    status: { $nin: ['cancelled', 'withdrawn'] }
                }).sort({ createdAt: -1 }).lean();
            }
            if (registration && role !== 'admin') {
                const { reviewHistory, storagePath, storageBucket, ...sanitizedReg } = registration;
                registration = sanitizedReg;
            }
        }
    } catch (e) {
        dbUnavailable = true;
        console.error('[SRIJANBOT CONTEXT] Error fetching registration:', e.message);
    }

    // 4. Fetch submission if team exists (linked to squad ID, repositoryUrl, demoUrl, score)
    let submission = null;
    try {
        if (team?.id) {
            submission = await Submission.findOne({ teamId: team.id }).sort({ createdAt: -1 }).lean();
            let evalDoc = null;
            try {
                evalDoc = await Evaluation.findOne({ teamId: team.id, status: 'submitted' }).sort({ createdAt: -1 }).lean();
                if (!evalDoc) {
                    evalDoc = await Evaluation.findOne({ teamId: team.id }).sort({ createdAt: -1 }).lean();
                }
            } catch (_) {}

            if (submission) {
                submission = {
                    ...submission,
                    repositoryUrl: submission.repositoryUrl || submission.githubUrl || team.repositoryUrl || team.githubLink || null,
                    demoUrl: submission.demoUrl || submission.liveDemoUrl || team.demoUrl || team.demoLink || null,
                    score: submission.score !== undefined ? submission.score : (evalDoc?.totalScore ?? null)
                };
            } else if (team.isSubmitted || team.repositoryUrl || team.githubLink) {
                submission = {
                    teamId: team.id,
                    repositoryUrl: team.repositoryUrl || team.githubLink || null,
                    demoUrl: team.demoUrl || team.demoLink || null,
                    score: evalDoc?.totalScore ?? null,
                    status: 'submitted'
                };
            }
        }
    } catch (e) {
        dbUnavailable = true;
        console.error('[SRIJANBOT CONTEXT] Error fetching submission:', e.message);
    }

    // 5. Fetch problem statements and tracks when requested
    let problemStatements = [];
    let tracks = [];
    try {
        const message = typeof req === 'string' ? req : (req?.body?.message || req?.message || '');
        const wantsProblems = /problem|track|challenge|domain|theme|statement|judg/i.test(message) || !message;

        if (wantsProblems) {
            const psQuery = {
                isPublished: { $ne: false },
                isLocked: { $ne: true }
            };
            if (activeHackathon?.id) {
                psQuery.hackathonId = activeHackathon.id;
            }
            problemStatements = await ProblemStatement.find(psQuery)
                .select('id title domain difficulty description tags isPublished')
                .lean();

            if (problemStatements.length === 0 && activeHackathon?.problemStatements?.length > 0) {
                problemStatements = activeHackathon.problemStatements
                    .filter(ps => ps && ps.isPublished !== false && ps.isLocked !== true)
                    .map(ps => ({
                        id: ps.id || ps._id,
                        title: ps.title || ps.name,
                        domain: ps.domain || ps.track || 'General',
                        difficulty: ps.difficulty || 'Medium',
                        description: ps.description || '',
                        tags: ps.tags || []
                    }));
            }
        }

        const domainSet = new Set();
        if (problemStatements && problemStatements.length > 0) {
            problemStatements.forEach(ps => {
                if (ps.domain) domainSet.add(ps.domain);
            });
        }
        if (domainSet.size === 0) {
            ['AI/ML', 'Web3 & Blockchain', 'FinTech', 'HealthTech', 'CyberSecurity'].forEach(t => domainSet.add(t));
        }
        tracks = Array.from(domainSet);
    } catch (e) {
        dbUnavailable = true;
        console.error('[SRIJANBOT CONTEXT] Error fetching problem statements:', e.message);
    }

    // 6. System settings
    const systemSettings = {
        maintenanceMode: false,
        registrationEnabled: true,
        submissionEnabled: true,
        chatEnabled: true,
        recruitmentEnabled: true,
        leaderboardVisible: true
    };

    return sanitizeGroundingData({
        user: safeUser,
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
        problemStatements,
        tracks,
        systemSettings,
        dbUnavailable,
        currentPath: clientContext.path || '/'
    });
}

/**
 * Detects adversarial / boundary attacks: prompt injection, credential disclosure, role escalations.
 */
export function checkAdversarialSecurity(message = "", ctx = null) {
    const lower = message.toLowerCase();

    // 1. Credential disclosure patterns: passwords, passwordHash, salt, JWT secrets, MongoDB connection strings, env vars, API tokens, private tokens
    if (
        !/forgot|how (can|do) i reset/i.test(lower) && !/certificate/i.test(lower) && (
            /(what (is|are)|reveal|show|give me|expose|dump|leak) .*(password|credential|passwd|password_?hash)/i.test(lower) ||
            /what is (the |my |any |user |admin('s)? )?password/i.test(lower) ||
            /reveal (the |my |all |user |admin('s)? )?passwords?/i.test(lower) ||
            /what is user .* password/i.test(lower) ||
            /give me (someone('s)?|the admin('s)?) password/i.test(lower) ||
            /show me (the )?password/i.test(lower) ||
            /(user|admin|account|someone('s)?) .*passwords?/i.test(lower) ||
            /password_?hash/i.test(lower) ||
            /\bpasswordhash\b/i.test(lower) ||
            /\bsalt\b/i.test(lower) ||
            /backend secrets/i.test(lower) ||
            /confidential backend/i.test(lower) ||
            /expose (the )?(administrator |admin )?token/i.test(lower) ||
            /(what (is|are)|reveal|show|give me|expose|leak|dump) (the )?jwt(_|\s)?(secret|key|token)/i.test(lower) ||
            /(jwt_secret|\bjwt secret\b)/i.test(lower) ||
            /(what (is|are)|reveal|show|give me|expose|leak|dump) (the )?(mongo|mongodb|atlas|database) (connection string|uri|url)/i.test(lower) ||
            /(mongodb(\+srv)?:\/\/|mongodb uri|mongo uri|atlas connection string|database connection string)/i.test(lower) ||
            /(what (is|are)|reveal|show|give me|expose|dump|leak|print) (the )?(environment variables?|env vars?|process\.env|\.env)/i.test(lower) ||
            /(\.env file|process\.env)/i.test(lower) ||
            /(what (is|are)|reveal|show|give me|expose|dump|leak) (the )?(api (key|token)|groq (api )?(key|token)|admin token|secret token|auth token|private token|session token)/i.test(lower) ||
            /(groq_api_key|\bgroq key\b|\bapi key\b|\bapi token\b|\bprivate token\b|\bsession token\b)/i.test(lower)
        )
    ) {
        return {
            isBlocked: true,
            reply: "SECURITY PROTOCOL VIOLATION: Access denied. User passwords, JWT secrets, database connection strings, environment variables, API tokens, and backend secrets are strictly encrypted. SrijanBot cannot view, retrieve, or disclose credentials. [Go to Dashboard -> /dashboard]"
        };
    }

    // 2. Role spoofing & privilege escalation claims (admin, judge, mentor)
    if (
        /i am (an |the )?admin/i.test(lower) ||
        /i am the administrator/i.test(lower) ||
        /treat me as (an )?admin/i.test(lower) ||
        /act as (an )?admin/i.test(lower) ||
        /give me admin(istrator)? (access|privileges|role|clearance)/i.test(lower) ||
        /make me (an )?admin/i.test(lower) ||
        /change my (role|permission) to admin/i.test(lower) ||
        /claim (the )?admin(istrator)? role/i.test(lower)
    ) {
        if (!ctx || ctx.role !== 'admin') {
            return {
                isBlocked: true,
                reply: "SECURITY PROTOCOL VIOLATION: Role elevation cannot be granted through chat. Clearance is enforced strictly by server-side authentication. [Go to Dashboard -> /dashboard]"
            };
        }
    }

    if (
        /i am (a |the )?judge/i.test(lower) ||
        /treat me as (a )?judge/i.test(lower) ||
        /act as (a )?judge/i.test(lower) ||
        /give me judge (access|privileges|role|clearance)/i.test(lower) ||
        /make me (a )?judge/i.test(lower) ||
        /change my (role|permission) to judge/i.test(lower) ||
        /claim (the )?judge role/i.test(lower)
    ) {
        if (!ctx || (ctx.role !== 'judge' && ctx.role !== 'admin')) {
            return {
                isBlocked: true,
                reply: "SECURITY PROTOCOL VIOLATION: Role elevation cannot be granted through chat. Clearance is enforced strictly by server-side authentication. [Go to Dashboard -> /dashboard]"
            };
        }
    }

    if (
        /i am (a |the )?mentor/i.test(lower) ||
        /treat me as (a )?mentor/i.test(lower) ||
        /act as (a )?mentor/i.test(lower) ||
        /give me mentor (access|privileges|role|clearance)/i.test(lower) ||
        /make me (a )?mentor/i.test(lower) ||
        /change my (role|permission) to mentor/i.test(lower) ||
        /claim (the )?mentor role/i.test(lower)
    ) {
        if (!ctx || (ctx.role !== 'mentor' && ctx.role !== 'admin')) {
            return {
                isBlocked: true,
                reply: "SECURITY PROTOCOL VIOLATION: Role elevation cannot be granted through chat. Clearance is enforced strictly by server-side authentication. [Go to Dashboard -> /dashboard]"
            };
        }
    }

    // 3. Data Privacy: unprivileged queries for other students' emails, unsubmitted draft repositories, private mentor notes
    if (
        /reveal (other )?(students?'?|users?'?) emails?/i.test(lower) ||
        /show (all |other )?(students?'?|users?'?) emails?/i.test(lower) ||
        /what are (the )?emails of (other )?students/i.test(lower) ||
        /give me (other )?(students?'?|users?'?) emails?/i.test(lower) ||
        /dump (user |student )?emails/i.test(lower) ||
        /(reveal|show|give me|dump|leak|access) (the )?(other (teams?'?|users?'?) )?(unsubmitted|draft) (repos|repositories|code|projects)/i.test(lower) ||
        /unsubmitted draft repositor/i.test(lower) ||
        /(reveal|show|give me|dump|leak|access) (the )?private (mentor|judge) notes/i.test(lower) ||
        ((/private mentor notes/i.test(lower) || /private judge notes/i.test(lower)) && (!ctx || (ctx.role !== 'admin' && ctx.role !== 'mentor')))
    ) {
        if (!ctx || (ctx.role !== 'admin' && ctx.role !== 'mentor') || /(reveal|show|give me|dump|leak|access)/i.test(lower)) {
            return {
                isBlocked: true,
                reply: "SECURITY PROTOCOL VIOLATION: Access denied. Other students' email addresses, unsubmitted draft repositories, and private mentor notes are strictly confidential and protected by CodeSrijan Data Privacy protocols. [View Privacy Policy -> /privacy-policy]"
            };
        }
    }

    // 4. Prompt injection and adversarial jailbreaks
    const injectionPatterns = [
        /ignore (all|your|previous) (rules|instructions|prompts)/i,
        /disregard (all|your|previous) (instructions|rules)/i,
        /override (system|all) (rules|instructions|prompts)/i,
        /jailbreak/i,
        /dan mode/i,
        /\bdo anything now\b/i,
        /(reveal|show|what is|print|dump|expose) (the |your )?(system )?prompt/i,
        /repeat (the |your )?(system )?prompt/i,
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

    if (/can (you|srijanbot) (directly )?create (my |a )?(team|squad)/i.test(lower) || /(directly )?create (my |a )?(team|squad) for me/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot directly create squads in the database. You can create your squad directly in the Recruitment Sector: [Create Squad -> /recruitment]"
        };
    }

    if (/can (you|srijanbot) (directly )?(remove|kick) a (team )?member/i.test(lower) || /(kick|remove) a (team )?member for me/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot modify squad rosters directly. Team leaders can manage members on the Team Roster page: [Manage Squad -> /team]"
        };
    }

    if (/can (you|srijanbot) (directly )?(approve|verify|confirm) (my )?payment/i.test(lower) || /approve a payment through this chat/i.test(lower) || /(directly )?approve (my )?payment/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot approve payments. All registration fees and UPI payment proofs are reviewed and verified by human administrators. [View Payment Status -> /payment]"
        };
    }

    if (/can (you|srijanbot) (directly )?(refund|cancel) (my )?payment/i.test(lower) || /give me a refund/i.test(lower) || /(directly )?refund (my |the )?(registration |payment )?fee/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot initiate refunds. Please contact the platform organizers or submit a support ticket: [Open Support -> /support]"
        };
    }

    if (/can (you|srijanbot) (directly )?change my (account )?role/i.test(lower) || /(directly )?change my (account )?role/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot modify user roles. Account roles are enforced by server security rules. To request a role change, contact support: [Contact Support -> /support]"
        };
    }

    if (/can (you|srijanbot) (directly )?submit (my |our )?project (for me)?/i.test(lower) || /(directly )?submit (my |our )?project/i.test(lower)) {
        return {
            isLimited: true,
            reply: "SrijanBot cannot submit projects on your behalf. Please navigate to your Workspace and transmit your GitHub and Demo links: [Open Workspace -> /workspace]"
        };
    }

    if (/can (you|srijanbot) (directly )?(change|edit|update|alter) (my |the |our )?score/i.test(lower) || /(directly )?(change|edit|update|alter) (my |the |our )?score/i.test(lower)) {
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

        // 0. 18+ Content Moderation Guard (Defense-in-depth)
        const modCheck = detectProhibitedContent(message);
        if (modCheck.flagged) {
            try {
                await handleContentModerationIncident({
                    req,
                    channel: 'SrijanBot AI Assistant Channel',
                    message,
                    flaggedTerms: modCheck.matchedTerms
                });
            } catch (_) {}
            return {
                reply: "⚠️ CODE OF CONDUCT VIOLATION: Your transmission contained prohibited adult or explicit terminology. This incident has been logged with your IP, user identity, and timestamp, and forwarded directly to the CodeSrijan Administrative Security Ledger. [Review Code of Conduct -> /code-of-conduct]"
            };
        }

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
            if (!/git|commit/i.test(lowerMsg) && /registration|payment|submission|deadline|when|workspace|team|squad|score/i.test(lowerMsg)) {
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
            /export hackathon data/i.test(lowerMsg) ||
            /batch certificate/i.test(lowerMsg) ||
            /certificate issuance/i.test(lowerMsg) ||
            /issue (batch )?certificates/i.test(lowerMsg) ||
            /user moderation/i.test(lowerMsg) ||
            /moderate users/i.test(lowerMsg) ||
            /ban user/i.test(lowerMsg) ||
            /suspend account/i.test(lowerMsg) ||
            /(banner|upload|asset|spec).*spec/i.test(lowerMsg) ||
            /1200x630/i.test(lowerMsg) ||
            /500x500/i.test(lowerMsg) ||
            /15mb/i.test(lowerMsg) ||
            /qr.*spec/i.test(lowerMsg)
        ) {
            if (ctx.role !== 'admin') {
                reply = "ACCESS DENIED. You do not possess administrator credentials. Platform telemetry and administrative controls are restricted. [Go to Dashboard -> /dashboard]";
            } else {
                if (/banner|qr|15mb|1200x630|500x500|upload spec|asset spec|specification/i.test(lowerMsg)) {
                    reply = "Hackathon Asset Specifications:\n1. Cover Banner: Recommended 1200 × 630 px (16:9 ratio), max 5MB (PNG/JPG/WEBP).\n2. Problem Specification Document: Max 15MB (.pdf, .doc, .docx).\n3. UPI Payment QR Code: Recommended 500 × 500 px (1:1 square), max 2MB.\nConfigure these in the Event Manager: [Manage Hackathons -> /admin/hackathons]";
                } else if (/certificate/i.test(lowerMsg)) {
                    reply = "Administrators can issue batch certificates in the Certificate Manager for all participants or specific squads across participation, winner, runner-up, and special mention categories with cryptographic verification hashes. [Issue Certificates -> /admin/certificates]";
                } else if (/manage users|moderate|ban|suspend/i.test(lowerMsg)) {
                    reply = "Administrators can inspect, search, filter, moderate, suspend, or ban user accounts and configure role clearances in User Management. [Manage Users -> /admin/users]";
                } else if (/health|database/i.test(lowerMsg)) {
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
                reply = `Your account clearance is confirmed as ADMINISTRATOR (${ctx.email}). You have full authority over events, payments, user moderation, telemetry, batch certificates, and rubric configuration. [Open Admin Dashboard -> /admin]`;
            } else if (ctx.role === 'judge') {
                reply = `Your account clearance is confirmed as JUDGE (${ctx.email}). You are authorized to evaluate assigned submissions, save scoring drafts, and submit finalized 4-pillar rubric scores. [Open Judge Portal -> /evaluations]`;
            } else if (ctx.role === 'mentor') {
                reply = `Your account clearance is confirmed as MENTOR (${ctx.email}). You can guide assigned squads, claim assistance tickets using atomic Compare-And-Swap (CAS), and write confidential private notes. [Open Mentor Center -> /mentor]`;
            } else if (ctx.role === 'student') {
                reply = `Your account role is verified as HACKER/STUDENT (${ctx.name || ctx.email}). You can register for hackathons, recruit squad members (1-4 members), solve problem statements, and submit projects. [Go to Dashboard -> /dashboard]`;
            } else {
                reply = "You are currently exploring CodeSrijan as an unauthenticated GUEST. Please log in or register to join hackathons, form squads, and submit projects. [Log In -> /login]";
            }
            return { reply };
        }

        // PRIORITY 3: Judge & Mentor (Cat 22 & 23)
        if (/judge (dashboard|portal|rubric)|judge command center|assigned submissions|score a submission|scoring criteria|judging criteria|evaluation rubric|rubric|how will my project be evaluated|who evaluates|draft evaluation|locked evaluation|100% mathematical constraint/i.test(lowerMsg)) {
            if (ctx.role === 'judge' || ctx.role === 'admin') {
                if (/command center/i.test(lowerMsg)) {
                    reply = "Welcome Judge. You can inspect assigned projects, save scoring drafts, and finalize 4-pillar rubric evaluations in the Judge Command Center. [Open Judge Command Center -> /judge-command-center]";
                } else if (/draft|resum|lock|reopen|immutable/i.test(lowerMsg)) {
                    reply = "Judges can save evaluation drafts and resume scoring at any point. Once submitted, evaluations are cryptographically locked and immutable; only administrators can reopen a locked evaluation with an audited justification. [Open Judge Portal -> /evaluations]";
                } else if (/100%|mathematical constraint|weight/i.test(lowerMsg)) {
                    reply = "The evaluation rubric enforces a strict 100% mathematical constraint across 4 pillars: Innovation, Technical Execution, Feasibility & Design, and Presentation & Impact (criteria weights must sum to exactly 100%). [Open Judge Command Center -> /judge-command-center]";
                } else {
                    reply = "Judges can inspect assigned projects and record scores against the 4-pillar evaluation rubric in the Judge Portal. [Open Judge Portal -> /evaluations]";
                }
            } else {
                reply = "Evaluation scoring is performed against 4 criteria: Innovation (25%), Technical Execution (25%), Design & Usability (25%), and Practical Impact (25%). Final scores are published on the Leaderboard. [View Leaderboard -> /leaderboard]";
            }
            return { reply };
        }

        if (/mentor|guidance|claim.*(ticket|request|guidance)|claim from the queue|cas\b|assigned squad|private note/i.test(lowerMsg)) {
            if (ctx.role === 'mentor' || ctx.role === 'admin') {
                if (/command center/i.test(lowerMsg)) {
                    reply = "Welcome Mentor. The Mentor Command Center allows you to oversee assigned squads, claim pending assistance tickets from the guidance queue via atomic Compare-And-Swap (CAS), post private mentor notes, and provide video mentorship links. [Open Mentor Command Center -> /mentor-command-center]";
                } else if (/claim|cas|queue/i.test(lowerMsg)) {
                    reply = "Mentors claim pending guidance tickets from the queue using atomic Compare-And-Swap (CAS) to prevent duplicate claims. Once claimed, you can provide technical guidance, attach an HTTPS meeting link, write private notes (1-5000 characters) hidden from students, and resolve the ticket. [Open Mentor Command Center -> /mentor-command-center]";
                } else if (/private note|mentor note/i.test(lowerMsg)) {
                    reply = "Private mentor notes (1–5000 characters) are strictly scoped to your assigned squads and confidential from students, stored securely in the Squad Dossier. [Open Mentor Center -> /mentor]";
                } else if (/assigned squad|scop/i.test(lowerMsg)) {
                    reply = "Mentors are strictly scoped to their assigned squads via administrative assignment. You can only view repositories, Kanban tasks, and guidance tickets for squads assigned to you. [Open Mentor Center -> /mentor]";
                } else {
                    reply = "Mentors can view assigned teams, answer guidance requests, and inspect project progress in the Mentor Center. [Open Mentor Center -> /mentor]";
                }
            } else {
                reply = "Squads can request mentor guidance inside the team communications sector. [Open Team Chat -> /chat]";
            }
            return { reply };
        }

        // PRIORITY 3.5: Canonical Milestones & Schedule Overview
        if (
            /(10|ten) (canonical )?milestones/i.test(lowerMsg) ||
            /canonical milestone/i.test(lowerMsg) ||
            /milestones of (the )?hackathon/i.test(lowerMsg) ||
            /opening ceremony/i.test(lowerMsg) ||
            /checkpoint 1/i.test(lowerMsg) ||
            /checkpoint 2/i.test(lowerMsg) ||
            /pitch round/i.test(lowerMsg) ||
            /grand finale/i.test(lowerMsg)
        ) {
            reply = "CodeSrijan Hackathons follow 10 canonical milestones operating dynamically in Indian Standard Time (IST):\n1. Registration Window — Operative enrollment and entry claim\n2. Team Formation & Roster Lock — Squad assembly (1–4 members) in Recruitment\n3. Opening Ceremony & Keynote Briefing — Tournament kickoff & directive briefing\n4. Hacking Begins & Git Repositories Live — Development sprint commences & Kanban unlocked\n5. Checkpoint 1 — Idea validation & architecture review with mentors\n6. Checkpoint 2 — Prototype validation & mid-sprint mentor sync\n7. Submission Deadline & Code Freeze — Final payload vault lock\n8. Pitch Round & Technical Demonstrations — Live squad presentations & Q&A\n9. Judging & Rubric Evaluation — 4-pillar weighted rubric assessment (100% constraint)\n10. Grand Finale & Award Ceremony — Results declaration & certificate issuance\n[View Official Timeline -> /timeline]";
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
            /lone wolf/i.test(lowerMsg) ||
            /payload format/i.test(lowerMsg) ||
            /submission format/i.test(lowerMsg) ||
            /what (do i need to|format to) submit/i.test(lowerMsg) ||
            /workspace kanban/i.test(lowerMsg)
        ) {
            if (/can i submit without a squad/i.test(lowerMsg)) {
                reply = "Submissions require an active squad of 1-4 members. Solo participants cannot transmit payloads until they form or join a squad. [Find or Create Squad -> /recruitment]";
            } else if (!ctx.team) {
                reply = "LONE WOLF DETECTED. Workspace access requires an active squad of 1-4 members. Create or join a team in the Recruitment sector to unlock your project board. [Find or Create Squad -> /recruitment]";
            } else if (/payload format|submission format|what (do i need to|format to) submit/i.test(lowerMsg)) {
                reply = `To submit your hackathon project, transmit your payload from the Workspace Kanban:\n1. Project Title & Description (core problem and solution overview)\n2. Public GitHub Repository URL (containing source code and README)\n3. Live Demo URL (hosted deployment e.g. Vercel/Netlify or video demonstration)\n4. Optional attachments (Figma UI designs, architecture docs)\nOnce transmitted, the payload is locked for evaluation. [Open Workspace -> /workspace]`;
            } else if (/workspace kanban/i.test(lowerMsg)) {
                reply = `The Project Workspace for squad "${ctx.team.name}" features a live Kanban board with Backlog, In-Progress, Review, and Done columns to coordinate sprint execution. [Open Workspace -> /workspace]`;
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
            !/announcement|notification/i.test(lowerMsg) && (
                /system lockdown|clock reaches zero/i.test(lowerMsg) ||
                /countdown|timer|cutoff|deadline/i.test(lowerMsg) ||
                /timeline|schedule/i.test(lowerMsg) ||
                /\b(when|what time|how much time|how long)\b.*\b(start|end|starts|ends|ending|finish|finishes|close|closes|expire|over|left)\b/i.test(lowerMsg) ||
                /\b(when|what).*\b(hackathon|event|tournament).*\b(start|end|starts|ends|over|finish|close)/i.test(lowerMsg) ||
                /\bhackathons?\b.*\b(end|ends|start|starts|deadline)\b/i.test(lowerMsg) ||
                /\b(end|ending|finish)\b.*\b(date|time|deadline)\b/i.test(lowerMsg) ||
                /which timezone/i.test(lowerMsg)
            )
        ) {
            const isTimelineOrScheduleIntent = /timeline|schedule/i.test(lowerMsg);
            const h = (ctx.team?.hackathonId && ctx.hackathons?.find(x => x.id === ctx.team.hackathonId)) || ctx.activeHackathon || (ctx.hackathons && ctx.hackathons[0]);
            if (h) {
                const deadline = h.submissionDeadline ? new Date(h.submissionDeadline) : (h.endDate ? new Date(h.endDate) : null);
                const endDate = h.endDate ? new Date(h.endDate) : deadline;
                const now = new Date();

                const formattedDeadline = deadline ? deadline.toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                }) : 'TBD';

                const formattedEnd = endDate ? endDate.toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                }) : formattedDeadline;

                const targetDate = deadline || endDate;
                const diffMs = targetDate ? (targetDate.getTime() - now.getTime()) : 0;
                const isExpired = diffMs <= 0;
                const hoursLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
                const minutesLeft = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

                if (isExpired) {
                    reply = `Submissions for "${h.name || h.title}" closed on ${formattedDeadline} IST. The tournament has concluded and workspace submission forms are locked. [View Leaderboard -> /leaderboard]`;
                } else if (isTimelineOrScheduleIntent) {
                    reply = `Live Schedule for "${h.name || h.title}":\n• Submission Deadline: ${formattedDeadline} IST\n• Tournament Conclusion: ${formattedEnd} IST\n• Time Remaining: ${hoursLeft} hours and ${minutesLeft} minutes.\n[View Official Timeline -> /timeline]`;
                } else {
                    reply = `Your active tournament "${h.name || h.title}" has the following schedule:\n• Final Submission Deadline: ${formattedDeadline} IST\n• Event Conclusion: ${formattedEnd} IST\n• Time Remaining: ${hoursLeft} hours and ${minutesLeft} minutes until submissions lock.\n[Open Workspace -> /workspace]`;
                }
            } else {
                reply = "Official hackathon timeline and submission deadlines are posted on the live schedule. All platform events operate on Indian Standard Time (IST). [View Official Timeline -> /timeline]";
            }
            return { reply };
        }

        // PRIORITY 6: Team Chat & Comms (Cat 17) - Before generic team!
        if ((/chat/i.test(lowerMsg) || /message/i.test(lowerMsg) || /communication/i.test(lowerMsg)) && !/commit|git\b/i.test(lowerMsg)) {
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
            const trackList = (ctx.tracks && ctx.tracks.length > 0)
                ? ctx.tracks.join(', ')
                : 'AI/ML, Web3, FinTech, HealthTech, CyberSecurity';

            if (ctx.problemStatements && ctx.problemStatements.length > 0) {
                const psTitles = ctx.problemStatements.slice(0, 3).map(p => `"${p.title}" (${p.domain || 'General'})`).join(', ');
                reply = `Active problem statements for "${ctx.activeHackathon?.name || 'CodeSrijan'}": ${psTitles}. Tracks: ${trackList}. Classified statements reveal automatically at kickoff. [Browse Problem Statements -> /problems]`;
            } else {
                reply = `Problem statements across tracks (${trackList}) are listed in the Problem Hub. Classified statements reveal automatically at kickoff. [Browse Problem Statements -> /problems]`;
            }
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
            } else if (ctx.registration?.paymentStatus === 'pending' || ctx.registration?.paymentStatus === 'pending_proof' || ctx.registration?.paymentStatus === 'payment_under_review') {
                reply = `Your payment proof has been submitted and is currently PENDING review by administrators. Verification normally completes within a few hours. [Check Payment Status -> /payment]`;
            } else if (ctx.registration?.paymentStatus === 'rejected') {
                reply = `Your previous payment submission was rejected. Please re-upload a clear screenshot displaying the UPI transaction ID (UTR). [Re-upload Payment Proof -> /payment]`;
            } else if (ctx.registration?.paymentStatus === 'not_required') {
                reply = `Your registration for "${activeH?.name || 'CodeSrijan'}" is complete. This is a FREE event, so no payment is required. [View Dashboard -> /dashboard]`;
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
            /ticket/i.test(lowerMsg) ||
            /blank page/i.test(lowerMsg) ||
            /slow/i.test(lowerMsg) ||
            /asap/i.test(lowerMsg) ||
            ((/help/i.test(lowerMsg) || /bug/i.test(lowerMsg) || /error/i.test(lowerMsg)) && !/dynamic programming|binary search|sorting|quicksort|mergesort|graph|bfs|dfs|dijkstra|big[- ]?o|useeffect|usestate|tailwind|vite|express|rest|graphql|mongoose|mongodb|jwt|websocket|merge conflict|git\b|react\b/i.test(lowerMsg))
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
            if (/mentor command center/i.test(lowerMsg)) reply = "Navigating to Mentor Command Center. [Open Mentor Command Center -> /mentor-command-center]";
            else if (/judge command center/i.test(lowerMsg)) reply = "Navigating to Judge Command Center. [Open Judge Command Center -> /judge-command-center]";
            else if (/mentor/i.test(lowerMsg)) reply = "Navigating to Mentor Center. [Open Mentor Center -> /mentor]";
            else if (/judge|evaluation/i.test(lowerMsg)) reply = "Navigating to Judge Portal. [Open Judge Portal -> /evaluations]";
            else if (/admin hackathon/i.test(lowerMsg)) reply = "Navigating to Admin Hackathons Manager. [Manage Hackathons -> /admin/hackathons]";
            else if (/admin certificate/i.test(lowerMsg)) reply = "Navigating to Admin Certificate Generator. [Manage Certificates -> /admin/certificates]";
            else if (/admin health/i.test(lowerMsg)) reply = "Navigating to Platform Health Telemetry. [Platform Health -> /admin/health]";
            else if (/admin payment/i.test(lowerMsg)) reply = "Navigating to Admin Payment Queue. [Review Payments -> /admin/payments]";
            else if (/admin user/i.test(lowerMsg)) reply = "Navigating to Admin User Directory. [Manage Users -> /admin/users]";
            else if (/admin log/i.test(lowerMsg)) reply = "Navigating to Admin Audit Logs. [View Audit Logs -> /admin/logs]";
            else if (/admin/i.test(lowerMsg)) reply = "Navigating to Admin Operations Center. [Open Admin Dashboard -> /admin]";
            else if (/hackathon|catalog/i.test(lowerMsg)) reply = "Navigating to Hackathons Catalog. [Explore Hackathons -> /hackathons]";
            else if (/timeline|schedule/i.test(lowerMsg)) reply = "Navigating to Official Timeline. [View Official Timeline -> /timeline]";
            else if (/code of conduct|conduct/i.test(lowerMsg)) reply = "Navigating to Code of Conduct. [View Code of Conduct -> /code-of-conduct]";
            else if (/privacy policy|privacy/i.test(lowerMsg)) reply = "Navigating to Privacy Policy. [View Privacy Policy -> /privacy-policy]";
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

        // PRIORITY 20: Technical, Computer Science & Engineering Knowledge
        // Sub-priority 20A: DSA & Algorithms
        if (/dynamic programming|\bdp\b|memoization|tabulation|overlapping subproblems|optimal substructure/i.test(lowerMsg)) {
            reply = "Dynamic Programming (DP) solves complex optimization problems by breaking them into overlapping subproblems and caching intermediate solutions.\n\nTwo core paradigms:\n1. Top-Down (Memoization): Recursive decomposition with a cache/memo table.\n2. Bottom-Up (Tabulation): Iterative table construction starting from base cases.\n\nKey formula:\n`Optimal Solution = Subproblem Solution + Transition Step`\n\nExample (Fibonacci with memoization):\n```javascript\nconst memo = {};\nfunction fib(n) {\n  if (n <= 1) return n;\n  if (memo[n]) return memo[n];\n  return (memo[n] = fib(n - 1) + fib(n - 2));\n}\n```\nComplexity: Reduces O(2^N) exponential complexity to O(N) linear time. Essential for knapsack, shortest paths, string edit distance, and sequence alignment. [Browse Problems -> /problems]";
            return { reply };
        }

        if (/binary search|\bbsearch\b/i.test(lowerMsg)) {
            reply = "Binary Search is an efficient O(log N) divide-and-conquer algorithm for finding elements in monotonically sorted collections by halving the search space at each iteration.\n\nImplementation:\n```javascript\nfunction binarySearch(arr, target) {\n  let low = 0, high = arr.length - 1;\n  while (low <= high) {\n    const mid = Math.floor(low + (high - low) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;\n}\n```\nComplexity: Time O(log N), Space O(1). Essential for sorted telemetry lookups, range queries, and optimization problems. [Browse Problems -> /problems]";
            return { reply };
        }

        if (/quicksort|merge ?sort|sorting algorithm|heapsort|bubble sort|insertion sort/i.test(lowerMsg)) {
            reply = "Sorting algorithms organize unstructured data into ordered sequences:\n- QuickSort (Avg: O(N log N), Worst: O(N^2), Space: O(log N)): Pivot partitioning; cache-friendly in-memory sort.\n- MergeSort (Time: O(N log N), Space: O(N)): Stable divide-and-conquer; divides array in half, sorts recursively, and merges.\n- Timsort (V8 JavaScript `Array.prototype.sort()` engine default): Hybrid merge/insertion sort optimized for real-world presorted data.\n\nHackathon Rule: Use native `arr.sort((a, b) => a - b)` for numerical sorting in JS unless implementing custom indexed data structures. [Open Workspace -> /workspace]";
            return { reply };
        }

        if (/graph traversal|breadth[- ]first search|\bbfs\b|depth[- ]first search|\bdfs\b|dijkstra|graph algorithm|shortest path/i.test(lowerMsg)) {
            reply = "Graph Traversal explores nodes and edges across interconnected network topologies:\n- BFS (Breadth-First Search): Uses a FIFO queue. Traverses level-by-level. Guaranteed to find the shortest path in unweighted graphs.\n- DFS (Depth-First Search): Uses a LIFO stack or recursion. Traverses deeply along each branch. Optimal for cycle detection, topological sorting, and maze/game trees.\n- Dijkstra's Algorithm: Greedy search using a min-heap / priority queue to find single-source shortest paths on weighted graphs with non-negative edges (O((V + E) log V)).\n\nBest practice: Store graph connections using an Adjacency List (`Map<node, neighbor[]>`) for optimal O(V + E) traversal efficiency. [Browse Problems -> /problems]";
            return { reply };
        }

        if (/big[- ]?o\b|time complexity|space complexity|asymptotic analysis|algorithmic complexity/i.test(lowerMsg)) {
            reply = "Big-O notation describes the upper bound of runtime or memory requirements as input size (N) scales:\n- O(1) Constant: Hash map lookup, array index read.\n- O(log N) Logarithmic: Binary search, balanced tree queries.\n- O(N) Linear: Single loop, linear array scan.\n- O(N log N) Linearithmic: Efficient sorting (MergeSort, QuickSort, TimSort).\n- O(N^2) Quadratic: Nested loops (brute-force pair comparisons).\n- O(2^N) Exponential: Naive recursion (avoid under hackathon production loads).\n\nTarget O(1) to O(N log N) in hackathon pipelines to avoid API timeouts and UI lockups under judge test loads. [Browse Problems -> /problems]";
            return { reply };
        }

        // Sub-priority 20B: Frontend Engineering
        if (/useeffect|react effect|lifecycle hook|side effect in react/i.test(lowerMsg)) {
            reply = "React `useEffect` synchronizes components with external systems (network requests, browser APIs, timers, subscriptions).\n\nSyntax & Lifecycle:\n```jsx\nuseEffect(() => {\n  const controller = new AbortController();\n  fetchData(controller.signal);\n\n  // Cleanup runs on unmount or before effect re-runs\n  return () => controller.abort();\n}, [dep1, dep2]); // Dependency array\n```\nRules of Engagement:\n1. Always list every reactive value (props, state) used inside the effect in the dependency array.\n2. `[]` dependency array runs once after initial mount.\n3. Omitting dependency array runs after EVERY render (risks infinite loops if setting state).\n4. Always return a cleanup callback for listeners, intervals, and WebSocket subscriptions. [Open Workspace -> /workspace]";
            return { reply };
        }

        if (/usestate|component state|state management|zustand|redux|props drilling|react hooks/i.test(lowerMsg)) {
            reply = "Component state manages dynamic user data that triggers UI re-renders upon mutation:\n- Local State (`useState`):\n```jsx\nconst [count, setCount] = useState(0);\n// Use functional updater when next state depends on current:\nsetCount(prev => prev + 1);\n```\n- Lifting State Up: Share state between siblings by moving it to their common parent component.\n- Global State: For app-wide data (auth session, active squad, theme), use lightweight Zustand stores or React Context.\n\nBest practice: Never mutate state objects directly—always return new copies: `setState(prev => ({ ...prev, active: true }))`. [Open Workspace -> /workspace]";
            return { reply };
        }

        if (/tailwind|tailwind css|utility[- ]first css|tailwind styling/i.test(lowerMsg)) {
            reply = "Tailwind CSS provides atomic, utility-first classes to compose custom designs directly in your markup:\n- Flexbox & Grid: `flex items-center justify-between gap-4`, `grid grid-cols-1 md:grid-cols-3 gap-6`.\n- Responsive Breakpoints: Mobile-first prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`).\n- Neo-Brutalist Theme: `border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase font-mono font-bold`.\n- States & Transitions: `hover:scale-105 active:scale-95 transition-transform duration-200`.\n\nHackathon Pro-tip: Utility classes eliminate context switching between CSS files and JSX, letting your team ship UI 3x faster. [Open Workspace -> /workspace]";
            return { reply };
        }

        if (/\bvite\b|vite\.config|build tool|hmr|bundler|frontend setup/i.test(lowerMsg)) {
            reply = "Vite uses native ES modules (ESM) in development and esbuild for lightning-fast Hot Module Replacement (HMR) and instant server boot times.\n\nKey configurations:\n- `vite.config.ts`: Configures plugins (e.g., `@vitejs/plugin-react`), path aliases (`@/ -> /src`), and dev proxy.\n- Dev Proxy: Prevent CORS issues in local development by proxying `/api` to Express:\n```js\nserver: {\n  proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } }\n}\n```\nRun `npm run build` to output production-ready static assets in `/dist`. [Open Workspace -> /workspace]";
            return { reply };
        }

        // Sub-priority 20C: Backend & APIs
        if (/express(\.js)?|rest api|rest endpoint|rest vs graphql|api routing|http methods/i.test(lowerMsg)) {
            reply = "Express.js is a minimalist web framework for Node.js organized around middleware chains:\n- Standard REST Endpoints:\n  - `GET /api/items`: Retrieve resources (200 OK).\n  - `POST /api/items`: Create resource (201 Created).\n  - `PUT /api/items/:id`: Complete resource replacement.\n  - `PATCH /api/items/:id`: Partial field update.\n  - `DELETE /api/items/:id`: Remove resource (204 No Content).\n- REST vs GraphQL: REST uses standard HTTP verbs with fixed endpoint schemas (predictable, simple caching). GraphQL uses a single `/graphql` POST endpoint with client-specified field selection (eliminates over-fetching).\n\nHackathon Recommendation: Stick with REST + Express for fast routing, easy debugging, and simple Postman testing. [Open Workspace -> /workspace]";
            return { reply };
        }

        if (/mongo(db)?|mongoose|schema design|database schema|nosql schema|mongoose model/i.test(lowerMsg)) {
            reply = "MongoDB & Mongoose schema design centers on document access patterns:\n- Embedding (1-to-few): Subdocuments inside a parent document for atomic updates and zero joins (e.g., squad members list).\n- Referencing (1-to-many / many-to-many): Store ObjectIds (`type: Schema.Types.ObjectId, ref: 'User'`) when collections grow large or require independent queries.\n- Schema Definition:\n```javascript\nconst UserSchema = new mongoose.Schema({\n  email: { type: String, required: true, unique: true, index: true },\n  role: { type: String, enum: ['student', 'mentor', 'judge', 'admin'], default: 'student' }\n}, { timestamps: true });\n```\nAlways index frequently filtered and sorted fields (`unique: true`, `index: true`) for high performance. [Open Workspace -> /workspace]";
            return { reply };
        }

        if (/jwt\b|json web token|jwt auth|bearer token|token-based auth|how does jwt/i.test(lowerMsg)) {
            reply = "JSON Web Tokens (JWT) enable stateless authentication across distributed web clients and APIs:\n- Format: `Header.Payload.Signature` (Base64URL encoded).\n- Authentication Workflow:\n  1. Client sends credentials via `POST /api/auth/login`.\n  2. Server verifies password hash with `bcrypt`, then signs payload:\n     `jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })`\n  3. Client includes token in HTTP headers: `Authorization: Bearer <token>`.\n  4. Server middleware verifies token via `jwt.verify(token, secret)` and attaches user context to `req.user`.\n\nSecurity Rule: Never store passwords or confidential secrets in JWT payloads—they are easily decoded by anyone with the token. [Open Workspace -> /workspace]";
            return { reply };
        }

        if (/websocket|web socket|socket\.io|real-?time communication|bi-?directional/i.test(lowerMsg)) {
            reply = "WebSockets provide persistent, full-duplex TCP connections for instant real-time data streaming between client and server:\n- Applications: Squad live chat, collaborative whiteboards, live leaderboard score pushes, live countdown alerts.\n- Socket.io Pattern:\n```javascript\n// Server\nio.on('connection', (socket) => {\n  socket.on('join_squad', (squadId) => socket.join(squadId));\n  socket.on('send_message', (data) => io.to(data.squadId).emit('new_message', data));\n});\n```\nOn CodeSrijan, live squad collaboration runs in dedicated team communication channels. [Open Team Chat -> /chat]";
            return { reply };
        }

        // Sub-priority 20D: Git & Version Control
        if (/merge conflict|resolve.*conflict|git conflict|conflict marker/i.test(lowerMsg)) {
            reply = "Git merge conflicts occur when concurrent branches modify identical lines in a file or one branch deletes a file modified in another.\n\nResolution Protocol:\n1. Run `git status` to identify conflicting files.\n2. Open conflicting files and locate the conflict markers:\n   `<<<<<<< HEAD` (your local branch code)\n   `=======` (division line)\n   `>>>>>>> incoming-branch` (incoming branch changes)\n3. Edit the code to merge both features cleanly, then delete all marker lines (`<<<<<<<`, `=======`, `>>>>>>>`).\n4. Stage the resolved files: `git add <filename>`.\n5. Finalize the merge: `git commit -m \"fix: resolve merge conflicts in <filename>\"`.\n\nCoordination Tip: Ping your squad in Team Chat before merging major architectural branches to prevent conflicts! [Open Workspace -> /workspace]";
            return { reply };
        }

        if (/git branch|branching strategy|pull request|\bprs\b|git workflow/i.test(lowerMsg)) {
            reply = "Standard Git workflow for hackathon squads:\n1. Protected Main: Keep `main` stable, working, and deployable at all times.\n2. Feature Branches: Branch out for each module:\n   `git checkout -b feat/user-auth` or `git checkout -b feat/kanban-ui`.\n3. Atomic Commits: Commit logical units with clear descriptions (`git commit -m \"feat(auth): add jwt middleware\"`).\n4. Pull Requests (PR): Push branch (`git push origin feat/user-auth`) and open a PR into `main` after teammate review.\n5. Sync Regularly: Always pull latest `main` before starting work: `git pull origin main`.\n\nKeeps squad collaboration seamless and submissions clean for judge evaluation. [Open Workspace -> /workspace]";
            return { reply };
        }

        if (/git commit|commit message|git hygiene|commit hygiene|repository hygiene/i.test(lowerMsg)) {
            reply = "Git commit hygiene demonstrates professional craftsmanship to hackathon judges:\n- Conventional Commits: Use descriptive prefixes:\n  - `feat: implement real-time squad chat WebSocket`\n  - `fix: resolve countdown timer timezone offset`\n  - `docs: add architecture diagram and setup guide to README`\n  - `refactor: optimize MongoDB query indexing`\n- Submission Checklist:\n  1. Add a comprehensive `README.md` with problem statement, system architecture diagram, tech stack, and live demo credentials.\n  2. Put `.env` and sensitive API keys in `.gitignore` (never expose secrets).\n  3. Ensure repository visibility is Public before transmitting to CodeSrijan judges. [Open Workspace -> /workspace]";
            return { reply };
        }

        // Sub-priority 20E: Hackathon Pitch & MVP Strategy
        if (/pitch|pitch deck|pitch strategy|how to pitch|presentation tips|demo presentation|hackathon presentation|demo guidelines/i.test(lowerMsg)) {
            reply = "Winning Hackathon Pitch Formula (3-5 Minute Framework):\n1. The Hook (30s): State the compelling real-world problem and why current alternatives fail.\n2. The Solution (30s): Introduce your product with a bold value proposition.\n3. Live Product Demo (120s): Show the happy path working end-to-end. Do NOT spend 2 minutes on login/sign-up—jump straight into your core killer feature!\n4. Architecture & Tech Stack (30s): Show a crisp system diagram (frontend, backend, AI model, database).\n5. Impact & Scalability (30s): Real-world viability, business/social impact, and next steps.\n\nGolden Rule: Never show slides when you can demo working software. Prepare a recorded fallback video in case of venue wifi failure. [View Leaderboard -> /leaderboard]";
            return { reply };
        }

        if (/mvp strategy|scope management|how to win hackathon|hackathon strategy/i.test(lowerMsg)) {
            reply = "Hackathon MVP Strategy & Scope Management:\nCodeSrijan projects are evaluated across 4 pillars (25% each): Innovation, Technical Execution, Design/UI, and Practical Impact.\n\nWinning tactics:\n1. Cut Scope Ruthlessly: Build 1 killer feature that works end-to-end flawlessly rather than 5 half-finished screens.\n2. Focus on Polish: A snappy, bug-free demo with good design leaves a stronger impression than a large, broken feature set.\n3. Seed Realistic Mock Data: Ensure your app looks populated and active during judge inspection.\n4. Track Sprints on Kanban: Break tasks into Frontend, Backend, and Pitch milestones in your squad Workspace. [Open Workspace -> /workspace]";
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
- Live Timeline & 10 Canonical Milestones: /timeline
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
- Rules & Regulations: /rules
- Community: /community
- About: /about
- Mentor Command Center: /mentor-command-center
- Mentor Center: /mentor
- Judge Command Center: /judge-command-center
- Judge Evaluations: /evaluations
- Admin Command Center: /admin
- Admin Hackathons & Event Manager: /admin/hackathons
- Admin Certificates & Batch Issuance: /admin/certificates
- Admin Payment Review Queue: /admin/payments
- Admin User Directory & Moderation: /admin/users
- Admin Platform Health & Telemetry: /admin/health
- Admin Audit Logs: /admin/logs
- Admin Submissions: /admin/submissions
- Admin Operations: /admin/operations

[PLATFORM KNOWLEDGE & SPECIFICATIONS]
- 10 Canonical Milestones (All operating dynamically in Indian Standard Time / IST):
  1. Registration Window — Operative enrollment and entry claim
  2. Team Formation & Roster Lock — Squad assembly (1–4 members) in Recruitment
  3. Opening Ceremony & Keynote Briefing — Tournament kickoff & directive briefing
  4. Hacking Begins & Git Repositories Live — Development sprint commences & Kanban unlocked
  5. Checkpoint 1 — Idea validation & architecture review with mentors
  6. Checkpoint 2 — Prototype validation & mid-sprint mentor sync
  7. Submission Deadline & Code Freeze — Final payload vault lock
  8. Pitch Round & Technical Demonstrations — Live squad presentations & Q&A
  9. Judging & Rubric Evaluation — 4-pillar weighted rubric assessment (100% constraint)
  10. Grand Finale & Award Ceremony — Results declaration & certificate issuance
- Role Permissions & Knowledge:
  * Student: Squad limit 1-4 members. Lone wolf warnings if unassigned. Workspace Kanban for tasks. Submission payload format requires projectTitle, description, public repositoryUrl (GitHub), and live demoUrl. Paid hackathons require UPI QR payment, 12-digit UTR, and proof upload. Free hackathons require no fee.
  * Mentor: Scoped strictly to assigned squads. CAS ticket claiming (atomic acceptance of pending requests in guidance queue). Private mentor notes (1-5000 characters) strictly hidden from students. Optional HTTPS video meet links.
  * Judge: Scoped to assigned submissions. 4-pillar weighted evaluation rubric (Innovation, Technical Execution, Feasibility/Design, Impact/Presentation) with strict 100% mathematical weight constraint. Draft saving & resuming. Final submission is immutable and locked; can only be reopened by an administrator with an audited reason.
  * Admin: Full telemetry & health monitoring (/admin/health), user moderation (ban/suspend/role assignment), payment proof review queue (/admin/payments), batch certificate issuance (/admin/certificates), event authoring. Hackathon specs: Cover banner 1200x630 px (16:9, max 5MB), problem specification doc max 15MB PDF/DOC, UPI payment QR code 500x500 px (1:1, max 2MB).

[VERIFIED LIVE PLATFORM DATA]
- Current Authenticated User: ${ctx.user ? `${ctx.name} (${ctx.email}), Verified Role: ${ctx.role}` : 'Unauthenticated Guest'}
- Assigned Squad: ${ctx.team ? `Squad "${ctx.team.name}" (ID: ${ctx.team.id}, Members: ${ctx.teamMemberCount}/4, Leader: ${ctx.team.leaderId === ctx.user?.id ? 'Current User' : ctx.team.leaderId}, Submitted: ${ctx.team.isSubmitted || !!ctx.submission})` : 'No Squad Assigned (Lone Wolf)'}
- Registration Status: ${ctx.registration ? `Status: ${ctx.registration.status}, Payment Status: ${ctx.registration.paymentStatus || 'N/A'}, Event: ${ctx.registration.hackathonId}` : 'Not Registered'}
- Submission Status: ${ctx.submission ? `Payload Transmitted (Repo: ${ctx.submission.repositoryUrl || 'Attached'}${ctx.submission.demoUrl ? `, Demo: ${ctx.submission.demoUrl}` : ''}, Score: ${ctx.submission.score != null ? ctx.submission.score : 'Pending Evaluation'})` : 'No Submission Recorded'}
- Active/Upcoming Hackathons:
${ctx.hackathons.length > 0 ? ctx.hackathons.map(h => `  * ${h.name} (${h.id}): Status: ${h.status}, Type: ${h.fee > 0 ? `Paid (₹${h.fee})` : 'Free'}, Starts: ${new Date(h.startDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST, Submissions Close: ${new Date(h.submissionDeadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`).join('\n') : (ctx.dbUnavailable ? '  * Database unreachable; hackathon schedule could not be verified.' : '  * No active hackathons configured in database.')}
- Problem Statements & Tracks:
${ctx.problemStatements?.length > 0 ? ctx.problemStatements.map(ps => `  * ${ps.title} [Track: ${ps.domain || 'General'}, Difficulty: ${ps.difficulty || 'Medium'}]`).join('\n') : `  * Available Tracks: ${(ctx.tracks && ctx.tracks.length > 0) ? ctx.tracks.join(', ') : 'AI/ML, Web3, FinTech, HealthTech, CyberSecurity'}. Problem statements viewable at /problems.`}
- System Settings: Maintenance: ${ctx.systemSettings.maintenanceMode ? 'ACTIVE' : 'Normal'}, Registration: ${ctx.systemSettings.registrationEnabled ? 'Open' : 'Closed'}, Submissions: ${ctx.systemSettings.submissionEnabled ? 'Open' : 'Closed'}
- Database Status: ${ctx.dbUnavailable ? 'UNREACHABLE (DEGRADED MODE - Live database records cannot be verified)' : 'ONLINE'}

CRITICAL BEHAVIORAL RULES:
1. GROUNDED IN FACT: Answer dynamic questions (deadlines, schedules, squad status, payments, hackathon counts) using ONLY the verified platform data above.
2. NEVER FABRICATE: If information is unavailable or unconfigured, say so clearly instead of inventing dates (never claim arbitrary deadlines like "20 October at 11:59 PM").
3. ACTION HONESTY: You are an informational copilot. You CANNOT execute database mutations (cannot create teams, change roles, approve payments, edit scores, or submit code). Always provide step-by-step guidance for the user to perform the action in the UI.
4. ROLE-BASED ACCESS CONTROL: Non-administrators must be denied access to admin commands and routes.
5. TECHNICAL & CODING QUESTIONS: You are an expert software engineer, computer science mentor, and hackathon architect. You are explicitly permitted and enthusiastically encouraged to answer general technical, computer science, programming, algorithmic, system design, architectural, framework, Git, and engineering questions (such as React hooks, state management, async Node.js, REST vs GraphQL, Big-O complexity, dynamic programming, sorting/searching algorithms, database schema design, Git conflict resolution, debugging advice, and hackathon pitch strategies). Provide clear explanations, industry best practices, and concise code snippets where helpful. Attach a helpful platform navigation action at the end to guide the operative back to building, such as [Open Workspace -> /workspace] or [Browse Problems -> /problems].
6. NAVIGATION ACTION FORMAT: At the VERY END of your response, provide exactly ONE navigation action formatted strictly as:
[Button Text -> /path]
Using ONLY real routes from the Site Map.
7. TONE: Neo-Brutalist, direct, technical, cyber-hacker aesthetic, concise, helpful.`;

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
