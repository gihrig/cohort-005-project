import { afterEach, describe, it, expect, vi } from "vitest";
import { QuestionType } from "~/db/schema";
import {
  addLesson,
  addModule,
  addQuestion,
  addQuiz,
  addUser,
  setup,
} from "./fixtures";

function setupWithQuiz() {
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
  const quiz = addQuiz(fixture.db, { lessonId: lesson.id, title: "Check" });
  return { ...fixture, lesson, quiz };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("quiz lookups", () => {
  it("finds a lesson's quiz by lesson and by id", () => {
    const { viewer, lesson, quiz } = setupWithQuiz();
    expect(viewer.getQuizByLessonId(lesson.id)?.id).toBe(quiz.id);
    expect(viewer.getQuizById(quiz.id)?.lessonId).toBe(lesson.id);
    expect(viewer.getQuizByLessonId(9999)).toBeUndefined();
    expect(viewer.getQuizById(9999)).toBeUndefined();
  });

  it("loads a quiz's questions in order, each with its own options", () => {
    const { db, viewer, quiz } = setupWithQuiz();
    const second = addQuestion(db, {
      quizId: quiz.id,
      position: 2,
      options: ["c", "d"],
      correct: 0,
    });
    const first = addQuestion(db, {
      quizId: quiz.id,
      position: 1,
      options: ["a", "b"],
      correct: 1,
    });

    const loaded = viewer.getQuizWithQuestions(quiz.id);

    expect(loaded?.title).toBe("Check");
    expect(
      loaded?.questions.map((q) => [q.id, q.options.map((o) => o.optionText)])
    ).toEqual([
      [first.question.id, ["a", "b"]],
      [second.question.id, ["c", "d"]],
    ]);
    expect(viewer.getQuizWithQuestions(9999)).toBeNull();
  });
});

describe("getBestAttempt", () => {
  it("returns the person's highest-scoring attempt", () => {
    const { db, viewer, user, quiz } = setupWithQuiz();
    const q = addQuestion(db, {
      quizId: quiz.id,
      position: 1,
      options: ["right", "wrong"],
      correct: 0,
    });
    const someoneElse = addUser(db, "Someone Else");
    expect(viewer.getBestAttempt(user.id, quiz.id)).toBeUndefined();

    viewer.computeResult(user.id, quiz.id, {
      [q.question.id]: q.options[1].id,
    });
    const best = viewer.computeResult(user.id, quiz.id, {
      [q.question.id]: q.options[0].id,
    });
    viewer.computeResult(user.id, quiz.id, {
      [q.question.id]: q.options[1].id,
    });

    expect(viewer.getBestAttempt(user.id, quiz.id)?.id).toBe(best?.attemptId);
    expect(viewer.getBestAttempt(someoneElse.id, quiz.id)).toBeUndefined();
  });
});

describe("computeResult", () => {
  it("scores each answer, records the attempt and the answers given", () => {
    const { db, viewer, user, quiz } = setupWithQuiz();
    const mc = addQuestion(db, {
      quizId: quiz.id,
      position: 1,
      options: ["a", "b", "c"],
      correct: 2,
    });
    const tf = addQuestion(db, {
      quizId: quiz.id,
      position: 2,
      questionType: QuestionType.TrueFalse,
      options: ["True", "False"],
      correct: 1,
    });
    const wrong = addQuestion(db, {
      quizId: quiz.id,
      position: 3,
      options: ["a", "b"],
      correct: 0,
    });
    const skipped = addQuestion(db, {
      quizId: quiz.id,
      position: 4,
      options: ["a", "b"],
      correct: 0,
    });

    const result = viewer.computeResult(user.id, quiz.id, {
      [mc.question.id]: mc.options[2].id,
      [tf.question.id]: tf.options[1].id,
      [wrong.question.id]: wrong.options[1].id,
    });

    expect(result).toMatchObject({
      score: 0.5,
      passed: false,
      grade: "F",
      totalCorrect: 2,
      totalQuestions: 4,
      questionResults: [
        {
          questionId: mc.question.id,
          correct: true,
          selectedOptionId: mc.options[2].id,
          correctOptionId: mc.options[2].id,
        },
        {
          questionId: tf.question.id,
          correct: true,
          selectedOptionId: tf.options[1].id,
          correctOptionId: tf.options[1].id,
        },
        {
          questionId: wrong.question.id,
          correct: false,
          selectedOptionId: wrong.options[1].id,
          correctOptionId: wrong.options[0].id,
        },
        {
          questionId: skipped.question.id,
          correct: false,
          selectedOptionId: null,
          correctOptionId: null,
        },
      ],
    });
    const attempt = viewer.getBestAttempt(user.id, quiz.id);
    expect(attempt).toMatchObject({
      id: result?.attemptId,
      score: 0.5,
      passed: false,
    });
    expect(viewer.getAttemptAnswers(attempt?.id ?? 0)).toEqual([
      { questionId: mc.question.id, selectedOptionId: mc.options[2].id },
      { questionId: tf.question.id, selectedOptionId: tf.options[1].id },
      { questionId: wrong.question.id, selectedOptionId: wrong.options[1].id },
    ]);
  });

  it.each([
    [10, "A", true],
    [9, "A", true],
    [8, "B", true],
    [7, "C", false],
    [6, "D", false],
    [5, "F", false],
  ])(
    "grades %i correct out of 10 as %s (passed: %s)",
    (correctCount, grade, passed) => {
      const { db, viewer, user, quiz } = setupWithQuiz();
      const answers: Record<number, number> = {};
      for (let position = 1; position <= 10; position++) {
        const q = addQuestion(db, {
          quizId: quiz.id,
          position,
          options: ["right", "wrong"],
          correct: 0,
        });
        answers[q.question.id] = q.options[position <= correctCount ? 0 : 1].id;
      }

      const result = viewer.computeResult(user.id, quiz.id, answers);

      expect(result).toMatchObject({
        score: correctCount / 10,
        grade,
        passed,
        totalCorrect: correctCount,
      });
    }
  );

  it("scores a quiz with no questions as zero", () => {
    const { viewer, user, quiz } = setupWithQuiz();
    expect(viewer.computeResult(user.id, quiz.id, {})).toMatchObject({
      score: 0,
      passed: false,
      grade: "F",
      totalCorrect: 0,
      totalQuestions: 0,
      questionResults: [],
    });
  });

  it("returns null for an unknown quiz", () => {
    const { viewer, user } = setupWithQuiz();
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(viewer.computeResult(user.id, 9999, {})).toBeNull();
    expect(logged).toHaveBeenCalledWith("quiz not found");
  });

  it("records no attempt when an answer cannot be stored", () => {
    const { db, viewer, user, quiz } = setupWithQuiz();
    const q = addQuestion(db, {
      quizId: quiz.id,
      position: 1,
      options: ["a", "b"],
      correct: 0,
    });
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      viewer.computeResult(user.id, quiz.id, { [q.question.id]: 9999 })
    ).toBeNull();
    expect(logged).toHaveBeenCalledWith(expect.any(Error));
    expect(viewer.getBestAttempt(user.id, quiz.id)).toBeUndefined();
  });
});
