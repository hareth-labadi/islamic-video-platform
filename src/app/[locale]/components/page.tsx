import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getEpisodes, getVideo, playlists } from "@/data/content";
import { BentoTile } from "@/components/media/BentoTile";
import { Cover } from "@/components/media/Cover";
import { PlaylistTile } from "@/components/media/PlaylistTile";
import { TrackRow } from "@/components/media/TrackRow";
import { VideoCard } from "@/components/media/VideoCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PlayPill } from "@/components/ui/PlayPill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowIcon } from "@/components/ui/icons";
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
        <code dir="ltr" className="rounded-full bg-paper px-3 py-1 font-latin text-xs text-muted">{file}</code>
      </div>
      {children}
    </section>
  );
}

/** Living style guide: every component with sample props. Not linked from the site. */
export default function ComponentsPage() {
  const ep = getEpisodes()[4];
  const kab = getVideo("v-kab-1")!;
  const short = getVideo("short-1")!;

  return (
    // Sample text on this page is Arabic, so it stays right-to-left in every language.
    <div dir="rtl" lang="ar" className="flex flex-col gap-6 pt-8 font-sans">
      <header className="flex flex-col gap-2 pb-4">
        <h1 className="text-4xl font-bold md:text-5xl">المكوّنات</h1>
        <p className="text-muted">كل مكوّن بأمثلة. عدّل الألوان من <code dir="ltr" className="font-latin">src/app/globals.css</code>.</p>
      </header>

      <Block title="الألوان" file="src/app/globals.css">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
          {colours.map((c) => (
            <div key={c.name} className="flex flex-col gap-2">
              <span className={`h-20 rounded-2xl ${c.cls}`} />
              <span dir="ltr" className="font-latin text-sm font-bold">{c.name}</span>
              <span className="text-xs text-muted">{c.use}</span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="الأزرار والشارات" file="components/ui">
        <div className="flex flex-wrap items-center gap-3">
          <PlayPill href="#" label="شاهد الآن" duration="18:42" />
          <Button variant="accent">زر أساسي</Button>
          <Button variant="ink">زر داكن</Button>
          <Button variant="outline" icon={<ArrowIcon size={16} />} className="flex-row-reverse">عرض الكل</Button>
          <Button variant="outline" size="sm">صغير</Button>
          <Badge tone="accent">تابِع</Badge>
          <Badge tone="fresh">جديدة</Badge>
          <Badge tone="kabyle" className="font-latin">CC · Taqbaylit</Badge>
          <Badge tone="outline" className="text-muted">شوهدت</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip selected>الكل</Chip>
          <Chip dotClass="bg-series">دلائل النبوّة</Chip>
          <Chip dotClass="bg-kabyle" className="font-latin">Taqbaylit</Chip>
          <Chip dotClass="bg-short">قصير</Chip>
        </div>
        <div className="max-w-sm rounded-2xl bg-ink p-4">
          <ProgressBar value={0.31} label="التقدّم" />
        </div>
        <SearchTrigger label="ابحث في كل المقاطع" hint="اضغط / للبحث" className="max-w-md" />
        <SectionHeading title="أحدث المقاطع" count={48} />
      </Block>

      <Block title="الأغلفة" file="components/media/Cover.tsx">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {(["series", "kabyle", "short", "qa", "mixed"] as const).map((k) => (
            <Cover key={k} video={{ kind: k, title: k, episode: k === "series" ? 12 : undefined }} label={k} />
          ))}
          <Cover video={{ kind: "series", title: "05", episode: 5 }} label="ح 05" />
        </div>
      </Block>

      <Block title="بطاقات المقاطع" file="components/media/VideoCard.tsx">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <VideoCard video={ep} href="#" meta="الحلقة 5" coverLabel="دلائل النبوّة · 05" />
          <VideoCard video={kab} href="#" meta="Taqbaylit" coverLabel="Taqbaylit" />
          <VideoCard video={short} href="#" ratio="short" className="max-w-40" />
          <div className="rounded-2xl bg-kabyle p-3">
            <VideoCard video={kab} href="#" coverLabel="Taqbaylit" onColor />
          </div>
        </div>
      </Block>

      <Block title="صفوف الحلقات" file="components/media/TrackRow.tsx">
        <div className="flex flex-col divide-y divide-line">
          <TrackRow video={ep} href="#" state="in-progress" stateLabel="تابِع" />
          <TrackRow video={getEpisodes()[5]} href="#" state="new" stateLabel="جديدة" />
          <TrackRow video={getEpisodes()[2]} href="#" state="watched" stateLabel="شوهدت" withCover />
          <TrackRow video={getEpisodes()[6]} href="#" />
        </div>
      </Block>

      <Block title="مربعات الواجهة وقوائم التشغيل" file="BentoTile.tsx · PlaylistTile.tsx">
        <div className="grid gap-3 md:grid-cols-4">
          <BentoTile tone="series" numeral="12" className="md:col-span-2"><span className="text-xl font-bold">مربع السلسلة</span></BentoTile>
          <BentoTile tone="ink" numeral="05"><span className="font-bold text-accent">تابِع</span></BentoTile>
          <BentoTile tone="accent" numeral="“"><span className="font-bold">اقتباس</span></BentoTile>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {playlists.map((p) => (
            <PlaylistTile key={p.id} playlist={p} href="#" countLabel={`${p.videoIds.length} مقطعًا`} />
          ))}
        </div>
      </Block>
    </div>
  );
}
