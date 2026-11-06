import { describe, expect, it } from "vitest";
import { isHttpUrl, normalizeTelegram, parseTikTokLine, parseYouTubeId, telegramUsername, tiktokHandle } from "./links";

describe("parseYouTubeId", () => {
  const id = "dQw4w9WgXcQ";

  it.each([
    id,
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=42s`,
    `youtube.com/watch?v=${id}`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/live/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
  ])("finds the id in %s", (input) => {
    expect(parseYouTubeId(input)).toBe(id);
  });

  it.each(["", "hello", "https://vimeo.com/12345", "https://youtube.com/watch?v=short", "https://youtube.com/channel/UC123"])("rejects %j", (input) => {
    expect(parseYouTubeId(input)).toBeNull();
  });
});

describe("parseTikTokLine", () => {
  it("reads a profile from @name or a profile URL", () => {
    expect(parseTikTokLine("@sheikh.dz")).toEqual({ kind: "profile", handle: "@sheikh.dz", url: "https://www.tiktok.com/@sheikh.dz" });
    expect(parseTikTokLine("https://www.tiktok.com/@sheikh.dz/")).toMatchObject({ kind: "profile", handle: "@sheikh.dz" });
  });

  it("reads a video link and drops the query string", () => {
    expect(parseTikTokLine("https://www.tiktok.com/@sheikh.dz/video/7312345678901234567?lang=fr")).toEqual({
      kind: "video",
      handle: "@sheikh.dz",
      id: "7312345678901234567",
      url: "https://www.tiktok.com/@sheikh.dz/video/7312345678901234567",
    });
  });

  it("accepts short share links", () => {
    expect(parseTikTokLine("https://vm.tiktok.com/ZMabc123/")).toMatchObject({ kind: "video", id: "ZMabc123" });
  });

  it.each(["https://youtube.com/@name", "tiktok", "https://www.tiktok.com/discover"])("marks %s invalid", (line) => {
    expect(parseTikTokLine(line).kind).toBe("invalid");
  });

  it("tiktokHandle returns the handle of a profile URL only", () => {
    expect(tiktokHandle("https://www.tiktok.com/@name")).toBe("@name");
    expect(tiktokHandle("https://www.tiktok.com/@name/video/7312345678901234567")).toBeNull();
    expect(tiktokHandle(undefined)).toBeNull();
  });
});

describe("Telegram", () => {
  it.each(["@ilm_nafi", "ilm_nafi", "t.me/ilm_nafi", "https://t.me/ilm_nafi/", "https://telegram.me/ilm_nafi"])("normalizes %s", (input) => {
    expect(normalizeTelegram(input)).toBe("https://t.me/ilm_nafi");
  });

  it("rejects names that are too short or start with a digit", () => {
    expect(normalizeTelegram("@abc")).toBeNull();
    expect(normalizeTelegram("1abcdef")).toBeNull();
  });

  it("telegramUsername strips the @ and refuses links", () => {
    expect(telegramUsername("@karim_dz")).toBe("karim_dz");
    expect(telegramUsername("t.me/karim_dz")).toBeNull();
  });
});

describe("isHttpUrl", () => {
  it("accepts http(s) only", () => {
    expect(isHttpUrl("https://example.org")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("not a url")).toBe(false);
  });

  it("can require a host", () => {
    expect(isHttpUrl("https://www.youtube.com/@name", ["youtube.com", "youtu.be"])).toBe(true);
    expect(isHttpUrl("https://evil.com/youtube.com", ["youtube.com"])).toBe(false);
  });
});
