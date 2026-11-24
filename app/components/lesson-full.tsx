import { useState, useEffect, useCallback } from "react";
import { useFetcher } from "react-router";
import type { Route } from "../routes/+types/courses.$slug.lessons.$lessonId";
import { CommentThread } from "~/components/comment-thread";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { LessonNote } from "~/components/lesson-note";
import { Clock, Bookmark, BookmarkCheck, Github } from "lucide-react";
import { formatDuration } from "~/lib/utils";
import { YouTubePlayer } from "~/components/youtube-player";
import { LessonLayout } from "~/components/lesson-layout";
import { QuizSection } from "~/components/lesson-quiz-section";
import { LessonPager, MarkComplete } from "~/components/lesson-footer";

type LessonLoaderData = Route.ComponentProps["loaderData"];

const AUTOPLAY_KEY = "cadence-autoplay";

function useAutoplay() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(AUTOPLAY_KEY) === "true");
    } catch {
      /* silently fail */
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(AUTOPLAY_KEY, String(next));
      } catch {
        /* silently fail */
      }
      return next;
    });
  }, []);

  return [enabled, toggle] as const;
}

type FullLessonData = Extract<LessonLoaderData, { view: "full" }>;

export function FullLesson({ data }: { data: FullLessonData }) {
  const { course, lesson, enrolled, currentUserId } = data;

  return (
    <LessonLayout
      sidebar={{
        course,
        curriculum: data.curriculum,
        currentLessonId: lesson.id,
        lessonProgressMap: data.lessonProgressMap,
        enrolled,
      }}
      breadcrumb={{ course, mod: data.module, lessonTitle: lesson.title }}
    >
      <LessonHeader
        lesson={lesson}
        bookmarked={currentUserId ? data.bookmarked : null}
      />

      <LessonVideo data={data} />

      {/* Note — under the video, so the Student can write while they watch */}
      {currentUserId && <LessonNote key={lesson.id} note={data.note} />}

      <LessonContent
        contentHtml={data.contentHtml}
        hasVideo={!!lesson.videoUrl}
      />

      <LessonQuiz data={data} />

      {enrolled && currentUserId && (
        <MarkComplete
          courseSlug={course.slug}
          lessonId={lesson.id}
          lessonStatus={data.lessonStatus}
          nextLesson={data.nextLesson}
        />
      )}

      {/* Questions & Discussion — confidential to people with access */}
      <CommentThread
        comments={data.comments}
        currentUserId={currentUserId}
        canModerate={data.canModerate}
        canPost
        instructorName={data.instructorName}
      />

      <LessonPager
        course={course}
        prevLesson={data.prevLesson}
        nextLesson={data.nextLesson}
      />
    </LessonLayout>
  );
}

function LessonVideo({ data }: { data: FullLessonData }) {
  const [autoplay, toggleAutoplay] = useAutoplay();
  const { lesson } = data;
  if (!lesson.videoUrl) return null;

  return (
    <YouTubePlayer
      videoUrl={lesson.videoUrl}
      lessonId={lesson.id}
      title={lesson.title}
      startPosition={data.lastWatchPosition}
      durationMinutes={lesson.durationMinutes}
      watchProgress={data.watchProgress}
      trackingEnabled={data.enrolled && !!data.currentUserId}
      autoplay={autoplay}
      onToggleAutoplay={toggleAutoplay}
    />
  );
}

function LessonHeader({
  lesson,
  bookmarked,
}: {
  lesson: FullLessonData["lesson"];
  /** Null when nobody is signed in: there is nobody to bookmark for. */
  bookmarked: boolean | null;
}) {
  return (
    <>
      <div className="mb-2 flex items-start justify-between gap-3">
        <h1 className="text-3xl font-bold">{lesson.title}</h1>
        {bookmarked !== null && <BookmarkToggle bookmarked={bookmarked} />}
      </div>
      <div className="mb-6 flex items-center gap-3">
        {lesson.durationMinutes && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {formatDuration(lesson.durationMinutes, true, false, false)}
          </div>
        )}
        {lesson.githubRepoUrl && (
          <a
            href={lesson.githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <Github className="mr-1.5 size-4" />
              Open Code
            </Button>
          </a>
        )}
      </div>
    </>
  );
}

function LessonContent({
  contentHtml,
  hasVideo,
}: {
  contentHtml: FullLessonData["contentHtml"];
  hasVideo: boolean;
}) {
  if (contentHtml) {
    return (
      <div
        className="prose prose-neutral dark:prose-invert mb-8 max-w-none"
        // oxlint-disable-next-line react/no-danger -- the instructor wrote this Markdown
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    );
  }
  if (hasVideo) return null;
  return (
    <Card className="mb-8">
      <CardContent className="py-12 text-center text-muted-foreground">
        No content has been added to this lesson yet.
      </CardContent>
    </Card>
  );
}

function LessonQuiz({ data }: { data: FullLessonData }) {
  const quizFetcher = useFetcher({ key: `quiz-${data.lesson.id}` });
  if (!data.quiz || !data.enrolled || !data.currentUserId) return null;

  return (
    <QuizSection
      quiz={data.quiz}
      bestAttempt={data.bestAttempt}
      quizResult={quizFetcher.data?.quizResult ?? null}
      quizFetcher={quizFetcher}
      isSubmitting={quizFetcher.state !== "idle"}
    />
  );
}

function BookmarkToggle({ bookmarked }: { bookmarked: boolean }) {
  const fetcher = useFetcher<{ ok: boolean }>();
  const isSaving = fetcher.state !== "idle";

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="toggle-bookmark" />
      <Button type="submit" variant="outline" size="sm" disabled={isSaving}>
        {bookmarked ? (
          <BookmarkCheck className="mr-1.5 size-4" />
        ) : (
          <Bookmark className="mr-1.5 size-4" />
        )}
        {bookmarked ? "Bookmarked" : "Bookmark"}
      </Button>
    </fetcher.Form>
  );
}
