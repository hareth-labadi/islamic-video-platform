/** Pulls the 11-character video id out of any common YouTube link (watch, youtu.be, shorts, embed, live). */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  let url: URL;
  try {
    url = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const match = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/);
      id = match?.[1] ?? null;
    }
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

export function youTubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youTubeUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export type TikTokLink =
  | { kind: "profile"; handle: string; url: string }
  | { kind: "video"; handle?: string; id: string; url: string }
  | { kind: "invalid"; raw: string };

/** Reads one pasted line: a profile (tiktok.com/@name or @name) or a video (…/@name/video/<digits>, vm.tiktok.com/…). */
export function parseTikTokLine(line: string): TikTokLink {
  const raw = line.trim();
  const handleOnly = raw.match(/^@([\w.]{2,24})$/);
  if (handleOnly) return { kind: "profile", handle: `@${handleOnly[1]}`, url: `https://www.tiktok.com/@${handleOnly[1]}` };
  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return { kind: "invalid", raw };
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  if (host === "vm.tiktok.com" || host === "vt.tiktok.com") {
    const code = url.pathname.split("/").filter(Boolean)[0];
    return code ? { kind: "video", id: code, url: url.href } : { kind: "invalid", raw };
  }
  if (host !== "tiktok.com") return { kind: "invalid", raw };
  const video = url.pathname.match(/^\/@([\w.]{2,24})\/video\/(\d{8,25})/);
  if (video) return { kind: "video", handle: `@${video[1]}`, id: video[2], url: `https://www.tiktok.com/@${video[1]}/video/${video[2]}` };
  const profile = url.pathname.match(/^\/@([\w.]{2,24})\/?$/);
  if (profile) return { kind: "profile", handle: `@${profile[1]}`, url: `https://www.tiktok.com/@${profile[1]}` };
  return { kind: "invalid", raw };
}

/** "@name" from a saved TikTok profile URL, if it is one. */
export function tiktokHandle(profileUrl?: string): string | null {
  if (!profileUrl) return null;
  const parsed = parseTikTokLine(profileUrl);
  return parsed.kind === "profile" ? parsed.handle : null;
}

/** Accepts "@name", "name", "t.me/name" or "https://t.me/name"; returns "https://t.me/name". */
export function normalizeTelegram(input: string): string | null {
  const value = input.trim();
  const match = value.match(/^(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([\w]{5,32})\/?$/i) ?? value.match(/^@?([A-Za-z][\w]{4,31})$/);
  return match ? `https://t.me/${match[1]}` : null;
}

export function telegramUsername(input: string): string | null {
  const match = input.trim().match(/^@?([A-Za-z][\w]{4,31})$/);
  return match ? match[1] : null;
}

export function isHttpUrl(input: string, hosts?: string[]): boolean {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (!hosts) return true;
    const host = url.hostname.replace(/^(www\.|m\.)/, "");
    return hosts.includes(host);
  } catch {
    return false;
  }
}
