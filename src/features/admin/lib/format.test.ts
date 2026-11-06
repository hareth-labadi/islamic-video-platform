import { describe, expect, it } from "vitest";
import { getAdminDictionary } from "../i18n";
import { clock, formatDate, initials, megabytes, parseDuration, relativeTime, slugify, todayISO } from "./format";

describe("formatDate", () => {
  it("writes the month in words with Western digits in both languages", () => {
    expect(formatDate("2026-11-05", "fr")).toBe("5 novembre 2026");
    expect(formatDate("2026-11-05", "ar")).toBe("5 نوفمبر 2026");
  });

  it("can drop the year", () => {
    expect(formatDate("2026-11-05", "fr", { year: false })).toBe("5 novembre");
  });

  it("returns the input when it is not a date", () => {
    expect(formatDate("soon", "fr")).toBe("soon");
  });
});

describe("relativeTime", () => {
  const t = getAdminDictionary("fr");
  const now = Date.parse("2026-11-05T12:00:00Z");

  it("uses minutes, hours and days for recent times", () => {
    expect(relativeTime("2026-11-05T11:58:00Z", "fr", t, now)).toBe("il y a 2 minutes");
    expect(relativeTime("2026-11-05T09:00:00Z", "fr", t, now)).toBe("il y a 3 heures");
    expect(relativeTime("2026-11-02T12:00:00Z", "fr", t, now)).toBe("il y a 3 jours");
  });

  it("says today / yesterday for plain dates", () => {
    expect(relativeTime("2026-11-05", "fr", t, now)).toBe(t.dates.today);
    expect(relativeTime("2026-11-04", "fr", t, now)).toBe(t.dates.yesterday);
  });

  it("falls back to a short date after two weeks", () => {
    expect(relativeTime("2026-10-01T12:00:00Z", "fr", t, now)).toBe("1 octobre");
  });
});

describe("clock and parseDuration", () => {
  it("formats seconds as m:ss or h:mm:ss", () => {
    expect(clock(0)).toBe("0:00");
    expect(clock(65)).toBe("1:05");
    expect(clock(3725)).toBe("1:02:05");
    expect(clock(-4)).toBe("0:00");
  });

  it("reads m:ss and h:mm:ss", () => {
    expect(parseDuration("18:42")).toBe(18 * 60 + 42);
    expect(parseDuration(" 1:02:05 ")).toBe(3725);
  });

  it("rejects malformed durations", () => {
    expect(parseDuration("1:60")).toBeNull();
    expect(parseDuration("1:61:00")).toBeNull();
    expect(parseDuration("12")).toBeNull();
    expect(parseDuration("abc")).toBeNull();
  });

  it("round-trips", () => {
    for (const s of [5, 59, 600, 3599, 7322]) expect(parseDuration(clock(s))).toBe(s);
  });
});

describe("slugify", () => {
  it("makes a Latin slug and strips accents", () => {
    expect(slugify("Dalâil an-Nubuwwa — partie 2")).toBe("dalail-an-nubuwwa-partie-2");
  });

  it("gives an empty string for Arabic-only titles", () => {
    expect(slugify("دلائل النبوة")).toBe("");
  });

  it("caps the length at 60", () => {
    expect(slugify("a".repeat(80))).toHaveLength(60);
  });
});

describe("initials", () => {
  it("takes two Latin initials and one Arabic letter", () => {
    expect(initials("Amina Kaci")).toBe("AK");
    expect(initials("الشيخ محمد شريف")).toBe("م");
  });

  it("ignores titles and punctuation", () => {
    expect(initials("Cheikh [Nom] Exemple")).toBe("NE");
    expect(initials("@sami_tlm")).toBe("S");
    expect(initials("")).toBe("?");
  });
});

it("todayISO pads month and day", () => {
  expect(todayISO(new Date(2026, 0, 3))).toBe("2026-01-03");
});

it("megabytes switches to GB above 1 GiB", () => {
  expect(megabytes(5 * 1024 ** 2)).toBe("5.0 MB");
  expect(megabytes(3 * 1024 ** 3)).toBe("3.0 GB");
  expect(megabytes(10)).toBe("0.1 MB");
});
