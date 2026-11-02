# Islamic video platform — front-end

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4. Front-end only: no
server, no database, no accounts. Content comes from one TypeScript file and
watch progress is saved in the visitor's browser.

Three interface languages: Arabic (`ar`, right-to-left), French (`fr`) and
Taqbaylit (`kab`, Latin script). The site starts with one sheikh, but every
video, series and playlist already belongs to a sheikh so more can be added.

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
| `/[locale]/series` | The دلائل النبوة series, grouped by section (محور) |
| `/[locale]/watch/[id]` | Video page with player, chapters, next episode |
| `/[locale]/search?q=` | Search with kind filters |
| `/[locale]/components` | Style guide: every component with examples (not indexed) |

`[locale]` is `ar`, `fr` or `kab`. The language switcher keeps you on the same page.

Press `/` or `Ctrl K` anywhere to open instant search.

## Where to edit what

| To change… | Edit |
| --- | --- |
| Colours, fonts, radii, animations | `src/app/globals.css` (`@theme` block) |
| Which colour a kind of content uses | `src/lib/tones.ts` |
| Fonts | `src/app/fonts.ts` |
| Any interface text (Arabic / French / Taqbaylit) | `src/i18n/dictionaries.ts` |
| Languages, their direction and labels | `src/i18n/config.ts` |
| Sheikhs (name in each language, bio) | `sheikhs` in `src/data/content.ts` |
| Videos, series, playlists (sample data) | `src/data/content.ts` |
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
| `series` (emerald) | The دلائل النبوة series |
| `kabyle` (terracotta) | Taqbaylit videos |
| `short` (cobalt) | Short clips |
| `accent` (saffron) | Play, continue, progress — always with ink text |
| `fresh` (mint) | "New" state |

The giant outlined numbers use the `text-stroke` utility with the `--stroke`
and `--stroke-width` variables (see `OutlineNumeral`).

## Structure

```
src/
  app/                 routes only (thin files)
    (ar)/              Arabic root layout (<html dir="rtl">) and pages
    (kab)/kab/         Taqbaylit root layout (<html dir="ltr">) and pages
    globals.css        design tokens
    fonts.ts           IBM Plex Sans Arabic + Inter via next/font
  features/            page compositions shared by both languages
  components/
    ui/                Button, PlayPill, Chip, Badge, ProgressBar,
                       SectionHeading, OutlineNumeral, icons
    media/             Cover, VideoCard, TrackRow, SeriesTrackList,
                       BentoTile, ContinueTile, PlaylistTile
    player/            PlayerProvider (shared playback state),
                       VideoPlayer, MiniPlayer
    search/            SearchProvider + palette, SearchTrigger
    layout/            AppShell, SiteHeader, SiteFooter, MobileTabBar, NavLink
  data/content.ts      sample content + query helpers
  i18n/                dictionaries
  lib/                 types, tones, routes, format, progress, cn
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
  `sheikhs` list in `src/data/content.ts`. It shows in the header, the home
  hero, the video page and the footer.
- **Add a sheikh:** add an object to `sheikhs` and give their videos, series
  and playlists that `sheikhId`. Pages still show the first sheikh
  (`featuredSheikhId`); a sheikh page and a sheikh filter are the next step
  once there is more than one.
