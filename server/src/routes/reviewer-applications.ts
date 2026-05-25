import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { pushTokens, reviewerApplications, users } from "../db/schema.js";
import { elderMiddleware, authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { sendPush } from "../lib/send-push.js";
import {
  sendEmail,
  reviewerApplicationStatusEmailHtml,
  reviewerApplicationStatusEmailText,
} from "../lib/send-email.js";

const VALID_ROLES = ["teacher", "professor", "elder"] as const;

// ── Authenticated user routes ─────────────────────────────────────────────────

export const reviewerApplicationsRouter = new Hono<AuthEnv>();
reviewerApplicationsRouter.use("*", authMiddleware);

// POST /reviewer-applications — submit an application
reviewerApplicationsRouter.post("/", async (c) => {
  const userId = c.get("userId");

  const body = await c.req.json<{
    role: string;
    background: string;
    reason: string;
    languages?: string[];
  }>();

  const { role, background, reason, languages } = body;

  if (!role || !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return c.json({ error: `role must be one of: ${VALID_ROLES.join(", ")}` }, 400);
  }

  let finalBackground = background?.trim() ?? "";
  let finalReason = reason?.trim() ?? "";

  // If updating as an approved reviewer, inherit blank fields from their previous application
  if (!finalBackground || !finalReason) {
    const [prevApp] = await db
      .select({ background: reviewerApplications.background, reason: reviewerApplications.reason })
      .from(reviewerApplications)
      .where(eq(reviewerApplications.userId, userId))
      .orderBy(desc(reviewerApplications.createdAt))
      .limit(1);
    if (!finalBackground) finalBackground = prevApp?.background ?? "";
    if (!finalReason) finalReason = prevApp?.reason ?? "";
  }

  if (!finalBackground || finalBackground.length > 3000) {
    return c.json({ error: "background must be non-empty and at most 3000 characters" }, 400);
  }
  if (!finalReason || finalReason.length > 3000) {
    return c.json({ error: "reason must be non-empty and at most 3000 characters" }, 400);
  }

  // Only one pending application at a time per user
  const [existing] = await db
    .select({ id: reviewerApplications.id })
    .from(reviewerApplications)
    .where(
      and(
        eq(reviewerApplications.userId, userId),
        eq(reviewerApplications.status, "pending")
      )
    )
    .limit(1);

  if (existing) {
    return c.json({ error: "You already have a pending application" }, 409);
  }

  const sanitisedLanguages = Array.isArray(languages)
    ? languages.map((l) => String(l).trim().toLowerCase()).filter(Boolean)
    : [];

  await db.insert(reviewerApplications).values({
    userId,
    role: role as (typeof VALID_ROLES)[number],
    background: finalBackground,
    reason: finalReason,
    languages: sanitisedLanguages,
  });

  return c.json({ success: true }, 201);
});

// DELETE /reviewer-applications/me — cancel own pending or approved application
reviewerApplicationsRouter.delete("/me", async (c) => {
  const userId = c.get("userId");

  const [user] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const displayName = user?.name || user?.email || userId;

  const [app] = await db
    .select({ id: reviewerApplications.id, status: reviewerApplications.status })
    .from(reviewerApplications)
    .where(eq(reviewerApplications.userId, userId))
    .orderBy(desc(reviewerApplications.createdAt))
    .limit(1);

  if (!app || app.status === "rejected") {
    return c.json({ error: "No active application to cancel" }, 404);
  }

  await db
    .update(reviewerApplications)
    .set({
      status: "rejected",
      reviewerNote: `Cancelled by ${displayName}`,
      reviewedAt: new Date(),
      reviewedBy: userId,
    })
    .where(eq(reviewerApplications.id, app.id));

  if (app.status === "approved") {
    await db
      .update(users)
      .set({ isReviewer: false, reviewerLanguages: [], reviewerRole: null })
      .where(eq(users.id, userId));
  }

  return c.json({ success: true });
});

// GET /reviewer-applications/me — check own application status
reviewerApplicationsRouter.get("/me", async (c) => {
  const userId = c.get("userId");

  const [app] = await db
    .select({
      id: reviewerApplications.id,
      role: reviewerApplications.role,
      languages: reviewerApplications.languages,
      status: reviewerApplications.status,
      reviewerNote: reviewerApplications.reviewerNote,
      createdAt: reviewerApplications.createdAt,
      reviewedAt: reviewerApplications.reviewedAt,
    })
    .from(reviewerApplications)
    .where(eq(reviewerApplications.userId, userId))
    .orderBy(desc(reviewerApplications.createdAt))
    .limit(1);

  return c.json(app ?? null);
});

// ── Admin routes ───────────────────────────────────────────────────────────────

export const reviewerApplicationsAdminRouter = new Hono<AuthEnv>();
reviewerApplicationsAdminRouter.use("*", authMiddleware);
reviewerApplicationsAdminRouter.use("*", elderMiddleware);

// GET /reviewer-applications/admin?status=pending
reviewerApplicationsAdminRouter.get("/", async (c) => {
  const statusFilter = c.req.query("status"); // "pending" | "approved" | "rejected" | undefined

  const rows = await db
    .select({
      id: reviewerApplications.id,
      role: reviewerApplications.role,
      background: reviewerApplications.background,
      reason: reviewerApplications.reason,
      languages: reviewerApplications.languages,
      status: reviewerApplications.status,
      reviewerNote: reviewerApplications.reviewerNote,
      createdAt: reviewerApplications.createdAt,
      reviewedAt: reviewerApplications.reviewedAt,
      userName: users.name,
      userEmail: users.email,
      userId: reviewerApplications.userId,
    })
    .from(reviewerApplications)
    .leftJoin(users, eq(reviewerApplications.userId, users.id))
    .orderBy(desc(reviewerApplications.createdAt));

  const filtered =
    statusFilter &&
    ["pending", "approved", "rejected"].includes(statusFilter)
      ? rows.filter((r) => r.status === statusFilter)
      : rows;

  return c.json(filtered);
});

// PATCH /reviewer-applications/admin/:id — approve or reject
reviewerApplicationsAdminRouter.patch("/:id", async (c) => {
  const reviewerId = c.get("userId");
  const { id } = c.req.param();

  const body = await c.req.json<{
    status: "approved" | "rejected";
    reviewerNote?: string;
    grantLanguages?: string[]; // languages to grant on approval
  }>();

  const { status, reviewerNote, grantLanguages } = body;

  if (status !== "approved" && status !== "rejected") {
    return c.json({ error: "status must be 'approved' or 'rejected'" }, 400);
  }

  const [app] = await db
    .select()
    .from(reviewerApplications)
    .where(eq(reviewerApplications.id, id))
    .limit(1);

  if (!app) return c.json({ error: "Application not found" }, 404);

  await db
    .update(reviewerApplications)
    .set({
      status,
      reviewerNote: reviewerNote?.trim() || null,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
    })
    .where(eq(reviewerApplications.id, id));

  // On approval: grant reviewer role with specified (or applied) languages
  if (status === "approved") {
    const langs =
      Array.isArray(grantLanguages) && grantLanguages.length > 0
        ? grantLanguages.map((l) => String(l).trim().toLowerCase()).filter(Boolean)
        : app.languages;

    await db
      .update(users)
      .set({ isReviewer: true, reviewerLanguages: langs, reviewerRole: app.role })
      .where(eq(users.id, app.userId));
  }

  // Fetch applicant details for notifications
  const [applicant] = await db
    .select({
      email: users.email,
      name: users.name,
      emailReviewerStatusEnabled: users.emailReviewerStatusEnabled,
    })
    .from(users)
    .where(eq(users.id, app.userId))
    .limit(1);

  // Push notification
  const tokens = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(eq(pushTokens.userId, app.userId));

  await Promise.all(
    tokens.map(({ token }) =>
      sendPush(
        token,
        status === "approved" ? "Application Approved 🎉" : "Application Update",
        status === "approved"
          ? "You've been granted reviewer access. Open the app to get started."
          : reviewerNote?.trim()
            ? `Your application was not approved: ${reviewerNote.trim()}`
            : "Your reviewer application was not approved at this time.",
        { screen: "reviewer-application" }
      )
    )
  );

  // Email notification
  if (applicant?.emailReviewerStatusEnabled) {
    const note = reviewerNote?.trim() || null;
    await sendEmail({
      to: { email: applicant.email, name: applicant.name },
      subject: status === "approved" ? "Reviewer access granted 🎉" : "Reviewer application update",
      htmlContent: reviewerApplicationStatusEmailHtml(applicant.name, status, note),
      textContent: reviewerApplicationStatusEmailText(applicant.name, status, note),
    });
  }

  return c.json({ success: true });
});
