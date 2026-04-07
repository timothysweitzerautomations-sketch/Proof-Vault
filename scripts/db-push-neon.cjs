#!/usr/bin/env node
/**
 * Loads DATABASE_URL from .env.neon (gitignored) and runs prisma db push.
 * Create .env.neon with one line from Neon → Connection string, e.g.
 *   DATABASE_URL="postgresql://..."
 */
const { existsSync, readFileSync } = require("fs");
const { join } = require("path");
const { spawnSync } = require("child_process");

const root = join(__dirname, "..");
const neonPath = join(root, ".env.neon");

if (!existsSync(neonPath)) {
  console.error(`Missing ${neonPath}`);
  console.error(
    "Create it with your Neon URI (Neon dashboard → Connection string), for example:"
  );
  console.error('  DATABASE_URL="postgresql://USER:PASS@HOST/neondb?sslmode=require"');
  process.exit(1);
}

let databaseUrl;
for (const line of readFileSync(neonPath, "utf8").split("\n")) {
  const s = line.trim();
  if (!s || s.startsWith("#")) continue;
  const eq = s.indexOf("=");
  if (eq === -1) continue;
  const k = s.slice(0, eq).trim();
  if (k !== "DATABASE_URL") continue;
  let v = s.slice(eq + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  databaseUrl = v;
  break;
}

if (!databaseUrl) {
  console.error(".env.neon must include a DATABASE_URL= line.");
  process.exit(1);
}

const r = spawnSync("npx", ["prisma", "db", "push"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: databaseUrl },
  shell: true,
});
process.exit(r.status ?? 1);
