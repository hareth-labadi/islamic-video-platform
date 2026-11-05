# Project documentation

What the site does, how the content is shaped, and what the backend has to provide. Start with the content model; each feature has its own page.

| # | Spec | What it covers |
| --- | --- | --- |
| 0001 | [Content model](specs/0001-content-model.md) | Sheikhs, series, videos, shorts, questions; the read API the site needs |
| 0002 | [Library, series and sheikhs](specs/0002-library-series-and-sheikhs.md) | Any number of series, the archive by month, sheikh on every card, sheikh pages |
| 0003 | [Shorts from TikTok](specs/0003-shorts-from-tiktok.md) | Vertical feed, the import script, hosting, transcripts later |
| 0004 | [Search](specs/0004-search.md) | The new search panel and page, Arabic/French matching rules |
| 0005 | [Questions and answers](specs/0005-questions-and-answers.md) | Anonymous questions, voice answers, tracking codes, Telegram, privacy rules, API |
| — | `specs/admin-*.md` | Admin panel (front end) — written by the admin panel work, see below |

## Who builds what

- **Public site** (this repo, front end): built on sample data in `src/data/content.ts`. Swapping to the API means rewriting the helpers at the bottom of that file and `src/data/search.ts`; pages do not change.
- **Admin panel** (front end): sheikh and team accounts, videos, series, shorts review, questions inbox with voice recording. Built in a separate session against the same content model; its API needs are in `docs/specs/admin-api.md`.
- **Backend** (another developer): the read API in 0001, the question endpoints in 0005, the TikTok import job in 0003, media storage, search in 0004, and the admin API.

## Roadmap

**Done in the front end (November 2026)**
- Several sheikhs; sheikh on every card; sheikh pages.
- Any number of lesson series; library page; archive by month.
- Shorts feed with sample clips; TikTok import script.
- New search panel and page over everything, Arabic and French aware.
- Q&A section: anonymous ask form, tracking codes, voice answers, Telegram.

**Next**
- Admin panel front end (in progress in its own session).
- Backend: read API, question endpoints, media storage, TikTok import job.
- Real content: the sheikh's name, bio, photo, Telegram and TikTok links, real videos.

**Later (not MVP)**
- Transcripts for shorts and lessons (speech-to-text), shown on the page and searchable.
- Optional answer notifications (Telegram bot or e-mail, with consent).
- Server-side search engine once the catalogue grows.

## Still waiting on

- The TikTok account link (to run the import).
- The reference website of the other sheikh whose search and Q&A you like (optional; the search can be adjusted to it).
- The sheikh's Telegram username.
