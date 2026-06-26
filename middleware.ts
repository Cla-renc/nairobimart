import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";

const authSecrets = [process.env.NEXTAUTH_SECRET, process.env.AUTH_SECRET]
    .filter((secret): secret is string => typeof secret === "string" && secret.length > 0);
const authSecret = authSecrets.length === 0 ? undefined : authSecrets.length === 1 ? authSecrets[0] : authSecrets;

const { auth } = NextAuth({
    ...authConfig,
    secret: authSecret,
    session: { strategy: "jwt" },
});

// Simple in-memory rate limiter (per-instance). For production use a shared store.
const RATE_WINDOW_SECONDS = 60; // time window
const RATE_MAX_REQUESTS = 120; // max requests per window
const ipStore = new Map<string, { count: number; start: number }>();

function getClientIp(req: Request) {
    const xff = req.headers.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
    // @ts-ignore - NextRequest may expose ip in some runtimes; fallback to unknown
    return (req as any).ip || "unknown";
}

export default auth((req) => {
    const { nextUrl } = req as any;

    // Rate limiting
    try {
        const ip = getClientIp(req as unknown as Request);
        const now = Date.now();
        const entry = ipStore.get(ip) || { count: 0, start: now };
        if (now - entry.start > RATE_WINDOW_SECONDS * 1000) {
            entry.count = 0;
            entry.start = now;
        }
        entry.count += 1;
        ipStore.set(ip, entry);
        if (entry.count > RATE_MAX_REQUESTS) {
            return new Response("Too Many Requests", { status: 429 });
        }
    } catch (e) {
        // on any rate-limiter error, allow the request (fail open)
    }

    const isLoggedIn = !!(req as any).auth;
    const isAdminRoute = nextUrl.pathname.startsWith("/admin");
    const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");

    if (isAdminRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", nextUrl));
    }

    if (isAdminRoute && (req as any).auth?.user?.role !== "admin") {
        return NextResponse.redirect(new URL("/", nextUrl));
    }

    // Security headers (CSP, HSTS, etc.) applied to all responses
    const res = NextResponse.next();

    // A reasonably strict CSP - adjust as necessary for external assets
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
        "style-src 'self' 'unsafe-inline' https:",
        "img-src 'self' data: https:",
        "connect-src 'self' https:",
        "font-src 'self' data:",
    ].join('; ');

    res.headers.set('Content-Security-Policy', csp);
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Permissions-Policy', 'geolocation=(), microphone=()');
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    return res;
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
