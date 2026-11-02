import type { Locale } from "./config";

/**
 * Every interface string lives here — edit wording in one place.
 * Names of sheikhs, series and videos are content: see src/data/content.ts.
 * Taqbaylit strings are a first draft for review by a native Kabyle speaker.
 */
const ar = {
  siteName: "اسم الموقع",
  skipToContent: "انتقل إلى المحتوى",
  languages: "اللغة",
  nav: { home: "الرئيسية", series: "دلائل النبوّة", videos: "المقاطع", playlists: "قوائم التشغيل", search: "بحث" },
  search: {
    label: "ابحث في كل المقاطع",
    placeholder: "ابحث عن حلقة، موضوع، أو كلمة…",
    shortcut: "اضغط / للبحث",
    allResults: "كل النتائج",
    noResults: "لا توجد نتائج لهذا البحث",
    recent: "بحثتَ مؤخرًا على هذا الجهاز",
    close: "إغلاق",
    filterAll: "الكل",
    groups: { series: "حلقات من دلائل النبوّة", videos: "مقاطع", kabyle: "Taqbaylit" },
  },
  sheikh: {
    title: "الشيخ",
    videosBy: "مقاطع",
  },
  home: {
    latestEpisode: "أحدث حلقة",
    continue: "تابِع من حيث توقفت",
    continueEpisode: (n: number) => `تابِع الحلقة ${n}`,
    searchTile: "عن ماذا تبحث؟",
    kabyleTile: "مقاطع بالقبائلية",
    quoteSource: "من كلام الشيخ — نص مؤقت",
    latest: "أحدث المقاطع",
    seriesBlurb: "سلسلة حلقات بالترتيب. تقدّمك محفوظ على هذا الجهاز.",
    kabyleBand: "بالقبائلية",
    shorts: "مقاطع قصيرة",
    playlists: "قوائم التشغيل",
    seeAll: "عرض الكل",
    videosCount: (n: number) => `${n} مقطعًا`,
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
    inArabic: "بالعربية",
  },
  state: { new: "جديدة", watched: "شوهدت", "in-progress": "تابِع", unwatched: "" },
  kinds: { series: "دلائل النبوّة", kabyle: "Taqbaylit", short: "قصير", qa: "أسئلة وأجوبة", mixed: "متنوّع" },
  player: { play: "تشغيل", pause: "إيقاف مؤقت", close: "إغلاق المشغّل", nowPlaying: "يُعرض الآن", seek: "التقديم" },
  footer: {
    note: "موقع مستقل لمقاطع المشايخ. كل المحتوى هنا نص مؤقت.",
    rights: "© جميع الحقوق محفوظة",
  },
  tabs: { home: "الرئيسية", series: "السلسلة", search: "بحث", playlists: "القوائم" },
  styleGuide: "المكوّنات",
} as const;

