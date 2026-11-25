import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "../app/db/schema";
import { existsSync } from "fs";
import { defaultNotifications } from "../app/lib/notifications.server";
import { syncAllUsers } from "../app/lib/notification-preferences.server";
import { seedDatabase } from "./seed/seed-database";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsFolder = path.resolve(__dirname, "../drizzle");

// Runs under tsx, not Vite, so load .env for the Knock keys ourselves.
const envFile = path.resolve(__dirname, "../.env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

async function seed() {
  console.log("Seeding database...");

  // Drop and recreate tables for a clean seed
  sqlite.exec(`
    DROP TABLE IF EXISTS bookmarks;
    DROP TABLE IF EXISTS notes;
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS course_ratings;
    DROP TABLE IF EXISTS video_watch_events;
    DROP TABLE IF EXISTS quiz_answers;
    DROP TABLE IF EXISTS quiz_attempts;
    DROP TABLE IF EXISTS quiz_options;
    DROP TABLE IF EXISTS quiz_questions;
    DROP TABLE IF EXISTS quizzes;
    DROP TABLE IF EXISTS lesson_progress;
    DROP TABLE IF EXISTS coupons;
    DROP TABLE IF EXISTS team_members;
    DROP TABLE IF EXISTS teams;
    DROP TABLE IF EXISTS refunds;
    DROP TABLE IF EXISTS purchases;
    DROP TABLE IF EXISTS enrollments;
    DROP TABLE IF EXISTS lessons;
    DROP TABLE IF EXISTS modules;
    DROP TABLE IF EXISTS courses;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS __drizzle_migrations;
  `);

  // Create tables using the same Drizzle migrations as the live database
  migrate(db, { migrationsFolder });

  console.log("Tables created.");

  seedDatabase(db);

  // ─── Sync users to Knock ───
  // Name, email, avatar, and default preferences for anyone without a set.
  if (process.env.KNOCK_SECRET_API_KEY) {
    const synced = await syncAllUsers(db, await defaultNotifications());
    console.log(`  Synced ${synced} users to Knock.`);
  } else {
    console.log("  Skipped Knock user sync: KNOCK_SECRET_API_KEY is not set.");
  }
}

seed().catch(console.error);
