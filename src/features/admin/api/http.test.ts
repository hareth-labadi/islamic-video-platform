import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminApi } from "./contract";
import type { PlaylistInput, SeriesInput, VideoInput } from "./types";
import { createHttpApi } from "./http";

/*
 * The HTTP client is what the real backend will talk to. These tests pin every
 * call to its method, path and body, and check each one is documented in
 * docs/specs/admin-api.md (and that the spec lists nothing the client never calls).
 */

const BASE = "https://api.example.org/";

interface Call {
  method: string;
  path: string;
  query: Record<string, string>;
  body?: unknown;
  init: RequestInit;
}

let calls: Call[] = [];
let respond: (call: Call) => Response = () => json({});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  calls = [];
  respond = () => json({});
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const u = new URL(url);
      const call: Call = {
        method: init.method ?? "GET",
        path: u.pathname,
        query: Object.fromEntries(u.searchParams),
        body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
        init,
      };
      calls.push(call);
      return respond(call);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const api = createHttpApi(BASE);

/** Stand-in for the browser's XHR, used for the upload PUT. */
class FakeXhr {
  static last: FakeXhr;
  method = "";
  url = "";
  headers: Record<string, string> = {};
  status = 200;
  upload: { onprogress?: (e: ProgressEvent) => void } = {};
  onload?: () => void;
  onerror?: () => void;
  sent?: unknown;
  constructor() {
    FakeXhr.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(k: string, v: string) {
    this.headers[k] = v;
  }
  send(body: unknown) {
    this.sent = body;
    this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 } as ProgressEvent);
    this.onload?.();
  }
}


const sheikhInput = { name: { ar: "ا", fr: "a", kab: "a" }, monogram: "م" };
const videoInput: VideoInput = { sheikhId: "s1", title: "T", lang: "ar", kind: "mixed", duration: "1:00", publishedAt: "2026-11-05", topics: [], source: { kind: "upload", url: "/f.mp4" }, status: "draft" };
const seriesInput: SeriesInput = { sheikhId: "s1", slug: "s", title: "S", lang: "ar", description: "d", glyph: "س", plannedCount: 3, status: "ongoing", visibility: "draft" };
const playlistInput: PlaylistInput = { sheikhId: "s1", slug: "p", title: "P", kind: "mixed", glyph: "ب", videoIds: [], visibility: "draft" };
const title = { ar: "ا", fr: "a", kab: "a" };

