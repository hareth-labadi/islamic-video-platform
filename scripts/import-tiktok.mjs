#!/usr/bin/env node
/*
 * Import the sheikh's TikTok videos as site "shorts".
 *
 * Downloads each clip (video + cover image + metadata) with yt-dlp into
 * public/media/shorts/, then adds or updates its entry in
 * src/data/shorts.imported.json — the file the site reads (see src/data/content.ts).
 * Already-imported clips are skipped, and hand edits to an entry (title, topics,
 * status, fromVideoId…) are kept when it is imported again.
 *
 * Needs yt-dlp on the PATH:  winget install yt-dlp   ·   pip install yt-dlp   ·   brew install yt-dlp
 * Only import an account you have the right to republish (the sheikh's own).
 *
 * Usage
 *   node scripts/import-tiktok.mjs --sheikh sheikh-1 https://www.tiktok.com/@account
 *   node scripts/import-tiktok.mjs --sheikh sheikh-1 --limit 10 <profile or video URLs…>
 *
 * Options
 *   --sheikh <id>        sheikhId the clips belong to (required; see `sheikhs` in src/data/content.ts)
 *   --status <s>         published (default) | pending | hidden
 *   --limit <n>          import at most n new clips (newest first)
 *   --out <dir>          where files go (default public/media/shorts)
 *   --base-url <url>     public URL of that folder (default derived from --out, e.g. /media/shorts)
 *   --manifest <file>    data file to update (default src/data/shorts.imported.json)
 *   --ingest-only        do not download: read the *.info.json files already in --out
 *   --dry-run            show what would change, write nothing
 */

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const opts = { status: "published", out: "public/media/shorts", manifest: "src/data/shorts.imported.json", urls: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--sheikh") opts.sheikh = next();
    else if (a === "--status") opts.status = next();
    else if (a === "--limit") opts.limit = Number(next());
    else if (a === "--out") opts.out = next();
    else if (a === "--base-url") opts.baseUrl = next();
    else if (a === "--manifest") opts.manifest = next();
    else if (a === "--ingest-only") opts.ingestOnly = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "-h" || a === "--help") opts.help = true;
    else if (a.startsWith("--")) throw new Error(`Unknown option ${a}`);
    else opts.urls.push(a);
  }
  return opts;
}

function usage() {
  console.log(`Usage: node scripts/import-tiktok.mjs --sheikh <id> [--limit n] [--status published|pending|hidden] <TikTok profile or video URLs…>
       node scripts/import-tiktok.mjs --sheikh <id> --ingest-only   (use files already downloaded into --out)
See the comment at the top of this file for every option.`);
}

async function ytDlp(args) {
  try {
    const { stdout } = await run("yt-dlp", args, { maxBuffer: 64 * 1024 * 1024 });
    return stdout;
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error("yt-dlp is not installed or not on the PATH. Install it (winget install yt-dlp · pip install yt-dlp · brew install yt-dlp) and try again.");
    }
    throw new Error(`yt-dlp failed: ${err.stderr || err.message}`);
  }
}

/** Video ids + URLs behind a profile or a single video link. */
async function listEntries(url) {
  const info = JSON.parse(await ytDlp(["--flat-playlist", "--dump-single-json", "--no-warnings", url]));
  const entries = info.entries ?? [info];
  return entries.map((e) => ({ id: String(e.id), url: e.url ?? e.webpage_url ?? url, timestamp: e.timestamp ?? 0 }));
}

async function download(entry, outDir) {
  await ytDlp([
    "--no-warnings",
    "--no-progress",
    "-f", "mp4/best",
    "--merge-output-format", "mp4",
    "--write-info-json",
    "--write-thumbnail",
    "--convert-thumbnails", "jpg",
    "-o", path.join(outDir, "%(id)s.%(ext)s"),
    entry.url,
  ]);
}

/* ---------------------------------------------------------- metadata → Short */

const HASHTAG = /#([\p{L}\p{N}_]+)/gu;

