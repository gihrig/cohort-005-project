// Fails when a module in app/modules/ lacks the layout in app/modules/README.md:
// a lib/ folder for the implementation, and a tests/ folder with at least one
// test. A module made by moving code out of a route brings its tests with it.
// Usage: node scripts/check-module-layout.js

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MODULES_ROOT = "app/modules";
const TEST_FILE = /\.test\.tsx?$/;

const problemsOf = (name) => {
  const dir = join(MODULES_ROOT, name);
  const problems = [];
  if (!existsSync(join(dir, "lib"))) {
    problems.push("no lib/ folder for the implementation");
  }
  const tests = join(dir, "tests");
  const hasTest =
    existsSync(tests) &&
    readdirSync(tests, { recursive: true }).some((file) =>
      TEST_FILE.test(String(file))
    );
  if (!hasTest) problems.push("no test file in tests/");
  return problems;
};

const failures = readdirSync(MODULES_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map(({ name }) => ({ name, problems: problemsOf(name) }))
  .filter(({ problems }) => problems.length > 0);

if (failures.length > 0) {
  console.error(
    "These modules do not have the layout in app/modules/README.md:\n"
  );
  for (const { name, problems } of failures) {
    console.error(`  ${MODULES_ROOT}/${name}: ${problems.join(", ")}`);
  }
  console.error(`
Put the implementation in lib/. Test it through the module's entry points from
tests/. A module that takes the database as an argument can get a test
database there. See app/modules/instructor-analytics/ for an example.`);
  process.exit(1);
}