/** [description, call, method, path (after /admin), body?, query?] */
const table: Array<[string, (a: AdminApi) => Promise<unknown>, string, string, unknown?, Record<string, string>?]> = [
  ["auth.requestLink", (a) => a.auth.requestLink("x@y.org", "fr"), "POST", "/auth/email-link", { email: "x@y.org", locale: "fr" }],
  ["auth.verifyCode", (a) => a.auth.verifyCode("x@y.org", "123456"), "POST", "/auth/verify-code", { email: "x@y.org", code: "123456" }],
  ["auth.verifyToken", (a) => a.auth.verifyToken("tok"), "POST", "/auth/verify-token", { token: "tok" }],
  ["auth.session", (a) => a.auth.session(), "GET", "/session"],
  ["auth.signOut", (a) => a.auth.signOut(), "POST", "/auth/sign-out", {}],
  ["auth.requestAccess", (a) => a.auth.requestAccess({ name: "N", email: "n@y.org", sheikhId: "s1" }), "POST", "/access-requests", { name: "N", email: "n@y.org", sheikhId: "s1" }],
  ["sheikhs.directory", (a) => a.sheikhs.directory(), "GET", "/directory/sheikhs"],
  ["sheikhs.get", (a) => a.sheikhs.get("s1"), "GET", "/sheikhs/s1"],
  ["sheikhs.update", (a) => a.sheikhs.update("s1", sheikhInput), "PUT", "/sheikhs/s1", sheikhInput],
  ["dashboard.summary", (a) => a.dashboard.summary("s1"), "GET", "/sheikhs/s1/dashboard"],
  ["videos.list", (a) => a.videos.list({ sheikhId: "s1", status: "draft", q: "" }), "GET", "/videos", undefined, { sheikhId: "s1", status: "draft" }],
  ["videos.get", (a) => a.videos.get("v/1"), "GET", "/videos/v%2F1"],
  ["videos.create", (a) => a.videos.create(videoInput), "POST", "/videos", videoInput],
  ["videos.update", (a) => a.videos.update("v1", videoInput), "PUT", "/videos/v1", videoInput],
  ["videos.setStatus", (a) => a.videos.setStatus("v1", "published"), "PATCH", "/videos/v1/status", { status: "published" }],
  ["videos.remove", (a) => a.videos.remove("v1"), "DELETE", "/videos/v1"],
  ["videos.topics", (a) => a.videos.topics("s1"), "GET", "/sheikhs/s1/topics"],
  ["series.list", (a) => a.series.list("s1"), "GET", "/series", undefined, { sheikhId: "s1" }],
  ["series.get", (a) => a.series.get("dalail"), "GET", "/series/dalail"],
  ["series.create", (a) => a.series.create(seriesInput), "POST", "/series", seriesInput],
  ["series.update", (a) => a.series.update("dalail", seriesInput), "PUT", "/series/dalail", seriesInput],
  ["series.reorder", (a) => a.series.reorder("dalail", ["b", "a"]), "PUT", "/series/dalail/episodes", { episodeIds: ["b", "a"] }],
  ["series.remove", (a) => a.series.remove("dalail"), "DELETE", "/series/dalail"],
  ["playlists.list", (a) => a.playlists.list("s1"), "GET", "/playlists", undefined, { sheikhId: "s1" }],
  ["playlists.get", (a) => a.playlists.get("p1"), "GET", "/playlists/p1"],
  ["playlists.create", (a) => a.playlists.create(playlistInput), "POST", "/playlists", playlistInput],
  ["playlists.update", (a) => a.playlists.update("p1", playlistInput), "PUT", "/playlists/p1", playlistInput],
  ["playlists.remove", (a) => a.playlists.remove("p1"), "DELETE", "/playlists/p1"],
  ["shorts.list", (a) => a.shorts.list("s1"), "GET", "/shorts", undefined, { sheikhId: "s1" }],
  ["shorts.update", (a) => a.shorts.update("tt-1", { status: "published" }), "PATCH", "/shorts/tt-1", { status: "published" }],
  ["shorts.importJobs", (a) => a.shorts.importJobs("s1"), "GET", "/shorts/imports", undefined, { sheikhId: "s1" }],
  ["shorts.startImport", (a) => a.shorts.startImport("s1", { kind: "profile", handle: "@x", status: "published", limit: 5 }), "POST", "/shorts/imports", { sheikhId: "s1", input: { kind: "profile", handle: "@x", status: "published", limit: 5 } }],
  ["shorts.retryImportItem", (a) => a.shorts.retryImportItem("job-1", "item-2"), "POST", "/shorts/imports/job-1/items/item-2/retry", {}],
  ["questions.list", (a) => a.questions.list("s1", { status: "pending", categoryId: "family" }), "GET", "/questions", undefined, { sheikhId: "s1", status: "pending", categoryId: "family" }],
  ["questions.counts", (a) => a.questions.counts("s1"), "GET", "/questions/counts", undefined, { sheikhId: "s1" }],
  ["questions.update", (a) => a.questions.update("q1", { suggestedVideoId: null }), "PATCH", "/questions/q1", { suggestedVideoId: null }],
  ["questions.answer", (a) => a.questions.answer("q1", { kind: "text", text: "…", published: true }), "PUT", "/questions/q1/answer", { kind: "text", text: "…", published: true }],
  ["questions.reject", (a) => a.questions.reject("q1", "spam"), "POST", "/questions/q1/reject", { reason: "spam" }],
  ["questions.restore", (a) => a.questions.restore("q1"), "POST", "/questions/q1/restore", {}],
  ["questions.categories", (a) => a.questions.categories("s1"), "GET", "/question-categories", undefined, { sheikhId: "s1" }],
  ["questions.saveCategory (new)", (a) => a.questions.saveCategory({ title }), "POST", "/question-categories", { title }],
  ["questions.saveCategory (edit)", (a) => a.questions.saveCategory({ id: "family", title }), "PUT", "/question-categories/family", { id: "family", title }],
  ["questions.removeCategory", (a) => a.questions.removeCategory("family"), "DELETE", "/question-categories/family"],
  ["team.list", (a) => a.team.list("s1"), "GET", "/sheikhs/s1/members"],
  ["team.invite", (a) => a.team.invite({ sheikhIds: ["s1"], role: "editor", email: "e@y.org" }), "POST", "/invitations", { sheikhIds: ["s1"], role: "editor", email: "e@y.org" }],
  ["team.approve", (a) => a.team.approve("m1", "s1", "editor"), "POST", "/members/m1/approve", { sheikhId: "s1", role: "editor" }],
  ["team.decline", (a) => a.team.decline("m1", "s1"), "POST", "/members/m1/decline", { sheikhId: "s1" }],
  ["team.updateRole", (a) => a.team.updateRole("m1", "admin"), "PATCH", "/members/m1", { role: "admin" }],
  ["team.revoke", (a) => a.team.revoke("m1", "s1"), "DELETE", "/members/m1/sheikhs/s1"],
  ["team.resendInvite", (a) => a.team.resendInvite("m1"), "POST", "/invitations/m1/resend", {}],
];

describe("every call", () => {
  it.each(table)("%s", async (_, call, method, path, body, query = {}) => {
    await call(api);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method, path: `/admin${path}`, query });
    expect(calls[0].body).toEqual(body);
    expect(calls[0].init.credentials).toBe("include");
    expect(new Headers(calls[0].init.headers).get("Content-Type")).toBe(body === undefined ? null : "application/json");
  });
});

