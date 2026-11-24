import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb, seedBaseData, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";

// The lesson-viewer module reads the app's shared `db`, so point it at a
// fresh in-memory database for each test.
const testDb = vi.hoisted(() => ({ current: undefined as unknown }));
vi.mock("~/db", () => ({
  db: new Proxy(
    {},
    {
      get(_target, prop) {
        const target = testDb.current as TestDb;
        const value = Reflect.get(target, prop);
        return typeof value === "function" ? value.bind(target) : value;
      },
    }
  ),
}));

const { getLessonQuiz } = await import("../quiz.server");

let db: TestDb;
let lessonId: number;
let otherLessonId: number;
let quizId: number;

function addLesson(moduleId: number, position: number) {
  return db
    .insert(schema.lessons)
    .values({ moduleId, title: `Lesson ${position}`, position })
    .returning()
    .get().id;
}

beforeEach(() => {
  db = createTestDb();
  testDb.current = db;
  const { course } = seedBaseData(db);
  const mod = db
    .insert(schema.modules)
    .values({ courseId: course.id, title: "Module", position: 1 })
    .returning()
    .get();
  lessonId = addLesson(mod.id, 1);
  otherLessonId = addLesson(mod.id, 2);
  quizId = db
    .insert(schema.quizzes)
    .values({ lessonId, title: "Quiz", passingScore: 0.7 })
    .returning()
    .get().id;
});

describe("getLessonQuiz", () => {
  it("returns the quiz when it belongs to the lesson", () => {
    expect(getLessonQuiz(quizId, lessonId)).toMatchObject({
      id: quizId,
      lessonId,
    });
  });

  it("treats a quiz from another lesson as missing", () => {
    expect(getLessonQuiz(quizId, otherLessonId)).toBeUndefined();
  });

  it("treats an unknown quiz id as missing", () => {
    expect(getLessonQuiz(quizId + 1, lessonId)).toBeUndefined();
  });
});
