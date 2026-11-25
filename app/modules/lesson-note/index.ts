import { noteEditorState } from "./lib/editor-state";

export type { NoteEditorState, NoteStatus } from "./lib/editor-state";

/**
 * What the Student's Note editor shows for the text in the box: the character
 * count against the limit, whether Save is enabled, and the save status.
 */
export function describeNoteDraft(input: {
  draft: string;
  savedBody: string | null;
  saving: boolean;
}) {
  return noteEditorState(input);
}
