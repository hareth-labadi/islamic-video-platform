import type { ContentKind, Playlist, Question, QuestionCategory, Series, Sheikh, Short, Video } from "@/lib/types";
import importedShorts from "./shorts.imported.json";

/*
 * SAMPLE PLACEHOLDER CONTENT — mirrors the Claude Design boards.
 * Every name, title, duration, date, count and answer below is invented for layout only.
 * Replace this file (or swap it for the API later) — components only depend on
 * the types in src/lib/types.ts and the helpers at the bottom of this file.
 * The shapes are documented in docs/specs/0001-content-model.md.
 */

/* ---------------------------------------------------------------- Sheikhs */

/*
 * Several sheikhs can publish on the site. Every video, series, short and
 * question belongs to one of them through `sheikhId`.
 * The second sheikh is a sample (the example name given in the brief) to show
 * how cards and pages look with more than one — replace or remove it.
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
    monogram: "ش",
    // Placeholders: put the real account links here.
    socials: { telegram: "https://t.me/", tiktok: "https://www.tiktok.com/", youtube: "https://www.youtube.com/" },
    takesQuestions: true,
  },
  {
    id: "sheikh-2",
    slug: "mohamed-cherif",
    name: { ar: "الشيخ محمد شريف", fr: "Cheikh Mohamed Cherif", kab: "Ccix Muḥend Cerif" },
    bio: {
      ar: "نص مؤقت: شيخ ثانٍ للمثال — يظهر كيف تبدو البطاقات والصفحات مع أكثر من شيخ.",
      fr: "Texte provisoire : un second cheikh d’exemple, pour voir le site avec plusieurs cheikhs.",
      kab: "Aḍris n uɛraḍ: ccix wis sin i umedya.",
    },
    monogram: "م",
    socials: { telegram: "https://t.me/" },
    takesQuestions: true,
  },
];

/** The site's main sheikh (header, footer, home hero). */
export const featuredSheikhId = sheikhs[0].id;

const S1 = "sheikh-1";
const S2 = "sheikh-2";

/* ----------------------------------------------------------------- Series */

/*
 * Lesson series. Add as many as needed: each one gets a page at
 * /<locale>/series/<slug> and a tile in the library (/<locale>/series).
 * Give its videos `seriesId`, `episode` and (optionally) `sectionId`.
 */
export const seriesList: Series[] = [
  {
    id: "dalail",
    slug: "dalail-an-nubuwwa",
    sheikhId: S1,
    title: "دلائل النبوّة",
    lang: "ar",
    description:
      "[وصف السلسلة كما يكتبه فريق الموقع: ما المقصود بدلائل النبوّة، ولماذا رُتّبت الحلقات بهذا الترتيب، ولمن هي.]",
    tagline: "[سطر واحد يعرّف بالسلسلة.]",
    glyph: "د",
    plannedCount: 24,
    sections: [
      { id: "s1", title: "[عنوان المحور الأول]" },
      { id: "s2", title: "[عنوان المحور الثاني]" },
      { id: "s3", title: "[عنوان المحور الثالث]" },
    ],
    status: "ongoing",
    featured: true,
  },
  {
    id: "sira",
    slug: "mukhtasar-as-sira",
    sheikhId: S1,
    title: "مختصر السيرة النبوية",
    lang: "ar",
    description: "[وصف السلسلة الثانية: سلسلة مكتملة للمثال، تظهر كيف تبدو سلسلة انتهى نشرها في المكتبة.]",
    tagline: "[سلسلة مكتملة — مثال.]",
    glyph: "س",
    plannedCount: 8,
    sections: [
      { id: "sira-s1", title: "[المرحلة المكية]" },
      { id: "sira-s2", title: "[المرحلة المدنية]" },
    ],
    status: "complete",
  },
  {
    id: "arbain",
    slug: "sharh-al-arbain",
    sheikhId: S2,
    title: "شرح الأربعين النووية",
    lang: "ar",
    description: "[وصف السلسلة كما يكتبه فريق الموقع — سلسلة للشيخ الثاني، للمثال.]",
    tagline: "[سطر واحد يعرّف بالسلسلة.]",
    glyph: "40",
    plannedCount: 42,
    sections: [
      { id: "arb-s1", title: "[الأحاديث ١ – ١٠]" },
      { id: "arb-s2", title: "[الأحاديث ١١ – ٢٠]" },
    ],
    status: "ongoing",
  },
];

