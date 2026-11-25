import { describe, it, expect } from "vitest";
import { LessonProgressStatus } from "~/db/schema";
import {
  addCourse,
  addLesson,
  addModule,
  addUser,
  addWatchEvent,
  setup,
} from "./fixtures";

function setupWithLessons() {
  const fixture = setup();
  const mod = addModule(fixture.db, {
    courseId: fixture.course.id,
    title: "M",
    position: 1,
  });
  const lesson = addLesson(fixture.db, {
    moduleId: mod.id,
    title: "L1",
    position: 1,
  });
  const other = addLesson(fixture.db, {
    moduleId: mod.id,
    title: "L2",
    position: 2,
  });
  return { ...fixture, lesson, other };
}

describe("lesson progress", () => {
  it("has no progress until the lesson is viewed", () => {
    const { viewer, user, lesson } = setupWithLessons();
    expect(viewer.getLessonProgress(user.id, lesson.id)).toBeUndefined();
  });

  it("marks a viewed lesson in progress, once", () => {
    const { viewer, user, lesson, course } = setupWithLessons();
    viewer.markLessonInProgress(user.id, lesson.id);
    const again = viewer.markLessonInProgress(user.id, lesson.id);

    expect(again.status).toBe(LessonProgressStatus.InProgress);
    expect(viewer.getLessonProgress(user.id, lesson.id)?.status).toBe(
      LessonProgressStatus.InProgress
    );
    expect(viewer.getLessonProgressForCourse(user.id, course.id)).toHaveLength(
      1
    );
  });

  it("marks a lesson complete with a completion time, from scratch or from in progress", () => {
    const { viewer, user, lesson, other, course } = setupWithLessons();
    const fresh = viewer.markLessonComplete(user.id, other.id);
    viewer.markLessonInProgress(user.id, lesson.id);
    const upgraded = viewer.markLessonComplete(user.id, lesson.id);

    for (const row of [fresh, upgraded]) {
      expect(row.status).toBe(LessonProgressStatus.Completed);
      expect(row.completedAt).toEqual(expect.any(String));
    }
    expect(viewer.getLessonProgressForCourse(user.id, course.id)).toHaveLength(
      2
    );
  });

  it("keeps a completed lesson completed when it is viewed again", () => {
    const { viewer, user, lesson } = setupWithLessons();
    const completed = viewer.markLessonComplete(user.id, lesson.id);
    const viewed = viewer.markLessonInProgress(user.id, lesson.id);

    expect(viewed).toEqual(completed);
    expect(viewer.getLessonProgress(user.id, lesson.id)?.status).toBe(
      LessonProgressStatus.Completed
    );
  });

  it("scopes progress to the person and the lesson", () => {
    const { db, viewer, user, lesson, other } = setupWithLessons();
    const someoneElse = addUser(db, "Someone Else");
    viewer.markLessonComplete(someoneElse.id, lesson.id);
    viewer.markLessonInProgress(user.id, other.id);

    expect(viewer.getLessonProgress(user.id, lesson.id)).toBeUndefined();
    expect(viewer.getLessonProgress(someoneElse.id, other.id)).toBeUndefined();
  });
});

