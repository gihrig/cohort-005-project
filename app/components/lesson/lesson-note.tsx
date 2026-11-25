import { useState } from "react";
import { useFetcher } from "react-router";
import { Lock, NotebookPen } from "lucide-react";
import {
  describeNoteDraft,
  type NoteEditorState,
  type NoteStatus,
} from "~/modules/lesson-note";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { cn, formatRelativeTime } from "~/lib/utils";
import type { LessonLoaderData } from "./loader-data";

function NoteStatusText({
  status,
  updatedAt,
}: {
  status: NoteStatus;
  updatedAt: string | undefined;
}) {
  if (status === "unsaved") return <span>Unsaved changes</span>;
  if (status === "saved" && updatedAt) {
    return (
      <span suppressHydrationWarning>
        Saved {formatRelativeTime(updatedAt)}
      </span>
    );
  }
  return null;
}

function NoteHeader() {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <NotebookPen className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">Your Notes</h2>
      </div>
      <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <Lock className="size-3" />
        Private
      </span>
    </div>
  );
}

function NoteFooter({
  state,
  saving,
  error,
  updatedAt,
}: {
  state: NoteEditorState;
  saving: boolean;
  error: string | undefined;
  updatedAt: string | undefined;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" size="sm" disabled={!state.canSave}>
        {saving ? "Saving..." : "Save note"}
      </Button>

      {error ? (
        <span className="text-sm text-destructive">{error}</span>
      ) : (
        <span className="text-xs text-muted-foreground">
          <NoteStatusText status={state.status} updatedAt={updatedAt} />
        </span>
      )}

      <span
        className={cn(
          "ml-auto text-xs",
          state.tooLong ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {state.length} / {state.max}
      </span>
    </div>
  );
}

export function LessonNote({ note }: { note: LessonLoaderData["note"] }) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const [draft, setDraft] = useState(note?.body ?? "");
  const saving = fetcher.state !== "idle";
  const error = fetcher.data?.error;
  const state = describeNoteDraft({
    draft,
    savedBody: note?.body ?? null,
    saving,
  });

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <NoteHeader />

        <fetcher.Form method="post" className="space-y-2">
          <input type="hidden" name="intent" value="save-note" />
          <Textarea
            name="body"
            rows={6}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Jot down what you want to remember from this lesson. Only you can read this."
            aria-label="Your notes"
            className="min-h-32 resize-y"
          />

          <NoteFooter
            state={state}
            saving={saving}
            error={error}
            updatedAt={note?.updatedAt}
          />
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}
