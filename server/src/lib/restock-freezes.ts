import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

const MAX_FREEZES = 5;

export async function restockPlusFreezes(): Promise<number> {
  const result = await db
    .update(users)
    .set({
      streakFreezes: sql`LEAST(${users.streakFreezes} + 1, ${MAX_FREEZES})`,
    })
    .where(eq(users.planTier, "plus"))
    .returning({ id: users.id });

  return result.length;
}
