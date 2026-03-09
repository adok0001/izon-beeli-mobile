import { Hono } from "hono";
import { eq, and, inArray, count, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  classroomGroups,
  classroomMembers,
  classroomAssignments,
  users,
  userProgress,
  lessons,
} from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

export const classroomRouter = new Hono<AuthEnv>();
classroomRouter.use("*", authMiddleware);

/** Generate a random 6-character alphanumeric invite code */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
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

  const result = groups.map((g) => ({
    ...g,
    members: (membersByGroup[g.id] ?? []).map((m) => ({
      id: m.userId,
      userId: m.userId,
      name: m.name ?? "User",
      role: m.role,
      lessonsCompleted: 0,
      streak: 0,
      points: 0,
    })),
  }));

  return c.json(result);
});

// POST /api/classroom/groups — create a new group
classroomRouter.post("/groups", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ name: string; languageId: string }>();
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
  const body = await c.req.json<{ inviteCode?: string; role?: string }>().catch(() => ({}));

  const [group] = await db
    .select()
    .from(classroomGroups)
    .where(eq(classroomGroups.id, id))
    .limit(1);

  if (!group) return c.json({ error: "Group not found" }, 404);

  if (body.inviteCode && group.inviteCode.toUpperCase() !== body.inviteCode.trim().toUpperCase()) {
    return c.json({ error: "Invalid invite code" }, 400);
  }

  // Check if already a member
  const [existing] = await db
    .select()
    .from(classroomMembers)
    .where(and(eq(classroomMembers.groupId, id), eq(classroomMembers.userId, userId)))
    .limit(1);

  if (existing) return c.json({ ...group, alreadyMember: true });

  const role = (body.role === "teacher" || body.role === "parent") ? body.role : "student";
  await db.insert(classroomMembers).values({ groupId: id, userId, role });

  return c.json(group, 201);
});

// POST /api/classroom/groups/join-by-code — join via bare invite code
classroomRouter.post("/groups/join-by-code", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ inviteCode: string }>();
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

  await db.insert(classroomMembers).values({ groupId: group.id, userId, role: "student" });
  return c.json(group, 201);
});

// POST /api/classroom/assignments — assign a lesson to a group
classroomRouter.post("/assignments", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ groupId: string; lessonId: string; dueDate?: string }>();
  const { groupId, lessonId, dueDate } = body;

  if (!groupId || !lessonId) {
    return c.json({ error: "groupId and lessonId are required" }, 400);
  }

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
  const { id } = c.req.param();

  const assignments = await db
    .select()
    .from(classroomAssignments)
    .where(eq(classroomAssignments.groupId, id))
    .orderBy(desc(classroomAssignments.createdAt));

  return c.json(assignments);
});

// GET /api/classroom/groups/:id/progress — per-member completion stats
classroomRouter.get("/groups/:id/progress", async (c) => {
  const { id } = c.req.param();

  // Get all members of the group
  const members = await db
    .select({
      userId: classroomMembers.userId,
      role: classroomMembers.role,
      name: users.name,
    })
    .from(classroomMembers)
    .leftJoin(users, eq(classroomMembers.userId, users.id))
    .where(eq(classroomMembers.groupId, id));

  if (members.length === 0) return c.json([]);

  // Fetch progress for all members
  const memberUserIds = members.map((m) => m.userId);
  const progress = await db
    .select({
      userId: userProgress.userId,
      streak: userProgress.streak,
      points: userProgress.points,
      completedCount: count(userProgress.id),
    })
    .from(userProgress)
    .where(
      and(
        inArray(userProgress.userId, memberUserIds),
        eq(userProgress.completed, true)
      )
    )
    .groupBy(userProgress.userId, userProgress.streak, userProgress.points);

  const progressByUser = progress.reduce<Record<string, (typeof progress)[0]>>(
    (acc, p) => { acc[p.userId] = p; return acc; },
    {}
  );

  // Get assignments for this group to check completion
  const assignments = await db
    .select({ lessonId: classroomAssignments.lessonId })
    .from(classroomAssignments)
    .where(eq(classroomAssignments.groupId, id));

  const assignedLessonIds = assignments.map((a) => a.lessonId);

  const result = members.map((m) => {
    const p = progressByUser[m.userId];
    const overdueLessons = 0; // Would need dueDate comparison to compute
    return {
      userId: m.userId,
      name: m.name ?? "User",
      role: m.role,
      lessonsCompleted: Number(p?.completedCount ?? 0),
      streak: p?.streak ?? 0,
      points: p?.points ?? 0,
      assignedCount: assignedLessonIds.length,
      overdueLessons,
    };
  });

  return c.json(result);
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
