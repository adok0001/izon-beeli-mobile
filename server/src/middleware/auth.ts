import { createMiddleware } from "hono/factory";
import { verifyToken } from "@clerk/backend";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY environment variable is required");
}

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

export type AuthEnv = {
  Variables: {
    userId: string;
    clerkId: string;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyToken(token, { secretKey: clerkSecretKey });

    const clerkId = payload.sub;
    if (!clerkId) {
      return c.json({ error: "Invalid token" }, 401);
    }

    // Look up or auto-create internal user
    let [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          clerkId,
          name: "Learner",
          email: "",
          selectedLanguageId: "izon",
        })
        .returning({ id: users.id });
    }

    c.set("userId", user.id);
    c.set("clerkId", clerkId);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});
