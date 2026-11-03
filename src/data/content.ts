import type { ContentKind, Playlist, Series, Sheikh, Video } from "@/lib/types";

/*
 * SAMPLE PLACEHOLDER CONTENT — mirrors the Claude Design boards.
 * Every name, title, duration, date and count below is invented for layout only.
 * Replace this file (or swap it for a CMS / YouTube feed later) — components
 * only depend on the types in src/lib/types.ts and the helpers at the bottom.
 */

/*
 * Sheikhs. The site starts with one; add more objects here and give their
 * videos, series and playlists the matching sheikhId.
 */
export const sheikhs: Sheikh[] = [
  {
    id: "sheikh-1",
    slug: "sheikh-1",
    // Write the sheikh's real name in each language here.
    name: { ar: "الشيخ [الاسم]", fr: "Cheikh [nom]", kab: "Ccix [isem]" },
    bio: {
      ar: "نص مؤقت: سطر قصير يعرّف بالشيخ.",
      fr: "Texte provisoire : une ligne qui présente le cheikh.",
      kab: "Aḍris n uɛraḍ: yiwen n yizirig ɣef ccix.",
    },
  },
];

/** The sheikh shown by default while the site has a single one. */
export const featuredSheikhId = sheikhs[0].id;

const S = featuredSheikhId;

export const series: Series = {
  id: "dalail",
  sheikhId: S,
  title: "دلائل النبوّة",
  description:
    "[وصف السلسلة كما يكتبه فريق الموقع: ما المقصود بدلائل النبوّة، ولماذا رُتّبت الحلقات بهذا الترتيب، ولمن هي.]",
  plannedCount: 24,
  sections: [
    { id: "s1", title: "[عنوان المحور الأول]" },
    { id: "s2", title: "[عنوان المحور الثاني]" },
    { id: "s3", title: "[عنوان المحور الثالث]" },
  ],
};

const episodeTitles = [
  "مقدّمة: لماذا ندرس دلائل النبوّة؟",
  "عنوان الحلقة الثانية يظهر هنا",
  "عنوان أطول للحلقة الثالثة يلتفّ على سطرين كحدٍّ أقصى",
  "عنوان الحلقة الرابعة",
  "عنوان الحلقة الخامسة يظهر هنا",
  "عنوان الحلقة السادسة",
  "عنوان الحلقة السابعة",
  "عنوان الحلقة الثامنة",
  "عنوان الحلقة التاسعة",
  "عنوان الحلقة العاشرة يظهر هنا",
  "عنوان الحلقة الحادية عشرة",
  "عنوان أحدث حلقة من سلسلة دلائل النبوّة",
];
const episodeDurations = ["14:20", "22:05", "19:48", "25:10", "17:33", "21:02", "23:40", "18:15", "20:44", "19:30", "21:16", "18:42"];
const episodeDates = [
  "2026-09-02", "2026-09-06", "2026-09-09", "2026-09-13", "2026-09-16", "2026-09-20",
  "2026-09-23", "2026-09-27", "2026-09-30", "2026-10-05", "2026-10-27", "2026-11-01",
];

const episodes: Video[] = episodeTitles.map((title, i) => ({
  id: `ep-${i + 1}`,
  sheikhId: S,
  title,
  lang: "ar",
  kind: "series",
  duration: episodeDurations[i],
  publishedAt: episodeDates[i],
  episode: i + 1,
  sectionId: i < 3 ? "s1" : i < 6 ? "s2" : "s3",
  captions: i % 3 === 0 ? ["kab"] : undefined,
  summary: "سطر واحد يلخّص موضوع الحلقة قبل مشاهدتها.",
  description: "[وصف الحلقة كما يكتبه فريق الموقع: ما الدليل الذي تتناوله، وكيف يرتبط بما قبله وما بعده في السلسلة.]",
  chapters: [
    { start: "00:00", title: "مقدمة" },
    { start: "03:10", title: "الفصل الأول: عنوان الفصل" },
    { start: "05:02", title: "الفصل الثاني: عنوان الفصل" },
    { start: "09:40", title: "الفصل الثالث: عنوان الفصل" },
    { start: "14:55", title: "خلاصة الحلقة" },
  ],
}));

const kabyle: Video[] = [
  { id: "v-kab-1", sheikhId: S, title: "Azwel n tvidyut s teqbaylit", lang: "kab", kind: "kabyle", duration: "11:05", publishedAt: "2026-10-31", summary: "Agzul wezzilen n tvidyut." },
  { id: "v-kab-2", sheikhId: S, title: "Azwel aɣezfan n tvidyut i d-yesskanen akken yettuɣal ɣef sin yizirig", lang: "kab", kind: "kabyle", duration: "16:48", publishedAt: "2026-10-12" },
  { id: "v-kab-3", sheikhId: S, title: "Azwel n tvidyut nniḍen", lang: "kab", kind: "kabyle", duration: "13:20", publishedAt: "2026-10-01" },
  { id: "v-kab-4", sheikhId: S, title: "Tikti deg yiwet n tesdat", lang: "kab", kind: "kabyle", duration: "0:44", publishedAt: "2026-09-20" },
];

