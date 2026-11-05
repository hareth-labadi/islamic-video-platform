import { hasToken, normalize, tokenize } from "@/lib/normalize";
import type { Question, Series, SeriesSection, Sheikh, Short, Video } from "@/lib/types";
import { getCategory, getAnsweredQuestions, getSeries, getSheikh, seriesList, sheikhs, shorts, videos } from "./content";

/*
 * Front-end search over everything on the site: videos, shorts, series and
 * their sections, answered questions and sheikhs. Every query word must match
 * somewhere (AND); a match in a title weighs more than one in a description.
 * When the backend exists, swap `search()` for an API call that returns the same shape.
 */

export type SearchHit =
  | { type: "video"; id: string; score: number; video: Video }
  | { type: "short"; id: string; score: number; short: Short }
  | { type: "series"; id: string; score: number; series: Series }
  | { type: "section"; id: string; score: number; section: SeriesSection; series: Series }
  | { type: "question"; id: string; score: number; question: Question }
  | { type: "sheikh"; id: string; score: number; sheikh: Sheikh };

export type SearchScope = "all" | "videos" | "shorts" | "questions" | "series" | "sheikhs";

export interface SearchResults {
  videos: Extract<SearchHit, { type: "video" }>[];
  shorts: Extract<SearchHit, { type: "short" }>[];
  series: Extract<SearchHit, { type: "series" }>[];
  sections: Extract<SearchHit, { type: "section" }>[];
  questions: Extract<SearchHit, { type: "question" }>[];
  sheikhs: Extract<SearchHit, { type: "sheikh" }>[];
  total: number;
}

type Field = [text: string | undefined, weight: number];

/** Score of a document for the query words; 0 when a word is missing everywhere. */
function score(tokens: string[], phrase: string, fields: Field[]): number {
  const folded = fields.map(([text, w]) => [normalize(text ?? ""), w] as const);
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const [text, w] of folded) if (w > best && hasToken(text, token)) best = w;
    if (best === 0) return 0;
    total += best;
  }
  // Whole phrase in the main field (first one) ranks first.
  if (tokens.length > 1 && folded[0][0].includes(phrase)) total += 6;
  if (folded[0][0].startsWith(tokens[0])) total += 2;
  return total;
}

const allNames = (s: Sheikh) => Object.values(s.name).join(" ");

function byScore<T extends { score: number }>(a: T, b: T) {
  return b.score - a.score;
}

export function search(query: string, opts: { sheikhId?: string; locale?: keyof Sheikh["name"] } = {}): SearchResults {
  const tokens = tokenize(query);
  const empty: SearchResults = { videos: [], shorts: [], series: [], sections: [], questions: [], sheikhs: [], total: 0 };
  if (tokens.length === 0) return empty;
  const phrase = tokens.join(" ");
  const own = (sheikhId: string) => !opts.sheikhId || sheikhId === opts.sheikhId;
  const loc = opts.locale ?? "ar";

  const out = empty;

  for (const video of videos) {
    if (!own(video.sheikhId)) continue;
    const series = video.seriesId ? getSeries(video.seriesId) : undefined;
    const s = score(tokens, phrase, [
      [video.title, 6],
      [video.topics?.join(" "), 4],
      [series?.title, 2],
      [video.summary, 2],
      [video.description, 1],
      [allNames(getSheikh(video.sheikhId)), 1],
    ]);
    if (s) out.videos.push({ type: "video", id: video.id, score: s, video });
  }

  for (const short of shorts) {
    if (!own(short.sheikhId)) continue;
    const s = score(tokens, phrase, [
      [short.title, 6],
      [short.topics?.join(" "), 4],
      [short.transcript, 1],
      [allNames(getSheikh(short.sheikhId)), 1],
    ]);
    if (s) out.shorts.push({ type: "short", id: short.id, score: s, short });
  }

  for (const series of seriesList) {
    if (!own(series.sheikhId)) continue;
    const s = score(tokens, phrase, [
      [series.title, 8],
      [series.tagline, 2],
      [series.description, 1],
      [allNames(getSheikh(series.sheikhId)), 1],
    ]);
    if (s) out.series.push({ type: "series", id: series.id, score: s, series });
    for (const section of series.sections) {
      const ss = score(tokens, phrase, [[section.title, 5]]);
      if (ss) out.sections.push({ type: "section", id: section.id, score: ss, section, series });
    }
  }

  for (const question of getAnsweredQuestions()) {
    if (!own(question.sheikhId)) continue;
    const category = getCategory(question.categoryId);
    const s = score(tokens, phrase, [
      [question.body, 6],
      [category ? Object.values(category.title).join(" ") : undefined, 3],
      [question.answer?.text, 1],
    ]);
    if (s) out.questions.push({ type: "question", id: question.id, score: s, question });
  }

  for (const sheikh of sheikhs) {
    const s = score(tokens, phrase, [
      [sheikh.name[loc], 8],
      [allNames(sheikh), 6],
      [sheikh.bio ? Object.values(sheikh.bio).join(" ") : undefined, 1],
    ]);
    if (s) out.sheikhs.push({ type: "sheikh", id: sheikh.id, score: s, sheikh });
  }

  out.videos.sort((a, b) => byScore(a, b) || b.video.publishedAt.localeCompare(a.video.publishedAt));
  out.shorts.sort((a, b) => byScore(a, b) || b.short.publishedAt.localeCompare(a.short.publishedAt));
  out.series.sort(byScore);
  out.sections.sort(byScore);
  out.questions.sort(byScore);
  out.sheikhs.sort(byScore);
  out.total = out.videos.length + out.shorts.length + out.series.length + out.sections.length + out.questions.length + out.sheikhs.length;
  return out;
}

/** How many results each scope would show. */
export function scopeCounts(r: SearchResults): Record<SearchScope, number> {
  return {
    all: r.total,
    videos: r.videos.length,
    shorts: r.shorts.length,
    questions: r.questions.length,
    series: r.series.length + r.sections.length,
    sheikhs: r.sheikhs.length,
  };
}
