import { describe, expect, it } from "vitest";
import { getAdminDictionary } from "../../i18n";
import { blank, toPlaylistInput, toSeriesInput, validate, type Values } from "./collectionForm";

const t = getAdminDictionary("fr");

function series(patch: Partial<Values> = {}): Values {
  return { ...blank("series", "sheikh-1"), title: "Dalâil", slug: "dalail-2", glyph: "د", description: "Les preuves de la prophétie.", ...patch };
}

describe("validate", () => {
  it("passes a complete series", () => {
    expect(validate(series(), "series", t, [])).toEqual({});
  });

  it("needs a lowercase, unused slug", () => {
    expect(validate(series({ slug: "" }), "series", t, []).slug).toBe(t.validation.required);
    expect(validate(series({ slug: "Dalail 2" }), "series", t, []).slug).toBe(t.validation.slug);
    expect(validate(series({ slug: "dalail" }), "series", t, ["dalail"]).slug).toContain("dalail");
  });

  it("needs a glyph of 1–3 characters", () => {
    expect(validate(series({ glyph: "" }), "series", t, []).glyph).toBe(t.validation.required);
    expect(validate(series({ glyph: "abcd" }), "series", t, []).glyph).toBe(t.validation.glyph);
    expect(validate(series({ glyph: "40" }), "series", t, []).glyph).toBeUndefined();
  });

  it("a series needs a description and a planned count no smaller than its episodes", () => {
    expect(validate(series({ description: "" }), "series", t, []).description).toBe(t.validation.required);
    expect(validate(series({ plannedCount: "2", items: ["a", "b", "c"] }), "series", t, []).plannedCount).toBe(t.validation.planned(3));
    expect(validate(series({ plannedCount: "" }), "series", t, []).plannedCount).toBe(t.validation.required);
  });

  it("a playlist needs neither", () => {
    const playlist = { ...blank("playlist", "sheikh-1"), title: "Kabyle", slug: "kab", glyph: "ⵣ" };
    expect(validate(playlist, "playlist", t, [])).toEqual({});
  });
});

describe("payloads", () => {
  it("toSeriesInput maps progress to status and items to episodeIds", () => {
    const input = toSeriesInput(series({ progress: "complete", items: ["v-1", "v-2"], tagline: "  ", plannedCount: "12" }));
    expect(input).toMatchObject({ status: "complete", episodeIds: ["v-1", "v-2"], plannedCount: 12, tagline: undefined, visibility: "draft" });
  });

  it("toPlaylistInput maps items to videoIds", () => {
    const input = toPlaylistInput({ ...blank("playlist", "sheikh-1"), title: " Kabyle ", slug: "kab", glyph: "ⵣ", items: ["v-3"] });
    expect(input).toMatchObject({ title: "Kabyle", videoIds: ["v-3"], kind: "mixed", description: undefined });
  });
});
