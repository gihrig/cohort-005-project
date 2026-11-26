import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, seedBaseData, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import { CourseStatus, UserRole } from "~/db/schema";
import { markdown } from "~/lib/text";
import { createLandingPage, FEATURED_COURSE_LIMIT } from "../index.server";

let db: TestDb;
let base: ReturnType<typeof seedBaseData>;

beforeEach(() => {
  db = createTestDb();
  base = seedBaseData(db);
});

// ─── Fixtures ───
// No service writes courses, modules or lessons, so rows go in directly.
// Kept in one place so a schema change touches only this block.

let counter = 0;

function addInstructor(name: string) {
  counter += 1;
  return db
    .insert(schema.users)
    .values({
      name,
      email: `i${counter}@example.com`,
      role: UserRole.Instructor,
    })
    .returning()
    .get();
}

function addCategory(name: string) {
  counter += 1;
  return db
    .insert(schema.categories)
    .values({ name, slug: `cat-${counter}` })
    .returning()
    .get();
}

function addCourse(
  title: string,
  options: {
    status?: CourseStatus;
    createdAt?: string;
    instructorId?: number;
    categoryId?: number;
  } = {}
) {
  counter += 1;
  return db
    .insert(schema.courses)
    .values({
      title,
      slug: `course-${counter}`,
      description: `${title} description`,
      salesCopy: markdown(title),
      instructorId: options.instructorId ?? base.instructor.id,
      categoryId: options.categoryId ?? base.category.id,
      status: options.status ?? CourseStatus.Published,
      ...(options.createdAt ? { createdAt: options.createdAt } : {}),
    })
    .returning()
    .get();
}

function addLessons(courseId: number, count: number) {
  const mod = db
    .insert(schema.modules)
    .values({ courseId, title: "Module", position: 1 })
    .returning()
    .get();
  for (let i = 0; i < count; i++) {
    db.insert(schema.lessons)
      .values({ moduleId: mod.id, title: `Lesson ${i + 1}`, position: i + 1 })
      .run();
  }
}

function landing() {
  return createLandingPage(db).get();
}

describe("featured courses", () => {
  it("shows the published course with its instructor, category and lesson count", () => {
    addLessons(base.course.id, 2);
    addLessons(base.course.id, 3);

    expect(landing().featuredCourses).toEqual([
      {
        id: base.course.id,
        title: "Test Course",
        slug: "test-course",
        description: "A test course",
        coverImageUrl: null,
        instructorName: "Test Instructor",
        categoryName: "Programming",
        lessonCount: 5,
      },
    ]);
  });

  it("counts zero lessons for a course with none", () => {
    expect(landing().featuredCourses[0].lessonCount).toBe(0);
  });

  it("leaves out drafts and archived courses", () => {
    addCourse("Draft", { status: CourseStatus.Draft });
    addCourse("Archived", { status: CourseStatus.Archived });

    expect(landing().featuredCourses.map((c) => c.title)).toEqual([
      "Test Course",
    ]);
  });

  it("breaks a tie on creation time by showing the later course first", () => {
    const at = "2030-01-01T00:00:00.000Z";
    addCourse("First added", { createdAt: at });
    addCourse("Second added", { createdAt: at });

    expect(
      landing()
        .featuredCourses.slice(0, 2)
        .map((c) => c.title)
    ).toEqual(["Second added", "First added"]);
  });

  it("shows the newest published courses, newest first, up to the limit", () => {
    addCourse("Oldest", { createdAt: "2020-01-01T00:00:00.000Z" });
    addCourse("Middle", { createdAt: "2030-01-01T00:00:00.000Z" });
    addCourse("Newest", { createdAt: "2031-01-01T00:00:00.000Z" });
    addCourse("Newer", { createdAt: "2030-06-01T00:00:00.000Z" });

    expect(FEATURED_COURSE_LIMIT).toBe(4);
    expect(landing().featuredCourses.map((c) => c.title)).toEqual([
      "Newest",
      "Newer",
      "Middle",
      "Test Course",
    ]);
  });

  it("is empty when nothing is published", () => {
    db.delete(schema.courses).run();

    expect(landing().featuredCourses).toEqual([]);
  });
});

describe("catalogue stats", () => {
  it("counts published courses, their lessons, instructors and categories", () => {
    const olive = addInstructor("Olive");
    const design = addCategory("Design");
    addCategory("Unused");
    const second = addCourse("Second", {
      instructorId: olive.id,
      categoryId: design.id,
    });
    addCourse("Third", { instructorId: olive.id });
    addLessons(base.course.id, 2);
    addLessons(second.id, 4);

    expect(landing().stats).toEqual({
      courses: 3,
      lessons: 6,
      instructors: 2,
      categories: 2,
    });
  });

  it("ignores everything in an unpublished course", () => {
    const other = addInstructor("Other");
    const art = addCategory("Art");
    const draft = addCourse("Draft", {
      status: CourseStatus.Draft,
      instructorId: other.id,
      categoryId: art.id,
    });
    addLessons(draft.id, 7);

    expect(landing().stats).toEqual({
      courses: 1,
      lessons: 0,
      instructors: 1,
      categories: 1,
    });
  });

  it("is all zeroes when nothing is published", () => {
    db.delete(schema.courses).run();

    expect(landing().stats).toEqual({
      courses: 0,
      lessons: 0,
      instructors: 0,
      categories: 0,
    });
  });
});