describe("getLessonProgressForCourse", () => {
  it("is empty for a course with no modules, or modules with no lessons, whatever the person did elsewhere", () => {
    const { db, viewer, user, instructor, category, course } = setup();
    const otherCourse = addCourse(db, {
      instructorId: instructor.id,
      categoryId: category.id,
    });
    const otherModule = addModule(db, {
      courseId: otherCourse.id,
      title: "X",
      position: 1,
    });
    const elsewhere = addLesson(db, {
      moduleId: otherModule.id,
      title: "X1",
      position: 1,
    });
    viewer.markLessonComplete(user.id, elsewhere.id);

    expect(viewer.getLessonProgressForCourse(user.id, course.id)).toEqual([]);
    addModule(db, { courseId: course.id, title: "Empty", position: 1 });
    expect(viewer.getLessonProgressForCourse(user.id, course.id)).toEqual([]);
  });

  it("returns this person's progress on this course's lessons only", () => {
    const { db, viewer, user, instructor, category, course, lesson, other } =
      setupWithLessons();
    const otherCourse = addCourse(db, {
      instructorId: instructor.id,
      categoryId: category.id,
    });
    const otherModule = addModule(db, {
      courseId: otherCourse.id,
      title: "X",
      position: 1,
    });
    const elsewhere = addLesson(db, {
      moduleId: otherModule.id,
      title: "X1",
      position: 1,
    });
    const someoneElse = addUser(db, "Someone Else");

    viewer.markLessonComplete(user.id, lesson.id);
    viewer.markLessonInProgress(user.id, other.id);
    viewer.markLessonComplete(user.id, elsewhere.id);
    viewer.markLessonComplete(someoneElse.id, lesson.id);

    const records = viewer.getLessonProgressForCourse(user.id, course.id);
    expect(
      records
        .map((r) => [r.lessonId, r.status])
        .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    ).toEqual(
      [
        [lesson.id, LessonProgressStatus.Completed],
        [other.id, LessonProgressStatus.InProgress],
      ].sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    );
  });
});

describe("video watch state", () => {
  it("resumes from the most recent position, not the furthest", () => {
    const { db, viewer, user, lesson } = setupWithLessons();
    expect(viewer.getLastWatchPosition(user.id, lesson.id)).toBe(0);

    addWatchEvent(db, {
      userId: user.id,
      lessonId: lesson.id,
      positionSeconds: 300,
      createdAt: "2026-01-01T10:00:00.000Z",
    });
    addWatchEvent(db, {
      userId: user.id,
      lessonId: lesson.id,
      positionSeconds: 120,
      createdAt: "2026-01-01T11:00:00.000Z",
    });

    expect(viewer.getLastWatchPosition(user.id, lesson.id)).toBe(120);
  });

  it("reports the furthest position as a rounded percentage, capped at 100", () => {
    const { db, viewer, user, lesson } = setupWithLessons();
    expect(viewer.calculateWatchProgress(user.id, lesson.id, 600)).toBe(0);

    addWatchEvent(db, {
      userId: user.id,
      lessonId: lesson.id,
      positionSeconds: 200,
      createdAt: "2026-01-01T10:00:00.000Z",
    });
    addWatchEvent(db, {
      userId: user.id,
      lessonId: lesson.id,
      positionSeconds: 100,
      createdAt: "2026-01-01T11:00:00.000Z",
    });

    expect(viewer.calculateWatchProgress(user.id, lesson.id, 600)).toBe(33);
    expect(viewer.calculateWatchProgress(user.id, lesson.id, 300)).toBe(67);
    expect(viewer.calculateWatchProgress(user.id, lesson.id, 150)).toBe(100);
  });

  it("reports no progress for a video with no duration", () => {
    const { db, viewer, user, lesson } = setupWithLessons();
    addWatchEvent(db, {
      userId: user.id,
      lessonId: lesson.id,
      positionSeconds: 10,
      createdAt: "2026-01-01T10:00:00.000Z",
    });
    expect(viewer.calculateWatchProgress(user.id, lesson.id, 0)).toBe(0);
    expect(viewer.calculateWatchProgress(user.id, lesson.id, -60)).toBe(0);
  });

  it("scopes watch events to the person and the lesson", () => {
    const { db, viewer, user, lesson, other } = setupWithLessons();
    const someoneElse = addUser(db, "Someone Else");
    addWatchEvent(db, {
      userId: someoneElse.id,
      lessonId: lesson.id,
      positionSeconds: 50,
      createdAt: "2026-01-01T10:00:00.000Z",
    });
    addWatchEvent(db, {
      userId: user.id,
      lessonId: other.id,
      positionSeconds: 60,
      createdAt: "2026-01-01T10:00:00.000Z",
    });

    expect(viewer.getLastWatchPosition(user.id, lesson.id)).toBe(0);
    expect(viewer.calculateWatchProgress(user.id, lesson.id, 100)).toBe(0);
  });
});
