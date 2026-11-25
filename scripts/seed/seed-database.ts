import { seedCategories } from "./categories";
import { seedComments } from "./comments";
import { seedCourse1 } from "./course-1";
import { seedCourse2 } from "./course-2";
import { seedCourse3 } from "./course-3";
import { seedCourse4 } from "./course-4";
import { seedCourse5 } from "./course-5";
import { seedEnrollmentsAndRatings } from "./enrollments-and-ratings";
import { seedGeneratedHistory } from "./generated-history";
import type { SeedDb } from "./helpers";
import { seedProgressAndQuizAttempts } from "./progress-and-quiz-attempts";
import { seedPurchasesAndTeams } from "./purchases-and-teams";
import { seedQuizzes } from "./quizzes";
import { seedRefunds } from "./refunds";
import type { SeedContext } from "./seed-context";
import { printSummary } from "./summary";
import { seedFurtherTeamPurchases } from "./team-purchases";
import { seedUsers } from "./users";
import {
  addHandWrittenWatchSessions,
  createWatchEventLog,
  flushWatchEvents,
} from "./watch-events";

// Fills an empty, migrated database. The steps run in this order because row
// ids are autoincrement and the generated history draws from one PRNG: move a
// step and every id or roll after it changes.
export function seedDatabase(db: SeedDb) {
  const users = seedUsers(db);
  const catBySlug = seedCategories(db);
  const owners = { ...users, catBySlug };

  const { course: course1, lessonIds: course1LessonIds } = seedCourse1(
    db,
    owners
  );
  const { course: course2, lessonIds: course2LessonIds } = seedCourse2(
    db,
    owners
  );
  const { course: course3, lessonIds: course3LessonIds } = seedCourse3(
    db,
    owners
  );
  seedCourse4(db, owners);
  seedCourse5(db, owners);

  const quizzes = seedQuizzes(db, { course1LessonIds, course2LessonIds });

  const context: SeedContext = {
    ...users,
    ...quizzes,
    course1,
    course1LessonIds,
    course2,
    course2LessonIds,
    course3,
    course3LessonIds,
  };

  seedEnrollmentsAndRatings(db, context);
  seedComments(db, context);
  seedProgressAndQuizAttempts(db, context);

  const watchEvents = createWatchEventLog();
  addHandWrittenWatchSessions(context, watchEvents.addWatchSession);

  seedPurchasesAndTeams(db, context);
  seedGeneratedHistory(db, context, watchEvents.addWatchSession);
  const novakLicence = seedFurtherTeamPurchases(db, context);
  seedRefunds(db, context, novakLicence);

  flushWatchEvents(db, watchEvents.rows);

  printSummary(db);
}