const chapters = [
  { start: "00:00", title: "مقدمة" },
  { start: "03:10", title: "الفصل الأول: عنوان الفصل" },
  { start: "05:02", title: "الفصل الثاني: عنوان الفصل" },
  { start: "09:40", title: "الفصل الثالث: عنوان الفصل" },
  { start: "14:55", title: "خلاصة الحلقة" },
];

const dalailTitles = [
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
const dalailDurations = ["14:20", "22:05", "19:48", "25:10", "17:33", "21:02", "23:40", "18:15", "20:44", "19:30", "21:16", "18:42"];
const dalailDates = [
  "2026-09-02", "2026-09-06", "2026-09-09", "2026-09-13", "2026-09-16", "2026-09-20",
  "2026-09-23", "2026-09-27", "2026-09-30", "2026-10-05", "2026-10-27", "2026-11-01",
];

const dalail: Video[] = dalailTitles.map((title, i) => ({
  id: `ep-${i + 1}`,
  sheikhId: S1,
  seriesId: "dalail",
  title,
  lang: "ar",
  kind: "series",
  duration: dalailDurations[i],
  publishedAt: dalailDates[i],
  episode: i + 1,
  sectionId: i < 3 ? "s1" : i < 6 ? "s2" : "s3",
  captions: i % 3 === 0 ? ["kab"] : undefined,
  summary: "سطر واحد يلخّص موضوع الحلقة قبل مشاهدتها.",
  description: "[وصف الحلقة كما يكتبه فريق الموقع: ما الدليل الذي تتناوله، وكيف يرتبط بما قبله وما بعده في السلسلة.]",
  chapters,
  topics: i === 0 ? ["المعجزات", "البشارات"] : i === 3 ? ["البشارات"] : ["المعجزات"],
}));

const sira: Video[] = Array.from({ length: 8 }, (_, i) => ({
  id: `sira-${i + 1}`,
  sheikhId: S1,
  seriesId: "sira",
  title: i === 0 ? "مقدّمة في دراسة السيرة النبوية" : `[عنوان الحلقة ${i + 1} من مختصر السيرة]`,
  lang: "ar" as const,
  kind: "series" as const,
  duration: ["16:05", "20:12", "18:40", "22:31", "19:02", "17:48", "21:30", "24:15"][i],
  publishedAt: ["2026-05-04", "2026-05-11", "2026-05-18", "2026-05-25", "2026-06-01", "2026-06-08", "2026-06-15", "2026-06-22"][i],
  episode: i + 1,
  sectionId: i < 4 ? "sira-s1" : "sira-s2",
  summary: "سطر واحد يلخّص موضوع الحلقة قبل مشاهدتها.",
  description: "[وصف الحلقة كما يكتبه فريق الموقع.]",
  topics: ["السيرة"],
}));

const arbain: Video[] = Array.from({ length: 5 }, (_, i) => ({
  id: `arb-${i + 1}`,
  sheikhId: S2,
  seriesId: "arbain",
  title: i === 0 ? "حديث «إنما الأعمال بالنيات»" : `[عنوان الحلقة ${i + 1} من شرح الأربعين]`,
  lang: "ar" as const,
  kind: "series" as const,
  duration: ["26:40", "24:12", "28:05", "22:47", "25:30"][i],
  publishedAt: ["2026-10-08", "2026-10-15", "2026-10-22", "2026-10-29", "2026-11-04"][i],
  episode: i + 1,
  sectionId: "arb-s1",
  summary: "سطر واحد يلخّص الحديث وموضوع الدرس.",
  description: "[وصف الحلقة كما يكتبه فريق الموقع.]",
  topics: ["الحديث", "النية"],
}));

/* ----------------------------------------------------------- Other videos */

const kabyle: Video[] = [
  { id: "v-kab-1", sheikhId: S1, title: "Azwel n tvidyut s teqbaylit", lang: "kab", kind: "kabyle", duration: "11:05", publishedAt: "2026-10-31", summary: "Agzul wezzilen n tvidyut.", topics: ["nnbi"] },
  { id: "v-kab-2", sheikhId: S1, title: "Azwel aɣezfan n tvidyut i d-yesskanen akken yettuɣal ɣef sin yizirig", lang: "kab", kind: "kabyle", duration: "16:48", publishedAt: "2026-10-12" },
  { id: "v-kab-3", sheikhId: S1, title: "Azwel n tvidyut nniḍen", lang: "kab", kind: "kabyle", duration: "13:20", publishedAt: "2026-10-01" },
  { id: "v-kab-4", sheikhId: S1, title: "Tikti deg yiwet n tesdat", lang: "kab", kind: "kabyle", duration: "0:44", publishedAt: "2026-09-20" },
];

const others: Video[] = [
  { id: "v-mix-1", sheikhId: S1, title: "عنوان مقطع متنوّع أطول قليلًا يلتفّ على سطرين كحدٍّ أقصى", lang: "ar", kind: "mixed", duration: "09:37", publishedAt: "2026-10-29" },
  { id: "v-qa-1", sheikhId: S1, title: "كيف أبدأ طلب العلم وأنا موظف؟", lang: "ar", kind: "qa", duration: "06:12", publishedAt: "2026-10-09", summary: "جواب مصوَّر عن سؤال وصل عبر الموقع.", description: "[وصف المقطع: الجواب عن سؤال أحد الزوار كما يكتبه فريق الموقع.]" },
  { id: "v-mix-2", sheikhId: S1, title: "عنوان مقطع متنوّع آخر", lang: "ar", kind: "mixed", duration: "12:30", publishedAt: "2026-10-09" },
  { id: "v-mix-3", sheikhId: S2, title: "عنوان محاضرة للشيخ الثاني", lang: "ar", kind: "mixed", duration: "31:08", publishedAt: "2026-11-02", summary: "سطر واحد يلخّص المحاضرة." },
  { id: "v-qa-2", sheikhId: S2, title: "بأي شرح أبدأ الأربعين النووية؟", lang: "ar", kind: "qa", duration: "04:51", publishedAt: "2026-10-20", summary: "جواب مصوَّر عن سؤال وصل عبر الموقع." },
];

export const videos: Video[] = [...dalail, ...sira, ...arbain, ...kabyle, ...others];

/* ----------------------------------------------------------------- Shorts */

/*
 * Short clips. Real ones come from the sheikh's TikTok through
 * `node scripts/import-tiktok.mjs` (it downloads each clip and writes
 * src/data/shorts.imported.json). Until that file has entries, these samples are shown.
 */
const sampleShorts: Short[] = (
  [
    ["فكرة واحدة في أقل من دقيقة", S1, "short", "0:58", "2026-11-03", "ar", undefined],
    ["Tikti deg yiwet n tesdat", S1, "kabyle", "0:44", "2026-10-30", "kab", undefined],
    ["من حلقة دلائل النبوّة 3", S1, "series", "0:51", "2026-10-26", "ar", "ep-3"],
    ["جواب مختصر عن سؤال", S2, "qa", "1:12", "2026-10-22", "ar", "v-qa-2"],
    ["تذكير قصير", S1, "mixed", "0:29", "2026-10-18", "ar", undefined],
    ["من شرح حديث النية", S2, "series", "0:36", "2026-10-12", "ar", "arb-1"],
  ] as const
).map(([title, sheikhId, tone, duration, publishedAt, lang, fromVideoId], i) => ({
  id: `short-${i + 1}`,
  sheikhId,
  title,
  lang,
  duration,
  publishedAt,
  tone: tone as ContentKind,
  fromVideoId,
  source: { platform: "tiktok" as const, url: "https://www.tiktok.com/", externalId: `sample-${i + 1}` },
  // Sample clips: plain colour, no poster — the branded cover is used.
  mediaUrl: `/media/samples/short-${i + 1}.mp4`,
  topics: i === 2 ? ["المعجزات"] : undefined,
  status: "published" as const,
}));

const imported = importedShorts as Short[];

export const shorts: Short[] = (imported.length > 0 ? imported : sampleShorts)
  .filter((s) => s.status === "published")
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

/* ------------------------------------------------------- Questions & answers */

export const questionCategories: QuestionCategory[] = [
  { id: "aqida", title: { ar: "العقيدة", fr: "Croyance", kab: "Liman" } },
  { id: "worship", title: { ar: "العبادات", fr: "Adoration", kab: "Taɛbadit" } },
  { id: "family", title: { ar: "الأسرة", fr: "Famille", kab: "Twacult" } },
  { id: "dealings", title: { ar: "المعاملات", fr: "Transactions", kab: "Timsenzay" } },
  { id: "knowledge", title: { ar: "طلب العلم", fr: "Étudier la science", kab: "Aɣmar n tmussni" } },
];

/*
 * Answered questions. The questions are realistic samples; every ANSWER is a
 * placeholder in brackets — the sheikh's real answers replace them.
 */
export const questions: Question[] = [
  {
    id: "q-101",
    sheikhId: S1,
    body: "فاتتني صلوات كثيرة في سنوات مضت ولا أعرف عددها، فكيف أقضي هذه الصلاة؟",
    lang: "ar",
    categoryId: "worship",
    askedAt: "2026-10-28",
    status: "answered",
    isPublic: true,
    answer: { kind: "voice", audioUrl: "/media/samples/voice-1.m4a", audioDuration: "0:42", text: "[ملخّص مكتوب للجواب الصوتي يكتبه فريق الموقع.]", answeredAt: "2026-11-02" },
  },
  {
    id: "q-102",
    sheikhId: S1,
    body: "هل يجوز الجمع بين نية صيام القضاء وصيام الست من شوال؟",
    lang: "ar",
    categoryId: "worship",
    askedAt: "2026-10-20",
    status: "answered",
    isPublic: true,
    answer: {
      kind: "text",
      text: "[جواب مكتوب: نص جواب الشيخ كما يُنشر على الموقع. يمكن أن يكون فقرة واحدة أو عدة فقرات، مع ذكر الأدلة والمراجع عند الحاجة.]\n\n[فقرة ثانية من الجواب للمثال، تُظهر كيف يبدو الجواب الطويل على الصفحة.]",
      answeredAt: "2026-10-31",
    },
  },
  {
    id: "q-103",
    sheikhId: S1,
    body: "كيف أبدأ طلب العلم الشرعي وأنا موظف ووقتي ضيق؟",
    lang: "ar",
    categoryId: "knowledge",
    askedAt: "2026-10-02",
    status: "answered",
    isPublic: true,
    answer: { kind: "video", videoId: "v-qa-1", text: "[ملخّص مكتوب لجواب الشيخ في المقطع.]", answeredAt: "2026-10-09" },
  },
  {
    id: "q-104",
    sheikhId: S1,
    body: "ما الفرق بين دلائل النبوة والمعجزات؟",
    lang: "ar",
    categoryId: "aqida",
    askedAt: "2026-10-14",
    status: "answered",
    isPublic: true,
    answer: { kind: "text", text: "[جواب مكتوب يكتبه الشيخ، ويمكن أن يحيل إلى حلقة من سلسلة دلائل النبوّة.]", answeredAt: "2026-10-27" },
  },
  {
    id: "q-105",
    sheikhId: S1,
    body: "Comment concilier mes études à l’université et l’apprentissage du Coran ?",
    lang: "fr",
    categoryId: "knowledge",
    askedAt: "2026-10-18",
    status: "answered",
    isPublic: true,
    answer: { kind: "voice", audioUrl: "/media/samples/voice-1.m4a", audioDuration: "0:42", text: "[Résumé écrit de la réponse vocale.]", answeredAt: "2026-10-25" },
  },
  {
    id: "q-106",
    sheikhId: S1,
    body: "أبي يمنعني من حضور الدروس في المسجد، فكيف أتعامل معه؟",
    lang: "ar",
    categoryId: "family",
    askedAt: "2026-10-10",
    status: "answered",
    isPublic: true,
    answer: { kind: "voice", audioUrl: "/media/samples/voice-1.m4a", audioDuration: "0:42", text: "[ملخّص مكتوب للجواب الصوتي.]", answeredAt: "2026-10-16" },
  },
  {
    id: "q-107",
    sheikhId: S2,
    body: "ما حكم البيع بالتقسيط مع زيادة في الثمن؟",
    lang: "ar",
    categoryId: "dealings",
    askedAt: "2026-10-05",
    status: "answered",
    isPublic: true,
    answer: { kind: "text", text: "[جواب مكتوب من الشيخ الثاني — للمثال.]", answeredAt: "2026-10-12" },
  },
  {
    id: "q-108",
    sheikhId: S1,
    body: "Amek ara lmedeɣ taɛrabt i wakken ad fehmeɣ Leqran?",
    lang: "kab",
    categoryId: "knowledge",
    askedAt: "2026-09-29",
    status: "answered",
    isPublic: true,
    answer: { kind: "voice", audioUrl: "/media/samples/voice-1.m4a", audioDuration: "0:42", text: "[Agzul s tira n tririt s taɣect.]", answeredAt: "2026-10-06" },
  },
  {
    id: "q-109",
    sheikhId: S2,
    body: "بأي شرح أبدأ الأربعين النووية وأنا مبتدئ؟",
    lang: "ar",
    categoryId: "knowledge",
    askedAt: "2026-10-15",
    status: "answered",
    isPublic: true,
    answer: { kind: "video", videoId: "v-qa-2", text: "[ملخّص مكتوب لجواب الشيخ في المقطع.]", answeredAt: "2026-10-20" },
  },
  {
    id: "q-110",
    sheikhId: S1,
    body: "هل تجب الزكاة في مال أدّخره للزواج؟",
    lang: "ar",
    categoryId: "worship",
    askedAt: "2026-09-21",
    status: "answered",
    isPublic: true,
    answer: { kind: "text", text: "[جواب مكتوب يكتبه الشيخ.]", answeredAt: "2026-09-30" },
  },
];

/* -------------------------------------------------------------- Playlists */

/** Hand-picked lists (not numbered). Series have their own pages, see `seriesList`. */
export const playlists: Playlist[] = [
  { id: "pl-kab", sheikhId: S1, title: "Tividyutin s teqbaylit", kind: "kabyle", glyph: "T", videoIds: kabyle.map((v) => v.id) },
  { id: "pl-qa", sheikhId: S1, title: "أسئلة وأجوبة", kind: "qa", glyph: "؟", videoIds: others.filter((v) => v.kind === "qa").map((v) => v.id) },
];

/** Site motto shown in the quote tile. */
export const quote = { text: "يحمِلُ هذا العلمَ من كلِّ خلَفٍ عدولُه", source: "من شعار الموقع" };

/** Topics suggested in the search panel and the home search tile. */
export const searchSuggestions = [
  { label: "المعجزات", lang: "ar" },
  { label: "البشارات", lang: "ar" },
  { label: "السيرة", lang: "ar" },
  { label: "طلب العلم", lang: "ar" },
  { label: "النية", lang: "ar" },
  { label: "nnbi", lang: "kab" },
] as const;

/* ------------------------------------------------------------ Query helpers */
/* Swap their bodies when the data comes from the API. */

export function getSheikh(id: string = featuredSheikhId): Sheikh {
  return sheikhs.find((s) => s.id === id) ?? sheikhs[0];
}

export function getSheikhBySlug(slug: string): Sheikh | undefined {
  return sheikhs.find((s) => s.slug === slug);
}

export function getVideo(id: string): Video | undefined {
  return videos.find((v) => v.id === id);
}

export function getSeries(id: string): Series | undefined {
  return seriesList.find((s) => s.id === id);
}

export function getSeriesBySlug(slug: string): Series | undefined {
  return seriesList.find((s) => s.slug === slug);
}

/** The series shown in the home spotlight. */
export function getFeaturedSeries(): Series {
  return seriesList.find((s) => s.featured) ?? seriesList[0];
}

/** Series of one sheikh, or all of them; ongoing first, then newest episode first. */
export function getSeriesOf(sheikhId?: string): Series[] {
  return seriesList
    .filter((s) => !sheikhId || s.sheikhId === sheikhId)
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || latestEpisodeDate(b).localeCompare(latestEpisodeDate(a)));
}

