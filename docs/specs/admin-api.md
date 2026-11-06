# Admin API (backend contract for the admin panel)

The admin panel (`/ar/admin`, `/fr/admin`) is frontend only. Every call goes
through `src/features/admin/api/client.ts`:

- without `NEXT_PUBLIC_API_URL` → in-memory mock (`api/mock/`, demo data, kept in `sessionStorage` for the tab);
- with `NEXT_PUBLIC_API_URL=https://api.example.com` → `api/http.ts`, which calls the endpoints below.

The TypeScript shapes are the source of truth: `src/features/admin/api/types.ts`
(DTOs) and `src/features/admin/api/contract.ts` (every call). They mirror the
public content model in `src/lib/types.ts` (see `docs/specs/0001-content-model.md`).

Two more references for the backend:

- **Rules in code**: the limits (title lengths, question 20–1500, import 1–50, voice 5 min…) live in
  `src/features/admin/rules.ts`; the role table in `src/features/admin/permissions.ts`.
- **Executable reference**: the demo backend (`api/mock/`) applies every rule on this page, and its tests
  (`api/mock/*.test.ts`) list them one by one — "an admin can only approve as editor", "a rejected patch changes
  nothing", … `api/http.test.ts` pins each call to its method, path and body, and **fails if an endpoint in this
  file and the client disagree**. Run `npm test`.

## Conventions

- Base path: `{API}/admin` — paths in the tables are relative to it, except in the Q&A section, which lists the public endpoints too and so writes `/admin/…` in full. JSON in and out. Dates are ISO 8601; publish dates are plain `YYYY-MM-DD`.
- Session: httpOnly, `Secure`, `SameSite=Lax` cookie set by the sign-in endpoints; all requests use `credentials: "include"` (allow the site origin in CORS with credentials).
- Errors: HTTP status + `{ "error": { "code": string, "message": string, "fields"?: { [field]: string } } }`.
  Codes: `unauthenticated` (401), `forbidden` (403), `not_found` (404), `validation` (422), `conflict` (409), `bad_code` (400), `rate_limited` (429).
- Every resource belongs to a sheikh (`sheikhId`). The server checks the member has that sheikh in `sheikhIds` **and** the role allows the action (table below) on every call — the UI only hides buttons.
- `202`/`204` responses have no body.

## Roles and permissions

Decided with the product owner (2026-11-05):

| Action | owner (the sheikh) | admin | editor |
| --- | :-: | :-: | :-: |
| Videos, series, playlists, shorts: create, edit, publish, hide, delete, import from TikTok | ✓ | ✓ | ✓ |
| Questions: categorize, reject, restore, suggest a video, manage categories | ✓ | ✓ | ✓ |
| Questions: **answer** (text / voice / video), edit an answer, publish a Q&A on the site | ✓ | – | – |
| See the team | ✓ | ✓ | ✓ |
| Invite, approve, decline, remove **editors** | ✓ | ✓ | – |
| Invite, approve, remove **admins**; change roles | ✓ | – | – |
| Edit the sheikh's profile | ✓ | ✓ | – |

Nobody can change or remove the owner, or themself. Same table in code:
`src/features/admin/permissions.ts`.

Note: `Member.role` applies to all of a member's `sheikhIds` (shape from the brief). If one person must be
admin for sheikh A and editor for sheikh B, move to `memberships: [{ sheikhId, role }]`.
Profile editing for admins is an assumption — confirm with the sheikh.

