import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../../db/index.js";
import { languages, users } from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";

export const educatorMeRouter = new Hono<AuthEnv>();

// ─── GET /educator/me ─────────────────────────────────────────────────────────

educatorMeRouter.get("/me", async (c) => {
  const userId = c.get("userId");
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const reviewerRole = c.get("reviewerRole");

  const [user] = await db
    .select({ name: users.name, email: users.email, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Fetch full language objects so the UI can show names
  const allLangs = await db.select().from(languages);
  const scopedLangs = isAdmin ? allLangs : allLangs.filter((l) => reviewerLanguages.includes(l.id));

  return c.json({ ...user, id: userId, isAdmin, reviewerLanguages, reviewerRole, languages: scopedLangs });
});
