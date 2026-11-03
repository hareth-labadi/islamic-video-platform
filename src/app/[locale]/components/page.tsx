import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getByKind, getEpisodes, getVideo, playlists } from "@/data/content";
import { BentoTile } from "@/components/media/BentoTile";
import { Cover } from "@/components/media/Cover";
import { PlaylistTile } from "@/components/media/PlaylistTile";
import { TrackRow } from "@/components/media/TrackRow";
import { VideoCard } from "@/components/media/VideoCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { PlayPill } from "@/components/ui/PlayPill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SearchTrigger } from "@/components/search/SearchTrigger";

export const metadata: Metadata = { title: "المكوّنات", robots: { index: false } };

const colours = [
  { name: "paper", cls: "bg-paper border border-line", use: "خلفية الصفحة" },
  { name: "ink", cls: "bg-ink", use: "النص، البحث، التذييل" },
  { name: "series", cls: "bg-series", use: "سلسلة دلائل النبوّة" },
  { name: "kabyle", cls: "bg-kabyle", use: "مقاطع Taqbaylit" },
  { name: "short", cls: "bg-short", use: "المقاطع القصيرة" },
  { name: "accent", cls: "bg-accent", use: "تشغيل، متابعة، تقدّم" },
  { name: "fresh", cls: "bg-fresh", use: "حالة «جديدة»" },
];

function Block({ title, file, children }: { title: string; file: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-[var(--radius-tile)] bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold">{title}</h2>
        <code dir="ltr" className="rounded-full bg-paper px-3 py-1 font-latin text-xs text-muted">
          {file}
        </code>
      </div>
      {children}
    </section>
  );
}