function latestEpisodeDate(series: Series): string {
  return getEpisodes(series.id).at(-1)?.publishedAt ?? "";
}

/** Episodes of a series in order (defaults to the featured series). */
export function getEpisodes(seriesId: string = getFeaturedSeries().id): Video[] {
  return videos.filter((v) => v.seriesId === seriesId).sort((a, b) => (a.episode ?? 0) - (b.episode ?? 0));
}

/** Series a section belongs to. */
export function getSeriesOfSection(sectionId: string): Series | undefined {
  return seriesList.find((s) => s.sections.some((sec) => sec.id === sectionId));
}

export function getSectionEpisodes(sectionId: string): Video[] {
  return videos.filter((v) => v.sectionId === sectionId);
}

/** Newest first. */
export function getLatest(limit = 8, sheikhId?: string): Video[] {
  return [...videos]
    .filter((v) => !sheikhId || v.sheikhId === sheikhId)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

export function getByKind(kind: Video["kind"]): Video[] {
  return videos.filter((v) => v.kind === kind);
}

/** Videos spoken in a language (e.g. every Taqbaylit video). */
export function getByLanguage(lang: Video["lang"]): Video[] {
  return videos.filter((v) => v.lang === lang);
}

export function getNextEpisode(video: Video): Video | undefined {
  if (!video.episode || !video.seriesId) return undefined;
  return getEpisodes(video.seriesId).find((e) => e.episode === video.episode! + 1);
}

export function getShorts(sheikhId?: string): Short[] {
  return shorts.filter((s) => !sheikhId || s.sheikhId === sheikhId);
}

export function getShort(id: string): Short | undefined {
  return shorts.find((s) => s.id === id);
}

export function getCategory(id: string): QuestionCategory | undefined {
  return questionCategories.find((c) => c.id === id);
}

/** Answered questions that may be shown publicly, newest answer first. */
export function getAnsweredQuestions(filter: { sheikhId?: string; categoryId?: string } = {}): Question[] {
  return questions
    .filter((q) => q.status === "answered" && q.isPublic && q.answer)
    .filter((q) => !filter.sheikhId || q.sheikhId === filter.sheikhId)
    .filter((q) => !filter.categoryId || q.categoryId === filter.categoryId)
    .sort((a, b) => b.answer!.answeredAt.localeCompare(a.answer!.answeredAt));
}

export function getQuestion(id: string): Question | undefined {
  return getAnsweredQuestions().find((q) => q.id === id);
}

/** The question a video answers, if any. */
export function getQuestionForVideo(videoId: string): Question | undefined {
  return getAnsweredQuestions().find((q) => q.answer?.videoId === videoId);
}

/** Sheikhs who receive questions through the site. */
export function getAskableSheikhs(): Sheikh[] {
  return sheikhs.filter((s) => s.takesQuestions);
}
