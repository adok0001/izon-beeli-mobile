import { eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../../db/index.js";
import { courses } from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";

export const educatorCoursesRouter = new Hono<AuthEnv>();

// GET /educator/courses — available courses in educator's language scope
educatorCoursesRouter.get("/courses", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const rows = await db
    .select({ id: courses.id, title: courses.title, titleFr: courses.titleFr, description: courses.description, descriptionFr: courses.descriptionFr, languageId: courses.languageId, level: courses.level, order: courses.order, courseType: courses.courseType, isActive: courses.isActive })
    .from(courses)
    .where(!isAdmin && reviewerLanguages.length > 0 ? inArray(courses.languageId, reviewerLanguages) : undefined)
    .orderBy(courses.languageId, courses.order);

  return c.json(rows);
});

// PATCH /educator/courses/:id
educatorCoursesRouter.patch("/courses/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const courseId = c.req.param("id");
  const body = await c.req.json<{
    isActive?: boolean;
    title?: string;
    titleFr?: string | null;
    description?: string;
    descriptionFr?: string | null;
    level?: string;
    order?: number;
  }>();

  const [course] = await db.select({ languageId: courses.languageId }).from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) return c.json({ error: "Course not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(course.languageId)) return c.json({ error: "Forbidden" }, 403);

  const patch: Record<string, unknown> = {};
  if (body.isActive !== undefined) patch.isActive = body.isActive;
  if (body.title !== undefined) patch.title = body.title;
  if (body.titleFr !== undefined) patch.titleFr = body.titleFr;
  if (body.description !== undefined) patch.description = body.description;
  if (body.descriptionFr !== undefined) patch.descriptionFr = body.descriptionFr;
  if (body.level !== undefined) patch.level = body.level;
  if (body.order !== undefined) patch.order = body.order;

  if (Object.keys(patch).length === 0) return c.json({ error: "No fields to update" }, 400);

  await db.update(courses).set(patch).where(eq(courses.id, courseId));
  return c.json({ ok: true });
});