describe("responses and errors", () => {
  it("returns the JSON body", async () => {
    respond = () => json([{ id: "v1" }]);
    await expect(api.videos.list({})).resolves.toEqual([{ id: "v1" }]);
  });

  it("204 and 202 resolve to undefined", async () => {
    respond = () => new Response(null, { status: 204 });
    await expect(api.videos.remove("v1")).resolves.toBeUndefined();
    respond = () => new Response(null, { status: 202 });
    await expect(api.auth.requestLink("x@y.org", "ar")).resolves.toBeUndefined();
  });

  it("turns { error } bodies into ApiError with code, fields and status", async () => {
    respond = () => json({ error: { code: "conflict", message: "Episode taken", fields: { episode: "taken" } } }, 409);
    await expect(api.videos.create(videoInput)).rejects.toMatchObject({ name: "ApiError", code: "conflict", message: "Episode taken", fields: { episode: "taken" }, status: 409 });
  });

  it("a non-JSON error is a server error", async () => {
    respond = () => new Response("Bad gateway", { status: 502, statusText: "Bad Gateway" });
    await expect(api.videos.get("v1")).rejects.toMatchObject({ code: "server", status: 502 });
  });

  it("a failed request is a network error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(api.videos.get("v1")).rejects.toMatchObject({ code: "network" });
  });

  it("session() is null when signed out, and rethrows other errors", async () => {
    respond = () => json({ error: { code: "unauthenticated" } }, 401);
    await expect(api.auth.session()).resolves.toBeNull();
    respond = () => json({ error: { code: "server" } }, 500);
    await expect(api.auth.session()).rejects.toMatchObject({ code: "server" });
  });
});

describe("uploads", () => {
  it("asks for a signed URL, PUTs the file there and returns the file URL", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
    respond = () => json({ uploadUrl: "https://storage.example.org/put?sig=1", fileUrl: "https://cdn.example.org/v.mp4" });
    const file = new File(["abc"], "lesson.mp4", { type: "video/mp4" });
    const progress: number[] = [];

    const result = await api.uploads.create(file, "video", (pct) => progress.push(pct));

    expect(calls[0]).toMatchObject({ method: "POST", path: "/admin/uploads", body: { purpose: "video", fileName: "lesson.mp4", contentType: "video/mp4", sizeBytes: 3 } });
    expect(FakeXhr.last).toMatchObject({ method: "PUT", url: "https://storage.example.org/put?sig=1", headers: { "Content-Type": "video/mp4" } });
    expect(FakeXhr.last.sent).toBe(file);
    expect(progress).toEqual([50]);
    expect(result).toEqual({ url: "https://cdn.example.org/v.mp4", contentType: "video/mp4", sizeBytes: 3 });
  });

  it("fails when storage refuses the file", async () => {
    class Refused extends FakeXhr {
      status = 403;
    }
    vi.stubGlobal("XMLHttpRequest", Refused);
    respond = () => json({ uploadUrl: "https://storage.example.org/put", fileUrl: "x" });
    await expect(api.uploads.create(new File(["a"], "a.png", { type: "image/png" }), "thumbnail")).rejects.toMatchObject({ code: "server", status: 403 });
  });
});

describe("docs/specs/admin-api.md", () => {
  const spec = readFileSync(join(process.cwd(), "docs/specs/admin-api.md"), "utf8");

  /** Documented admin endpoints as "METHOD /path/:param", paths relative to {API}/admin. */
  const documented = new Set<string>();
  for (const line of spec.split("\n")) {
    const row = line.match(/^\| ([A-Z/ ]+) \| (.+?) \|/);
    if (!row) continue;
    const methods = row[1].split("/").map((m) => m.trim()).filter(Boolean);
    const paths = [...row[2].matchAll(/`([^`]+)`/g)].map((m) => m[1].split("?")[0]);
    for (const method of methods) {
      for (const raw of paths) {
        // The Q&A section writes admin paths in full (/admin/…); its other paths are public.
        const inQaSection = spec.indexOf(line) > spec.indexOf("## Questions & answers") && spec.indexOf(line) < spec.indexOf("## Team");
        if (inQaSection && !raw.startsWith("/admin/")) continue;
        documented.add(`${method} ${raw.replace(/^\/admin/, "")}`);
      }
    }
  }

  const toPattern = (route: string) => new RegExp(`^${route.replace(/:[a-zA-Z]+/g, "[^/]+")}$`);

  async function callEverything() {
    for (const [, call] of table) await call(api);
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
    await api.uploads.create(new File(["a"], "a.png", { type: "image/png" }), "thumbnail");
  }

  it("documents every call the client makes", async () => {
    await callEverything();
    const routes = [...documented];
    const missing = calls
      .map((c) => `${c.method} ${c.path.replace(/^\/admin/, "")}`)
      .filter((made) => !routes.some((route) => route.split(" ")[0] === made.split(" ")[0] && toPattern(route.split(" ")[1]).test(made.split(" ")[1])));
    expect(missing).toEqual([]);
  });

  it("lists no admin endpoint the client never calls", async () => {
    await callEverything();
    const made = calls.map((c) => `${c.method} ${c.path.replace(/^\/admin/, "")}`);
    const unused = [...documented].filter((route) => {
      const [method, path] = route.split(" ");
      return !made.some((m) => m.split(" ")[0] === method && toPattern(path).test(m.split(" ")[1]));
    });
    expect(unused).toEqual([]);
  });
});
