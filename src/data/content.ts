import type { Playlist, Series, Video } from "@/lib/types";

/*
 * SAMPLE PLACEHOLDER CONTENT.
 * Every title, duration, date and count below is invented for layout only.
 * Replace this file (or swap it for a CMS / YouTube feed later) — components
 * only depend on the types in src/lib/types.ts.
 */

export const series: Series = {
  id: "dalail",
  title: "دلائل النبوّة",
  description: "نص مؤقت لوصف السلسلة: سلسلة حلقات يشرح فيها الشيخ دلائل النبوّة بالترتيب.",
  sections: [
    { id: "s1", title: "المحور الأول — عنوان مؤقت" },
    { id: "s2", title: "المحور الثاني — عنوان مؤقت" },
    { id: "s3", title: "المحور الثالث — عنوان مؤقت" },
  ],
};

const ordinals = [
  "الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة",
  "السابعة", "الثامنة", "التاسعة", "العاشرة", "الحادية عشرة", "الثانية عشرة",
];
const seriesDurations = ["18:42", "21:05", "16:20", "24:10", "17:33", "21:02", "23:40", "18:15", "20:44", "19:30", "22:18", "18:42"];

const episodes: Video[] = ordinals.map((ordinal, i) => ({
  id: `ep-${i + 1}`,
  title: `عنوان الحلقة ${ordinal}`,
  lang: "ar",
  kind: "series",
  duration: seriesDurations[i],
  publishedAt: `2026-${String(5 + Math.floor(i / 2)).padStart(2, "0")}-${String(4 + (i % 2) * 14).padStart(2, "0")}`,
  episode: i + 1,
  sectionId: i < 4 ? "s1" : i < 8 ? "s2" : "s3",
  captions: i % 3 === 0 ? ["kab"] : undefined,
  description: "نص مؤقت للوصف. يكتب هنا ملخص قصير لما يشرحه الشيخ في هذه الحلقة.",
  chapters: [
    { start: "00:00", title: "مقدّمة" },
    { start: "05:02", title: "عنوان الفصل الثاني" },
    { start: "11:40", title: "عنوان الفصل الثالث" },
  ],
}));

const others: Video[] = [
  { id: "v-kab-1", title: "Azwel n tvidyut s teqbaylit", lang: "kab", kind: "kabyle", duration: "14:20", publishedAt: "2026-10-12" },
  { id: "v-kab-2", title: "Azwel n tvidyut nniḍen", lang: "kab", kind: "kabyle", duration: "09:48", publishedAt: "2026-10-02" },
  { id: "v-kab-3", title: "Azwel ɣef lmuɛjizat", lang: "kab", kind: "kabyle", duration: "12:05", publishedAt: "2026-09-21" },
  { id: "v-kab-4", title: "Azwel n tsekkilt n tezwart", lang: "kab", kind: "kabyle", duration: "08:31", publishedAt: "2026-09-08" },
  { id: "v-qa-1", title: "عنوان مقطع أسئلة وأجوبة", lang: "ar", kind: "qa", duration: "11:12", publishedAt: "2026-10-20" },
  { id: "v-mix-1", title: "عنوان مقطع متنوّع", lang: "ar", kind: "mixed", duration: "07:45", publishedAt: "2026-10-15" },
  { id: "v-mix-2", title: "عنوان مقطع متنوّع آخر", lang: "ar", kind: "mixed", duration: "13:02", publishedAt: "2026-09-30" },
  ...Array.from({ length: 6 }, (_, i): Video => ({
    id: `short-${i + 1}`,
    title: `عنوان مقطع قصير ${i + 1}`,
    lang: i === 2 ? "kab" : "ar",
    kind: "short",
    duration: `0:${String(38 + i * 4).padStart(2, "0")}`,
    publishedAt: `2026-10-${String(25 - i * 3).padStart(2, "0")}`,
  })),
];

export const videos: Video[] = [...episodes, ...others];

export const playlists: Playlist[] = [
  { id: "pl-series", title: "دلائل النبوّة كاملة", kind: "series", glyph: "د", videoIds: episodes.map((e) => e.id) },
  { id: "pl-qa", title: "أسئلة وأجوبة", kind: "qa", glyph: "؟", videoIds: ["v-qa-1"] },
  { id: "pl-kab", title: "Taqbaylit", kind: "kabyle", glyph: "T", videoIds: ["v-kab-1", "v-kab-2", "v-kab-3", "v-kab-4"] },
  { id: "pl-shorts", title: "مقاطع قصيرة", kind: "short", glyph: "1′", videoIds: others.filter((v) => v.kind === "short").map((v) => v.id) },
];

export const quote = "نص مؤقت لاقتباس قصير من كلام الشيخ يظهر هنا في سطرين.";

/* Query helpers — swap their bodies when the data source changes. */

export function getVideo(id: string): Video | undefined {
  return videos.find((v) => v.id === id);
}

export function getEpisodes(): Video[] {
  return episodes;
}

export function getLatest(limit = 8): Video[] {
  return [...videos]
    .filter((v) => v.kind !== "short")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

export function getByKind(kind: Video["kind"]): Video[] {
  return videos.filter((v) => v.kind === kind);
}

export function getNextEpisode(video: Video): Video | undefined {
  if (!video.episode) return undefined;
  return episodes.find((e) => e.episode === video.episode! + 1);
}

/** Plain substring search over titles and descriptions (front-end only). */
export function searchVideos(query: string): Video[] {
  const q = normalize(query);
  if (!q) return [];
  return videos.filter((v) => normalize(`${v.title} ${v.description ?? ""}`).includes(q));
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
