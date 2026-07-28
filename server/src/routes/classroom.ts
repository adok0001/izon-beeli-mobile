import { Hono } from "hono";
import { parseJson } from "../lib/http.js";
import { eq, and, inArray, count, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  classroomGroups,
  classroomMembers,
  classroomAssignments,
  groupRoleEnum,
  users,
  userProgress,
  lessons,
} from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";
import {
  checkGroupStudentCapacity,
  type StudentCapacityResult,
} from "../middleware/educator-gate.js";

export const classroomRouter = new Hono<AuthEnv>();
classroomRouter.use("*", authMiddleware);

/** 402 body for a join blocked by the owning organization's seat limit. */
function capacityError(capacity: Extract<StudentCapacityResult, { ok: false }>) {
  return {
    error: "student_capacity_exceeded",
    code: "limit_reached",
    studentLimit: capacity.studentLimit,
    studentCount: capacity.studentCount,
  };
}

/** Generate a random 6-character alphanumeric invite code */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

type GroupRole = (typeof groupRoleEnum.enumValues)[number];
type Membership = typeof classroomMembers.$inferSelect;

type MembershipResult =
  | { ok: true; membership: Membership }
  | { ok: false; status: 403 | 404; error: string };

/**
 * Object-level authorization for a classroom group: the caller must be a member
 * of `groupId`, and — when `role` is given — hold that role. Every handler that
 * takes a group id from the request (body or path) must go through this before
 * reading or writing anything scoped to that group.
 *
 * Non-members always get the same 404 regardless of whether the group exists,
 * so the response never confirms a guessed group id.
 */
async function requireMembership(
  groupId: string,
  userId: string,
  opts: { role?: GroupRole; forbidden?: string } = {}
): Promise<MembershipResult> {
  const [membership] = await db
    .select()
    .from(classroomMembers)
    .where(and(eq(classroomMembers.groupId, groupId), eq(classroomMembers.userId, userId)))
    .limit(1);

  if (!membership) {
    return { ok: false, status: 404, error: "Not a member of this group" };
  }
  if (opts.role && membership.role !== opts.role) {
    return { ok: false, status: 403, error: opts.forbidden ?? `Only ${opts.role}s can do that` };
  }
  return { ok: true, membership };
}

// GET /api/classroom/groups — list groups the user belongs to
classroomRouter.get("/groups", async (c) => {
  const userId = c.get("userId");

  const memberships = await db
    .select({ groupId: classroomMembers.groupId })
    .from(classroomMembers)
    .where(eq(classroomMembers.userId, userId));

  const groupIds = memberships.map((m) => m.groupId);
  if (groupIds.length === 0) return c.json([]);

  const groups = await db
    .select()
    .from(classroomGroups)
    .where(inArray(classroomGroups.id, groupIds))
    .orderBy(desc(classroomGroups.createdAt));

  // Fetch members for each group
  const allMembers = await db
    .select({
      groupId: classroomMembers.groupId,
      userId: classroomMembers.userId,
      role: classroomMembers.role,
      name: users.name,
    })
    .from(classroomMembers)
    .leftJoin(users, eq(classroomMembers.userId, users.id))
    .where(inArray(classroomMembers.groupId, groupIds));

  const membersByGroup = allMembers.reduce<Record<string, typeof allMembers>>(
    (acc, m) => {
      if (!acc[m.groupId]) acc[m.groupId] = [];
      acc[m.groupId].push(m);
      return acc;
    },
    {}
  );

  const result = groups.map((g) => {
    const groupMembers = membersByGroup[g.id] ?? [];
    const myMember = groupMembers.find((m) => m.userId === userId);
    return {
      ...g,
      myRole: myMember?.role ?? "student",
      members: groupMembers.map((m) => ({
        id: m.userId,
        userId: m.userId,
        name: m.name ?? "User",
        role: m.role,
        lessonsCompleted: 0,
        streak: 0,
        points: 0,
      })),
    };
  });

  return c.json(result);
});

