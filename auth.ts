import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import authConfig from "./auth.config";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt" },
    debug: true,
    // Merge any providers defined in auth.config with the Credentials provider used by the app.
    providers: [
        ...(authConfig.providers ?? []),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(
                credentials: Partial<Record<"email" | "password", unknown>> | undefined
            ) {
                const email = typeof credentials?.email === "string" ? credentials.email : null;
                const password = typeof credentials?.password === "string" ? credentials.password : null;
                if (!email || !password) return null;

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.passwordHash) return null;

                const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

                if (!isPasswordValid) return null;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    createdAt: user.createdAt.toISOString(),
                };
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user }: { token: JWT; user?: User | undefined }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.phone = user.phone;
                token.createdAt = user.createdAt;
            }
            return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            if (token && session.user) {
                session.user.id = (token.id as string) ?? session.user.id;
                session.user.role = token.role ?? session.user.role;
                session.user.phone = token.phone ?? session.user.phone;
                session.user.createdAt = token.createdAt ?? session.user.createdAt;
            }
            return session;
        },
    },
});
