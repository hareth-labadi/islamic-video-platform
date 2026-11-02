import Link from "next/link";
import { notFound } from "next/navigation";
import { getEpisodes, getNextEpisode, getSheikh, getVideo } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate, pad2 } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/types";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";

export function WatchPage({ locale, id }: { locale: Locale; id: string }) {
  const video = getVideo(id);
  if (!video) notFound();

  const t = getDictionary(locale);
  const next = getNextEpisode(video);
  const episodes = video.kind === "series" ? getEpisodes() : [];
  const isKab = video.lang === "kab";
  const sheikh = getSheikh(video.sheikhId);

  return (
    <div className="grid gap-8 pt-6 md:pt-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-5">
        <VideoPlayer video={video} labels={{ play: t.player.play, pause: t.player.pause, captions: "Taqbaylit", seek: t.player.seek }} />

        <div className="flex flex-col gap-3">
          {video.episode && (
            <Link href={routes.series(locale)} className="inline-flex items-center gap-2 self-start text-[13px] font-bold">
              <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-series" />
              {t.nav.series} · <span className="font-latin">{pad2(video.episode)}/{pad2(episodes.length)}</span>
            </Link>
          )}
          <h1
            dir={isKab ? "ltr" : "rtl"}
            lang={video.lang}
            className={cn("self-start text-[clamp(26px,3vw,40px)] leading-tight font-bold", isKab ? "font-latin tracking-[-0.02em]" : "font-sans")}
          >{video.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <span lang={locale} className="font-bold text-ink">{sheikh.name[locale]}</span>
            <span aria-hidden="true">·</span>
            <span lang={locale}>{formatDate(video.publishedAt, locale)}</span>
            {video.captions?.includes("kab") && <Badge tone="kabyle" className="font-latin">CC · Taqbaylit</Badge>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">{t.video.share}</Button>
            <Button size="sm">{t.video.audioOnly}</Button>
          </div>
        </div>

        {(video.description || video.chapters) && (
          <section className="flex flex-col gap-4 rounded-[var(--radius-tile)] bg-card p-6" dir="rtl" lang="ar">
            {video.description && <p className="leading-relaxed">{video.description}</p>}
            {video.chapters && (
              <>
                <h2 lang={locale} dir="auto" className="text-sm font-bold text-muted">{t.video.chapters}</h2>
                <ol className="flex flex-col gap-2">
                  {video.chapters.map((c, i) => (
                    <li key={c.start} className="flex items-center gap-3">
                      <span className={cn("rounded-full px-2.5 py-1 font-latin text-xs font-bold", i === 1 ? "bg-accent" : "bg-paper")}>{c.start}</span>
                      <span className="font-semibold">{c.title}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>
        )}
      </div>

      <aside className="flex flex-col gap-4" dir="rtl" lang="ar">
        {next && (
          <Link href={routes.watch(locale, next.id)} className="relative isolate flex flex-col gap-1.5 overflow-hidden rounded-[var(--radius-tile)] bg-accent p-6 transition-transform hover:-translate-y-1">
            <OutlineNumeral value={pad2(next.episode!)} stroke="rgb(22 22 22 / .18)" className="-z-10 text-[150px]" />
            <span className="text-xs font-bold">
              {t.video.next} · <span className="font-latin">{next.duration}</span>
            </span>
            <span className="text-lg font-bold">{next.title}</span>
          </Link>
        )}
        {episodes.length > 0 && (
          <ol className="flex flex-col gap-1 rounded-[var(--radius-tile)] bg-card p-2">
            {episodes.map((e) => {
              const current = e.id === video.id;
              return (
                <li key={e.id}>
                  <Link
                    href={routes.watch(locale, e.id)}
                    aria-current={current ? "page" : undefined}
                    className={cn("grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3 rounded-xl p-2", current ? "bg-paper" : "hover:bg-paper/70")}
                  >
                    <span className={cn("grid aspect-video place-items-center rounded-lg font-latin text-xl font-extrabold", current ? "bg-accent text-ink" : "bg-series text-white")}>
                      {pad2(e.episode!)}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-bold">{e.title}</span>
                      <span dir="ltr" className="self-end font-latin text-xs text-muted">{e.duration}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </aside>
    </div>
  );
}
