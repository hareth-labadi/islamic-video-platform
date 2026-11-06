import { describe, expect, it } from "vitest";
import { dirOf, isScheduled, markOf, thumbOf } from "./content";

describe("thumbOf", () => {
  it("prefers the custom thumbnail", () => {
    expect(thumbOf({ thumbnail: "/t.jpg", source: { kind: "youtube", youtubeId: "dQw4w9WgXcQ", url: "" } })).toBe("/t.jpg");
  });

  it("uses YouTube's image, except for the demo's fake ids and uploads", () => {
    expect(thumbOf({ source: { kind: "youtube", youtubeId: "dQw4w9WgXcQ", url: "" } })).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(thumbOf({ source: { kind: "youtube", youtubeId: "Yt001DemoAb", url: "" } })).toBeUndefined();
    expect(thumbOf({ source: { kind: "upload", url: "/v.mp4" } })).toBeUndefined();
  });
});

it("markOf shows the episode number, else the kind's glyph", () => {
  expect(markOf({ episode: 7, kind: "series" })).toBe("07");
  expect(markOf({ kind: "qa" })).toBeTruthy();
});

it("isScheduled is true for published videos dated in the future", () => {
  expect(isScheduled({ status: "published", publishedAt: "2026-12-01" }, "2026-11-05")).toBe(true);
  expect(isScheduled({ status: "published", publishedAt: "2026-11-05" }, "2026-11-05")).toBe(false);
  expect(isScheduled({ status: "draft", publishedAt: "2026-12-01" }, "2026-11-05")).toBe(false);
});

it("dirOf is rtl for Arabic only", () => {
  expect(dirOf("ar")).toBe("rtl");
  expect(dirOf("fr")).toBe("ltr");
  expect(dirOf("kab")).toBe("ltr");
});
