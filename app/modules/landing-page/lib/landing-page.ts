import { and, countDistinct, desc, eq, inArray, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "~/db/schema";
import { CourseStatus } from "~/db/schema";

const { categories, courses, lessons, modules, users } = schema;

export type Db = BetterSQLite3Database<typeof schema>;

export const FEATURED_COURSE_LIMIT = 4;

export type FeaturedCourse = {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  instructorName: string;
  categoryName: string;
  lessonCount: number;
};

export type CatalogueStats = {
  courses: number;
  lessons: number;
  instructors: number;
  categories: number;
};

export type LandingPage = {
  featuredCourses: FeaturedCourse[];
  stats: CatalogueStats;
};

function getFeaturedCourses(db: Db): FeaturedCourse[] {
  const newest = db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      description: courses.description,
      coverImageUrl: courses.coverImageUrl,
      instructorName: users.name,
      categoryName: categories.name,
    })
    .from(courses)
    .innerJoin(users, eq(courses.instructorId, users.id))
    .innerJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.status, CourseStatus.Published))
    .orderBy(desc(courses.createdAt), desc(courses.id))
    .limit(FEATURED_COURSE_LIMIT)
    .all();

  const lessonCounts = new Map(
    db
      .select({ courseId: modules.courseId, count: sql<number>`count(*)` })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .where(
        inArray(
          modules.courseId,
          newest.map((course) => course.id)
        )
      )
      .groupBy(modules.courseId)
      .all()
      .map((row) => [row.courseId, row.count])
  );

  return newest.map((course) => ({
    ...course,
    lessonCount: lessonCounts.get(course.id) ?? 0,
  }));
}

// Both queries aggregate without GROUP BY, so SQLite returns exactly one row
// even when no course is published: the first row is always there.
function getCatalogueStats(db: Db): CatalogueStats {
  const published = eq(courses.status, CourseStatus.Published);

  const [catalogue] = db
    .select({
      courses: countDistinct(courses.id),
      instructors: countDistinct(courses.instructorId),
      categories: countDistinct(courses.categoryId),
    })
    .from(courses)
    .where(published)
    .all();

  const [lessonTotal] = db
    .select({ count: sql<number>`count(*)` })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, and(eq(modules.courseId, courses.id), published))
    .all();

  return { ...catalogue, lessons: lessonTotal.count };
}

export function getLandingPage(db: Db): LandingPage {
  return {
    featuredCourses: getFeaturedCourses(db),
    stats: getCatalogueStats(db),
  };
}
