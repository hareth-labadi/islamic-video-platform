import type { Locale } from "@/lib/types";

/**
 * Every interface string lives here — edit wording in one place.
 * Taqbaylit strings are a first draft for review by a native Kabyle speaker.
 */
const ar = {
  siteName: "اسم الموقع",
  sheikhName: "اسم الشيخ",
  nav: { home: "الرئيسية", series: "دلائل النبوّة", videos: "المقاطع", playlists: "قوائم التشغيل", search: "بحث" },
  otherLanguage: "Taqbaylit",
  otherLanguageHref: "/kab",
  search: {
    label: "ابحث في كل المقاطع",
    placeholder: "ابحث عن حلقة، موضوع، أو كلمة…",
    shortcut: "اضغط / للبحث",
    allResults: "كل النتائج",
    noResults: "لا توجد نتائج لهذا البحث",
    recent: "بحثتَ مؤخرًا على هذا الجهاز",
    close: "إغلاق",
    groups: { series: "حلقات من دلائل النبوّة", videos: "مقاطع", kabyle: "Taqbaylit" },
  },
  home: {
    latestEpisode: "أحدث حلقة",
    continue: "تابِع من حيث توقفت",
    continueEpisode: (n: number) => `تابِع الحلقة ${n}`,
    searchTile: "عن ماذا تبحث؟",
    kabyleTile: "مقاطع بالقبائلية",
    quoteSource: "من كلام الشيخ — نص مؤقت",
    latest: "أحدث المقاطع",
    seriesTitle: "دلائل النبوّة",
    seriesBlurb: "سلسلة حلقات بالترتيب. تقدّمك محفوظ على هذا الجهاز.",
    kabyleBand: "بالقبائلية",
    shorts: "مقاطع قصيرة",
    playlists: "قوائم التشغيل",
    seeAll: "عرض الكل",
  },
  video: {
    watchNow: "شاهد الآن",
    episode: (n: number) => `الحلقة ${n}`,
    next: "التالي",
    autoplay: "تشغيل تلقائي",
    chapters: "الفصول",
    description: "الوصف",
    share: "مشاركة",
    audioOnly: "صوت فقط",
    captions: "ترجمة",
  },
  state: { new: "جديدة", watched: "شوهدت", "in-progress": "تابِع", unwatched: "" },
  kinds: { series: "دلائل النبوّة", kabyle: "Taqbaylit", short: "قصير", qa: "أسئلة وأجوبة", mixed: "متنوّع" },
  player: { play: "تشغيل", pause: "إيقاف مؤقت", close: "إغلاق المشغّل", nowPlaying: "يُعرض الآن" },
  footer: {
    note: "موقع مستقل لمقاطع الشيخ. كل المحتوى هنا نص مؤقت.",
    rights: "© جميع الحقوق محفوظة",
  },
  tabs: { home: "الرئيسية", series: "السلسلة", search: "بحث", playlists: "القوائم" },
} as const;

const kab: Dictionary = {
  siteName: "Isem n usmel",
  sheikhName: "Isem n ccix",
  nav: { home: "Agejdan", series: "Dala'il an-Nubuwwa", videos: "Tividyutin", playlists: "Tibdarin", search: "Nadi" },
  otherLanguage: "العربية",
  otherLanguageHref: "/",
  search: {
    label: "Nadi deg akk tividyutin",
    placeholder: "Nadi tasekkilt, asentel neɣ awal…",
    shortcut: "Sit ɣef / akken ad tnadiḍ",
    allResults: "Akk igmaḍ",
    noResults: "Ulac igmaḍ",
    recent: "Inadiyen ineggura",
    close: "Mdel",
    groups: { series: "Dala'il an-Nubuwwa", videos: "Tividyutin", kabyle: "Taqbaylit" },
  },
  home: {
    latestEpisode: "Tasekkilt taneggarut",
    continue: "Kemmel seg wanida tḥebseḍ",
    continueEpisode: (n: number) => `Kemmel tasekkilt ${n}`,
    searchTile: "Acu i tettnadiḍ?",
    kabyleTile: "Tividyutin s teqbaylit",
    quoteSource: "Seg wawal n ccix — aḍris n uɛraḍ",
    latest: "Tividyutin tineggura",
    seriesTitle: "Dala'il an-Nubuwwa",
    seriesBlurb: "S taɛrabt, s yidrisen n teqbaylit anida llan.",
    kabyleBand: "S teqbaylit",
    shorts: "Tividyutin timeẓẓyanin",
    playlists: "Tibdarin",
    seeAll: "Wali akk",
  },
  video: {
    watchNow: "Wali tura",
    episode: (n: number) => `Tasekkilt ${n}`,
    next: "Tin d-iteddun",
    autoplay: "Taɣuri tawurmant",
    chapters: "Ixfawen",
    description: "Aglam",
    share: "Bḍu",
    audioOnly: "Imesli kan",
    captions: "Iduras",
  },
  state: { new: "Tamaynut", watched: "Tettwaẓra", "in-progress": "Kemmel", unwatched: "" },
  kinds: { series: "Dala'il", kabyle: "Taqbaylit", short: "Tameẓẓyant", qa: "Isteqsiyen", mixed: "Tiyaḍ" },
  player: { play: "Urar", pause: "Ḥbes", close: "Mdel ameɣri", nowPlaying: "Tura" },
  footer: {
    note: "Asmel ilelli n tvidyutin n ccix. Akk agbur da d aḍris n uɛraḍ.",
    rights: "© Izerfan akk ttwaḥerzen",
  },
  tabs: { home: "Agejdan", series: "Tasnit", search: "Nadi", playlists: "Tibdarin" },
};

type Widen<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends string
    ? string
    : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof ar>;

const dictionaries: Record<Locale, Dictionary> = { ar, kab };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export const localeDir: Record<Locale, "rtl" | "ltr"> = { ar: "rtl", kab: "ltr" };
