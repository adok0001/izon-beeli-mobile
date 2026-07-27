import { eq, count } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { db } from "../db/index.js";
import {
  users,
  organizationSubscriptions,
  classroomMembers,
  classroomGroups,
} from "../db/schema.js";
import type { AuthEnv } from "./auth.js";

/**
 * Requires the authed user to belong to an organization with an active subscription.
 * Apply to classroom routes that should be behind the Educator tier paywall.
 */
export const educatorGate = createMiddleware<AuthEnv>(async (c, next) => {
  const userId = c.get("userId");

  const [user] = await db
    .select({ organizationId: users.organizationId, isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Admins bypass the paywall
  if (user?.isAdmin) return next();

  if (!user?.organizationId) {
    return c.json({ error: "educator_subscription_required", code: "no_org" }, 402);
  }

  const [sub] = await db
    .select({
      status: organizationSubscriptions.status,
      studentLimit: organizationSubscriptions.studentLimit,
      organizationId: organizationSubscriptions.organizationId,
    })
    .from(organizationSubscriptions)
    .where(eq(organizationSubscriptions.organizationId, user.organizationId))
    .limit(1);

  if (!sub || sub.status !== "active") {
    return c.json({ error: "educator_subscription_required", code: "inactive" }, 402);
  }

  await next();
});

/** Count all classroom members across every group owned by a user in this org. */
async function countOrganizationMembers(organizationId: string): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(classroomMembers)
    .innerJoin(classroomGroups, eq(classroomMembers.groupId, classroomGroups.id))
    .innerJoin(users, eq(classroomGroups.createdBy, users.id))
    .where(eq(users.organizationId, organizationId));

  return total;
}

/**
 * Call after educatorGate. Checks that adding one more student won't exceed the plan limit.
 * Counts all classroom members in the organization.
 */
export async function assertStudentCapacity(
  organizationId: string,
  studentLimit: number | null
): Promise<boolean> {
  if (studentLimit === null) return true; // institution = unlimited

  return (await countOrganizationMembers(organizationId)) < studentLimit;
}

export type StudentCapacityResult =
  | { ok: true }
  | { ok: false; studentLimit: number; studentCount: number };

/**
 * Capacity check for adding a member to `groupId`.
 *
 * The seat limit belongs to the organization of the group's *owner*, not the joining
 * user — students arrive via a circulating invite code and normally have no org of
 * their own. Groups whose owner has no organization (or whose org has no subscription
 * row) have no seat limit defined and are not gated here.
 *
 * The count includes teachers and parents, matching `assertStudentCapacity` and the
 * `studentCount` reported by GET /billing/educator/status. Every join path is gated
 * regardless of the requested role, since `role` comes from the client body and would
 * otherwise be a one-word bypass.
 *
 * Racy by design: neon-http has no transactions, so a burst of concurrent joins can
 * overshoot the limit by a seat or two. That is an accepted rounding error — see the
 * over-capacity report at GET /admin/billing/over-capacity for reconciliation.
 */
export async function checkGroupStudentCapacity(
  groupId: string
): Promise<StudentCapacityResult> {
  const [owner] = await db
    .select({ organizationId: users.organizationId })
    .from(classroomGroups)
    .innerJoin(users, eq(classroomGroups.createdBy, users.id))
    .where(eq(classroomGroups.id, groupId))
    .limit(1);

  if (!owner?.organizationId) return { ok: true };

  const [sub] = await db
    .select({ studentLimit: organizationSubscriptions.studentLimit })
    .from(organizationSubscriptions)
    .where(eq(organizationSubscriptions.organizationId, owner.organizationId))
    .limit(1);

  // No subscription row, or institution tier — no limit to enforce.
  if (!sub || sub.studentLimit === null) return { ok: true };

  const studentCount = await countOrganizationMembers(owner.organizationId);
  if (studentCount < sub.studentLimit) return { ok: true };

  return { ok: false, studentLimit: sub.studentLimit, studentCount };
}
