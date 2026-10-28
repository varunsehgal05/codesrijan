import React from 'react';
import { Link } from '@tanstack/react-router';

/**
 * Valid allowed internal route paths for SrijanBot navigation actions.
 */
export const ALLOWED_NAVIGATION_ROUTES = new Set([
    '/',
    '/dashboard',
    '/hackathons',
    '/timeline',
    '/profile',
    '/profile-overview',
    '/problems',
    '/challenge',
    '/team',
    '/recruitment',
    '/workspace',
    '/payment',
    '/chat',
    '/notifications',
    '/leaderboard',
    '/certificates',
    '/support',
    '/settings',
    '/ai-assistant',
    '/login',
    '/register',
    '/auth/forgot-password',
    '/auth/otp',
    '/evaluations',
    '/mentor',
    '/admin',
    '/admin/hackathons',
    '/admin/problems',
    '/admin/users',
    '/admin/teams',
    '/admin/payments',
    '/admin/submissions',
    '/admin/health',
    '/admin/logs',
    '/code-of-conduct',
    '/privacy-policy',
    '/faq',
    '/gallery',
    '/sponsors',
    '/announcements'
]);

/**
 * Sanitizes and validates a target navigation route.
 * Rejects external URLs, javascript: URI schemes, protocol-relative paths, and unknown paths.
 */
export function sanitizeNavigationRoute(route: string): string | null {
    if (!route || typeof route !== 'string') return null;
    const clean = route.trim();

    // Must start with single / and not //
    if (!clean.startsWith('/') || clean.startsWith('//')) return null;

    // Reject dangerous schemes
    if (/^(javascript:|data:|vbscript:|file:|about:)/i.test(clean)) return null;

    // Reject external protocols
    if (/^[a-z]+:\/\//i.test(clean)) return null;

    // Strip query or fragment for base path check
    const basePath = clean.split('?')[0].split('#')[0];

    // Check if exact match or child of allowed route
    if (ALLOWED_NAVIGATION_ROUTES.has(basePath)) {
        return clean;
    }

    // Dynamic paths (e.g. /hackathons/:id)
    if (basePath.startsWith('/hackathons/') || basePath.startsWith('/admin/') || basePath.startsWith('/auth/')) {
        return clean;
    }

    return null;
}

interface ParseOptions {
    buttonClassName?: string;
    containerClassName?: string;
}

/**
 * Parses message text containing [Button Text -> /path] into interactive Neo-Brutalist Link buttons.
 * Preserves normal bracketed text (e.g. [1], [Note: ...]) without turning them into broken buttons.
 */
export function parseSrijanBotMessageNodes(
    text: string,
    options?: ParseOptions
): React.ReactNode[] | string {
    if (!text || typeof text !== 'string') return text || "";

    const buttonRegex = /\[(.*?)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = buttonRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(
                <span key={`txt-${lastIndex}`} className="whitespace-pre-wrap">
                    {text.substring(lastIndex, match.index)}
                </span>
            );
        }

        const rawContent = (match[1] || "").trim();
        let buttonText = "";
        let targetRoute: string | null = null;

        if (rawContent.includes("->")) {
            const split = rawContent.split("->");
            buttonText = (split[0] || "").trim();
            const rawPath = (split[1] || "").trim();
            targetRoute = sanitizeNavigationRoute(rawPath);
        } else {
            // Legacy button format support only for known action phrases
            if (/open workspace|complete submission|deliver payload/i.test(rawContent)) {
                buttonText = rawContent;
                targetRoute = '/workspace';
            } else if (/find (a )?squad|create team|find teammates/i.test(rawContent)) {
                buttonText = rawContent;
                targetRoute = '/recruitment';
            } else if (/create support ticket|help desk|contact support/i.test(rawContent)) {
                buttonText = rawContent;
                targetRoute = '/support';
            } else if (/view leaderboard|open leaderboard/i.test(rawContent)) {
                buttonText = rawContent;
                targetRoute = '/leaderboard';
            } else if (/view certificates/i.test(rawContent)) {
                buttonText = rawContent;
                targetRoute = '/certificates';
            } else if (/admin dashboard|open admin/i.test(rawContent)) {
                buttonText = rawContent;
                targetRoute = '/admin';
            } else if (/open evaluations|judge portal/i.test(rawContent)) {
                buttonText = rawContent;
                targetRoute = '/evaluations';
            } else if (/explore hackathons/i.test(rawContent)) {
                buttonText = rawContent;
                targetRoute = '/hackathons';
            }
        }

        if (buttonText && targetRoute) {
            const btnClass = options?.buttonClassName ||
                "inline-flex items-center gap-2 px-5 py-2.5 bg-electric-blue text-on-primary font-label-bold text-sm uppercase brutal-border brutal-shadow brutal-hover brutal-active transition-all cursor-pointer";
            const containerClass = options?.containerClassName ||
                "mt-3 pt-2 border-t-2 border-ink-black/20";

            parts.push(
                <div key={`nav-${match.index}`} className={containerClass}>
                    <Link to={targetRoute} className={btnClass}>
                        <span>{buttonText}</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                </div>
            );
        } else {
            // Not a valid button, keep as original bracketed text
            parts.push(
                <span key={`raw-${match.index}`} className="whitespace-pre-wrap">
                    {`[${rawContent}]`}
                </span>
            );
        }

        lastIndex = buttonRegex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(
            <span key={`txt-end-${lastIndex}`} className="whitespace-pre-wrap">
                {text.substring(lastIndex)}
            </span>
        );
    }

    return parts.length > 0 ? parts : text;
}
