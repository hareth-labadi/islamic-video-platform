/*
 * The public (unauthenticated) API client. Every call maps to an endpoint in the
 * FastAPI backend (see backend/app/routers/public_*.py and docs/specs/*). The backend
 * already serializes camelCase, so its JSON matches the types in src/lib/types.ts
 * one-to-one; the only massaging done here is turning backend-relative media paths
 * (e.g. "/media/shorts/x.mp4") into absolute URLs the browser can load.
 *
 * With NEXT_PUBLIC_API_URL unset the site has no backend to talk to: `hasApi` is
 * false and callers fall back to the bundled sample content (see src/data/ensure.ts).
 */
import type { ContentSnapshot } from "@/data/content";
import type { SearchResults } from "@/data/search";
import type { Question, QuestionCategory, Series, Sheikh, Short, Video } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

/** True when a backend is configured. */
export const hasApi = Boolean(API);

/** Turn a backend-relative media path into an absolute URL; leave absolute/data URLs alone. */
function media(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (!API) return url;
  return url.startsWith("/") ? `${API}${url}` : url;
}

type Query = Record<string, string | number | boolean | undefined>;

async function get<T>(path: string, query?: Query): Promise<T> {
  if (!API) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const qs = query
    ? new URLSearchParams(
        Object.entries(query)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : "";
  const res = await fetch(`${API}${path}${qs ? `?${qs}` : ""}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

/* -------------------------------------------------- media-aware mappers */

const mapSheikh = (s: Sheikh): Sheikh => ({ ...s, photo: media(s.photo) });
const mapVideo = (v: Video): Video => ({ ...v, thumbnail: media(v.thumbnail) });
const mapShort = (s: Short): Short => ({ ...s, mediaUrl: media(s.mediaUrl), posterUrl: media(s.posterUrl) });
const mapQuestion = (q: Question): Question =>
  q.answer?.audioUrl ? { ...q, answer: { ...q.answer, audioUrl: media(q.answer.audioUrl) } } : q;

/* --------------------------------------------------------------- sheikhs */

export const fetchSheikhs = async (): Promise<Sheikh[]> => (await get<Sheikh[]>("/sheikhs")).map(mapSheikh);
export const fetchSheikh = async (slug: string): Promise<Sheikh> => mapSheikh(await get<Sheikh>(`/sheikhs/${encodeURIComponent(slug)}`));

/* ---------------------------------------------------------------- series */

export const fetchSeriesList = (sheikh?: string): Promise<Series[]> => get<Series[]>("/series", { sheikh });
export const fetchSeriesBySlug = (slug: string): Promise<Series> => get<Series>(`/series/${encodeURIComponent(slug)}`);

/* ---------------------------------------------------------------- videos */

export interface VideoQuery {
  sheikh?: string;
  series?: string;
  kind?: string;
  lang?: string;
  limit?: number;
  before?: string;
}

export const fetchVideos = async (params: VideoQuery = {}): Promise<Video[]> =>
  (await get<Video[]>("/videos", { limit: 100, ...params })).map(mapVideo);
export const fetchVideo = async (id: string): Promise<Video> => mapVideo(await get<Video>(`/videos/${encodeURIComponent(id)}`));

/* ---------------------------------------------------------------- shorts */

export const fetchShorts = async (params: { sheikh?: string; limit?: number; before?: string } = {}): Promise<Short[]> =>
  (await get<Short[]>("/shorts", { limit: 100, ...params })).map(mapShort);
export const fetchShort = async (id: string): Promise<Short> => mapShort(await get<Short>(`/shorts/${encodeURIComponent(id)}`));

/* ------------------------------------------------------- questions & categories */

export const fetchCategories = (): Promise<QuestionCategory[]> => get<QuestionCategory[]>("/categories");

export const fetchQuestions = async (params: { sheikh?: string; category?: string; kind?: string; q?: string; limit?: number } = {}): Promise<Question[]> =>
  (await get<Question[]>("/questions", params)).map(mapQuestion);
export const fetchQuestion = async (id: string): Promise<Question> => mapQuestion(await get<Question>(`/questions/${encodeURIComponent(id)}`));

/* ---------------------------------------------------------------- search */

export const fetchSearch = (query: string, opts: { sheikh?: string; scope?: string } = {}): Promise<SearchResults> =>
  get<SearchResults>("/search", { q: query, scope: opts.scope, sheikh: opts.sheikh });

/* ----------------------------------------------- full content snapshot */

/** Load everything the public site needs in parallel. Throws if any call fails. */
export async function fetchSnapshot(): Promise<ContentSnapshot> {
  const [sheikhs, seriesList, videos, shorts, questionCategories, questions] = await Promise.all([
    fetchSheikhs(),
    fetchSeriesList(),
    fetchVideos(),
    fetchShorts(),
    fetchCategories(),
    fetchQuestions(),
  ]);
  return { sheikhs, seriesList, videos, shorts, questionCategories, questions };
}
