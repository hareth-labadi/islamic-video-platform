import Link from "next/link";
import { getByLanguage, getEpisodes, getFeaturedSeries, quote, videos } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { pad2 } from "@/lib/format";
import { routes } from "@/lib/routes";
import { BentoTile } from "@/components/media/BentoTile";
import { ContinueTile } from "@/components/media/ContinueTile";
import { Cover } from "@/components/media/Cover";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { PlayPill } from "@/components/ui/PlayPill";
import { RelativeDate } from "@/components/ui/RelativeDate";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SearchTrigger } from "@/components/search/SearchTrigger";

/** Taqbaylit home: Taqbaylit videos first, the Arabic series labelled with its captions. */
export function KabyleHomePage() {
  const locale = "kab" as const;
  const t = getDictionary(locale);
  const kabyle = getByLanguage("kab");
  const lead = kabyle[0];
  const series = getFeaturedSeries();
  const episodes = getEpisodes(series.id);

  return (
    <div className="flex flex-col gap-[34px] pb-16 font-latin md:gap-[72px]">
      <section aria-label={t.home.newEpisode} className="grid grid-cols-2 gap-2.5 px-3 pt-1 md:grid-cols-4 md:grid-rows-[240px_240px] md:gap-3.5 md:px-0 md:pt-2">
        <BentoTile tone="kabyle" className="col-span-2 min-h-[300px] justify-end gap-3.5 p-[22px] md:row-span-2 md:min-h-0 md:p-8">
          <OutlineNumeral value="T" stroke="rgb(255 255 255 / .22)" strokeWidth="2px" align="right" className="-z-10 -top-20 text-[300px] tracking-[-0.07em] md:text-[420px]" />
          <span className="absolute top-7 left-8 text-[12.5px] font-bold tracking-[0.08em]">TAMAYNUT · TAQBAYLIT</span>
          <span className="max-w-[520px] text-[28px] leading-[1.08] font-extrabold tracking-[-0.03em] md:text-[44px]">{lead.title}</span>
          <span className="text-[15px] leading-[1.6] opacity-88">[{lead.summary}]</span>
          <span className="flex gap-2.5">
            <PlayPill href={routes.watch(locale, lead.id)} label={`▶ ${t.home.watchNow}`} chip={lead.duration} />
          </span>
        </BentoTile>

        <ContinueTile locale={locale} className="min-h-[168px] md:col-start-3 md:row-start-1 md:min-h-0" />

        <BentoTile tone="card" className="hidden justify-between md:col-start-4 md:row-start-1 md:flex">
          <span className="text-2xl leading-[1.2] font-extrabold tracking-[-0.02em]">{t.home.searchIn(videos.length)}</span>
          <SearchTrigger label={t.search.placeholder} variant="field" ariaLabel={t.search.label} />
        </BentoTile>

        <BentoTile tone="series" href={routes.seriesPage(locale, series.slug)} className="min-h-[168px] justify-between md:col-start-3 md:row-start-2 md:min-h-0">
          <OutlineNumeral value={series.plannedCount} stroke="rgb(255 255 255 / .2)" strokeWidth="1.5px" align="right" className="-z-10 top-auto -bottom-[50px] text-[160px] md:text-[200px]" />
          <span className="text-[12.5px] font-bold text-accent">{t.home.seriesKicker}</span>
          <span dir="rtl" lang="ar" className="self-start font-sans text-[30px] font-bold">
            {series.title}
          </span>
        </BentoTile>

        <BentoTile tone="accent" className="hidden justify-between md:col-start-4 md:row-start-2 md:flex">
          <span aria-hidden="true" className="h-[34px] text-[72px] leading-[0.6] font-extrabold">
            “
          </span>
          <p dir="rtl" lang="ar" className="font-sans text-[19px] leading-[1.6] font-bold">
            {quote.text}
          </p>
        </BentoTile>
      </section>

      <section aria-labelledby="kab-latest">
        <SectionHeading id="kab-latest" title={t.home.kabyleTitle} count={kabyle.length} more={{ href: routes.search(locale, undefined, "kabyle"), label: t.home.kabyleMore }} latin />
        <div className="grid grid-cols-2 gap-x-[18px] gap-y-[30px] px-3 md:grid-cols-4 md:px-0">
          {kabyle.map((v, i) => (
            <Link key={v.id} href={routes.watch(locale, v.id)} className="group flex flex-col gap-2.5">
              <div className="transition-transform duration-300 group-hover:-translate-y-1">
                <Cover video={{ ...v, mark: pad2(i + 1), tone: (["kabyle", "mixed", "short", "kabyle"] as const)[i % 4] }} numeralClass="text-[100px] md:text-[150px]" />
              </div>
              <h3 className="line-clamp-2 text-base leading-[1.5] font-bold">{v.title}</h3>
              <p className="flex items-center gap-1.5 text-[13px] text-muted">
                <span aria-hidden="true" className="size-2 rounded-full bg-kabyle" />
                <RelativeDate iso={v.publishedAt} locale={locale} />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="kab-series" className="px-3 md:px-0">
        <div className="relative isolate grid gap-10 overflow-hidden rounded-[28px] bg-series p-6 text-white md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-start md:p-9">
          <OutlineNumeral value={series.plannedCount} stroke="rgb(255 255 255 / .14)" strokeWidth="2px" className="-z-10 top-auto -bottom-[70px] -left-5 text-[300px] tracking-[-0.07em]" />
          <div className="flex flex-col gap-3">
            <span className="text-[12.5px] font-bold text-accent uppercase">{t.home.seriesKicker}</span>
            <h2 id="kab-series" dir="rtl" lang="ar" className="self-start font-sans text-[46px] font-bold">
              {series.title}
            </h2>
            <p className="text-[15.5px] leading-[1.7] opacity-88">{t.home.seriesBlurb(series.plannedCount)}</p>
            <span className="mt-1.5 flex gap-2.5">
              <PlayPill href={routes.watch(locale, episodes[4].id)} label={t.home.continueShort} chip={pad2(5)} />
            </span>
          </div>
          <ol className="list-none">
            {episodes.slice(0, 4).map((e) => (
              <li key={e.id}>
                <Link href={routes.watch(locale, e.id)} className="grid grid-cols-[70px_minmax(0,1fr)_130px] items-center gap-4 border-t border-white/18 px-3 py-3.5">
                  <span className="text-center text-[38px] font-extrabold tracking-[-0.04em] text-stroke [--stroke:rgb(255_255_255/.7)] [--stroke-width:1.2px]">{pad2(e.episode!)}</span>
                  <span dir="rtl" lang="ar" className="text-left font-sans text-base font-bold">
                    {e.title}
                  </span>
                  <span className={`justify-self-end rounded-full px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap text-ink ${e.captions?.includes("kab") ? "bg-accent" : "bg-white/75"}`}>
                    {e.captions?.includes("kab") ? "CC · Taqbaylit" : t.video.inArabic}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
