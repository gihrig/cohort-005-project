import { Link } from "react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  PlayCircle,
  User,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { CourseImage } from "~/components/course-image";
import type { CatalogueStats, FeaturedCourse } from "~/modules/landing-page";

function plural(count: number, one: string, many: string) {
  return count === 1 ? one : many;
}

export function LandingHero({
  stats,
  spotlight,
  signedIn,
}: {
  stats: CatalogueStats;
  spotlight: FeaturedCourse | undefined;
  signedIn: boolean;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full bg-primary/5 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.15fr_1fr] lg:py-28">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Self-paced courses for developers
          </p>
          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Learn to code,
            <br />
            <span className="text-muted-foreground">at your own pace.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Structured courses built by experienced instructors. Watch the
            lessons, take the quizzes, and pick up exactly where you left off.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/courses">
                Browse courses
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={signedIn ? "/dashboard" : "/signup"}>
                {signedIn ? "Go to your dashboard" : "Create a free account"}
              </Link>
            </Button>
          </div>
          <CatalogueStatList stats={stats} />
        </div>
        {spotlight && <SpotlightCourse course={spotlight} />}
      </div>
    </section>
  );
}

function CatalogueStatList({ stats }: { stats: CatalogueStats }) {
  const statTiles = [
    { value: stats.courses, label: plural(stats.courses, "course", "courses") },
    { value: stats.lessons, label: plural(stats.lessons, "lesson", "lessons") },
    {
      value: stats.instructors,
      label: plural(stats.instructors, "instructor", "instructors"),
    },
    {
      value: stats.categories,
      label: plural(stats.categories, "topic", "topics"),
    },
  ];

  return (
    <dl className="mt-14 grid max-w-xl grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
      {statTiles.map((tile) => (
        <div key={tile.label}>
          <dt className="sr-only">{tile.label}</dt>
          <dd className="text-3xl font-bold tracking-tight">{tile.value}</dd>
          <dd className="mt-1 text-sm text-muted-foreground">{tile.label}</dd>
        </div>
      ))}
    </dl>
  );
}

function SpotlightCourse({ course }: { course: FeaturedCourse }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group relative block lg:ml-auto lg:max-w-md"
    >
      <div
        aria-hidden
        className="absolute inset-0 translate-x-4 translate-y-4 rounded-xl border border-border bg-muted"
      />
      <Card className="relative overflow-hidden pt-0 shadow-lg transition-transform group-hover:-translate-y-1">
        <CourseImage
          src={course.coverImageUrl}
          alt={course.title}
          className="aspect-video w-full object-cover"
        />
        <CardHeader>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            New · {course.categoryName}
          </p>
          <h2 className="text-xl font-semibold leading-snug">{course.title}</h2>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {course.description}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="size-4" />
            {course.instructorName}
          </span>
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            Start learning
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

const STEPS = [
  {
    icon: Compass,
    title: "Pick a course",
    body: "Browse by topic and read what each course covers before you commit.",
  },
  {
    icon: PlayCircle,
    title: "Learn lesson by lesson",
    body: "Short video lessons, notes you keep alongside them, and quizzes that check you got it.",
  },
  {
    icon: CheckCircle2,
    title: "Track your progress",
    body: "Your dashboard remembers every finished lesson, so you always know what's next.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
        <p className="mt-2 text-muted-foreground">
          No schedule to keep up with. Start when you like, stop when you need
          to.
        </p>
      </div>
      <ol className="mt-12 grid gap-10 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="border-l-2 border-primary/20 pl-6">
            <span className="text-sm font-semibold text-primary">
              0{index + 1}
            </span>
            <step.icon className="mt-4 size-6 text-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CourseCard({ course }: { course: FeaturedCourse }) {
  return (
    <Link to={`/courses/${course.slug}`} className="group">
      <Card className="h-full overflow-hidden bg-background pt-0 transition-shadow group-hover:shadow-md">
        <CourseImage
          src={course.coverImageUrl}
          alt={course.title}
          className="aspect-video w-full object-cover"
        />
        <CardHeader>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {course.categoryName}
          </p>
          <h3 className="font-semibold leading-snug group-hover:text-primary">
            {course.title}
          </h3>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {course.description}
          </p>
        </CardContent>
        <CardFooter className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="size-3" />
            {course.instructorName}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="size-3" />
            {course.lessonCount}{" "}
            {plural(course.lessonCount, "lesson", "lessons")}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export function FeaturedCourses({ courses }: { courses: FeaturedCourse[] }) {
  return (
    <section className="border-y border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              New on Cadence
            </h2>
            <p className="mt-2 text-muted-foreground">
              The latest courses from our instructors
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/courses">
              View all courses
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClosingCallToAction({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-col items-start justify-between gap-8 rounded-2xl bg-primary px-8 py-12 text-primary-foreground sm:px-12 md:flex-row md:items-center">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight">
            {signedIn
              ? "Pick up where you left off"
              : "Start your first lesson today"}
          </h2>
          <p className="mt-3 text-primary-foreground/80">
            {signedIn
              ? "Your progress is saved. Jump back into your courses from the dashboard."
              : "Sign up in a minute and keep your progress across every course you take."}
          </p>
        </div>
        <Button asChild size="lg" variant="secondary">
          <Link to={signedIn ? "/dashboard" : "/signup"}>
            {signedIn ? "Open dashboard" : "Sign up"}
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function LandingFooter({ signedIn }: { signedIn: boolean }) {
  const links = signedIn
    ? [
        { to: "/courses", label: "Courses" },
        { to: "/dashboard", label: "Dashboard" },
      ]
    : [
        { to: "/courses", label: "Courses" },
        { to: "/login", label: "Log in" },
        { to: "/signup", label: "Sign up" },
      ];

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/" className="text-lg font-bold tracking-tight">
            Cadence
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Learn to code, at your own pace.
          </p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
