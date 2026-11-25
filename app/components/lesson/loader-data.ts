import type { Route } from "../../routes/+types/courses.$slug.lessons.$lessonId";

// Derived from the route's own types, so the components cannot drift from
// what the loader returns.
export type LessonLoaderData = Route.ComponentProps["loaderData"];
