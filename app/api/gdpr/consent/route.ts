import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { requireCSRF } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  try {
    const csrfError = requireCSRF(request);
    if (csrfError) {
      return csrfError;
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { consentType, accepted } = body;

    if (!consentType || typeof accepted !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid consent data" },
        { status: 400 }
      );
    }

    const [existingConsent] = await db
      .select()
      .from(schema.userConsents)
      .where(
        and(
          eq(schema.userConsents.userId, user.id),
          eq(schema.userConsents.consentType, consentType)
        )
      );

    if (existingConsent) {
      const [updated] = await db
        .update(schema.userConsents)
        .set({
          accepted,
          acceptedAt: accepted ? new Date() : null,
          updatedAt: new Date(),
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        })
        .where(eq(schema.userConsents.id, existingConsent.id))
        .returning();

      return NextResponse.json({ consent: updated });
    }

    const [consent] = await db
      .insert(schema.userConsents)
      .values({
        userId: user.id,
        consentType,
        accepted,
        acceptedAt: accepted ? new Date() : null,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      })
      .returning();

    await db.insert(schema.auditLogs).values({
      userId: user.id,
      action: `gdpr.consent_${accepted ? "granted" : "revoked"}`,
      resource: "user_consent",
      resourceId: consent.id.toString(),
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: { consentType, accepted },
    });

    return NextResponse.json({ consent }, { status: 201 });
  } catch (error) {
    console.error("Consent error:", error);
    return NextResponse.json(
      { error: "Failed to record consent" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const consents = await db
      .select()
      .from(schema.userConsents)
      .where(eq(schema.userConsents.userId, user.id));

    return NextResponse.json({ consents });
  } catch (error) {
    console.error("Fetch consents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consents" },
      { status: 500 }
    );
  }
}
