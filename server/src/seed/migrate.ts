import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  // Drop our tables if they exist (in dependency order)
  console.log("Dropping existing tables...");
  const dropStatements = [
    "DROP TABLE IF EXISTS lesson_contribution_segments CASCADE",
    "DROP TABLE IF EXISTS lesson_contributions CASCADE",
    "DROP TABLE IF EXISTS word_bank CASCADE",
    "DROP TABLE IF EXISTS comments CASCADE",
    "DROP TABLE IF EXISTS likes CASCADE",
    "DROP TABLE IF EXISTS contributions CASCADE",
    "DROP TABLE IF EXISTS feed_items CASCADE",
    "DROP TABLE IF EXISTS journal_entries CASCADE",
    "DROP TABLE IF EXISTS user_progress CASCADE",
    "DROP TABLE IF EXISTS users CASCADE",
    "DROP TYPE IF EXISTS feed_item_type CASCADE",
    "DROP TYPE IF EXISTS contribution_type CASCADE",
    "DROP TYPE IF EXISTS contribution_status CASCADE",
    "DROP TYPE IF EXISTS lesson_contribution_status CASCADE",
  ];

  for (const stmt of dropStatements) {
    await sql.query(stmt);
  }
  console.log("  Done.");

  // Now run the migration
  const migrationPath = join(__dirname, "../../drizzle/0000_smart_crusher_hogan.sql");
  const migration = readFileSync(migrationPath, "utf-8");

  const statements = migration
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Running ${statements.length} migration statements...`);

  for (let i = 0; i < statements.length; i++) {
    try {
      await sql.query(statements[i]);
      console.log(`  [${i + 1}/${statements.length}] OK`);
    } catch (err: any) {
      console.error(`  [${i + 1}/${statements.length}] FAILED:`, err.message);
    }
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
