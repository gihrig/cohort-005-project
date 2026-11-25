import { MAX_NOTE_LENGTH } from "~/lib/notes";

export type NoteStatus = "saving" | "unsaved" | "saved" | "blank";

export type NoteEditorState = {
  length: number;
  max: number;
  tooLong: boolean;
  canSave: boolean;
  status: NoteStatus;
};

export function noteEditorState({
  draft,
  savedBody,
  saving,
}: {
  draft: string;
  savedBody: string | null;
  saving: boolean;
}): NoteEditorState {
  const trimmed = draft.trim();
  // The server stores the trimmed body, so whitespace alone is not a change.
  const changed = trimmed !== (savedBody ?? "");
  const tooLong = trimmed.length > MAX_NOTE_LENGTH;

  return {
    length: trimmed.length,
    max: MAX_NOTE_LENGTH,
    tooLong,
    canSave: !saving && changed && trimmed.length > 0 && !tooLong,
    status: saving
      ? "saving"
      : changed
        ? "unsaved"
        : savedBody === null
          ? "blank"
          : "saved",
  };
}
