# Actual frontend route inventory

Source snapshot: 2026-11-01T21:51:11.600Z. Local HEAD: `35afbefd3ab3dc1dd7ab392b2f8430da5b2e7be9` (not asserted as deployed).

Discovered **68 createFileRoute definitions**, **67 distinct normalized URL patterns**. `__root.tsx` is the root layout, not another URL. `/admin` and `/admin/` identify the admin layout/index destination and count once as a normalized URL. Dynamic parameters below use TanStack `$param` notation.

| Actual pattern | Scope | Source | Kind |
|---|---|---|---|
| `/` | Public/discovery | `src/routes/index.tsx` | URL |
| `/about` | Public/discovery | `src/routes/about.tsx` | URL |
| `/admin` | Admin | `src/routes/admin.tsx` | Layout + URL |
| `/admin-login` | Authentication | `src/routes/admin-login.tsx` | URL |
| `/admin/` | Admin | `src/routes/admin.index.tsx` | Index URL (same /admin destination) |
| `/admin/analytics` | Admin | `src/routes/admin.analytics.tsx` | URL |
| `/admin/announcements` | Admin | `src/routes/admin.announcements.tsx` | URL |
| `/admin/certificates` | Admin | `src/routes/admin.certificates.tsx` | URL |
| `/admin/evaluations` | Admin | `src/routes/admin.evaluations.tsx` | URL |
| `/admin/gallery` | Admin | `src/routes/admin.gallery.tsx` | URL |
| `/admin/hackathons` | Admin | `src/routes/admin.hackathons.tsx` | URL |
| `/admin/hackathons/$id` | Admin | `src/routes/admin.hackathons.$id.tsx` | URL; parameterized |
| `/admin/hackathons/create` | Admin | `src/routes/admin.hackathons.create.tsx` | URL |
| `/admin/health` | Admin | `src/routes/admin.health.tsx` | URL |
| `/admin/judges` | Admin | `src/routes/admin.judges.tsx` | URL |
| `/admin/leaderboard` | Admin | `src/routes/admin.leaderboard.tsx` | URL |
| `/admin/logs` | Admin | `src/routes/admin.logs.tsx` | URL |
| `/admin/mentors` | Admin | `src/routes/admin.mentors.tsx` | URL |
| `/admin/operations` | Admin | `src/routes/admin.operations.tsx` | URL |
| `/admin/payments` | Admin | `src/routes/admin.payments.tsx` | URL |
| `/admin/problems` | Admin | `src/routes/admin.problems.tsx` | URL |
| `/admin/problems/$id` | Admin | `src/routes/admin.problems.$id.tsx` | URL; parameterized |
| `/admin/problems/create` | Admin | `src/routes/admin.problems.create.tsx` | URL |
| `/admin/recruitment` | Admin | `src/routes/admin.recruitment.tsx` | URL |
| `/admin/schedule` | Admin | `src/routes/admin.schedule.tsx` | URL |
| `/admin/settings` | Admin | `src/routes/admin.settings.tsx` | URL |
| `/admin/sponsors` | Admin | `src/routes/admin.sponsors.tsx` | URL |
| `/admin/submissions` | Admin | `src/routes/admin.submissions.tsx` | URL |
| `/admin/support` | Admin | `src/routes/admin.support.tsx` | URL |
| `/admin/teams` | Admin | `src/routes/admin.teams.tsx` | URL |
| `/admin/users` | Admin | `src/routes/admin.users.tsx` | URL |
| `/ai-assistant` | Student/shared | `src/routes/ai-assistant.tsx` | URL |
| `/announcements` | Public/discovery | `src/routes/announcements.tsx` | URL |
| `/auth/forgot-password` | Authentication | `src/routes/auth.forgot-password.tsx` | URL |
| `/auth/otp` | Authentication | `src/routes/auth.otp.tsx` | URL |
| `/auth/reset-password` | Authentication | `src/routes/auth.reset-password.tsx` | URL |
| `/certificates` | Student/shared | `src/routes/certificates.tsx` | URL |
| `/challenge` | Student/shared | `src/routes/challenge.tsx` | URL |
| `/chat` | Student/shared | `src/routes/chat.tsx` | URL |
| `/code-of-conduct` | Public/discovery | `src/routes/code-of-conduct.tsx` | URL |
| `/community` | Public/discovery | `src/routes/community.tsx` | URL |
| `/dashboard` | Student/shared | `src/routes/dashboard.tsx` | URL |
| `/evaluations` | Judge | `src/routes/evaluations.tsx` | URL |
| `/faq` | Public/discovery | `src/routes/faq.tsx` | URL |
| `/gallery` | Public/discovery | `src/routes/gallery.tsx` | URL |
| `/hackathons/` | Public/discovery | `src/routes/hackathons.index.tsx` | URL |
| `/hackathons/$id/register` | Student/shared | `src/routes/hackathons.$id.register.tsx` | URL; parameterized |
| `/highlights` | Public/discovery | `src/routes/highlights.tsx` | URL |
| `/host-event` | Public/discovery | `src/routes/host-event.tsx` | URL |
| `/invite/$token` | Student/shared | `src/routes/invite.$token.tsx` | URL; parameterized |
| `/leaderboard` | Public/discovery | `src/routes/leaderboard.tsx` | URL |
| `/login` | Authentication | `src/routes/login.tsx` | URL |
| `/mentor` | Public/discovery | `src/routes/mentor.tsx` | URL |
| `/mentor-command-center` | Mentor | `src/routes/mentor-command-center.tsx` | URL |
| `/notifications` | Student/shared | `src/routes/notifications.tsx` | URL |
| `/payment` | Student/shared | `src/routes/payment.tsx` | URL |
| `/privacy-policy` | Public/discovery | `src/routes/privacy-policy.tsx` | URL |
| `/problems` | Public/discovery | `src/routes/problems.tsx` | URL |
| `/profile` | Student/shared | `src/routes/profile.tsx` | URL |
| `/profile-overview` | Student/shared | `src/routes/profile-overview.tsx` | URL |
| `/recruitment` | Student/shared | `src/routes/recruitment.tsx` | URL |
| `/register` | Authentication | `src/routes/register.tsx` | URL |
| `/settings` | Student/shared | `src/routes/settings.tsx` | URL |
| `/sponsors` | Public/discovery | `src/routes/sponsors.tsx` | URL |
| `/support` | Student/shared | `src/routes/support.tsx` | URL |
| `/team` | Student/shared | `src/routes/team.tsx` | URL |
| `/timeline` | Public/discovery | `src/routes/timeline.tsx` | URL |
| `/workspace` | Student/shared | `src/routes/workspace.tsx` | URL |

## Authority and execution

Generate this inventory with `node tests/qa-public-auth-inventory.cjs`. Source discovery establishes existence in this checkout; deployment may differ. Public/auth live outcomes are in PUBLIC_EXECUTION.md and AUTH_EXECUTION.md. Role-specific browser outcomes are recorded by their assigned workstreams. This inventory does not claim protected workflows passed.

The named architecture references were found in the outer workspace as FULL_SITE_ARCHITECTURE_AND_USER_GUIDE.md and FULL_SITE_STRUCTURE.md; both were read completely. They claim 66 route components. This inventory supersedes that count for the inspected checkout.

The separately named CODESRIJAN_GSD_MASTER_QA_AND_ROLE_DASHBOARDS.md containing 267 case IDs was not found by filename or content search of workspace Markdown/text paths. The supplied attachment describes group counts and workflows, but contains no 267 individual IDs. No IDs or per-ID pass counts are invented.
