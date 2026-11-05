# 0004. Search, redesigned

**Date**: 2026-11-05
**Status**: Built (front end search over sample data)

## Summary

Search used to cover the page with solid black and only looked through video titles. It now opens as a light panel over a softly blurred page (a full-screen sheet on phones), searches everything on the site (lessons, shorts, series and their sections, answered questions, sheikhs), forgives Arabic spelling variants and French accents, and offers suggestions before you type.

## Context

The owner found the black overlay unpleasant. The site also gained new kinds of content (questions, shorts, several sheikhs) that the old search could not find. A reference site of another sheikh with a search the owner likes will be shared later; this design can be adjusted to it.

## Requirements

**User stories**
- As a visitor, I can open search from anywhere (`/`, `Ctrl/⌘ K`, the header pill, the phone tab bar) and find a lesson, a clip, an answer or a sheikh.
- As a visitor, I find «الصلاة» whether I type «الصلاه», «صلاة» or «والصلاة», and «études» when I type «etudes».
- As a visitor, before typing I see my recent searches, suggested topics and quick ways into the series, shorts, Q&A and sheikhs.

**Acceptance criteria**
- **AC-1**: The panel is light (paper/white) over a 30% ink, 3px blurred backdrop; on phones it is a full-screen paper sheet with a Cancel button. ✅
- **AC-2**: Scopes: All · Lessons · Questions · Shorts · Series · Sheikhs, each with its result count; a sheikh filter. ✅
- **AC-3**: Results are grouped (sheikhs, series, sections, episodes, videos, questions, shorts) with the matched words highlighted. ✅
- **AC-4**: Keyboard: ↑ ↓ moves, ↵ opens, Esc closes; the active row scrolls into view; `aria-activedescendant` on the input. ✅
- **AC-5**: Matching ignores diacritics, tatweel, alef/hamza/ya/ta-marbuta forms, Arabic-Indic digits, Latin accents and case; words match at the start of a word after the prefixes و ف ب ك ل and ال/لل; every query word must match (AND). ✅ (17 unit checks in the session)
- **AC-6**: Title matches rank above description matches; a whole-phrase title match ranks first. ✅
- **AC-7**: "All results" opens `/[locale]/search?q=…`, which shows every group with scopes, a sheikh filter, a type filter and sort; without a query it lists every video newest first. ✅

## Decision

- One search function, `search()` in `src/data/search.ts`, used by both the panel and the page; matching rules in `src/lib/normalize.ts`; highlighting in `src/components/search/Highlight.tsx`.
- Front-end only for now (the whole catalogue is small). When the catalogue grows, keep the same result shape and move the work to `GET /search` on the backend.

## For the backend developer

- Use a search engine with Arabic support (Meilisearch, Typesense, or PostgreSQL full-text with an Arabic dictionary) and apply the same folding as `normalize.ts` at index time.
- Index transcripts (shorts now, lessons later) with a low weight, and the question text + written answers.
- Return the grouped shape of `SearchResults` so the UI does not change.

## Files

`src/components/search/SearchPalette.tsx`, `src/features/search/SearchResults.tsx`, `src/data/search.ts`, `src/lib/normalize.ts`, `src/components/search/Highlight.tsx`.