function clock(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function isoDate(info) {
  if (info.upload_date && /^\d{8}$/.test(info.upload_date)) {
    const d = info.upload_date;
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  }
  if (info.timestamp) return new Date(info.timestamp * 1000).toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

/** Guess the spoken language from the caption: Arabic script → ar, Kabyle letters → kab, else fr. */
function guessLang(text) {
  const arabic = (text.match(/[؀-ۿ]/g) ?? []).length;
  const latin = (text.match(/[A-Za-zÀ-ɏḀ-ỿ]/g) ?? []).length;
  if (arabic >= latin) return "ar";
  return /[ɛɣḥṭṣẓčǧṛ]/i.test(text) ? "kab" : "fr";
}

/** Caption without hashtags, one line, at most ~110 characters. */
function cleanTitle(text) {
  const plain = text.replace(HASHTAG, "").replace(/\s+/g, " ").trim();
  if (plain.length <= 110) return plain;
  const cut = plain.slice(0, 110);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 80)).trim()}…`;
}

function toShort(info, { sheikh, status, baseUrl, outDir }) {
  const caption = info.description || info.title || "";
  const topics = [...new Set([...[...caption.matchAll(HASHTAG)].map((m) => m[1]), ...(info.tags ?? [])])]
    .filter((t) => !/^(fyp|foryou|foryoupage|viral|tiktok|explore)$/i.test(t))
    .slice(0, 8);
  const poster = ["jpg", "webp", "png"].map((ext) => `${info.id}.${ext}`).find((f) => existsSync(path.join(outDir, f)));
  const media = ["mp4", "webm", "mov"].map((ext) => `${info.id}.${ext}`).find((f) => existsSync(path.join(outDir, f)));
  return {
    id: `tt-${info.id}`,
    sheikhId: sheikh,
    title: cleanTitle(caption) || `TikTok ${info.id}`,
    lang: guessLang(caption),
    duration: clock(info.duration),
    publishedAt: isoDate(info),
    source: { platform: "tiktok", url: info.webpage_url || `https://www.tiktok.com/video/${info.id}`, externalId: String(info.id) },
    ...(media ? { mediaUrl: `${baseUrl}/${media}` } : {}),
    ...(poster ? { posterUrl: `${baseUrl}/${poster}` } : {}),
    ...(topics.length ? { topics } : {}),
    status,
  };
}

/* ------------------------------------------------------------------- main */

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) return usage();
  if (!opts.sheikh) {
    usage();
    throw new Error("--sheikh is required (e.g. --sheikh sheikh-1).");
  }
  if (!["published", "pending", "hidden"].includes(opts.status)) throw new Error("--status must be published, pending or hidden.");
  if (!opts.ingestOnly && opts.urls.length === 0) {
    usage();
    throw new Error("Give at least one TikTok profile or video URL, or use --ingest-only.");
  }

  const outDir = path.resolve(ROOT, opts.out);
  const manifestPath = path.resolve(ROOT, opts.manifest);
  const rel = path.relative(path.join(ROOT, "public"), outDir).split(path.sep).join("/");
  const baseUrl = (opts.baseUrl ?? (rel.startsWith("..") ? null : `/${rel}`))?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("--out is outside public/: also give --base-url (where those files are served from).");

  const manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, "utf8")) : [];
  const known = new Set(manifest.map((s) => s.source?.externalId));
  await mkdir(outDir, { recursive: true });

  if (!opts.ingestOnly) {
    let entries = [];
    for (const url of opts.urls) entries.push(...(await listEntries(url)));
    entries = entries.filter((e, i, all) => all.findIndex((x) => x.id === e.id) === i && !known.has(e.id));
    entries.sort((a, b) => b.timestamp - a.timestamp);
    if (opts.limit) entries = entries.slice(0, opts.limit);
    console.log(`${entries.length} new clip(s) to download.`);
    for (const [i, entry] of entries.entries()) {
      console.log(`  [${i + 1}/${entries.length}] ${entry.id}`);
      if (!opts.dryRun) await download(entry, outDir);
    }
  }

  const infoFiles = (await readdir(outDir)).filter((f) => f.endsWith(".info.json"));
  const byId = new Map(manifest.map((s) => [s.source.externalId, s]));
  let added = 0;
  let updated = 0;
  for (const file of infoFiles) {
    const info = JSON.parse(await readFile(path.join(outDir, file), "utf8"));
    const fresh = toShort(info, { sheikh: opts.sheikh, status: opts.status, baseUrl, outDir });
    const old = byId.get(fresh.source.externalId);
    if (old) {
      // Keep hand edits; refresh only what comes from the file.
      byId.set(fresh.source.externalId, { ...fresh, ...old, mediaUrl: fresh.mediaUrl ?? old.mediaUrl, posterUrl: fresh.posterUrl ?? old.posterUrl, duration: fresh.duration });
      updated++;
    } else {
      byId.set(fresh.source.externalId, fresh);
      added++;
    }
  }

  const next = [...byId.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  console.log(`${added} added, ${updated} refreshed, ${next.length} short(s) in ${path.relative(ROOT, manifestPath)}.`);
  if (opts.dryRun) {
    console.log(JSON.stringify(next.slice(0, 3), null, 2));
    console.log("(dry run: nothing written)");
    return;
  }
  await writeFile(manifestPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

main().catch((err) => {
  console.error(`✖ ${err.message}`);
  process.exit(1);
});
