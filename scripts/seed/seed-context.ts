import type { Course } from "./helpers";
import type { seedQuizzes } from "./quizzes";
import type { SeededUsers } from "./users";

// Everything the later seed steps look up from the earlier ones: the users,
// the courses with their lesson ids in course order, and the quizzes.
export type SeedContext = SeededUsers &
  ReturnType<typeof seedQuizzes> & {
    course1: Course;
    course1LessonIds: number[];
    course2: Course;
    course2LessonIds: number[];
    course3: Course;
    course3LessonIds: number[];
  };
