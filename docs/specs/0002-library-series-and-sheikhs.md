# 0002. Library, many series, and several sheikhs

**Date**: 2026-11-05
**Status**: Built (front end, sample data)

## Summary

دلائل النبوّة is no longer hard-wired: it is one series among any number, each with its own page. A new library page lists every series, the collections (shorts, Q&A, Taqbaylit, all videos) and an archive of every video month by month. Every card says which sheikh the video belongs to, and each sheikh has a page.

## Context

The first version had one series (`series` was a single object) and one sheikh. The owner asked how a second playlist would work, and wants the site to support several sheikhs from the start, with the latest videos showing whose lesson each one is.

## Requirements

**User stories**
- As a visitor, I can browse every lesson series, see who teaches it, how many episodes are out and how far I got.
- As a visitor, I can browse an archive of everything published, by month, filtered by sheikh and type.
- As a visitor, I can see on every video card which sheikh it belongs to, and filter the latest videos by sheikh.
- As a visitor, I can open a sheikh's page: bio, accounts (Telegram, TikTok, YouTube), series, latest videos, shorts, answers, and an "ask" button.
- As the site team, I add a series by adding data, not code.

**Acceptance criteria**
- **AC-1**: `/[locale]/series` lists every series as a tile (title, sheikh, status ongoing/complete, published/planned count, progress on this device). ✅
- **AC-2**: `/[locale]/series/[slug]` renders any series: sections (محاور) as tabs, search inside the series, continue / from start, "other series". ✅
- **AC-3**: The library has a sheikh filter that narrows series, collections counts and the archive together. ✅
- **AC-4**: The archive groups videos by month (newest first), filterable by type, three months at a time with "show older". ✅
- **AC-5**: Video cards (home, sheikh page, search, archive) show the sheikh avatar and name. Home "latest" has sheikh chips. ✅
- **AC-6**: `/[locale]/sheikhs` and `/[locale]/sheikhs/[slug]` exist; `/[locale]/about` redirects to the main sheikh's page. ✅
- **AC-7**: The watch page links to the sheikh and to the right series (episode X of N of *that* series); outside a series, the side list shows more from the same sheikh. ✅

## Decision

- `seriesList: Series[]` in `src/data/content.ts`; one series has `featured: true` and drives the home spotlight and the Taqbaylit home.
- Episodes reference their series (`seriesId`, `episode`, `sectionId`). Helpers: `getSeriesOf(sheikhId?)`, `getSeriesBySlug`, `getEpisodes(seriesId)`, `getFeaturedSeries()`.
- Colour stays meaningful: emerald = "lesson series" in general; a series is told apart by its glyph and title, not by a new colour.
- The header nav is now: Home · Series · Shorts · Q&A · Sheikhs. The phone tab bar: Home · Library · Shorts · Questions · Search.

## How to add a series

1. Add an object to `seriesList` (`id`, `slug`, `sheikhId`, `title`, `glyph`, `plannedCount`, `sections`, `status`).
2. Give its videos `seriesId`, `episode` (1, 2, 3…) and a `sectionId`.
3. Done: the library, the sheikh page, search and the watch page pick it up. Once the backend exists, this is an admin-panel form.

## How to add a sheikh

Add an object to `sheikhs` (name in ar/fr/kab, `slug`, `monogram`, `socials`, `takesQuestions`) and use its `id` as `sheikhId`. The second sheikh in the sample data ("الشيخ محمد شريف") is only an example — remove or replace it.

## Files

`src/features/library/LibraryPage.tsx`, `src/features/series/SeriesPage.tsx`, `src/features/sheikhs/SheikhPages.tsx`, `src/features/home/LatestVideos.tsx`, `src/components/media/SeriesTile.tsx`, `src/components/ui/SheikhAvatar.tsx`, `src/data/present.ts` (labels shared by cards).

## Later

- Per-sheikh accent (photo) once real portraits exist.
- Pagination of the archive from the API (`before=` cursor) instead of loading everything.
