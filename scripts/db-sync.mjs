// Safe database sync for builds.
//
// Runs `prisma db push` WITHOUT --accept-data-loss. Prisma then applies only
// non-destructive schema changes (new tables, new columns, new indexes...).
// If a change would delete data (dropping a column or table, etc.), Prisma refuses,
// this script fails the build, and Vercel keeps the previous version live —
// your data stays untouched. Make destructive changes deliberately, by hand.
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  console.error(`
==========================================================================
  DATABASE SYNC STOPPED — the build was cancelled to protect your data.

  Prisma refused to apply the schema change automatically, most likely
  because it would delete data (or a new unique rule conflicts with
  existing rows). The live site keeps running the previous version.

  Read the Prisma message above, fix the data or apply the change by
  hand, then redeploy.
==========================================================================
`);
  process.exit(1);
}