// POST /api/classroom/groups — create a new group
classroomRouter.post("/groups", async (c) => {
  const userId = c.get("userId");
  const body = await parseJson<{ name: string; languageId: string }>(c);
  const { name, languageId } = body;

  if (!name?.trim() || !languageId) {
    return c.json({ error: "name and languageId are required" }, 400);
  }

  const inviteCode = generateInviteCode();

  const [group] = await db
    .insert(classroomGroups)
    .values({
      name: name.trim(),
      languageId,
      inviteCode,
      createdBy: userId,
    })
    .returning();

  // Creator joins as teacher
  await db.insert(classroomMembers).values({
    groupId: group.id,
    userId,
    role: "teacher",
  });

  return c.json({ ...group, members: [] }, 201);
});

// POST /api/classroom/groups/:id/join — join via invite code
classroomRouter.post("/groups/:id/join", async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.param();
  const body = await c.req.json<{ inviteCode?: string; role?: string }>().catch(() => ({ inviteCode: undefined as string | undefined, role: undefined as string | undefined }));

  const [group] = await db
    .select()
    .from(classroomGroups)
    .where(eq(classroomGroups.id, id))
    .limit(1);

  if (!group) return c.json({ error: "Group not found" }, 404);

  // The invite code is the only thing gating this group, so it is mandatory —
  // when it was optional, knowing a group id was enough to walk in.
  const supplied = body.inviteCode?.trim().toUpperCase();
  if (!supplied || group.inviteCode.toUpperCase() !== supplied) {
    return c.json({ error: "Invalid invite code" }, 400);
  }

  // Check if already a member
  const [existing] = await db
    .select()
    .from(classroomMembers)
    .where(and(eq(classroomMembers.groupId, id), eq(classroomMembers.userId, userId)))
    .limit(1);

  if (existing) return c.json({ ...group, alreadyMember: true });

  const capacity = await checkGroupStudentCapacity(id);
  if (!capacity.ok) return c.json(capacityError(capacity), 402);

  // Never honour a self-declared "teacher": the invite code is shared with the
  // whole class, so anyone holding it could otherwise promote themselves to
  // staff. Teachers are made by group creation or by an existing teacher.
  const role: GroupRole = body.role === "parent" ? "parent" : "student";
  await db.insert(classroomMembers).values({ groupId: id, userId, role });

  return c.json(group, 201);
});

// POST /api/classroom/groups/join-by-code — join via bare invite code
classroomRouter.post("/groups/join-by-code", async (c) => {
  const userId = c.get("userId");
  const body = await parseJson<{ inviteCode: string }>(c);
  const code = body.inviteCode?.trim().toUpperCase();

  if (!code) return c.json({ error: "inviteCode is required" }, 400);

  const [group] = await db
    .select()
    .from(classroomGroups)
    .where(eq(classroomGroups.inviteCode, code))
    .limit(1);

  if (!group) return c.json({ error: "No group found with that invite code" }, 404);

  const [existing] = await db
    .select()
    .from(classroomMembers)
    .where(and(eq(classroomMembers.groupId, group.id), eq(classroomMembers.userId, userId)))
    .limit(1);

  if (existing) return c.json(group);

  const capacity = await checkGroupStudentCapacity(group.id);
  if (!capacity.ok) return c.json(capacityError(capacity), 402);

  await db.insert(classroomMembers).values({ groupId: group.id, userId, role: "student" });
  return c.json(group, 201);
});

// POST /api/classroom/assignments — assign a lesson to a group
classroomRouter.post("/assignments", async (c) => {
  const userId = c.get("userId");
  const body = await parseJson<{ groupId: string; lessonId: string; dueDate?: string }>(c);
  const { groupId, lessonId, dueDate } = body;

  if (!groupId || !lessonId) {
    return c.json({ error: "groupId and lessonId are required" }, 400);
  }

  const auth = await requireMembership(groupId, userId, {
    role: "teacher",
    forbidden: "Only teachers can create assignments",
  });
  if (!auth.ok) return c.json({ error: auth.error }, auth.status);

  const [assignment] = await db
    .insert(classroomAssignments)
    .values({
      groupId,
      lessonId,
      assignedBy: userId,
      dueDate: dueDate ? new Date(dueDate) : null,
    })
    .returning();

  return c.json(assignment, 201);
});

