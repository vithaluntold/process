import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import * as schema from "@/shared/schema";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";

async function logAuditEvent(
  userId: number | null,
  action: string,
  resource: string,
  metadata?: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await db.insert(schema.auditLogs).values({
      userId,
      action,
      resource,
      resourceId: userId?.toString() || null,
      ipAddress: ipAddress || "unknown",
      userAgent: userAgent || "unknown",
      metadata: metadata || null,
    });
  } catch (error) {
    console.error("CRITICAL: Audit logging failed:", error);
    throw error;
  }
}

import type { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        const ip = req?.headers?.get('x-forwarded-for') ?? 
                   req?.headers?.get('x-real-ip') ?? 
                   (req as any)?.ip ?? 
                   "unknown";
        const userAgent = req?.headers?.get('user-agent') ?? "unknown";

        if (!credentials?.email || !credentials?.password) {
          await logAuditEvent(
            null,
            "auth.login.failed",
            "authentication",
            { reason: "missing_credentials", email: credentials?.email },
            ip,
            userAgent
          );
          return null;
        }

        const [user] = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, credentials.email as string));

        if (!user || !user.password) {
          await logAuditEvent(
            null,
            "auth.login.failed",
            "authentication",
            { reason: "user_not_found", email: credentials.email },
            ip,
            userAgent
          );
          return null;
        }

        const isPasswordValid = await compare(credentials.password as string, user.password);

        if (!isPasswordValid) {
          await logAuditEvent(
            user.id,
            "auth.login.failed",
            "authentication",
            { reason: "invalid_password", email: credentials.email },
            ip,
            userAgent
          );
          return null;
        }

        await logAuditEvent(
          user.id,
          "auth.login.success",
          "authentication",
          { email: user.email },
          ip,
          userAgent
        );

        return {
          id: user.id.toString(),
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
};

export default NextAuth(authOptions);
export { authOptions };