const others: Video[] = [
  { id: "v-mix-1", sheikhId: S, title: "عنوان مقطع متنوّع أطول قليلًا يلتفّ على سطرين كحدٍّ أقصى", lang: "ar", kind: "mixed", duration: "09:37", publishedAt: "2026-10-29" },
  { id: "v-qa-1", sheikhId: S, title: "عنوان جواب عن سؤال", lang: "ar", kind: "qa", duration: "06:12", publishedAt: "2026-10-09" },
  { id: "v-mix-2", sheikhId: S, title: "عنوان مقطع متنوّع آخر", lang: "ar", kind: "mixed", duration: "12:30", publishedAt: "2026-10-09" },
];

/** Shorts: `tone` gives each its source colour, `mark` its number on the cover. */
const shorts: Video[] = (
  [
    ["فكرة واحدة في أقل من دقيقة", "short", "0:58", "2026-09-28", "ar"],
    ["Tikti deg yiwet n tesdat", "kabyle", "0:44", "2026-09-26", "kab"],
    ["جواب مختصر عن سؤال", "mixed", "1:12", "2026-09-24", "ar"],
    ["تذكير قصير", "qa", "0:29", "2026-09-22", "ar"],
    ["من حلقة دلائل النبوّة 3", "series", "0:51", "2026-09-18", "ar"],
    ["عنوان مقطع قصير آخر", "short", "0:36", "2026-09-15", "ar"],
  ] as const
).map(([title, tone, duration, publishedAt, lang], i) => ({
  id: `short-${i + 1}`,
  sheikhId: S,
  title,
  lang,
  kind: "short" as ContentKind,
  tone,
  duration,
  publishedAt,
  mark: String(i + 1).padStart(2, "0"),
}));

export const videos: Video[] = [...episodes, ...kabyle, ...others, ...shorts];

export const playlists: Playlist[] = [
  { id: "pl-series", sheikhId: S, title: "دلائل النبوّة", kind: "series", glyph: "د", videoIds: episodes.map((e) => e.id) },
  { id: "pl-qa", sheikhId: S, title: "أسئلة وأجوبة", kind: "qa", glyph: "؟", videoIds: ["v-qa-1"] },
  { id: "pl-kab", sheikhId: S, title: "Tividyutin s teqbaylit", kind: "kabyle", glyph: "T", videoIds: kabyle.map((v) => v.id) },
  { id: "pl-shorts", sheikhId: S, title: "مقاطع قصيرة", kind: "short", glyph: "1′", videoIds: shorts.map((v) => v.id) },
];

/** Site motto shown in the quote tile. */
export const quote = { text: "يحمِلُ هذا العلمَ من كلِّ خلَفٍ عدولُه", source: "من شعار الموقع" };

/** Suggested searches shown in the home search tile. */
export const searchSuggestions = [
  { label: "المعجزات", lang: "ar" },
  { label: "البشارات", lang: "ar" },
  { label: "nnbi", lang: "kab" },
] as const;

/* Query helpers — swap their bodies when the data source changes. */

export function getSheikh(id: string = featuredSheikhId): Sheikh {
  return sheikhs.find((s) => s.id === id) ?? sheikhs[0];
}

export function getVideo(id: string): Video | undefined {
  return videos.find((v) => v.id === id);
}

export function getEpisodes(): Video[] {
  return episodes;
}

export function getSectionEpisodes(sectionId: string): Video[] {
  return episodes.filter((e) => e.sectionId === sectionId);
}

/** Newest first, shorts excluded. */
export function getLatest(limit = 8): Video[] {
  return [...videos]
    .filter((v) => v.kind !== "short")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

export function getByKind(kind: Video["kind"]): Video[] {
  return videos.filter((v) => v.kind === kind);
}

/** Videos spoken in a language (e.g. every Taqbaylit video, shorts excluded). */
export function getByLanguage(lang: Video["lang"]): Video[] {
  return videos.filter((v) => v.lang === lang && v.kind !== "short");
}

export function getNextEpisode(video: Video): Video | undefined {
  if (!video.episode) return undefined;
  return episodes.find((e) => e.episode === video.episode! + 1);
}

/** Plain substring search over titles, summaries and descriptions (front-end only). */
export function searchVideos(query: string): Video[] {
  const q = normalize(query);
  if (!q) return [];
  return videos.filter((v) => normalize(`${v.title} ${v.summary ?? ""} ${v.description ?? ""}`).includes(q));
}

/** Series sections whose title matches the query. */
export function searchSections(query: string) {
  const q = normalize(query);
  if (!q) return [];
  return series.sections.filter((s) => normalize(s.title).includes(q));
}

/** Ignore Arabic diacritics, tatweel and alef/ya/ta-marbuta variants. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
}
