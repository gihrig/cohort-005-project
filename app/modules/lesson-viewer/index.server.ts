import { db } from "~/db";
import type { Db } from "./lib/db";
import {
  flattenCourseLessons,
  getCourseWithDetails,
  getLessonById,
  getModuleById,
  getUserById,
} from "./lib/course-outline";
import {
  calculateWatchProgress,
  getLastWatchPosition,
  getLessonProgress,
  getLessonProgressForCourse,
  markLessonComplete,
  markLessonInProgress,
} from "./lib/lesson-progress";
import {
  getCommentById,
  getLessonThread,
  renderThread,
} from "./lib/lesson-thread";
import {
  computeResult,
  getAttemptAnswers,
  getBestAttempt,
  getQuizById,
  getQuizByLessonId,
  getQuizWithQuestions,
} from "./lib/quiz";

export type { Db } from "./lib/db";
export type { FlatLesson } from "./lib/course-outline";
export type { CommentAuthor, ThreadComment } from "./lib/lesson-thread";
export type { QuestionResult } from "./lib/quiz";

/**
 * What the lesson page reads and writes, bound to a database. The app uses
 * `lessonViewer`, which reads the app database; tests build their own
 * against a test database.
 */
export function createLessonViewer(database: Db) {
  return {
    getCourseWithDetails: (id: number) => getCourseWithDetails(database, id),
    getLessonById: (id: number) => getLessonById(database, id),
    getModuleById: (id: number) => getModuleById(database, id),
    getUserById: (id: number) => getUserById(database, id),
    flattenCourseLessons,

    getLessonProgress: (userId: number, lessonId: number) =>
      getLessonProgress(database, userId, lessonId),
    getLessonProgressForCourse: (userId: number, courseId: number) =>
      getLessonProgressForCourse(database, userId, courseId),
    markLessonComplete: (userId: number, lessonId: number) =>
      markLessonComplete(database, userId, lessonId),
    markLessonInProgress: (userId: number, lessonId: number) =>
      markLessonInProgress(database, userId, lessonId),
    getLastWatchPosition: (userId: number, lessonId: number) =>
      getLastWatchPosition(database, userId, lessonId),
    calculateWatchProgress: (
      userId: number,
      lessonId: number,
      videoDurationSeconds: number
    ) =>
      calculateWatchProgress(database, userId, lessonId, videoDurationSeconds),

    getCommentById: (commentId: number) => getCommentById(database, commentId),
    getLessonThread: (lessonId: number) => getLessonThread(database, lessonId),
    renderThread,

    getQuizById: (quizId: number) => getQuizById(database, quizId),
    getQuizByLessonId: (lessonId: number) =>
      getQuizByLessonId(database, lessonId),
    getQuizWithQuestions: (quizId: number) =>
      getQuizWithQuestions(database, quizId),
    getBestAttempt: (userId: number, quizId: number) =>
      getBestAttempt(database, userId, quizId),
    getAttemptAnswers: (attemptId: number) =>
      getAttemptAnswers(database, attemptId),
    computeResult: (
      userId: number,
      quizId: number,
      selectedAnswers: Record<number, number>
    ) => computeResult(database, userId, quizId, selectedAnswers),
  };
}

// Pure so a route importing this only for its loader doesn't pull the
// database into the client bundle (see `~/db`).
export const lessonViewer = /* @__PURE__ */ createLessonViewer(db);
