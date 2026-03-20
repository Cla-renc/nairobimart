import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    const isAdminRoute = nextUrl.pathname.startsWith("/admin");
    const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");

    if (isAdminRoute && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
    }

    if (isAdminRoute && req.auth?.user?.role !== "admin") {
        return Response.redirect(new URL("/", nextUrl));
    }

    return;
});

export const config = {
    matcher: ["/admin/:path*", "/account/:path*"],
};