/** Living style guide: every component with sample props. Not linked from the site. */
export default function ComponentsPage() {
  const eps = getEpisodes();
  const kab = getVideo("v-kab-1")!;
  const mixed = getVideo("v-mix-1")!;
  const shorts = getByKind("short");

  return (
    // Sample text on this page is Arabic, so it stays right-to-left in every language.
    <div dir="rtl" lang="ar" className="flex flex-col gap-6 px-3 pt-8 pb-20 font-sans md:px-0">
      <header className="flex flex-col gap-2 pb-4">
        <h1 className="text-4xl font-bold md:text-5xl">المكوّنات</h1>
        <p className="text-muted">
          كل مكوّن بأمثلة. عدّل الألوان من{" "}
          <code dir="ltr" className="font-latin">
            src/app/globals.css
          </code>
          .
        </p>
      </header>

      <Block title="الألوان" file="src/app/globals.css">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
          {colours.map((c) => (
            <div key={c.name} className="flex flex-col gap-2">
              <span className={`h-20 rounded-2xl ${c.cls}`} />
              <span dir="ltr" className="font-latin text-sm font-bold">
                {c.name}
              </span>
              <span className="text-xs text-muted">{c.use}</span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="الأزرار والشارات" file="components/ui">
        <div className="flex flex-wrap items-center gap-3">
          <PlayPill href="#" label="شاهد الآن" chip="18:42" icon />
          <span className="rounded-2xl bg-series p-3">
            <PlayPill href="#" label="الحلقة 12 من 24" variant="outline" className="text-white" />
          </span>
          <Button variant="accent">زر أساسي</Button>
          <Button variant="ink">زر داكن</Button>
          <Button variant="outline">كل المقاطع ←</Button>
          <Badge tone="accent">▶ تابِع</Badge>
          <Badge tone="fresh">جديدة</Badge>
          <Badge tone="kabyle" className="font-latin">
            CC · Taqbaylit
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip selected>الكل</Chip>
          <Chip dotClass="bg-series">دلائل النبوّة</Chip>
          <Chip dotClass="bg-kabyle" className="font-latin">
            Taqbaylit
          </Chip>
          <Chip dotClass="bg-short">قصيرة</Chip>
        </div>
        <div className="max-w-sm rounded-2xl bg-ink p-4">
          <ProgressBar value={0.31} label="التقدّم" />
        </div>
        <div className="flex flex-wrap gap-3">
          <SearchTrigger label="بحث" />
          <SearchTrigger label="موضوع، كلمة، عنوان…" variant="field" className="max-w-xs" />
        </div>
        <SectionHeading title="أحدث المقاطع" count={48} more={{ href: "#", label: "كل المقاطع ←" }} className="px-0" />
      </Block>

      <Block title="الأغلفة" file="components/media/Cover.tsx">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <Cover video={eps[11]} label="دلائل النبوّة · ح 12" />
          <Cover video={kab} label="Taqbaylit" />
          <Cover video={mixed} label="مقطع متنوّع" />
          <Cover video={getVideo("v-qa-1")!} label="أسئلة وأجوبة" />
          <Cover video={shorts[0]} label="مقطع قصير" />
          <span className="rounded-2xl bg-kabyle p-2">
            <Cover video={kab} label="Taqbaylit" surface="white" />
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {shorts.map((v) => (
            <Cover key={v.id} video={v} ratio="short" numeralClass="text-[120px] -top-[18px]" radiusClass="rounded-[18px]" title={v.title} />
          ))}
        </div>
      </Block>

      <Block title="بطاقات المقاطع" file="components/media/VideoCard.tsx">
        <div className="grid gap-4 md:grid-cols-4">
          <VideoCard video={eps[11]} href="#" coverLabel="دلائل النبوّة · ح 12" list="دلائل النبوّة" date="منذ يومين" />
          <VideoCard video={kab} href="#" coverLabel="Taqbaylit" list="بالقبائلية" date="منذ 3 أيام" />
          <VideoCard video={mixed} href="#" coverLabel="مقطع متنوّع" list="مقاطع متنوعة" date="منذ 5 أيام" />
        </div>
      </Block>

      <Block title="صفوف الحلقات" file="components/media/TrackRow.tsx">
        <ol>
          <li>
            <TrackRow video={eps[3]} href="#" state="watched" stateLabel="✓ شوهدت" subtitle="[المحور الثاني]" />
          </li>
          <li>
            <TrackRow video={eps[4]} href="#" state="in-progress" stateLabel="▶ تابِع" subtitle="[المحور الثاني]" />
          </li>
          <li>
            <TrackRow video={eps[5]} href="#" state="new" stateLabel="جديدة" subtitle="[المحور الثاني]" />
          </li>
          <li>
            <TrackRow video={eps[6]} href="#" state="unwatched" stateLabel="لم تُشاهَد" variant="full" meta={<span>23 سبتمبر 2026</span>} />
          </li>
        </ol>
      </Block>

      <Block title="مربعات الواجهة وقوائم التشغيل" file="BentoTile.tsx · PlaylistTile.tsx">
        <div className="grid gap-3 md:grid-cols-4">
          <BentoTile tone="series" className="min-h-[200px] justify-end md:col-span-2">
            <OutlineNumeral value="12" stroke="rgb(255 255 255 / .22)" strokeWidth="2px" className="-z-10 text-[220px]" />
            <span className="text-xl font-bold">مربع السلسلة</span>
          </BentoTile>
          <BentoTile tone="ink" className="min-h-[200px] justify-end">
            <span className="font-latin text-[64px] leading-[0.9] font-extrabold">05</span>
            <span className="font-bold text-accent">تابِع</span>
          </BentoTile>
          <BentoTile tone="accent" className="min-h-[200px] justify-end">
            <span className="text-[19px] font-bold">اقتباس</span>
          </BentoTile>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
          {playlists.map((p) => (
            <PlaylistTile key={p.id} playlist={p} href="#" countLabel={`${p.videoIds.length} مقطعًا`} />
          ))}
        </div>
      </Block>
    </div>
  );
}
