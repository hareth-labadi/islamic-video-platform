import { describe, expect, it } from "vitest";
import type { AdminSeries, AdminVideo } from "../../api/types";
import { getAdminDictionary } from "../../i18n";
import { limits } from "../../rules";
import { toForm, toInput, validate, type FormValues } from "./videoForm";

const t = getAdminDictionary("fr");

const series = { id: "dalail", episodeIds: ["v-1", "v-2", "v-3"] } as AdminSeries;

function form(patch: Partial<FormValues> = {}): FormValues {
  return {
    ...toForm(undefined, "sheikh-1"),
    title: "Leçon d’essai",
    youtubeUrl: "https://youtu.be/dQw4w9WgXcQ",
    publishedAt: "2026-11-05",
    ...patch,
  };
}

describe("toForm", () => {
  it("starts a new video as a draft, in the series when one is given", () => {
    const blank = toForm(undefined, "sheikh-1", "dalail");
    expect(blank).toMatchObject({ sheikhId: "sheikh-1", status: "draft", seriesId: "dalail", kind: "series", sourceKind: "youtube" });
  });

  it("reads an uploaded video back into the form", () => {
    const video = {
      id: "v-9",
      sheikhId: "sheikh-1",
      title: "Khutba",
      lang: "ar",
      kind: "mixed",
      duration: "34:10",
      publishedAt: "2026-11-01",
      topics: ["salat"],
      source: { kind: "upload", url: "/f.mp4", fileName: "f.mp4", sizeBytes: 10 },
      status: "draft",
    } as AdminVideo;
    expect(toForm(video, "ignored")).toMatchObject({ sourceKind: "upload", youtubeUrl: "", upload: { url: "/f.mp4", fileName: "f.mp4" }, episode: "" });
  });
});

describe("validate", () => {
  it("passes a complete form", () => {
    expect(validate(form(), t, undefined)).toEqual({});
  });

  it("needs a title of 3 to 160 characters", () => {
    expect(validate(form({ title: "  " }), t, undefined).title).toBe(t.validation.required);
    expect(validate(form({ title: "ab" }), t, undefined).title).toBe(t.validation.min(3));
    expect(validate(form({ title: "x".repeat(limits.video.title + 1) }), t, undefined).title).toBe(t.validation.max(limits.video.title));
  });

  it("needs a YouTube link or an uploaded file", () => {
    expect(validate(form({ youtubeUrl: "" }), t, undefined).youtubeUrl).toBe(t.validation.source);
    expect(validate(form({ youtubeUrl: "https://vimeo.com/1" }), t, undefined).youtubeUrl).toBe(t.validation.youtube);
    expect(validate(form({ sourceKind: "upload", duration: "3:00" }), t, undefined).upload).toBe(t.validation.source);
  });

  it("needs a duration for uploads, and a valid one when typed", () => {
    expect(validate(form({ sourceKind: "upload", upload: { url: "/f.mp4" } }), t, undefined).duration).toBe(t.validation.required);
    expect(validate(form({ duration: "7:75" }), t, undefined).duration).toBe(t.validation.duration);
  });

  it("checks the episode number against the series", () => {
    expect(validate(form({ seriesId: "dalail", episode: "" }), t, series).episode).toBe(t.validation.required);
    expect(validate(form({ seriesId: "dalail", episode: "0" }), t, series).episode).toBe(t.validation.episode);
    expect(validate(form({ seriesId: "dalail", episode: "2" }), t, series).episode).toBe(t.validation.episodeTaken(2));
    expect(validate(form({ seriesId: "dalail", episode: "2" }), t, series, "v-2").episode).toBeUndefined();
    expect(validate(form({ seriesId: "dalail", episode: "4" }), t, series).episode).toBeUndefined();
  });

  it("limits topics and checks the date", () => {
    expect(validate(form({ topics: Array.from({ length: 11 }, (_, i) => `t${i}`) }), t, undefined).topics).toBe(t.validation.topics(10));
    expect(validate(form({ publishedAt: "05/11/2026" }), t, undefined).publishedAt).toBe(t.validation.date);
  });
});

describe("toInput", () => {
  it("cleans the YouTube link and trims text", () => {
    const input = toInput(form({ title: "  Leçon  ", summary: "  ", youtubeUrl: "youtube.com/watch?v=dQw4w9WgXcQ&t=1" }));
    expect(input.title).toBe("Leçon");
    expect(input.summary).toBeUndefined();
    expect(input.source).toEqual({ kind: "youtube", youtubeId: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });
    expect(input.duration).toBe("0:00");
  });

  it("sends series fields only with a series, and forces kind series", () => {
    const inSeries = toInput(form({ seriesId: "dalail", episode: "4", sectionId: "sec-2", kind: "qa" }));
    expect(inSeries).toMatchObject({ seriesId: "dalail", episode: 4, sectionId: "sec-2", kind: "series" });
    const alone = toInput(form({ seriesId: "", episode: "4", sectionId: "sec-2" }));
    expect(alone.seriesId).toBeUndefined();
    expect(alone.episode).toBeUndefined();
    expect(alone.sectionId).toBeUndefined();
  });
});
