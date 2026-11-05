# 0003. Shorts imported from TikTok

**Date**: 2026-11-05
**Status**: Built (front end + import script); TikTok account link still to come

## Summary

The sheikh already posts short clips on TikTok. We download each clip with its cover and caption, host the file ourselves, and show the clips in a vertical feed on the site (swipe or arrow keys, one clip per screen, sound on tap). Each clip keeps a link to the original TikTok and, when it was cut from a lesson, a button to watch the full lesson. Written transcripts are planned for later, not the MVP.

## Context

Embedding TikTok's player would load TikTok's scripts and tracking on every visit, and clips would vanish if the account changes. Downloading gives us our own copies, a consistent player and fast loading. The account belongs to the sheikh, so republishing his own clips is fine; do not import other people's accounts.

## Requirements

**User stories**
- As a visitor, I can watch shorts one after another in a vertical feed, on phone and desktop.
- As a visitor, I can share a link to one clip and the feed opens on it.
- As a visitor, I can jump from a clip to the full lesson it comes from.
- As the site team, I can import new clips from the TikTok account with one command, without losing edits I made to titles.

**Acceptance criteria**
- **AC-1**: `/[locale]/shorts` shows a scroll-snap feed; the clip in view plays muted, others are paused; only the clip in view and its neighbours load their file. ✅
- **AC-2**: The address bar follows the clip (`/[locale]/shorts/<id>`), and opening that URL starts the feed on that clip. ✅
- **AC-3**: Controls: play/pause (tap the video), sound on/off (button, `M`), share (native share sheet or copy link), open on TikTok; ↑ ↓ / j k to move. ✅
- **AC-4**: A clip with `fromVideoId` shows "Full lesson" linking to the watch page. ✅
- **AC-5**: A clip without `mediaUrl` (not downloaded yet) shows the branded cover and "Watch on TikTok". ✅
- **AC-6**: The importer skips clips already imported, keeps hand edits (title, topics, status, `fromVideoId`), turns hashtags into topics and guesses the language (ar / kab / fr). ✅ (tested on sample metadata; not yet run against the real account)
- **AC-7**: Shorts appear in search (title and hashtags), on the home page, on the sheikh's page and in the library. ✅

## How to import

Requires [yt-dlp](https://github.com/yt-dlp/yt-dlp) on the PATH (`winget install yt-dlp`, `pip install yt-dlp` or `brew install yt-dlp`).

```bash
npm run import:tiktok -- --sheikh sheikh-1 https://www.tiktok.com/@ACCOUNT
npm run import:tiktok -- --sheikh sheikh-1 --limit 10 --status pending https://www.tiktok.com/@ACCOUNT
npm run import:tiktok -- --sheikh sheikh-1 --dry-run https://www.tiktok.com/@ACCOUNT
```

- Files go to `public/media/shorts/<tiktok id>.mp4|.jpg|.info.json`.
- Entries go to `src/data/shorts.imported.json`. While that file is empty the site shows the six sample clips; as soon as it has entries, only the imported clips are shown.
- `--ingest-only` rebuilds the entries from files already in the folder (useful after downloading by hand).
- `--out` + `--base-url` put files in object storage instead (see below).

## Decision

- Self-hosted copies, imported by `scripts/import-tiktok.mjs` (yt-dlp), metadata in a JSON file the site reads.
- A separate `Short` type (not a `Video` with `kind: "short"`), so the TikTok source, status and future transcript have a home.
- Feed: native scroll-snap + IntersectionObserver, no player library.

## For the backend developer

- Move the import into a scheduled job (for example every hour): list the account, download new clips, upload video + cover to object storage (S3, Cloudflare R2, Vercel Blob…), create `Short` rows with `status: "pending"` so an admin reviews them in the admin panel before they go live.
- Do not commit many video files to the repo: hosting large media from `public/` makes deployments heavy. The sample clips are tiny placeholders (about 70 KB each).
- Optionally transcode to H.264 720p and keep the original cover frame as `posterUrl`.

## Later (not MVP)

- **Transcripts**: run speech-to-text on each clip (Arabic + Taqbaylit), store in `transcript`, show it under the clip and index it in search. The `Short.transcript` field and search weighting already exist.
- Link clips to lessons automatically (by matching transcript to lesson transcripts).
