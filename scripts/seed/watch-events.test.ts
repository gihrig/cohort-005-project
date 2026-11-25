import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWatchEventLog } from "./watch-events";

describe("createWatchEventLog", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      now: new Date("2026-11-25T12:00:00.000Z"),
      toFake: ["Date"],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("records a session watched to the end as play, a heartbeat every 10 seconds, then ended", () => {
    const log = createWatchEventLog();

    log.addWatchSession(7, 3, 0, 30, 30, 2);

    expect(
      log.rows.map(({ eventType, positionSeconds }) => [
        eventType,
        positionSeconds,
      ])
    ).toEqual([
      ["play", 0],
      ["progress", 10],
      ["progress", 20],
      ["ended", 30],
    ]);
    expect(
      log.rows.every((row) => row.userId === 7 && row.lessonId === 3)
    ).toBe(true);
  });

  it("ends a session that stops short of the video's end with pause", () => {
    const log = createWatchEventLog();

    log.addWatchSession(1, 1, 100, 115, 600, 5);

    expect(log.rows.map((row) => row.eventType)).toEqual([
      "play",
      "progress",
      "pause",
    ]);
  });

  it("advances the clock with the playback position", () => {
    const log = createWatchEventLog();

    log.addWatchSession(1, 1, 0, 3600, 3600, 2);

    expect(log.rows[0].createdAt).toBe("2026-11-25T10:00:00.000Z");
    expect(log.rows.at(-1)?.createdAt).toBe("2026-11-25T11:00:00.000Z");
  });

  it("appends every session to the same rows", () => {
    const log = createWatchEventLog();

    log.addWatchSession(1, 1, 0, 10, 10, 1);
    log.addWatchSession(2, 1, 0, 10, 10, 1);

    expect(log.rows.map((row) => row.userId)).toEqual([1, 1, 2, 2]);
  });
});
