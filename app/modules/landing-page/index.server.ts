import { db } from "~/db";
import { getLandingPage, type Db } from "./lib/landing-page";

export { FEATURED_COURSE_LIMIT } from "./lib/landing-page";

/**
 * The landing page's data bound to a database. The app uses `landingPage`;
 * tests build their own against a test database.
 */
export function createLandingPage(database: Db) {
  return {
    /**
     * The newest published courses, and counts that describe the published
     * catalogue. Drafts and archived courses never appear in either.
     */
    get() {
      return getLandingPage(database);
    },
  };
}

// Pure so a route importing this only for its loader doesn't pull the
// database into the client bundle (see `~/db`).
export const landingPage = /* @__PURE__ */ createLandingPage(db);
