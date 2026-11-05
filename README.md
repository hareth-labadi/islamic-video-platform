# Islamic video platform — front-end

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4. Front-end only: no
server, no database, no accounts. Content comes from one TypeScript file and
watch progress is saved in the visitor's browser.

Three interface languages: Arabic (`ar`, right-to-left), French (`fr`) and
Taqbaylit (`kab`, Latin script). Several sheikhs can publish: every video,
series, short and answered question belongs to a sheikh, and cards show whose
lesson it is.

Feature specs, the content model and the API the backend should provide are in
[`docs/`](docs/README.md).

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Pages

| URL | What |
| --- | --- |
| `/` | Redirects to `/ar`, `/fr` or `/kab` from the browser language (`src/proxy.ts`) |
| `/[locale]` | Home |
| `/[locale]/series` | Library: every series, collections, archive by month |
| `/[locale]/series/[slug]` | One series, grouped by section (محور) |
| `/[locale]/watch/[id]` | Video page with player, chapters, next episode, sheikh |
| `/[locale]/shorts` · `/[locale]/shorts/[id]` | Vertical feed of short clips (opens on a clip) |
| `/[locale]/questions` | Q&A: answers, anonymous ask form, follow a question |
| `/[locale]/questions/[id]` | One question and its answer (text, voice or video) |
| `/[locale]/sheikhs` · `/[locale]/sheikhs/[slug]` | Sheikhs and each sheikh's page |
| `/[locale]/search?q=` | Search everything, with scopes and filters |
| `/[locale]/about` | Redirects to the main sheikh's page |
| `/[locale]/components` | Style guide: every component with examples (not indexed) |

`[locale]` is `ar`, `fr` or `kab`. The language switcher keeps you on the same page.

Press `/` or `Ctrl K` anywhere to open search.

Import the sheikh's TikTok clips (needs yt-dlp; see `docs/specs/0003-shorts-from-tiktok.md`):

```bash
npm run import:tiktok -- --sheikh sheikh-1 https://www.tiktok.com/@ACCOUNT
```

Questions are sent to `NEXT_PUBLIC_API_URL` when it is set; without it the
ask form runs in demo mode (questions stay in the visitor's browser).

## Where to edit what

| To change… | Edit |
| --- | --- |
| Colours, fonts, radii, animations | `src/app/globals.css` (`@theme` block) |
| Which colour a kind of content uses | `src/lib/tones.ts` |
| Fonts | `src/app/fonts.ts` |
| Any interface text (Arabic / French / Taqbaylit) | `src/i18n/dictionaries.ts` |
| Languages, their direction and labels | `src/i18n/config.ts` |
| Sheikhs (name, bio, Telegram/TikTok links) | `sheikhs` in `src/data/content.ts` |
| Series (any number) | `seriesList` in `src/data/content.ts` |
| Videos, playlists, Q&A, categories (sample data) | `src/data/content.ts` |
| Shorts | `src/data/shorts.imported.json` (written by the import script) |
| Search matching rules | `src/lib/normalize.ts`, `src/data/search.ts` |
| Sending questions | `src/lib/api/questions.ts` |
| URLs | `src/lib/routes.ts` |
| A component's look | its file in `src/components/` |
| A page's layout | `src/features/<page>/` |

### Design tokens

Tailwind classes come straight from the tokens, so `bg-series`, `text-accent`,
`border-line` and so on all follow `globals.css`. Each content colour has one
meaning — keep it that way:

| Token | Meaning |
| --- | --- |
| `paper` / `card` / `ink` / `muted` / `line` | Base surfaces and text |
| `series` (emerald) | Lesson series (any series; told apart by glyph and title) |
| `kabyle` (terracotta) | Taqbaylit videos |
| `short` (cobalt) | Short clips |
| `accent` (saffron) | Play, continue, progress — always with ink text |
| `fresh` (mint) | "New" state |

The giant outlined numbers use the `text-stroke` utility with the `--stroke`
and `--stroke-width` variables (see `OutlineNumeral`).

## Structure

```
src/
  app/[locale]/        routes only (thin files); layout sets lang + dir
    globals.css        design tokens
    fonts.ts           IBM Plex Sans Arabic + Inter via next/font
  features/            page compositions: home, library, series, watch,
                       shorts, questions, sheikhs, search
  components/
    ui/                Button, PlayPill, Chip, Badge, ProgressBar, Sticker,
                       SectionHeading, OutlineNumeral, SheikhAvatar,
                       PageSkeleton, icons
    media/             Cover, VideoCard, TrackRow, SeriesTrackList, SeriesTile,
                       ShortThumb, BentoTile, ContinueTile, PlaylistTile
    qa/                QuestionCard, VoicePlayer
    player/            PlayerProvider (shared playback state),
                       VideoPlayer, MiniPlayer
    search/            SearchProvider + panel, SearchTrigger, Highlight
    layout/            AppShell, SiteHeader, SiteFooter, MobileTabBar, NavLink
  data/
    content.ts         sample content + query helpers
    search.ts          search over everything
    present.ts         labels cards print (series title, sheikh line)
    shorts.imported.json  shorts written by scripts/import-tiktok.mjs
  i18n/                dictionaries
  lib/                 types, tones, routes, format, progress, normalize, cn
    api/questions.ts   send / follow anonymous questions
scripts/
  import-tiktok.mjs    download TikTok clips into the site
docs/                  feature specs and the content model
```

Conventions:

- Components take their text as props, so they work in both languages;
  pages pass strings from the dictionary.
- Server components by default; `"use client"` only where there is state
  (player, search, progress, active nav link).
- Use logical properties (`ms-`, `me-`, `ps-`, `start-`, `end-`) instead of
  left/right so layouts mirror correctly between Arabic and Taqbaylit.
- Every interactive element is a real `<a>` or `<button>` with a visible
  focus ring; motion respects `prefers-reduced-motion`.

## Placeholders and next steps

- **All content is sample placeholder text** — titles, durations, dates,
  counts, the site name and the sheikh's details. Replace
  `src/data/content.ts`, or keep its functions and load the data from a
  CMS or the YouTube API later.
- **Playback is simulated** in `PlayerProvider` (a timer) so the mini-player
  and progress saving can be tested. When there is real media, swap the
  stage in `VideoPlayer.tsx` for a `<video>` element or an embed and call
  `seek`/`saveProgress` from its time events.
- **Taqbaylit strings are a first draft** for review by a native speaker.
- The logo is a placeholder letter in `SiteHeader.tsx`; put the real file
  in `public/` and use `next/image`.

## Languages and sheikhs

- **Add a language:** add its code to `locales` in `src/i18n/config.ts`, a
  dictionary in `src/i18n/dictionaries.ts` (TypeScript lists any missing
  string) and month names in `src/lib/format.ts`.
- **Name the sheikh:** edit `name` (one spelling per language) in the
  `sheikhs` list in `src/data/content.ts`. It shows on cards, the home hero,
  the video page, the sheikh page and the footer.
- **Add a sheikh:** add an object to `sheikhs` and give their videos, series,
  shorts and questions that `sheikhId`. Cards, filters and the sheikh pages
  pick it up. The second sample sheikh ("الشيخ محمد شريف") is an example only.
- **Add a series:** add an object to `seriesList` and give its videos
  `seriesId`, `episode` and `sectionId`. Mark one series `featured` for the
  home spotlight.
