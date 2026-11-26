# Coding standards

## Fail with a thrown response, not a return value

A loader or an action that cannot continue throws. It does not return an
error shape for the component to unpack.

```ts
if (!course) throw data("Course not found", { status: 404 });
```

The route then has one success path. A returned error shape gives every
component a second path to forget about.

## Parse untrusted input with a schema, at the edge

Form data, search parameters and request bodies get a zod schema before the
values reach any query. Parse once, at the boundary; after that the value has
a type and you do not check it again. Coerce numbers through the schema, not
`Number()`: `Number("")` is `0`, and an empty `lessonId` once opened lesson 0
for every learner.

## Check permission in the action, not only the loader

A loader guard does not protect an action. They are separate requests. For a
week anybody who was signed in could approve a refund by posting to
`/admin/refunds`.

## A route does not query data a module owns

Once a module owns a feature's data, the route asks the module for it and
does not import `~/db` or `drizzle-orm` itself. The instructor analytics
route gets everything from `instructorAnalytics`. A query in the loader
splits the feature's rules across two files, and the module's tests stop
covering what the page shows. `npm run lint:boundaries` enforces this for
every route except the old ones in `ROUTES_THAT_QUERY_THE_DB`
(`.dependency-cruiser.cjs`); apply it to those by hand. See
[app/modules/README.md](./app/modules/README.md).

## Arrange tests through the module under test

Test setup calls the module's own functions. When the function you need does
not exist, add it to the module rather than inserting rows directly, so a
change to how the module stores its data leaves its tests alone.

One exception: when no module has a function that writes the rows a test
needs, the test may insert them. Put the inserts in named helpers at the top
of the test file, such as `addCourse`, with a comment that names the missing
writer. The change that adds that writer replaces the inserts in every test.
The `landing-page` tests (#32) need courses, and no module writes them yet.

The rule applies to every test. The direct inserts in `app/lib` tests are old
breaches. A change that edits one of those files does not have to fix them.

## A move carries its old breaches

A change that only moves code does not have to fix the rules that code
already broke. Report them as one finding that names the moved files and the
rules, not one finding per breach, and fix them in a follow-up ticket once
the code has tests. A breach on a line the change wrote or edited is new, and
gets its own finding.

## A ticket about looks changes only the looks

A ticket that says a page looks wrong may change behaviour only when the new
look cannot work without it. A new module is fine if the behaviour in it
passes that test. Leave any other behaviour change out, file it as a new
ticket, and link that ticket under "Left out on purpose". On #21, a ticket
about how the notes card looked also turned off Save for an unchanged note.
A Student could no longer save again to move "last edited" forward.

## List each behaviour change in the PR body

A PR that changes what a user can do has a `## Behaviour changes` heading.
Each change is one bullet that says what happened before and what happens
now. On #21 the Save change was in "Blast Radius", where a product owner
could miss it.

This rule is not effective yet. These factory files override it:
`.agents/skills/pr/SKILL.md:15`
`.sandcastle/agent-workflows/implement/prompt.md:27`
These can be updated in later projects after Cohort-005.

## Reuse a block before you copy its look

If a change makes one block look like another, share the block. A block is
a part with its own job, such as a header, a footer or a card. One repeated
class list is not a block. If the source block can be extracted with no
change to how it looks or behaves, extracting it is in scope. If not, copy
it, name the copy in the PR body, and file a follow-up ticket. An old copy
is not a breach until a change edits that block. On #21 the notes footer
copied the comment form's footer by hand, so the two can drift apart.

## Keep files under 5000 tokens

Keep every file under 5000 tokens.

## Wrap related writes in a transaction

Two writes that must both land, or neither, go in a transaction. If the second
one fails and the first stayed, you have invented a state nothing knows how to
read. (The refund bug: the refund was approved, the enrollment was never
ended, and the learner kept the course.)

## Do not read from the database in a loop

One query per item is N+1 queries. Use a join, or one query with an `IN`. The
notes loader ran one query per lesson, forty lessons per course.

## Paginate anything that can grow

A query with no limit is fine on a seeded database and fatal on a real one.
If the row count is a function of how long the product has been alive, add a
limit. The instructor's students page timed out on the first big course.

## Soft-delete anything a person can point at

If another row references it, or a person has a link to it, do not delete it.
Mark it deleted and filter it out on read. Deleting a lesson used to take the
learners' notes and bookmarks with it.

## Enumerations live in the schema file

A status string that the code compares against is an enum in `app/db/schema.ts`,
not a literal repeated in six places. Refund status was `"pending"` in four
files and `"Pending"` in one.

## Inject the clock

A function that calls `Date.now()` cannot be tested at a fixed moment. Take
the time as an argument. The refund window tests failed every night at
midnight until we did this.

## Keep secrets on the server

Anything the browser can read is public. A secret is read only in a
`.server` file.

## Do not put a side effect in the render path

Rendering is for working out what the output is, not for doing something.
Anything that touches the outside world belongs in an effect or an action.

## Derive, do not store

If a value can be worked out from another value you already hold, work it out.
Storing it gives you two things that must agree, and one day they will not.

```ts
// Bad
const [items, setItems] = useState(rows);
const [count, setCount] = useState(rows.length);

// Good
const [items, setItems] = useState(rows);
const count = items.length;
```

## A screen reader hears each thing once, and every control has a name

A screen reader reads each piece of text once. Every button, link and input
has an accessible name. If a change edits markup, check the page with
`agent-browser snapshot`, not only the diff. On #32 each stat had an
`sr-only` label and a visible label with the same text, so it was read twice.

## Design the empty state

A page that shows stored data has a state for no data. Hide or replace a
count of zero. Collapse a layout column that has nothing in it. Give an empty
list a message that says what to do next. Put the no-data decision in module
code, and test it with no rows. On #32 an empty catalogue showed "0 courses /
0 lessons / 0 instructors / 0 topics" next to an empty column.

## Write UI text in sentence case

Buttons, links, headings and page titles capitalise only the first word and
proper names: "Browse courses", not "Browse Courses". A term from
`GLOSSARY.md` keeps its capitals: "Refund Requests". Old title-case text is
not a breach until a change edits that line. On #32 the header said "Log In"
next to a page that said "Sign up".

## A comment explains why

Name and extract until a comment is unnecessary. A comment earns its place
only for a _why_ the code cannot express: a constraint, a decision, a link to
the ADR behind it. A comment that restates _what_ the code does goes stale the
first time the code changes.

## Show each screenshot once

Take a screenshot only of a change that shows in the UI. The before
screenshot goes in the issue, because the issue describes the page as it is
now. The PR body holds the after screenshot and links to the issue for the
before. A later step, such as a review, adds a screenshot only when the page
changed after the previous one. PR #21 had an after screenshot in its body and
two more of the same card in the review verdict.

For this rule is not effective. It will be overridden by factory system files:
`.sandcastle/agent-workflows/implement/prompt.md:24`
`.sandcastle/agent-workflows/implement-spec/build-prompt.md:29`
`.sandcastle/agent-workflows/review/prompt.md:39`
`.agents/skills/pr/SKILL.md:21`
`docs/agents/agent-browser.md:55`
`.sandcastle/agent-workflows/explore/prompt.md:28`
These can be updated in later projects after Cohort-005