// GET /api/classroom/groups/:id/assignments — list assignments for a group
classroomRouter.get("/groups/:id/assignments", async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.param();

  // Any role — students need to see the work they've been set.
  const auth = await requireMembership(id, userId);
  if (!auth.ok) return c.json({ error: auth.error }, auth.status);

  const assignments = await db
    .select()
    .from(classroomAssignments)
    .where(eq(classroomAssignments.groupId, id))
    .orderBy(desc(classroomAssignments.createdAt));

  return c.json(assignments);
});

// GET /api/classroom/groups/:id/progress — per-member completion stats
classroomRouter.get("/groups/:id/progress", async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.param();

  const auth = await requireMembership(id, userId);
  if (!auth.ok) return c.json({ error: auth.error }, auth.status);

  // Only teachers see the whole roster; everyone else sees just their own row.
  // These are often minors' names, streaks and points — don't hand the class
  // list to a classmate (or to a parent, who is a member but not staff).
  const members = await db
    .select({
      userId: classroomMembers.userId,
      role: classroomMembers.role,
      name: users.name,
    })
    .from(classroomMembers)
    .leftJoin(users, eq(classroomMembers.userId, users.id))
    .where(
      auth.membership.role === "teacher"
        ? eq(classroomMembers.groupId, id)
        : and(eq(classroomMembers.groupId, id), eq(classroomMembers.userId, userId))
    );

  if (members.length === 0) return c.json([]);

  // Fetch progress for the members we're actually returning
  const memberUserIds = members.map((m) => m.userId);
  const progress = await db
    .select({
      userId: userProgress.userId,
      streak: users.streak,
      points: users.points,
      completedCount: count(userProgress.id),
    })
    .from(userProgress)
    .leftJoin(users, eq(userProgress.userId, users.id))
    .where(
      and(
        inArray(userProgress.userId, memberUserIds),
        eq(userProgress.completed, true)
      )
    )
    .groupBy(userProgress.userId, users.streak, users.points);

  const progressByUser = progress.reduce<Record<string, (typeof progress)[0]>>(
    (acc, p) => { acc[p.userId] = p; return acc; },
    {}
  );

  // Get assignments for this group to check completion
  const assignments = await db
    .select({ lessonId: classroomAssignments.lessonId, dueDate: classroomAssignments.dueDate })
    .from(classroomAssignments)
    .where(eq(classroomAssignments.groupId, id));

  const now = new Date();
  const overdueLessonIds = assignments
    .filter((a) => a.dueDate && new Date(a.dueDate) < now)
    .map((a) => a.lessonId);

  // Which of the overdue lessons each member has actually finished. Without
  // this the overdue count is a group-level number stamped onto every row, so a
  // student who has done everything looks identical to one who has done none —
  // worse than useless in the teacher's primary view, because it reads as
  // actionable.
  const completedAssigned = overdueLessonIds.length
    ? await db
        .select({ userId: userProgress.userId, lessonId: userProgress.lessonId })
        .from(userProgress)
        .where(
          and(
            inArray(userProgress.userId, memberUserIds),
            inArray(userProgress.lessonId, overdueLessonIds),
            eq(userProgress.completed, true)
          )
        )
    : [];

  const completedByUser = completedAssigned.reduce<Record<string, Set<string>>>((acc, row) => {
    (acc[row.userId] ??= new Set()).add(row.lessonId);
    return acc;
  }, {});

  const result = members.map((m) => {
    const p = progressByUser[m.userId];
    const done = completedByUser[m.userId];
    return {
      userId: m.userId,
      name: m.name ?? "User",
      role: m.role,
      lessonsCompleted: Number(p?.completedCount ?? 0),
      streak: p?.streak ?? 0,
      points: p?.points ?? 0,
      assignedCount: assignments.length,
      overdueLessons: overdueLessonIds.filter((lid) => !done?.has(lid)).length,
    };
  });

  return c.json(result);
});

