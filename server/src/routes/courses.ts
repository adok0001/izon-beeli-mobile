import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { courses } from "../db/schema.js";

export const coursesRouter = new Hono();

// GET /api/courses?languageId=
coursesRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId || languageId.length > 64) {
    return c.json({ error: "Valid languageId query param required" }, 400);
  }

  const result = await db
    .select()
    .from(courses)
    .where(eq(courses.languageId, languageId))
    .orderBy(asc(courses.order));

  return c.json(result);
});

// GET /api/courses/:id
coursesRouter.get("/:id", async (c) => {
  const { id } = c.req.param();

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  return c.json(course);
});
