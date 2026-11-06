"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { tones } from "@/lib/tones";
import { buttonClasses } from "@/components/ui/Button";
import { Sticker } from "@/components/ui/Sticker";
import { usePanel } from "../../AdminContext";
import { api, type AdminPlaylist, type AdminSeries } from "../../api/client";
import { useQuery } from "../../api/hooks";
import { dirOf } from "../../lib/content";
import { ErrorNote, PageHeader, Skeleton, StatusBadge } from "../../ui/display";
import { Segmented } from "../../ui/form";
import { PlusIcon } from "../../ui/icons";

export function CollectionsScreen() {
  const { t, sheikh, routes } = usePanel();
  const router = useRouter();
  const tab = useSearchParams().get("tab") === "playlists" ? "playlists" : "series";
  const seriesQ = useQuery(`series:${sheikh.id}`, () => api.series.list(sheikh.id), { keepPrevious: true });
  const playlistsQ = useQuery(`playlists:${sheikh.id}`, () => api.playlists.list(sheikh.id), { keepPrevious: true });
  const active = tab === "series" ? seriesQ : playlistsQ;

  return (
    <div>
      <PageHeader
        title={t.collections.title}
        count={(seriesQ.data?.length ?? 0) + (playlistsQ.data?.length ?? 0) || undefined}
        actions={
          <>
            <Link href={routes.newCollection("series")} className={buttonClasses({ variant: "accent" })}>
              <PlusIcon size={18} />
              {t.collections.newSeries}
            </Link>
            <Link href={routes.newCollection("playlist")} className={buttonClasses({ variant: "outline" })}>
              <PlusIcon size={18} />
              {t.collections.newPlaylist}
            </Link>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Segmented
          label={t.collections.title}
          value={tab}
          onChange={(v) => router.replace(routes.collections(v), { scroll: false })}
          options={[
            { value: "series", label: `${t.collections.series} · ${seriesQ.data?.length ?? "–"}`, dotClass: "bg-series" },
            { value: "playlists", label: `${t.collections.playlists} · ${playlistsQ.data?.length ?? "–"}`, dotClass: "bg-kabyle" },
          ]}
        />
        <p className="text-[13.5px] text-subtle">{tab === "series" ? t.collections.seriesHint : t.collections.playlistHint}</p>
      </div>

      {active.error ? (
        <ErrorNote>{t.common.error}</ErrorNote>
      ) : active.pending ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-tile" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {tab === "series" ? seriesQ.data?.map((s) => <SeriesTile key={s.id} series={s} />) : playlistsQ.data?.map((p) => <PlaylistTile key={p.id} playlist={p} />)}
          <li>
            <Link
              href={routes.newCollection(tab === "series" ? "series" : "playlist")}
              className="flex h-full min-h-56 flex-col items-center justify-center gap-3 rounded-tile border-[1.5px] border-dashed border-ink/30 p-6 text-center font-bold text-subtle transition-colors hover:border-ink hover:bg-card hover:text-ink"
            >
              <span className="grid size-12 place-items-center rounded-full bg-ink text-white">
                <PlusIcon size={22} />
              </span>
              {tab === "series" ? t.collections.newSeries : t.collections.newPlaylist}
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}

function SeriesTile({ series }: { series: AdminSeries }) {
  const { t, routes } = usePanel();
  const count = series.episodeIds.length;
  return (
    <li>
      <Link href={routes.collection("series", series.id)} className="group relative flex h-full flex-col overflow-visible rounded-tile bg-card transition-shadow hover:shadow-[0_18px_40px_-24px_rgb(22_22_22/.55)]">
        <Block kind="series" glyph={series.glyph} cover={series.coverUrl} />
        {series.featured && <Sticker emoji="⭐" label={t.collections.featured} tone="accent" tilt={-5} className="absolute -top-3 end-4" />}
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="flex items-center gap-2">
            <StatusBadge status={series.visibility} label={t.status[series.visibility]} />
            <span className="rounded-full bg-paper px-2.5 py-1 text-[11.5px] font-bold">{t.status[series.status]}</span>
          </div>
          <h3 lang={series.lang} dir={dirOf(series.lang)} className="text-xl leading-snug font-bold">
            {series.title}
          </h3>
          {series.tagline && <p className="line-clamp-1 text-sm text-subtle">{series.tagline}</p>}
          <div className="mt-auto pt-3">
            <div className="mb-1.5 flex justify-between text-xs font-semibold text-muted">
              <span>{t.collections.episodesOf(count, series.plannedCount)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-paper">
              <div className="h-full rounded-full bg-series" style={{ width: `${Math.min(100, (count / Math.max(1, series.plannedCount)) * 100)}%` }} />
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

function PlaylistTile({ playlist }: { playlist: AdminPlaylist }) {
  const { t, routes } = usePanel();
  return (
    <li>
      <Link href={routes.collection("playlist", playlist.id)} className="group relative flex h-full flex-col rounded-tile bg-card transition-shadow hover:shadow-[0_18px_40px_-24px_rgb(22_22_22/.55)]">
        <Block kind={playlist.kind} glyph={playlist.glyph} cover={playlist.coverUrl} />
        <div className="flex flex-1 flex-col gap-2 p-5">
          <StatusBadge status={playlist.visibility} label={t.status[playlist.visibility]} className="self-start" />
          <h3 className="text-xl leading-snug font-bold">{playlist.title}</h3>
          {playlist.description && <p className="line-clamp-1 text-sm text-subtle">{playlist.description}</p>}
          <p className="mt-auto pt-3 text-xs font-semibold text-muted">{t.collections.items(playlist.videoIds.length)}</p>
        </div>
      </Link>
    </li>
  );
}

/** Colour block with the giant outlined glyph, or the cover image. */
export function Block({ kind, glyph, cover, className }: { kind: keyof typeof tones; glyph: string; cover?: string; className?: string }) {
  const tone = tones[kind];
  return (
    <div className={cn("relative aspect-[16/9] overflow-hidden rounded-t-tile", tone.bg, tone.fg, className)}>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="absolute -bottom-4 end-3 font-sans text-[130px] leading-none font-bold tracking-[-0.04em] text-stroke [--stroke-width:1.5px]"
          style={{ ["--stroke" as string]: tone.stroke }}
        >
          {glyph}
        </span>
      )}
    </div>
  );
}
