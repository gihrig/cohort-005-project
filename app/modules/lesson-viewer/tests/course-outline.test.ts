import { describe, it, expect } from "vitest";
import { UserRole } from "~/db/schema";
import { addCourse, addLesson, addModule, addUser, setup } from "./fixtures";

describe("getCourseWithDetails", () => {
  it("returns null for an unknown course", () => {
    const { viewer } = setup();
    expect(viewer.getCourseWithDetails(9999)).toBeNull();
  });

  it("joins the instructor and category, and nests lessons in their modules in order", () => {
    const { db, viewer, course, instructor, category } = setup();
    const second = addModule(db, {
      courseId: course.id,
      title: "Second",
      position: 2,
    });
    const first = addModule(db, {
      courseId: course.id,
      title: "First",
      position: 1,
    });
    const b = addLesson(db, { moduleId: first.id, title: "B", position: 2 });
    const a = addLesson(db, { moduleId: first.id, title: "A", position: 1 });
    const c = addLesson(db, { moduleId: second.id, title: "C", position: 1 });

    const details = viewer.getCourseWithDetails(course.id);

    expect(details).toMatchObject({
      id: course.id,
      title: course.title,
      slug: course.slug,
      instructorId: instructor.id,
      instructorName: instructor.name,
      categoryName: category.name,
    });
    expect(
      details?.modules.map((m) => ({
        id: m.id,
        lessons: m.lessons.map((l) => l.id),
      }))
    ).toEqual([
      { id: first.id, lessons: [a.id, b.id] },
      { id: second.id, lessons: [c.id] },
    ]);
  });

  it("gives a course with no modules an empty outline", () => {
    const { viewer, course } = setup();
    expect(viewer.getCourseWithDetails(course.id)?.modules).toEqual([]);
  });

  it("leaves out another course's modules and lessons", () => {
    const { db, viewer, course, instructor, category } = setup();
    const mod = addModule(db, { courseId: course.id, title: "M", position: 1 });
    addLesson(db, { moduleId: mod.id, title: "Mine", position: 1 });
    const other = viewer.getCourseWithDetails(course.id);
    expect(other?.modules).toHaveLength(1);

    const otherCourse = addCourse(db, {
      instructorId: instructor.id,
      categoryId: category.id,
    });
    const otherModule = addModule(db, {
      courseId: otherCourse.id,
      title: "Theirs",
      position: 1,
    });
    addLesson(db, { moduleId: otherModule.id, title: "Theirs", position: 1 });

    const details = viewer.getCourseWithDetails(course.id);
    expect(details?.modules.map((m) => m.title)).toEqual(["M"]);
    expect(details?.modules[0].lessons.map((l) => l.title)).toEqual(["Mine"]);
  });
});

describe("single-row lookups", () => {
  it("finds a lesson, a module and a user by id, and nothing for an unknown id", () => {
    const { db, viewer, course } = setup();
    const mod = addModule(db, { courseId: course.id, title: "M", position: 1 });
    const lesson = addLesson(db, { moduleId: mod.id, title: "L", position: 1 });
    const admin = addUser(db, "Ada Admin", UserRole.Admin);

    expect(viewer.getLessonById(lesson.id)?.title).toBe("L");
    expect(viewer.getModuleById(mod.id)?.title).toBe("M");
    expect(viewer.getUserById(admin.id)?.name).toBe("Ada Admin");
    expect(viewer.getLessonById(9999)).toBeUndefined();
    expect(viewer.getModuleById(9999)).toBeUndefined();
    expect(viewer.getUserById(9999)).toBeUndefined();
  });
});

describe("flattenCourseLessons", () => {
  it("lists every lesson in outline order with its module", () => {
    const { viewer } = setup();
    expect(
      viewer.flattenCourseLessons({
        modules: [
          {
            id: 1,
            title: "One",
            lessons: [
              { id: 10, title: "a", moduleId: 1 },
              { id: 11, title: "b", moduleId: 1 },
            ],
          },
          { id: 2, title: "Two", lessons: [] },
          {
            id: 3,
            title: "Three",
            lessons: [{ id: 30, title: "c", moduleId: 3 }],
          },
        ],
      })
    ).toEqual([
      { id: 10, title: "a", moduleId: 1, moduleTitle: "One" },
      { id: 11, title: "b", moduleId: 1, moduleTitle: "One" },
      { id: 30, title: "c", moduleId: 3, moduleTitle: "Three" },
    ]);
  });
});
