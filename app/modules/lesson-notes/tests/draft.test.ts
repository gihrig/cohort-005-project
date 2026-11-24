import { describe, expect, it } from "vitest";
import { describeNoteDraft } from "../index";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

describe("describeNoteDraft", () => {
  it("cannot save an empty box when there is no note yet", () => {
    expect(describeNoteDraft("", null)).toEqual({
      length: 0,
      limit: MAX_NOTE_LENGTH,
      tooLong: false,
      unsaved: false,
      canSave: false,
    });
  });

  it("cannot save whitespace only, because the server trims it to nothing", () => {
    const status = describeNoteDraft("   \n ", null);
    expect(status.length).toBe(0);
    expect(status.canSave).toBe(false);
  });

  it("can save new text", () => {
    const status = describeNoteDraft("Result types beat throwing", null);
    expect(status).toMatchObject({ length: 26, unsaved: true, canSave: true });
  });

  it("has nothing to save when the text matches the saved note", () => {
    const status = describeNoteDraft("  My note \n", "My note");
    expect(status.unsaved).toBe(false);
    expect(status.canSave).toBe(false);
  });

  it("can save an edit to an existing note", () => {
    const status = describeNoteDraft("My note, edited", "My note");
    expect(status.unsaved).toBe(true);
    expect(status.canSave).toBe(true);
  });

  it("cannot save an emptied note, because the server refuses an empty body", () => {
    const status = describeNoteDraft("  ", "My note");
    expect(status.unsaved).toBe(true);
    expect(status.canSave).toBe(false);
  });

  it("allows a note exactly at the limit", () => {
    const status = describeNoteDraft("a".repeat(MAX_NOTE_LENGTH), null);
    expect(status.tooLong).toBe(false);
    expect(status.canSave).toBe(true);
  });

  it("refuses a note one character over the limit", () => {
    const status = describeNoteDraft("a".repeat(MAX_NOTE_LENGTH + 1), null);
    expect(status.tooLong).toBe(true);
    expect(status.canSave).toBe(false);
  });

  it("counts the trimmed length against the limit", () => {
    const status = describeNoteDraft(` ${"a".repeat(MAX_NOTE_LENGTH)} `, null);
    expect(status.length).toBe(MAX_NOTE_LENGTH);
    expect(status.tooLong).toBe(false);
  });
});
