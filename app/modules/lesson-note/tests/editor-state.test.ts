import { describe, expect, it } from "vitest";
import { MAX_NOTE_LENGTH } from "~/lib/notes";
import { describeNoteDraft } from "../index";

describe("describeNoteDraft", () => {
  it("is blank, with Save off, before the Student writes anything", () => {
    expect(
      describeNoteDraft({ draft: "", savedBody: null, saving: false })
    ).toEqual({
      length: 0,
      max: MAX_NOTE_LENGTH,
      tooLong: false,
      canSave: false,
      status: "blank",
    });
  });

  it("does not offer to save whitespace alone", () => {
    const state = describeNoteDraft({
      draft: "   \n ",
      savedBody: null,
      saving: false,
    });
    expect(state.canSave).toBe(false);
    expect(state.length).toBe(0);
  });

  it("offers to save a new draft", () => {
    expect(
      describeNoteDraft({
        draft: "Remember Result<T>",
        savedBody: null,
        saving: false,
      })
    ).toMatchObject({ canSave: true, status: "unsaved", length: 18 });
  });

  it("is saved, with Save off, when the draft matches the stored note", () => {
    expect(
      describeNoteDraft({ draft: "  kept  ", savedBody: "kept", saving: false })
    ).toMatchObject({ canSave: false, status: "saved" });
  });

  it("is unsaved once the draft differs from the stored note", () => {
    expect(
      describeNoteDraft({
        draft: "kept, edited",
        savedBody: "kept",
        saving: false,
      })
    ).toMatchObject({ canSave: true, status: "unsaved" });
  });

  it("is unsaved when the Student clears a stored note, but will not save it empty", () => {
    expect(
      describeNoteDraft({ draft: "", savedBody: "kept", saving: false })
    ).toMatchObject({ canSave: false, status: "unsaved" });
  });

  it("turns Save off while a save is in flight", () => {
    expect(
      describeNoteDraft({ draft: "new", savedBody: "old", saving: true })
    ).toMatchObject({ canSave: false, status: "saving" });
  });

  it("allows a draft at the limit", () => {
    expect(
      describeNoteDraft({
        draft: "a".repeat(MAX_NOTE_LENGTH),
        savedBody: null,
        saving: false,
      })
    ).toMatchObject({ tooLong: false, canSave: true });
  });

  it("refuses a draft over the limit", () => {
    expect(
      describeNoteDraft({
        draft: "a".repeat(MAX_NOTE_LENGTH + 1),
        savedBody: null,
        saving: false,
      })
    ).toMatchObject({
      tooLong: true,
      canSave: false,
      length: MAX_NOTE_LENGTH + 1,
    });
  });
});
