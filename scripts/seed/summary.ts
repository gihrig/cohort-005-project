import { eq, gte, isNotNull, sql } from "drizzle-orm";
import * as schema from "../../app/db/schema";
import {
  CourseStatus,
  LessonProgressStatus,
  UserRole,
} from "../../app/db/schema";
import { countRows, daysAgo, type SeedDb } from "./helpers";

export function printSummary(db: SeedDb) {
  // ─── Summary ───

  const sevenDaysAgo = daysAgo(7);
  const oldestPurchase =
    db
      .select({ createdAt: sql<string>`min(${schema.purchases.createdAt})` })
      .from(schema.purchases)
      .get()?.createdAt ?? new Date().toISOString();
  const historyDays = Math.round(
    (Date.now() - Date.parse(oldestPurchase)) / 86_400_000
  );

  console.log("\n✓ Seed complete!");
  console.log(
    `  Users: ${countRows(db, schema.users)} (${countRows(db, schema.users, eq(schema.users.role, UserRole.Admin))} admin, ${countRows(db, schema.users, eq(schema.users.role, UserRole.Instructor))} instructors, ${countRows(db, schema.users, eq(schema.users.role, UserRole.Student))} students)`
  );
  console.log(`  Categories: ${countRows(db, schema.categories)}`);
  console.log(
    `  Courses: ${countRows(db, schema.courses)} (${countRows(db, schema.courses, eq(schema.courses.status, CourseStatus.Published))} published, ${countRows(db, schema.courses, eq(schema.courses.status, CourseStatus.Draft))} draft)`
  );
  console.log(
    `  Modules: ${countRows(db, schema.modules)}, lessons: ${countRows(db, schema.lessons)}`
  );
  console.log(
    `  Quizzes: ${countRows(db, schema.quizzes)}, attempts: ${countRows(db, schema.quizAttempts)}`
  );
  console.log(`  Enrollments: ${countRows(db, schema.enrollments)}`);
  console.log(`  Course ratings: ${countRows(db, schema.courseRatings)}`);
  console.log(`  Lesson comments: ${countRows(db, schema.comments)}`);
  console.log(
    `  Lesson progress: ${countRows(db, schema.lessonProgress)} (${countRows(db, schema.lessonProgress, eq(schema.lessonProgress.status, LessonProgressStatus.Completed))} completed)`
  );
  console.log(
    `  Video watch events: ${countRows(db, schema.videoWatchEvents)} (${countRows(db, schema.videoWatchEvents, eq(schema.videoWatchEvents.eventType, "progress"))} progress heartbeats)`
  );
  console.log(
    `  Purchases: ${countRows(db, schema.purchases)} (${countRows(db, schema.purchases, gte(schema.purchases.createdAt, sevenDaysAgo))} in the last 7 days), spanning ${historyDays} days`
  );
  console.log(
    `  Teams: ${countRows(db, schema.teams)}, coupons: ${countRows(db, schema.coupons)} (${countRows(db, schema.coupons, isNotNull(schema.coupons.redeemedByUserId))} redeemed)`
  );
}
