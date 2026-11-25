import { createTestDb, seedBaseData, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import { QuestionType, UserRole } from "~/db/schema";
import { markdown } from "~/lib/text";
import { createLessonViewer } from "../index.server";

// Nothing in the module writes courses, lessons, quizzes, comments or watch
// events, so these fixtures insert rows directly. Kept in one place so a
// schema change touches only this file.

export function setup() {
  const db = createTestDb();
  const base = seedBaseData(db);
  return { db, ...base, viewer: createLessonViewer(db) };
}

export function addUser(db: TestDb, name: string, role = UserRole.Student) {
  return db
    .insert(schema.users)
    .values({
      name,
      email: `${name.toLowerCase().replaceAll(" ", ".")}@example.com`,
      role,
    })
    .returning()
    .get();
}

export function addCourse(
  db: TestDb,
  values: { instructorId: number; categoryId: number }
) {
  return db
    .insert(schema.courses)
    .values({
      ...values,
      title: "Other Course",
      slug: "other-course",
      description: "Another course",
      salesCopy: markdown("Another course"),
      status: schema.CourseStatus.Published,
    })
    .returning()
    .get();
}

export function addModule(
  db: TestDb,
  values: { courseId: number; title: string; position: number }
) {
  return db.insert(schema.modules).values(values).returning().get();
}

export function addLesson(
  db: TestDb,
  values: {
    moduleId: number;
    title: string;
    position: number;
    videoUrl?: string;
    durationMinutes?: number;
  }
) {
  return db.insert(schema.lessons).values(values).returning().get();
}

export function addWatchEvent(
  db: TestDb,
  values: {
    userId: number;
    lessonId: number;
    positionSeconds: number;
    createdAt: string;
  }
) {
  return db
    .insert(schema.videoWatchEvents)
    .values({ ...values, eventType: "progress" })
    .returning()
    .get();
}

export function addComment(
  db: TestDb,
  values: {
    lessonId: number;
    userId: number;
    body: string;
    parentId?: number;
    createdAt?: string;
    editedAt?: string;
    deletedAt?: string;
  }
) {
  return db
    .insert(schema.comments)
    .values({ ...values, body: markdown(values.body) })
    .returning()
    .get();
}

export function addQuiz(
  db: TestDb,
  values: { lessonId: number; title?: string; passingScore?: number }
) {
  return db
    .insert(schema.quizzes)
    .values({ title: "Quiz", passingScore: 0.7, ...values })
    .returning()
    .get();
}

/** A question with its options; `correct` is the index of the right one. */
export function addQuestion(
  db: TestDb,
  values: {
    quizId: number;
    position: number;
    questionType?: QuestionType;
    options: string[];
    correct: number;
  }
) {
  const question = db
    .insert(schema.quizQuestions)
    .values({
      quizId: values.quizId,
      questionText: `Question ${values.position}`,
      questionType: values.questionType ?? QuestionType.MultipleChoice,
      position: values.position,
    })
    .returning()
    .get();
  const options = values.options.map((optionText, index) =>
    db
      .insert(schema.quizOptions)
      .values({
        questionId: question.id,
        optionText,
        isCorrect: index === values.correct,
      })
      .returning()
      .get()
  );
  return { question, options };
}
