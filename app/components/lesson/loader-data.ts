import type { Route } from "../../routes/+types/courses.$slug.lessons.$lessonId";

// The lesson route's loader data, for the components that render it.
export type LessonLoaderData = Route.ComponentProps["loaderData"];