// DELETE /api/classroom/groups/:id/leave — current user leaves the group
classroomRouter.delete("/groups/:id/leave", async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.param();

  const auth = await requireMembership(id, userId);
  if (!auth.ok) return c.json({ error: auth.error }, auth.status);

  // Don't let the last teacher leave without transferring ownership
  if (auth.membership.role === "teacher") {
    const teachers = await db
      .select()
      .from(classroomMembers)
      .where(and(eq(classroomMembers.groupId, id), eq(classroomMembers.role, "teacher")));
    if (teachers.length === 1) {
      return c.json({ error: "Cannot leave as the only teacher. Delete the group or assign another teacher first." }, 400);
    }
  }

  await db
    .delete(classroomMembers)
    .where(and(eq(classroomMembers.groupId, id), eq(classroomMembers.userId, userId)));

  return c.json({ ok: true });
});

// DELETE /api/classroom/groups/:id/members/:userId — teacher removes a member
classroomRouter.delete("/groups/:id/members/:memberId", async (c) => {
  const requesterId = c.get("userId");
  const { id, memberId } = c.req.param();

  const auth = await requireMembership(id, requesterId, {
    role: "teacher",
    forbidden: "Only teachers can remove members",
  });
  if (!auth.ok) return c.json({ error: auth.error }, auth.status);

  // Can't remove yourself via this endpoint
  if (memberId === requesterId) {
    return c.json({ error: "Use the leave endpoint to remove yourself" }, 400);
  }

  await db
    .delete(classroomMembers)
    .where(and(eq(classroomMembers.groupId, id), eq(classroomMembers.userId, memberId)));

  return c.json({ ok: true });
});

// DELETE /api/classroom/assignments/:id — teacher deletes an assignment
classroomRouter.delete("/assignments/:id", async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.param();

  const [assignment] = await db
    .select()
    .from(classroomAssignments)
    .where(eq(classroomAssignments.id, id))
    .limit(1);

  if (!assignment) return c.json({ error: "Assignment not found" }, 404);

  const auth = await requireMembership(assignment.groupId, userId, {
    role: "teacher",
    forbidden: "Only teachers can delete assignments",
  });
  if (!auth.ok) return c.json({ error: auth.error }, auth.status);

  await db.delete(classroomAssignments).where(eq(classroomAssignments.id, id));
  return c.json({ ok: true });
});

// GET /api/classroom/dashboard — institution-level aggregate stats
classroomRouter.get("/dashboard", async (c) => {
  const userId = c.get("userId");

  // Groups the user manages (created by them)
  const myGroups = await db
    .select({ id: classroomGroups.id, languageId: classroomGroups.languageId })
    .from(classroomGroups)
    .where(eq(classroomGroups.createdBy, userId));

  const groupIds = myGroups.map((g) => g.id);

  let totalStudents = 0;
  if (groupIds.length > 0) {
    const memberRows = await db
      .select({ userId: classroomMembers.userId })
      .from(classroomMembers)
      .where(and(inArray(classroomMembers.groupId, groupIds), eq(classroomMembers.role, "student")));
    totalStudents = new Set(memberRows.map((m) => m.userId)).size;
  }

  const langCounts = myGroups.reduce<Record<string, number>>((acc, g) => {
    acc[g.languageId] = (acc[g.languageId] ?? 0) + 1;
    return acc;
  }, {});
  const popularLanguages = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([languageId, cnt]) => ({ languageId, count: cnt }));

  return c.json({
    totalStudents,
    totalGroups: myGroups.length,
    activeThisWeek: 0,
    popularLanguages,
    weeklyActivity: [],
  });
});
