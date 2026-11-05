# 0005. Questions and answers (أسئلة وأجوبة)

**Date**: 2026-11-05
**Status**: Built (front end, demo mode); backend endpoints to implement

## Summary

A clear Q&A section where anyone can ask the sheikh a question **without giving their name**. The sheikh answers in writing, with a voice message, or with a video. Visitors get a tracking code to follow their question; answered questions they agreed to publish appear on the site, anonymously, with filters and search. The sheikh's Telegram is offered as another way to reach him.

## Context

The sheikh already answers many questions, mostly in videos, but the site had only a small, unclear "Q&A" playlist. The owner wants a proper place for these answers, a way to ask anonymously, voice answers, and a link to the sheikh's Telegram. The admin side (inbox, answering, recording voice notes) is built in the admin panel session; the backend is built by another developer.

## Requirements

**User stories**
- As a visitor, I can ask the sheikh a question without giving any personal information.
- As a visitor, I get a code to come back and see whether my question was answered.
- As a visitor, I can browse answers by topic, by type (written, voice, video) and by sheikh, search inside them, and listen to voice answers on the page.
- As a visitor, I can open one question on its own page and share it.
- As a visitor who prefers Telegram, I can reach the sheikh there.
- As the sheikh (admin panel), I see new questions, answer with text, a recorded voice note or a video, and choose whether to publish.

**Acceptance criteria**
- **AC-1**: `/[locale]/questions` explains the feature (hero + three steps), lists published answers, and has the ask form and "follow your question" side by side on desktop (form after the list on phones; the hero button jumps to it). ✅
- **AC-2**: The form asks only for: sheikh (when several take questions), topic, question text (20–1500 characters, counter), and publish consent (checked by default). A hidden honeypot field stops simple bots. Errors are announced and focus moves to the first wrong field. ✅
- **AC-3**: On success the visitor sees a tracking code (`K7Q-4M2` style, no look-alike characters) with a copy button; the question is listed under "your questions on this device". ✅
- **AC-4**: "Follow your question" looks a code up and shows pending / answered (with a link to the answer when published). ✅ (demo mode: this device only)
- **AC-5**: Filters (topic, answer type, sheikh) and the search box work together; the result count updates live; "remove filters" resets them. `?sheikh=<slug>&category=<id>` preselects filters. ✅
- **AC-6**: Voice answers play inline with a waveform you can click, drag or step with the arrow keys, elapsed time, and speed 1× / 1.5× / 2×; starting one note pauses any other. ✅
- **AC-7**: `/[locale]/questions/[id]` shows the question (marked "question from a visitor"), the sheikh's answer (text, voice player or video card + written summary), related questions and an "ask your own" box. ✅
- **AC-8**: A video that answers a question links back to it from the watch page. ✅
- **AC-9**: Telegram button in the hero, a Telegram card beside the form, a Telegram link in the footer and on the sheikh page (only when a Telegram URL is set). ✅

## Privacy rules (backend must keep these)

1. Store only: `sheikhId`, `categoryId`, `body`, `lang`, `isPublic`, `askedAt`, `status`, the hash of the tracking code.
2. Never store: name, e-mail, phone, IP address, user agent, cookie or device id. Do not log request bodies or IPs on this endpoint; if rate limiting needs the IP, keep it in memory only (or a short-lived salted hash) and never next to the question.
3. The browser sends the request with `credentials: "omit"`, so no cookie ties the question to the visitor.
4. Publishing is opt-in per question (`isPublic`), and the sheikh can still decide not to publish. Admins can edit out any personal detail a visitor typed into the text before publishing.

## API (backend)

| Method | Path | Body / query | Returns |
| --- | --- | --- | --- |
| POST | `/questions` | `{ sheikhId, categoryId, body, lang, isPublic }` | `201 { trackingCode, status: "pending" }` |
| GET | `/questions/track/:code` | | `{ status: "pending" \| "answered" \| "rejected", questionId? }` or `404` |
| GET | `/questions` | `sheikh, category, kind, q, limit, before` | answered + public questions, newest answer first |
| GET | `/questions/:id` | | one answered, public question |
| GET | `/categories` | | `QuestionCategory[]` |

Validation: body 20–1500 characters after trimming; unknown `sheikhId`/`categoryId` → 400; rate limit (for example 5 questions per hour per client) → 429. The front end reads the API base URL from `NEXT_PUBLIC_API_URL`; without it the site runs in **demo mode** (questions stay in the browser, a note says so).

Voice answers: the admin panel records with the browser's MediaRecorder (WebM/Opus or MP4/AAC). Store the file in object storage and save `audioUrl` + `audioDuration`. Serving an AAC (`.m4a`) copy makes playback work on every browser, including older Safari.

## Decision

- One public page for browsing and asking, one page per answer for sharing and search engines.
- Anonymous by design: a tracking code instead of an account or contact detail.
- Voice notes are first-class answers (own player), not attachments.

## Files

`src/features/questions/QuestionsPage.tsx`, `AskForm.tsx`, `TrackPanel.tsx`, `QuestionDetail.tsx`, `src/components/qa/QuestionCard.tsx`, `src/components/qa/VoicePlayer.tsx`, `src/lib/api/questions.ts`.

## Open points

- The sheikh's real Telegram username (the sample links point to telegram's home page).
- Answer notifications: with a tracking code only, the visitor has to come back. An optional "notify me" (e-mail or Telegram bot) would need consent and would store a contact detail separately from the question — decide later.
- Whether unanswered questions can expire, and how long rejected questions are kept.
