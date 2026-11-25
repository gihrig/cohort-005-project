import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { daysAgo, hoursAgo, makeRandom, slugify } from "./helpers";

describe("makeRandom", () => {
  it("returns the same sequence for the same seed", () => {
    const first = makeRandom(20260731);
    const second = makeRandom(20260731);

    const draws = Array.from({ length: 5 }, () => [first(), second()]);

    for (const [a, b] of draws) expect(a).toBe(b);
  });

  it("returns a different sequence for a different seed", () => {
    expect(makeRandom(1)()).not.toBe(makeRandom(2)());
  });

  it("draws from [0, 1)", () => {
    const random = makeRandom(42);

    for (let i = 0; i < 1000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  // Pinned: the generated history and every number asserted against it hang
  // off this sequence.
  it("keeps the mulberry32 sequence", () => {
    const random = makeRandom(1);

    expect([random(), random(), random()]).toEqual([
      0.6270739405881613, 0.002735721180215478, 0.5274470399599522,
    ]);
  });
});

describe("slugify", () => {
  it("lowercases and joins words with hyphens", () => {
    expect(slugify("Ava Nakamura")).toBe("ava-nakamura");
  });

  it("collapses runs of other characters and trims the ends", () => {
    expect(slugify("  Hello, World!  ")).toBe("hello-world");
  });
});

describe("daysAgo and hoursAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      now: new Date("2026-11-25T12:00:00.000Z"),
      toFake: ["Date"],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts days back from now", () => {
    expect(daysAgo(0)).toBe("2026-11-25T12:00:00.000Z");
    expect(daysAgo(10)).toBe("2026-11-15T12:00:00.000Z");
  });

  it("counts hours back from now, and forward for a negative count", () => {
    expect(hoursAgo(3)).toBe("2026-11-25T09:00:00.000Z");
    expect(hoursAgo(-1)).toBe("2026-11-25T13:00:00.000Z");
  });
});
