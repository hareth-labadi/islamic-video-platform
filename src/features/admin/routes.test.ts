import { describe, expect, it } from "vitest";
import { adminRoutes, safeNext, switchAdminLocale } from "./routes";

describe("adminRoutes", () => {
  const r = adminRoutes("ar");

  it("puts every page under /<locale>/admin", () => {
    expect(r.dashboard).toBe("/ar/admin");
    expect(r.signIn).toBe("/ar/admin/sign-in");
    expect(r.shortsImport).toBe("/ar/admin/shorts/import");
    expect(adminRoutes("fr").team).toBe("/fr/admin/team");
  });

  it("builds editor links", () => {
    expect(r.video("v 1")).toBe("/ar/admin/videos/v%201");
    expect(r.newVideo()).toBe("/ar/admin/videos/new");
    expect(r.newVideo({ seriesId: "dalail" })).toBe("/ar/admin/videos/new?series=dalail");
    expect(r.collection("series", "dalail")).toBe("/ar/admin/playlists/s-dalail");
    expect(r.collection("playlist", "pl-kab")).toBe("/ar/admin/playlists/p-pl-kab");
    expect(r.newCollection("playlist")).toBe("/ar/admin/playlists/new?type=playlist");
    expect(r.collections("playlists")).toBe("/ar/admin/playlists?tab=playlists");
    expect(r.collections()).toBe("/ar/admin/playlists");
  });
});

describe("switchAdminLocale", () => {
  it("keeps the page and swaps the language", () => {
    expect(switchAdminLocale("/ar/admin/videos/v-1", "fr")).toBe("/fr/admin/videos/v-1");
    expect(switchAdminLocale("/fr/admin", "ar")).toBe("/ar/admin");
  });
});

describe("safeNext", () => {
  const r = adminRoutes("fr");

  it("keeps an admin page of this site", () => {
    expect(safeNext("/fr/admin/questions?tab=answered", r)).toBe("/fr/admin/questions?tab=answered");
    expect(safeNext("/fr/admin", r)).toBe("/fr/admin");
  });

  it.each([null, "", "https://evil.example/fr/admin", "//evil.example/fr/admin", "/\\evil.example","/fr/administrator", "/fr", "javascript:alert(1)"])("sends %j to the dashboard", (next) => {
    expect(safeNext(next, r)).toBe("/fr/admin");
  });
});
