import Database from "better-sqlite3";
import { eq, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "../../app/db/schema";
import { LessonProgressStatus, RefundStatus } from "../../app/db/schema";
import { countRows } from "./helpers";
import { seedDatabase } from "./seed-database";

const migrationsFolder = fileURLToPath(
  new URL("../../drizzle", import.meta.url)
);

function seededDatabase() {
  const db = drizzle(new Database(":memory:"), { schema });
  migrate(db, { migrationsFolder });
  seedDatabase(db);
  return db;
}

describe("seedDatabase", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      now: new Date("2026-11-25T12:00:00.000Z"),
      toFake: ["Date"],
    });
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // These are the counts `npm run db:seed` printed before the script was split
  // into scripts/seed/. A step that moves, or runs out of order, changes them.
  it("writes the same number of rows to every table", () => {
    const db = seededDatabase();

    expect({
      users: countRows(db, schema.users),
      categories: countRows(db, schema.categories),
      courses: countRows(db, schema.courses),
      modules: countRows(db, schema.modules),
      lessons: countRows(db, schema.lessons),
      quizzes: countRows(db, schema.quizzes),
      quizQuestions: countRows(db, schema.quizQuestions),
      quizAttempts: countRows(db, schema.quizAttempts),
      enrollments: countRows(db, schema.enrollments),
      courseRatings: countRows(db, schema.courseRatings),
      comments: countRows(db, schema.comments),
      lessonProgress: countRows(db, schema.lessonProgress),
      completedLessons: countRows(
        db,
        schema.lessonProgress,
        eq(schema.lessonProgress.status, LessonProgressStatus.Completed)
      ),
      videoWatchEvents: countRows(db, schema.videoWatchEvents),
      progressHeartbeats: countRows(
        db,
        schema.videoWatchEvents,
        eq(schema.videoWatchEvents.eventType, "progress")
      ),
      purchases: countRows(db, schema.purchases),
      teams: countRows(db, schema.teams),
      coupons: countRows(db, schema.coupons),
      redeemedCoupons: countRows(
        db,
        schema.coupons,
        isNotNull(schema.coupons.redeemedByUserId)
      ),
      refunds: countRows(db, schema.refunds),
    }).toEqual({
      users: 44,
      categories: 5,
      courses: 5,
      modules: 17,
      lessons: 59,
      quizzes: 3,
      quizQuestions: 8,
      quizAttempts: 10,
      enrollments: 66,
      courseRatings: 7,
      comments: 15,
      lessonProgress: 509,
      completedLessons: 462,
      videoWatchEvents: 5780,
      progressHeartbeats: 5590,
      purchases: 61,
      teams: 3,
      coupons: 17,
      redeemedCoupons: 8,
      refunds: 2,
    });
  });

  it("generates the same history on every run", () => {
    const purchasesOf = (db: ReturnType<typeof seededDatabase>) =>
      db.select().from(schema.purchases).all();

    expect(purchasesOf(seededDatabase())).toEqual(
      purchasesOf(seededDatabase())
    );
  });

  it("opens Liam's refund request against his purchase of the TypeScript course", () => {
    const db = seededDatabase();

    const [liamRefund] = db
      .select({
        email: schema.users.email,
        slug: schema.courses.slug,
        status: schema.refunds.status,
      })
      .from(schema.refunds)
      .innerJoin(
        schema.purchases,
        eq(schema.refunds.purchaseId, schema.purchases.id)
      )
      .innerJoin(schema.users, eq(schema.purchases.userId, schema.users.id))
      .innerJoin(
        schema.courses,
        eq(schema.purchases.courseId, schema.courses.id)
      )
      .where(eq(schema.users.email, "liam@example.com"))
      .all();

    expect(liamRefund).toEqual({
      email: "liam@example.com",
      slug: "introduction-to-typescript",
      status: RefundStatus.Open,
    });
  });
});
