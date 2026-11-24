export type NoteDraftStatus = {
  /** Characters that will be saved: the server trims the note first. */
  length: number;
  limit: number;
  tooLong: boolean;
  unsaved: boolean;
  canSave: boolean;
};

export function describeDraft(
  draft: string,
  savedBody: string | null,
  limit: number
): NoteDraftStatus {
  const body = draft.trim();
  const tooLong = body.length > limit;
  const unsaved = body !== (savedBody ?? "");

  return {
    length: body.length,
    limit,
    tooLong,
    unsaved,
    canSave: unsaved && body.length > 0 && !tooLong,
  };
}
