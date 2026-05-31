import { eq, count } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { db } from "../db/index.js";
import {
  users,
  organizations,
  organizationSubscriptions,
  classroomMembers,
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

/**
 * Call after educatorGate. Checks that adding one more student won't exceed the plan limit.
 * Counts all classroom members in the organization.
 */
export async function assertStudentCapacity(
  organizationId: string,
  studentLimit: number | null
): Promise<boolean> {
  if (studentLimit === null) return true; // institution = unlimited

  // Count all members across all groups in the org
  const groups = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, organizationId));

  if (groups.length === 0) return true;

  const [{ total }] = await db
    .select({ total: count() })
    .from(classroomMembers);

  return total < studentLimit;
}