const fr: Dictionary = {
  siteName: "Nom du site",
  skipToContent: "Aller au contenu",
  languages: "Langue",
  nav: { home: "Accueil", series: "Dalâ’il an-Nubuwwa", videos: "Vidéos", playlists: "Playlists", search: "Recherche" },
  search: {
    label: "Rechercher dans toutes les vidéos",
    placeholder: "Un épisode, un sujet, un mot…",
    shortcut: "Appuyez sur / pour chercher",
    allResults: "Tous les résultats",
    noResults: "Aucun résultat pour cette recherche",
    recent: "Recherches récentes sur cet appareil",
    close: "Fermer",
    filterAll: "Tout",
    groups: { series: "Épisodes de Dalâ’il an-Nubuwwa", videos: "Vidéos", kabyle: "Taqbaylit" },
  },
  sheikh: {
    title: "Cheikh",
    videosBy: "Vidéos",
  },
  home: {
    latestEpisode: "Dernier épisode",
    continue: "Reprendre où vous en étiez",
    continueEpisode: (n: number) => `Reprendre l’épisode ${n}`,
    searchTile: "Que cherchez-vous ?",
    kabyleTile: "Vidéos en kabyle",
    quoteSource: "Parole du cheikh — texte provisoire",
    latest: "Dernières vidéos",
    seriesBlurb: "En arabe, sous-titré quand c’est disponible. Votre progression est gardée sur cet appareil.",
    kabyleBand: "en kabyle",
    shorts: "Vidéos courtes",
    playlists: "Playlists",
    seeAll: "Tout voir",
    videosCount: (n: number) => `${n} vidéos`,
  },
  video: {
    watchNow: "Regarder",
    episode: (n: number) => `Épisode ${n}`,
    next: "Suivant",
    autoplay: "Lecture automatique",
    chapters: "Chapitres",
    description: "Description",
    share: "Partager",
    audioOnly: "Audio seul",
    captions: "Sous-titres",
    inArabic: "en arabe",
  },
  state: { new: "Nouveau", watched: "Vu", "in-progress": "Reprendre", unwatched: "" },
  kinds: { series: "Dalâ’il", kabyle: "Taqbaylit", short: "Court", qa: "Questions-réponses", mixed: "Divers" },
  player: { play: "Lire", pause: "Pause", close: "Fermer le lecteur", nowPlaying: "En cours", seek: "Avancer" },
  footer: {
    note: "Site indépendant des vidéos des cheikhs. Tout le contenu ici est provisoire.",
    rights: "© Tous droits réservés",
  },
  tabs: { home: "Accueil", series: "Série", search: "Recherche", playlists: "Playlists" },
  styleGuide: "Composants",
};

const kab: Dictionary = {
  siteName: "Isem n usmel",
  skipToContent: "Ɛeddi ɣer ugbur",
  languages: "Tutlayt",
  nav: { home: "Agejdan", series: "Dala'il an-Nubuwwa", videos: "Tividyutin", playlists: "Tibdarin", search: "Nadi" },
  search: {
    label: "Nadi deg akk tividyutin",
    placeholder: "Nadi tasekkilt, asentel neɣ awal…",
    shortcut: "Sit ɣef / akken ad tnadiḍ",
    allResults: "Akk igmaḍ",
    noResults: "Ulac igmaḍ",
    recent: "Inadiyen ineggura",
    close: "Mdel",
    filterAll: "Akk",
    groups: { series: "Dala'il an-Nubuwwa", videos: "Tividyutin", kabyle: "Taqbaylit" },
  },
  sheikh: {
    title: "Ccix",
    videosBy: "Tividyutin",
  },
  home: {
    latestEpisode: "Tasekkilt taneggarut",
    continue: "Kemmel seg wanida tḥebseḍ",
    continueEpisode: (n: number) => `Kemmel tasekkilt ${n}`,
    searchTile: "Acu i tettnadiḍ?",
    kabyleTile: "Tividyutin s teqbaylit",
    quoteSource: "Seg wawal n ccix — aḍris n uɛraḍ",
    latest: "Tividyutin tineggura",
    seriesBlurb: "S taɛrabt, s yidrisen n teqbaylit anida llan.",
    kabyleBand: "S teqbaylit",
    shorts: "Tividyutin timeẓẓyanin",
    playlists: "Tibdarin",
    seeAll: "Wali akk",
    videosCount: (n: number) => `${n} tvidyutin`,
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
    inArabic: "s taɛrabt",
  },
  state: { new: "Tamaynut", watched: "Tettwaẓra", "in-progress": "Kemmel", unwatched: "" },
  kinds: { series: "Dala'il", kabyle: "Taqbaylit", short: "Tameẓẓyant", qa: "Isteqsiyen", mixed: "Tiyaḍ" },
  player: { play: "Urar", pause: "Ḥbes", close: "Mdel ameɣri", nowPlaying: "Tura", seek: "Zwi" },
  footer: {
    note: "Asmel ilelli n tvidyutin n yicuyax. Akk agbur da d aḍris n uɛraḍ.",
    rights: "© Izerfan akk ttwaḥerzen",
  },
  tabs: { home: "Agejdan", series: "Tasnit", search: "Nadi", playlists: "Tibdarin" },
  styleGuide: "Isuddusen",
};

type Widen<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends string
    ? string
    : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof ar>;

const dictionaries: Record<Locale, Dictionary> = { ar, fr, kab };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
