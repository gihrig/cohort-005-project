import { useEffect } from "react";
import { Link, useFetcher, useNavigate } from "react-router";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { LessonProgressStatus } from "~/db/schema";
import { Button } from "~/components/ui/button";

type LessonLink = { id: number; title: string };

export function MarkComplete({
  courseSlug,
  lessonId,
  lessonStatus,
  nextLesson,
}: {
  courseSlug: string;
  lessonId: number;
  lessonStatus: string | null;
  nextLesson: LessonLink | null;
}) {
  const { fetcher, isMarking, justCompleted } = useMarkComplete(
    courseSlug,
    lessonId,
    nextLesson
  );
  const isCompleted =
    lessonStatus === LessonProgressStatus.Completed || justCompleted;

  if (isCompleted) {
    return (
      <div className="mb-8">
        <LessonCompleted courseSlug={courseSlug} nextLesson={nextLesson} />
      </div>
    );
  }

  return (
    <div className="mb-8">
      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="mark-complete" />
        {nextLesson ? (
          <Button disabled={isMarking}>
            {isMarking ? (
              "Completing..."
            ) : (
              <>
                Up next: {nextLesson.title}
                <ChevronRight className="ml-1 size-4" />
              </>
            )}
          </Button>
        ) : (
          <Button disabled={isMarking}>
            <CheckCircle2 className="mr-2 size-4" />
            {isMarking ? "Marking..." : "Mark as Complete"}
          </Button>
        )}
      </fetcher.Form>
    </div>
  );
}

function useMarkComplete(
  courseSlug: string,
  lessonId: number,
  nextLesson: LessonLink | null
) {
  const fetcher = useFetcher({ key: `mark-complete-${lessonId}` });
  const navigate = useNavigate();

  const isMarking =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("intent") === "mark-complete";

  const justCompleted = fetcher.data?.success;

  // Navigate to next lesson after marking complete
  useEffect(() => {
    if (justCompleted && nextLesson) {
      navigate(`/courses/${courseSlug}/lessons/${nextLesson.id}`);
    }
  }, [justCompleted, nextLesson, courseSlug, navigate]);

  return { fetcher, isMarking, justCompleted };
}

function LessonCompleted({
  courseSlug,
  nextLesson,
}: {
  courseSlug: string;
  nextLesson: LessonLink | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="size-5" />
        <span className="font-medium">Lesson completed</span>
      </div>
      {nextLesson && (
        <Link to={`/courses/${courseSlug}/lessons/${nextLesson.id}`}>
          <Button variant="outline" size="sm">
            Up next: {nextLesson.title}
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}

export function LessonPager({
  course,
  prevLesson,
  nextLesson,
}: {
  course: { slug: string; title: string };
  prevLesson: LessonLink | null;
  nextLesson: LessonLink | null;
}) {
  return (
    <div className="flex items-center justify-between border-t pt-6">
      {prevLesson ? (
        <Link
          to={`/courses/${course.slug}/lessons/${prevLesson.id}`}
          className="flex items-center gap-2 text-sm hover:text-foreground text-muted-foreground"
        >
          <ChevronLeft className="size-4" />
          <PagerLabel label="Previous" title={prevLesson.title} />
        </Link>
      ) : (
        <div />
      )}

      {nextLesson ? (
        <Link
          to={`/courses/${course.slug}/lessons/${nextLesson.id}`}
          className="flex items-center gap-2 text-right text-sm hover:text-foreground text-muted-foreground"
        >
          <PagerLabel label="Next" title={nextLesson.title} />
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <Link
          to={`/courses/${course.slug}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <PagerLabel label="Back to" title={course.title} />
          <ChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

function PagerLabel({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium text-foreground">{title}</div>
    </div>
  );
}