## Auth (e-mail link only, no passwords)

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/auth/email-link` | `{ email, locale: "ar" \| "fr" }` | 202 always (never reveal whether the e-mail exists). Sends a link `…/{locale}/admin/sign-in?token=…` and a 6-digit code, both valid 15 min, single use. Rate-limit per e-mail and IP. |
| POST | `/auth/verify-code` | `{ email, code }` | `Session` + cookie, or 400 `bad_code`. Lock after 5 wrong codes. |
| POST | `/auth/verify-token` | `{ token }` | `Session` + cookie |
| GET | `/session` | – | `Session` or 401 |
| POST | `/auth/sign-out` | – | 204 |
| POST | `/access-requests` | `{ name, email, sheikhId, message? }` | 202. Public, rate-limited. Creates a `Member` with `status: "requested"`, `role: "editor"`. |
| GET | `/directory/sheikhs` | – | `[{ id, name, monogram, photo? }]` (public, for the request form) |

`Session = { member: Member, sheikhs: AdminSheikh[] }`. First sign-in of an invited member turns `invited` → `active`.
Invitations by Telegram username: the invitee opens the link, then signs in with an e-mail (stored on the member).

## Sheikh profile and dashboard

| Method | Path | Body / query | Response |
| --- | --- | --- | --- |
| GET | `/sheikhs/:id` | – | `AdminSheikh` |
| PUT | `/sheikhs/:id` | `SheikhInput` (`name`, `honorific?`, `bio?` as `{ ar, fr, kab }`; `monogram`; `photo?`; `socials { telegram?, tiktok?, youtube? }` full URLs; `takesQuestions`) | `AdminSheikh` |
| GET | `/sheikhs/:id/dashboard` | – | `DashboardSummary` (pending questions + latest 3, drafts count + latest 4, shorts to review, last import, published this month, featured series progress, access requests) |
| GET | `/sheikhs/:id/topics` | – | `string[]` topics already used (suggestions) |

## Videos

| Method | Path | Body / query | Response |
| --- | --- | --- | --- |
| GET | `/videos` | `?sheikhId&status=draft\|published&collection=series:<id>\|playlist:<id>\|none&q` (q searches title, summary, topics). Without `sheikhId`: all the member's sheikhs. Drafts first (by `updatedAt`), then by `publishedAt` desc. | `AdminVideo[]` |
| GET | `/videos/:id` | – | `AdminVideo` |
| POST | `/videos` | `VideoInput` | `AdminVideo` (server makes `slug` from the title if missing) |
| PUT | `/videos/:id` | `VideoInput` | `AdminVideo` |
| PATCH | `/videos/:id/status` | `{ status }` | `AdminVideo` |
| DELETE | `/videos/:id` | – | 204 (also removed from its series — renumber — and playlists) |

`VideoInput`: `sheikhId, title (3–160), summary? (≤200), description? (≤5000), lang, kind ("series"|"kabyle"|"qa"|"mixed"), duration ("mm:ss"; the API may send `durationSec` instead and the client formats it), topics (≤10, each ≤40), source, seriesId?, episode?, sectionId? (a محور of that series), status, publishedAt, thumbnail?`.
`source = { kind: "youtube", youtubeId, url } | { kind: "upload", url, fileName?, sizeBytes? }`.
For YouTube the backend should fill `duration` (and a thumbnail) from the YouTube API when the editor leaves it empty (`"0:00"`).
`status: "published"` with a future `publishedAt` = scheduled: the public site shows it from that date.
Episode: `409 conflict` with `fields.episode = "taken"` if that number is used in the series (reorder through the series instead).

## Series and playlists

Series = numbered lessons (repo `Series`, e.g. دلائل النبوّة); playlist = hand-picked unnumbered list (repo `Playlist`).

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| GET | `/series?sheikhId` | – | `AdminSeries[]` |
| GET | `/series/:id` | – | `AdminSeries` |
| POST | `/series` | `SeriesInput` | `AdminSeries` |
| PUT | `/series/:id` | `SeriesInput` (incl. `episodeIds`) | `AdminSeries` |
| PUT | `/series/:id/episodes` | `{ episodeIds }` | `AdminSeries` — order = episode numbers (sets `seriesId` + `episode` on each video; a video added here leaves its previous series) |
| DELETE | `/series/:id` | – | 204 (videos stay, lose `seriesId`) |
| GET/POST | `/playlists?sheikhId` / `/playlists` | `PlaylistInput` | `AdminPlaylist[]` / `AdminPlaylist` |
| GET/PUT/DELETE | `/playlists/:id` | `PlaylistInput` (incl. ordered `videoIds`) | `AdminPlaylist` / 204 |

`SeriesInput`: `sheikhId, slug (^[a-z0-9]+(-[a-z0-9]+)*$, unique), title, lang, description, tagline?, glyph (1–3 chars), coverUrl?, plannedCount (≥ episodes), status: "ongoing"|"complete", featured? (one per sheikh — setting it clears the others), visibility: "draft"|"published", episodeIds?`.
`visibility` is used because the repo's `Series.status` already means ongoing/complete. `sections` are kept but not edited yet.

## Shorts (TikTok import)

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| GET | `/shorts?sheikhId` | – | `AdminShort[]` (newest import first) |
| PATCH | `/shorts/:id` | `{ title?, lang?, topics?, fromVideoId? ("" clears), tone?, status? }` | `AdminShort` (first publish sets `publishedAt`) |
| GET | `/shorts/imports?sheikhId` | – | `ImportJob[]` newest first; the panel polls every 3 s while one is `running` |
| POST | `/shorts/imports` | `{ sheikhId, input: ({ kind: "profile", handle: "@name" } \| { kind: "links", urls: string[] }) & { status?: "pending"\|"published"\|"hidden" (default "pending"), limit?: 1–50 (none = every new clip) } }` | `ImportJob` (202-style: returns at once, a worker fills it). 422 `fields.limit = "range"` for a limit outside 1–50, 422 `fields.urls = "required"` for an empty link list |
| POST | `/shorts/imports/:jobId/items/:itemId/retry` | – | `ImportJob` — only a `failed` item (else 409) |

Worker: the same steps as `scripts/import-tiktok.mjs --sheikh <id> --status <s> --limit <n> <urls>` (yt-dlp), run on the server:
list the profile's videos newest first (or take the links), skip `externalId`s already imported (`state: "skipped"`),
download each file to our storage, set `mediaUrl` + `posterUrl` + `duration`, create the short with id `tt-<tiktok id>` and the requested `status`.
Item `state: queued → downloading (progress 0–100) → imported | failed`, `error: "private" | "not_found" | "download_failed"`.
`transcript` stays `null` (not in the MVP; the field is shown disabled).

## Questions & answers

Questions are anonymous (rules in `0005-questions-and-answers.md`): store only `sheikhId`, `categoryId`, `body`, `lang`, `isPublic`,
`askedAt`, `status` and the **hash** of the visitor's tracking code — never a name, e-mail, phone, IP, user agent, cookie or device id,
and don't log the request body or IP of the public endpoint. Admin endpoints never return the tracking code or its hash.

Public endpoints (same backend, no `/admin` prefix, called by the site with `credentials: "omit"` — listed here so there is one set):

| Method | Path | Body / query | Response |
| --- | --- | --- | --- |
| POST | `/questions` | `{ sheikhId, categoryId, body (20–1500), lang, isPublic }` | `201 { trackingCode: "K7Q-4M2", status: "pending" }` — 400 unknown sheikh/category, 429 rate limit |
| GET | `/questions/track/:code` | – | `{ status, questionId? }` (`questionId` once answered and published) or 404 |
| GET | `/questions` · `/questions/:id` | `?sheikh&category&kind&q&limit&before` | answered questions with `isPublic && published` only |
| GET | `/categories` | – | `QuestionCategory[]` |

Admin endpoints:

| Method | Path | Body / query | Response |
| --- | --- | --- | --- |
| GET | `/admin/questions` | `?sheikhId&status=pending\|answered\|rejected&categoryId&q` | `AdminQuestion[]` (newest first) |
| GET | `/admin/questions/counts?sheikhId` | – | `{ pending, answered, rejected }` |
| PATCH | `/admin/questions/:id` | `{ body?, categoryId?, suggestedVideoId? (null clears), published? }` — `body` (20–1500) lets the team remove a personal detail the visitor typed; `published` is owner-only, needs `isPublic` and `status: "answered"` (else 409) | `AdminQuestion` |
| PUT | `/admin/questions/:id/answer` | `AnswerInput { kind: "text"\|"voice"\|"video", text?, audioUrl?, audioDuration? ("m:ss"), videoId?, published }` — owner only | `AdminQuestion` (`status: "answered"`) |
| POST | `/admin/questions/:id/reject` | `{ reason: "spam"\|"duplicate"\|"off_topic"\|"other" }` | `AdminQuestion` |
| POST | `/admin/questions/:id/restore` | – | `AdminQuestion` (back to `pending`, or `answered` if it has an answer) |
| GET | `/admin/question-categories?sheikhId` | – | `[{ id, title: { ar, fr, kab }, questionCount }]` (ids: `aqida`, `worship`, `family`, `dealings`, `knowledge`, …) |
| POST | `/admin/question-categories` | `{ title: { ar, fr, kab } }` | `QuestionCategory` (id made from the French title) |
| PUT | `/admin/question-categories/:id` | `{ title: { ar, fr, kab } }` | `QuestionCategory` |
| DELETE | `/admin/question-categories/:id` | – | 204, or 409 if questions use it |

Two flags, both needed for a Q&A to be public: `isPublic` (the visitor agreed, set by the ask form, read-only here)
and `published` (the sheikh's choice). **The public site should list `status === "answered" && isPublic && published`** —
`published` is new compared with `src/lib/types.ts`.
Voice answers are recorded in the browser (MediaRecorder: `audio/webm;codecs=opus`, or `audio/mp4` on Safari, ≤ 5 min), uploaded with `purpose: "voice"`, then sent as `audioUrl`. Transcode to AAC/MP3 server-side if needed for old Safari.

## Team

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| GET | `/sheikhs/:id/members` | – | `Member[]` with every status (`active`, `invited`, `requested`) for that sheikh |
| POST | `/invitations` | `InviteInput { sheikhIds, role: "admin"\|"editor", name?, email? \| telegram?, message? }` | `{ member, inviteUrl }` — e-mail: we send it; Telegram: the panel shows `inviteUrl` to copy (valid 7 days). 422 without e-mail or Telegram; 409 if already active; inviting someone with a pending access request turns it into an invitation. The role must be one the inviter may grant, for every sheikh in `sheikhIds`. |
| POST | `/invitations/:memberId/resend` | – | `{ member, inviteUrl }` — only for `invited` members (else 409), by someone who may manage that member |
| POST | `/members/:id/approve` | `{ sheikhId, role }` | `Member` (`active`) — only a `requested` member (else 409) of that sheikh (else 404); an admin may only approve as `editor` |
| POST | `/members/:id/decline` | `{ sheikhId }` | 204 |
| PATCH | `/members/:id` | `{ role }` (owner only, of a sheikh that member belongs to) | `Member` |
| DELETE | `/members/:id/sheikhs/:sheikhId` | – | 204 (revoke access / cancel invitation; deletes the member when no sheikh is left). Content they published stays. |

## Uploads

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/uploads` | `{ purpose: "thumbnail"\|"cover"\|"avatar"\|"video"\|"voice", fileName, contentType, sizeBytes }` | `{ uploadUrl, headers?, fileUrl }` — a signed URL; the browser `PUT`s the file there (progress via XHR) and then stores `fileUrl` |

Limits checked by the panel and to be enforced by the server: images JPG/PNG/WebP ≤ 5 MB, videos MP4/MOV/WebM ≤ 2 GB, voice ≤ 5 min.

## Field names that differ from the brief (the repo won)

`photo` (brief: `avatarUrl`), `thumbnail` (`thumbnailUrl`), `seriesId` + `Series` (brief: `playlistId` + `Playlist` for numbered series),
`duration` / `audioDuration` as `"m:ss"` strings (brief: `durationSec`, `audioDurationSec`), `categoryId` (brief: `category`),
series/playlist `visibility` (brief: `status`), `Sheikh.name/bio/honorific` are `{ ar, fr, kab }`.
Imported short ids are `tt-<tiktok id>` (as in `scripts/import-tiktok.mjs`); videos keep `sectionId` (the محور) as in `src/lib/types.ts`.
Added: `Video.status`, `Video.source`, `Video.slug`, `AdminQuestion.published`, `suggestedVideoId`, `rejection`, `Member.createdAt/lastActiveAt/invitedBy/message`, `ImportJob`.
