import { MAX_NOTE_LENGTH } from "~/lib/notes";
import { describeDraft, type NoteDraftStatus } from "./lib/draft";

export type { NoteDraftStatus };

/**
 * What the notes box should show for the text a Student has typed, given the
 * note already saved for this lesson (or null when there is none yet).
 */
export function describeNoteDraft(
  draft: string,
  savedBody: string | null
): NoteDraftStatus {
  return describeDraft(draft, savedBody, MAX_NOTE_LENGTH);
}
