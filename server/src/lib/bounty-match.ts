import { and, eq, sql, type SQL } from "drizzle-orm";
import { bounties } from "../db/schema.js";

/**
 * Conditions to find an ACTIVE, non-expired, unfilled bounty that a given
 * contribution fulfills. Used at approval time to credit the highest-reward
 * matching bounty (order by xpReward, limit 1 at the call site) when a
 * contribution has no explicit target bounty, or its target went stale.
 */
export function bountyMatchesContribution(
  languageId: string,
  category: string,
  type: string
): SQL | undefined {
  return and(
    eq(bounties.status, "active"),
    eq(bounties.languageId, languageId),
    sql`(${bounties.category} IS NULL OR ${bounties.category} = ${category})`,
    sql`(${bounties.contributionType} IS NULL OR ${bounties.contributionType} = ${type})`,
    sql`(${bounties.expiresAt} IS NULL OR ${bounties.expiresAt} > NOW())`,
    sql`${bounties.currentCount} < ${bounties.targetCount}`
  );
}
