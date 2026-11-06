import type {
  AdminPlaylist,
  AdminQuestion,
  AdminSeries,
  AdminSheikh,
  AdminShort,
  AdminVideo,
  ImportJob,
  Member,
  QuestionCategory,
} from "../types";

/*
 * Demo data for the in-memory mock API. Same ids and placeholder titles as the
 * public sample content (src/data/content.ts) so both sides read alike; dates
 * are relative to "now" so the dashboard always looks current.
 */

export interface MockDb {
  sheikhs: AdminSheikh[];
  members: Member[];
  videos: AdminVideo[];
  series: AdminSeries[];
  playlists: AdminPlaylist[];
  shorts: AdminShort[];
  importJobs: ImportJob[];
  questions: AdminQuestion[];
  categories: QuestionCategory[];
}

const S1 = "sheikh-1";
const S2 = "sheikh-2";

export function createSeed(now = Date.now()): MockDb {
  const at = (hours: number) => new Date(now - hours * 3_600_000).toISOString();
  const day = (days: number) => at(days * 24).slice(0, 10);

  const sheikhs: AdminSheikh[] = [
    {
      id: S1,
      slug: "sheikh-1",
      name: { ar: "الشيخ [الاسم]", fr: "Cheikh [nom]", kab: "Ccix [isem]" },
      honorific: { ar: "حفظه الله", fr: "qu’Allah le préserve", kab: "" },
      bio: {
        ar: "نص مؤقت: سطر قصير يعرّف بالشيخ.",
        fr: "Texte provisoire : une ligne qui présente le cheikh.",
        kab: "Aḍris n uɛraḍ: yiwen n yizirig ɣef ccix.",
      },
      monogram: "ش",
      socials: { telegram: "https://t.me/sheikh_channel", tiktok: "https://www.tiktok.com/@sheikh.lessons", youtube: "https://www.youtube.com/@sheikh" },
      takesQuestions: true,
    },
    {
      id: S2,
      slug: "mohamed-cherif",
      name: { ar: "الشيخ محمد شريف", fr: "Cheikh Mohamed Cherif", kab: "Ccix Muḥend Cerif" },
      bio: {
        ar: "نص مؤقت: شيخ ثانٍ للمثال.",
        fr: "Texte provisoire : un second cheikh d’exemple.",
        kab: "Aḍris n uɛraḍ: ccix wis sin i umedya.",
      },
      monogram: "م",
      socials: { telegram: "https://t.me/mohamed_cherif" },
      takesQuestions: true,
    },
  ];

  const members: Member[] = [
    { id: "m-owner-1", name: "الشيخ [الاسم]", email: "sheikh@example.org", role: "owner", sheikhIds: [S1], status: "active", createdAt: at(24 * 120), lastActiveAt: at(2) },
    { id: "m-owner-2", name: "الشيخ محمد شريف", email: "cherif@example.org", role: "owner", sheikhIds: [S2], status: "active", createdAt: at(24 * 60), lastActiveAt: at(30) },
    { id: "m-admin-1", name: "Yacine Belkacem", email: "yacine@example.org", telegram: "yacine_b", role: "admin", sheikhIds: [S1, S2], status: "active", createdAt: at(24 * 100), lastActiveAt: at(0.3) },
    { id: "m-editor-1", name: "Amina Kaci", email: "amina@example.org", role: "editor", sheikhIds: [S1], status: "active", createdAt: at(24 * 40), lastActiveAt: at(26) },
    { id: "m-editor-2", name: "كريم ح.", email: "karim@example.org", telegram: "karim_dz", role: "editor", sheikhIds: [S1], status: "active", createdAt: at(24 * 12), lastActiveAt: at(24 * 6) },
    { id: "m-inv-1", name: "nadia@example.org", email: "nadia@example.org", role: "editor", sheikhIds: [S1], status: "invited", createdAt: at(20), invitedBy: "m-admin-1" },
    { id: "m-inv-2", name: "@sami_tlm", telegram: "sami_tlm", role: "admin", sheikhIds: [S1], status: "invited", createdAt: at(24 * 3), invitedBy: "m-owner-1" },
    { id: "m-req-1", name: "عمر ل.", email: "omar@example.org", role: "editor", sheikhIds: [S1], status: "requested", createdAt: at(5), message: "أنا من طلبة الشيخ، وأستطيع رفع الدروس وكتابة أوصافها." },
    { id: "m-req-2", name: "Sofiane M.", email: "sofiane@example.org", role: "editor", sheikhIds: [S1], status: "requested", createdAt: at(28), message: "Je monte des vidéos et je peux aider pour les shorts en kabyle." },
  ];

  /** Fake 11-character YouTube ids (their thumbnails don't exist, so the branded cover shows). */
  const yt = (n: number) => `Yt${String(n).padStart(3, "0")}DemoAb`;

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

  const base = (v: Partial<AdminVideo> & Pick<AdminVideo, "id" | "sheikhId" | "title">, i: number): AdminVideo => ({
    slug: v.id,
    lang: "ar",
    kind: "mixed",
    duration: "10:00",
    publishedAt: day(i * 5 + 3),
    topics: [],
    source: { kind: "youtube", youtubeId: yt(i), url: `https://www.youtube.com/watch?v=${yt(i)}` },
    status: "published",
    createdAt: at(24 * (i * 5 + 4)),
    updatedAt: at(24 * (i * 5 + 3)),
    ...v,
  });

  const dalail: AdminVideo[] = dalailTitles.map((title, i) =>
    base(
      {
        id: `ep-${i + 1}`,
        sheikhId: S1,
        seriesId: "dalail",
        episode: i + 1,
        sectionId: i < 3 ? "s1" : i < 6 ? "s2" : "s3",
        title,
        kind: "series",
        duration: dalailDurations[i],
        publishedAt: day((11 - i) * 5 + 4),
        summary: "سطر واحد يلخّص موضوع الحلقة قبل مشاهدتها.",
        description: "[وصف الحلقة كما يكتبه فريق الموقع: ما الدليل الذي تتناوله، وكيف يرتبط بما قبله وما بعده في السلسلة.]",
        topics: i === 0 ? ["المعجزات", "البشارات"] : i === 3 ? ["البشارات"] : ["المعجزات"],
        updatedAt: at(24 * ((11 - i) * 5 + 4)),
      },
      i + 1,
    ),
  );
  dalail.push(
    base(
      {
        id: "ep-13",
        sheikhId: S1,
        seriesId: "dalail",
        episode: 13,
        sectionId: "s3",
        title: "[الحلقة 13: عنوان الحلقة القادمة]",
        kind: "series",
        duration: "20:05",
        publishedAt: day(-2),
        status: "draft",
        summary: "",
        topics: ["المعجزات"],
        updatedAt: at(3),
        createdAt: at(26),
      },
      13,
    ),
  );

  const sira: AdminVideo[] = Array.from({ length: 8 }, (_, i) =>
    base(
      {
        id: `sira-${i + 1}`,
        sheikhId: S1,
        seriesId: "sira",
        episode: i + 1,
        sectionId: i < 4 ? "sira-s1" : "sira-s2",
        title: i === 0 ? "مقدّمة في دراسة السيرة النبوية" : `[عنوان الحلقة ${i + 1} من مختصر السيرة]`,
        kind: "series",
        duration: ["16:05", "20:12", "18:40", "22:31", "19:02", "17:48", "21:30", "24:15"][i],
        publishedAt: day(180 - i * 7),
        topics: ["السيرة"],
        updatedAt: at(24 * (180 - i * 7)),
      },
      20 + i,
    ),
  );

  const arbain: AdminVideo[] = Array.from({ length: 5 }, (_, i) =>
    base(
      {
        id: `arb-${i + 1}`,
        sheikhId: S2,
        seriesId: "arbain",
        episode: i + 1,
        sectionId: "arb-s1",
        title: i === 0 ? "حديث «إنما الأعمال بالنيات»" : `[عنوان الحلقة ${i + 1} من شرح الأربعين]`,
        kind: "series",
        duration: ["26:40", "24:12", "28:05", "22:47", "25:30"][i],
        publishedAt: day(28 - i * 7),
        topics: ["الحديث", "النية"],
        updatedAt: at(24 * (28 - i * 7)),
      },
      30 + i,
    ),
  );

  const others: AdminVideo[] = [
    base({ id: "v-kab-1", sheikhId: S1, title: "Azwel n tvidyut s teqbaylit", lang: "kab", kind: "kabyle", duration: "11:05", publishedAt: day(5), summary: "Agzul wezzilen n tvidyut.", topics: ["nnbi"] }, 40),
    base({ id: "v-kab-2", sheikhId: S1, title: "Azwel aɣezfan n tvidyut i d-yesskanen akken yettuɣal ɣef sin yizirig", lang: "kab", kind: "kabyle", duration: "16:48", publishedAt: day(24) }, 41),
    base({ id: "v-kab-3", sheikhId: S1, title: "Azwel n tvidyut nniḍen", lang: "kab", kind: "kabyle", duration: "13:20", publishedAt: day(35) }, 42),
    base({ id: "v-mix-1", sheikhId: S1, title: "عنوان مقطع متنوّع أطول قليلًا يلتفّ على سطرين كحدٍّ أقصى", kind: "mixed", duration: "09:37", publishedAt: day(7) }, 43),
    base({ id: "v-qa-1", sheikhId: S1, title: "كيف أبدأ طلب العلم وأنا موظف؟", kind: "qa", duration: "06:12", publishedAt: day(27), summary: "جواب مصوَّر عن سؤال وصل عبر الموقع.", topics: ["طلب العلم"] }, 44),
    base({ id: "v-mix-2", sheikhId: S1, title: "عنوان مقطع متنوّع آخر", kind: "mixed", duration: "12:30", publishedAt: day(27) }, 45),
    base({ id: "v-draft-1", sheikhId: S1, title: "[محاضرة الجمعة: عنوان مؤقت]", kind: "mixed", duration: "34:10", publishedAt: day(0), status: "draft", source: { kind: "upload", url: "/media/samples/short-1.mp4", fileName: "khutba-friday.mp4", sizeBytes: 412_000_000 }, updatedAt: at(20), createdAt: at(22) }, 46),
    base({ id: "v-draft-2", sheikhId: S1, title: "Tazwart n wammud amaynut", lang: "kab", kind: "kabyle", duration: "08:44", publishedAt: day(-1), status: "draft", updatedAt: at(50), createdAt: at(52) }, 47),
    base({ id: "v-mix-3", sheikhId: S2, title: "عنوان محاضرة للشيخ الثاني", kind: "mixed", duration: "31:08", publishedAt: day(3), summary: "سطر واحد يلخّص المحاضرة." }, 48),
    base({ id: "v-qa-2", sheikhId: S2, title: "بأي شرح أبدأ الأربعين النووية؟", kind: "qa", duration: "04:51", publishedAt: day(16), summary: "جواب مصوَّر عن سؤال وصل عبر الموقع." }, 49),
  ];

  const videos = [...dalail, ...sira, ...arbain, ...others];

  const series: AdminSeries[] = [
    {
      id: "dalail",
      slug: "dalail-an-nubuwwa",
      sheikhId: S1,
      title: "دلائل النبوّة",
      lang: "ar",
      description: "[وصف السلسلة كما يكتبه فريق الموقع: ما المقصود بدلائل النبوّة، ولماذا رُتّبت الحلقات بهذا الترتيب، ولمن هي.]",
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
      visibility: "published",
      episodeIds: dalail.map((v) => v.id),
      updatedAt: at(3),
    },
    {
      id: "sira",
      slug: "mukhtasar-as-sira",
      sheikhId: S1,
      title: "مختصر السيرة النبوية",
      lang: "ar",
      description: "[وصف السلسلة الثانية: سلسلة مكتملة للمثال.]",
      tagline: "[سلسلة مكتملة — مثال.]",
      glyph: "س",
      plannedCount: 8,
      sections: [
        { id: "sira-s1", title: "[المرحلة المكية]" },
        { id: "sira-s2", title: "[المرحلة المدنية]" },
      ],
      status: "complete",
      visibility: "published",
      episodeIds: sira.map((v) => v.id),
      updatedAt: at(24 * 120),
    },
    {
      id: "aqida-draft",
      slug: "usul-al-iman",
      sheikhId: S1,
      title: "[أصول الإيمان — سلسلة قادمة]",
      lang: "ar",
      description: "[سلسلة قيد التحضير، لم تُنشر بعد.]",
      glyph: "أ",
      plannedCount: 10,
      sections: [],
      status: "ongoing",
      visibility: "draft",
      episodeIds: [],
      updatedAt: at(40),
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
      sections: [{ id: "arb-s1", title: "[الأحاديث ١ – ١٠]" }],
      status: "ongoing",
      featured: true,
      visibility: "published",
      episodeIds: arbain.map((v) => v.id),
      updatedAt: at(24 * 2),
    },
  ];

  const playlists: AdminPlaylist[] = [
    { id: "pl-kab", slug: "tividyutin-s-teqbaylit", sheikhId: S1, title: "Tividyutin s teqbaylit", description: "Tividyutin akk s teqbaylit.", kind: "kabyle", glyph: "T", videoIds: ["v-kab-1", "v-kab-2", "v-kab-3"], visibility: "published", updatedAt: at(24 * 5) },
    { id: "pl-qa", slug: "asila-wa-ajwiba", sheikhId: S1, title: "أسئلة وأجوبة", description: "أجوبة مصوّرة عن أسئلة الزوار.", kind: "qa", glyph: "؟", videoIds: ["v-qa-1"], visibility: "published", updatedAt: at(24 * 27) },
  ];

  const shortSeed: Array<[string, string, AdminShort["status"], string, number, AdminShort["tone"], string?]> = [
    ["فكرة واحدة في أقل من دقيقة", S1, "published", "0:58", 50, "short"],
    ["Tikti deg yiwet n tesdat", S1, "published", "0:44", 140, "kabyle"],
    ["من حلقة دلائل النبوّة 3", S1, "published", "0:51", 230, "series", "ep-3"],
    ["تذكير قصير", S1, "hidden", "0:29", 400, "mixed"],
    ["جواب مختصر عن سؤال", S2, "published", "1:12", 330, "qa", "v-qa-2"],
    ["", S1, "pending", "0:47", 1.5, "short"],
    ["", S1, "pending", "1:05", 1.5, "short"],
    ["", S1, "pending", "0:38", 1.5, "series"],
  ];
  // Published ones keep the public sample ids (short-1…); imports are "tt-<tiktok id>" like the importer.
  const shorts: AdminShort[] = shortSeed.map(([title, sheikhId, status, duration, hours, tone, fromVideoId], i) => ({
    id: status === "pending" ? `tt-73${String(i + 1).padStart(17, "0")}` : `short-${i + 1}`,
    sheikhId,
    title,
    lang: title.startsWith("Tikti") ? "kab" : "ar",
    duration,
    publishedAt: status === "published" ? day(hours / 24) : undefined,
    importedAt: at(hours + 1),
    source: { platform: "tiktok", url: `https://www.tiktok.com/@sheikh.lessons/video/73${String(i + 1).padStart(17, "0")}`, externalId: `73${String(i + 1).padStart(17, "0")}` },
    mediaUrl: `/media/samples/short-${(i % 6) + 1}.mp4`,
    topics: i === 2 ? ["المعجزات"] : [],
    tone,
    fromVideoId,
    transcript: null,
    status,
    importJobId: status === "pending" ? "job-1" : undefined,
  }));

  const importJobs: ImportJob[] = [
    {
      id: "job-1",
      sheikhId: S1,
      input: { kind: "profile", handle: "@sheikh.lessons" },
      createdAt: at(2.5),
      createdBy: "m-admin-1",
      status: "done",
      items: [
        ...shorts.filter((s) => s.importJobId === "job-1").map((s, i) => ({ id: `job-1-${i}`, url: s.source.url, externalId: s.source.externalId, state: "imported" as const, shortId: s.id })),
        { id: "job-1-x", url: "https://www.tiktok.com/@sheikh.lessons/video/7300000000000000099", externalId: "7300000000000000099", state: "failed", error: "private" },
      ],
    },
  ];

  const categories: QuestionCategory[] = [
    { id: "aqida", title: { ar: "العقيدة", fr: "Croyance", kab: "Liman" } },
    { id: "worship", title: { ar: "العبادات", fr: "Adoration", kab: "Taɛbadit" } },
    { id: "family", title: { ar: "الأسرة", fr: "Famille", kab: "Twacult" } },
    { id: "dealings", title: { ar: "المعاملات", fr: "Transactions", kab: "Timsenzay" } },
    { id: "knowledge", title: { ar: "طلب العلم", fr: "Étudier la science", kab: "Aɣmar n tmussni" } },
  ];

  const q = (v: Omit<AdminQuestion, "published"> & { published?: boolean }): AdminQuestion => ({ published: false, ...v });
  const questions: AdminQuestion[] = [
    q({ id: "q-201", sheikhId: S1, body: "ما حكم قراءة القرآن من الهاتف دون وضوء؟ وهل يختلف الحكم إذا كان المصحف مطبوعًا؟", lang: "ar", categoryId: "worship", askedAt: at(1.2), status: "pending", isPublic: true }),
    q({ id: "q-202", sheikhId: S1, body: "أريد أن أبدأ بحفظ الأربعين النووية مع أولادي، فبأي شرح تنصحون للمبتدئين؟", lang: "ar", categoryId: "knowledge", askedAt: at(4), status: "pending", isPublic: true, suggestedVideoId: "v-qa-1" }),
    q({ id: "q-203", sheikhId: S1, body: "Est-il permis de rassembler les prières lors d’un long trajet en voiture pour le travail ?", lang: "fr", categoryId: "worship", askedAt: at(9), status: "pending", isPublic: true }),
    q({ id: "q-204", sheikhId: S1, body: "زوجي لا يصلي إلا قليلًا، وأخشى على أولادي من ذلك. كيف أنصحه دون أن تسوء العلاقة بيننا؟", lang: "ar", categoryId: "family", askedAt: at(20), status: "pending", isPublic: false }),
    q({ id: "q-205", sheikhId: S1, body: "ما الفرق بين المعجزة والكرامة؟ وهل ذُكر ذلك في سلسلة دلائل النبوة؟", lang: "ar", categoryId: "aqida", askedAt: at(30), status: "pending", isPublic: true }),
    q({ id: "q-206", sheikhId: S1, body: "Ma yella ad nezzall s teqbaylit deg ddoɛa, ma yella yelha?", lang: "kab", categoryId: "worship", askedAt: at(52), status: "pending", isPublic: true }),
    q({ id: "q-207", sheikhId: S1, body: "هل يجوز شراء سيارة بالتقسيط من البنك إذا كانت الزيادة محددة من البداية؟", lang: "ar", categoryId: "dealings", askedAt: at(76), status: "pending", isPublic: true }),
    q({
      id: "q-101",
      sheikhId: S1,
      body: "فاتتني صلوات كثيرة في سنوات مضت ولا أعرف عددها، فكيف أقضي هذه الصلاة؟",
      lang: "ar",
      categoryId: "worship",
      askedAt: at(24 * 8),
      status: "answered",
      isPublic: true,
      published: true,
      answer: { kind: "voice", audioUrl: "/media/samples/voice-1.m4a", audioDuration: "0:42", text: "[ملخّص مكتوب للجواب الصوتي يكتبه فريق الموقع.]", answeredAt: at(24 * 3) },
    }),
    q({
      id: "q-102",
      sheikhId: S1,
      body: "هل يجوز الجمع بين نية صيام القضاء وصيام الست من شوال؟",
      lang: "ar",
      categoryId: "worship",
      askedAt: at(24 * 16),
      status: "answered",
      isPublic: true,
      published: true,
      answer: { kind: "text", text: "[جواب مكتوب: نص جواب الشيخ كما يُنشر على الموقع.]", answeredAt: at(24 * 5) },
    }),
    q({
      id: "q-103",
      sheikhId: S1,
      body: "كيف أبدأ طلب العلم الشرعي وأنا موظف ووقتي ضيق؟",
      lang: "ar",
      categoryId: "knowledge",
      askedAt: at(24 * 34),
      status: "answered",
      isPublic: true,
      published: true,
      answer: { kind: "video", videoId: "v-qa-1", text: "[كلمة قصيرة قبل الفيديو.]", answeredAt: at(24 * 27) },
    }),
    q({
      id: "q-104",
      sheikhId: S1,
      body: "أمي مريضة ولا تستطيع الصيام، فهل عليها كفارة؟",
      lang: "ar",
      categoryId: "worship",
      askedAt: at(24 * 12),
      status: "answered",
      isPublic: false,
      answer: { kind: "text", text: "[جواب خاص لم يُنشر لأن السائل طلب ذلك.]", answeredAt: at(24 * 10) },
    }),
    q({ id: "q-301", sheikhId: S1, body: "اشترك في قناتي واربح جوائز!!! رابط في البايو", lang: "ar", categoryId: "knowledge", askedAt: at(24 * 2), status: "rejected", isPublic: true, rejection: { reason: "spam", at: at(24 * 2 - 1) } }),
    q({ id: "q-302", sheikhId: S1, body: "هل يجوز الجمع بين نية القضاء والست من شوال؟", lang: "ar", categoryId: "worship", askedAt: at(24 * 15), status: "rejected", isPublic: true, rejection: { reason: "duplicate", at: at(24 * 14) } }),
    q({ id: "q-401", sheikhId: S2, body: "ما معنى «إنما الأعمال بالنيات» في العبادات اليومية؟", lang: "ar", categoryId: "aqida", askedAt: at(6), status: "pending", isPublic: true }),
    q({ id: "q-402", sheikhId: S2, body: "Quel commentaire des 40 hadiths conseillez-vous en français ?", lang: "fr", categoryId: "knowledge", askedAt: at(40), status: "pending", isPublic: true }),
  ];

  return { sheikhs, members, videos, series, playlists, shorts, importJobs, questions, categories };
}
