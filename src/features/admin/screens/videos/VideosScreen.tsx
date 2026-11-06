"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { usePanel } from "../../AdminContext";
import { api, type AdminVideo, type PublishStatus } from "../../api/client";
import { useAction, useNow, useQuery } from "../../api/hooks";
import { dirOf, isScheduled, markOf, thumbOf } from "../../lib/content";
import { relativeTime, formatDate } from "../../lib/format";
import { Avatar, Dot, EmptyState, ErrorNote, ListSkeleton, MiniCover, PageHeader, StatusBadge } from "../../ui/display";
import { Segmented, Select } from "../../ui/form";
import { DotsIcon, EyeIcon, EyeOffIcon, ExternalIcon, PlusIcon, TrashIcon } from "../../ui/icons";
import { SearchField } from "../../ui/inputs";
import { ConfirmDialog, MenuItem, Popover, useToast } from "../../ui/overlay";

type StatusFilter = "all" | PublishStatus;

export function VideosScreen() {
  const { t, locale, sheikh, sheikhs, routes } = usePanel();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>(params.get("status") === "draft" ? "draft" : params.get("status") === "published" ? "published" : "all");
  const [collection, setCollection] = useState("");
  const [sheikhFilter, setSheikhFilter] = useState<string>(sheikh.id);
  const query = useDeferredValue(q);

  // Follow the header's sheikh switcher.
  const [lastSheikh, setLastSheikh] = useState(sheikh.id);
  if (lastSheikh !== sheikh.id) {
    setLastSheikh(sheikh.id);
    setSheikhFilter(sheikh.id);
    setCollection("");
  }

  const filter = { sheikhId: sheikhFilter || undefined, status: status === "all" ? undefined : status, collection: collection || undefined, q: query || undefined };
  const videos = useQuery(`videos:${JSON.stringify(filter)}`, () => api.videos.list(filter), { keepPrevious: true });
  const seriesQ = useQuery(`series:${sheikhFilter || sheikh.id}`, () => api.series.list(sheikhFilter || sheikh.id));
  const playlistsQ = useQuery(`playlists:${sheikhFilter || sheikh.id}`, () => api.playlists.list(sheikhFilter || sheikh.id));
  const seriesTitle = (id?: string) => seriesQ.data?.find((s) => s.id === id)?.title;

  const filtered = !!(q || status !== "all" || collection || sheikhFilter !== sheikh.id);

  return (
    <div>
      <PageHeader
        title={t.videos.title}
        count={videos.data?.length}
        actions={
          <Link href={routes.newVideo()} className={buttonClasses({ variant: "accent" })}>
            <PlusIcon size={18} />
            {t.videos.new}
          </Link>
        }
      />

      <div className="mb-5 flex flex-col gap-3 rounded-tile bg-card p-3 md:p-4 lg:flex-row lg:items-center">
        <SearchField value={q} onChange={setQ} placeholder={t.videos.searchPlaceholder} label={t.common.search} className="lg:flex-1" />
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label={t.videos.statusFilter}
            value={status}
            onChange={setStatus}
            size="sm"
            options={[
              { value: "all", label: t.common.all },
              { value: "published", label: t.status.published },
              { value: "draft", label: t.status.draft },
            ]}
          />
          <div className="w-full sm:w-56">
            <Select aria-label={t.videos.collection} value={collection} onChange={(e) => setCollection(e.target.value)} className="h-10 rounded-full text-[13.5px]">
              <option value="">{t.videos.allCollections}</option>
              <option value="none">{t.videos.noCollection}</option>
              {!!seriesQ.data?.length && (
                <optgroup label={t.videos.seriesGroup}>
                  {seriesQ.data.map((s) => (
                    <option key={s.id} value={`series:${s.id}`}>
                      {s.title}
                    </option>
                  ))}
                </optgroup>
              )}
              {!!playlistsQ.data?.length && (
                <optgroup label={t.videos.playlistsGroup}>
                  {playlistsQ.data.map((p) => (
                    <option key={p.id} value={`playlist:${p.id}`}>
                      {p.title}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
          </div>
          {sheikhs.length > 1 && (
            <div className="w-full sm:w-52">
              <Select
                aria-label={t.videos.sheikh}
                value={sheikhFilter}
                onChange={(e) => {
                  setSheikhFilter(e.target.value);
                  setCollection("");
                }}
                className="h-10 rounded-full text-[13.5px]"
              >
                <option value="">{t.videos.allSheikhs}</option>
                {sheikhs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name[locale]}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 flex min-h-6 items-center justify-between gap-3 px-1 text-[13px] font-semibold text-subtle" aria-live="polite">
        <span>{videos.data && t.videos.results(videos.data.length)}</span>
        {filtered && (
          <button
            type="button"
            className="underline-offset-4 hover:text-ink hover:underline"
            onClick={() => {
              setQ("");
              setStatus("all");
              setCollection("");
              setSheikhFilter(sheikh.id);
            }}
          >
            {t.videos.resetFilters}
          </button>
        )}
      </div>

      {videos.error ? (
        <ErrorNote>{t.common.error}</ErrorNote>
      ) : videos.pending ? (
        <ListSkeleton />
      ) : videos.data?.length === 0 ? (
        <EmptyState emoji={filtered ? "🔍" : "🎬"} title={filtered ? t.videos.empty : t.videos.emptyAll}>
          {!filtered && (
            <Link href={routes.newVideo()} className={buttonClasses({ variant: "accent", size: "sm" })}>
              <PlusIcon size={16} />
              {t.videos.new}
            </Link>
          )}
        </EmptyState>
      ) : (
        <ul className={cn("flex flex-col gap-2.5 transition-opacity", videos.loading && "opacity-60")}>
          {videos.data?.map((video) => (
            <VideoRow key={video.id} video={video} seriesTitle={seriesTitle(video.seriesId)} showSheikh={!sheikhFilter && sheikhs.length > 1} />
          ))}
        </ul>
      )}
    </div>
  );
}

function VideoRow({ video, seriesTitle, showSheikh }: { video: AdminVideo; seriesTitle?: string; showSheikh: boolean }) {
  const { t, locale, routes, sheikhs } = usePanel();
  const now = useNow();
  const toast = useToast();
  const [run, busy] = useAction();
  const [confirm, setConfirm] = useState(false);
  const owner = sheikhs.find((s) => s.id === video.sheikhId);
  const scheduled = isScheduled(video);

  const setStatus = async (status: PublishStatus) => {
    try {
      await run(() => api.videos.setStatus(video.id, status));
      toast(status === "published" ? t.videos.publishedToast : t.videos.unpublishedToast);
    } catch {
      toast(t.common.error, "error");
    }
  };

  return (
    <li className="group relative flex items-center gap-3 rounded-tile bg-card p-2.5 pe-3 transition-shadow hover:shadow-[0_10px_30px_-18px_rgb(22_22_22/.45)] md:gap-4 md:p-3 md:pe-4">
      <MiniCover kind={video.kind} mark={markOf(video)} image={thumbOf(video)} chip={video.duration} className="w-28 text-[15px] md:w-40 md:text-[19px]" />
      <div className="min-w-0 flex-1">
        <Link href={routes.video(video.id)} className="after:absolute after:inset-0 after:rounded-tile">
          <span lang={video.lang} dir={dirOf(video.lang)} className="line-clamp-2 text-[15px] leading-snug font-bold md:text-base">
            {video.title}
          </span>
        </Link>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] font-semibold text-muted">
          <Dot kind={video.kind} />
          {seriesTitle ? (
            <span className="text-subtle">
              {seriesTitle} · {t.videos.episode(video.episode ?? 0)}
            </span>
          ) : (
            <span>{t.kinds[video.kind]}</span>
          )}
          <span aria-hidden="true">·</span>
          <span>{video.status === "draft" ? (now ? relativeTime(video.updatedAt, locale, t, now) : "") : formatDate(video.publishedAt, locale)}</span>
          {video.topics.length > 0 && (
            <span className="hidden truncate sm:inline">
              <span aria-hidden="true">· </span>
              {video.topics.slice(0, 3).join("، ")}
            </span>
          )}
        </p>
      </div>
      {showSheikh && owner && <Avatar name={owner.name[locale]} monogram={owner.monogram} photo={owner.photo} size={30} tone="accent" className="relative hidden sm:inline-flex" />}
      <StatusBadge status={scheduled ? "scheduled" : video.status} label={scheduled ? t.status.scheduled : t.status[video.status]} className="relative hidden sm:inline-flex" />
      <div className="relative">
        <Popover
          trigger={({ toggle, ...aria }) => (
            <button type="button" {...aria} onClick={toggle} disabled={busy} aria-label={`${t.common.more}: ${video.title}`} className="grid size-10 place-items-center rounded-full hover:bg-paper">
              <DotsIcon size={20} />
            </button>
          )}
        >
          {(close) => (
            <>
              {video.status === "draft" ? (
                <MenuItem
                  onSelect={() => {
                    close();
                    void setStatus("published");
                  }}
                >
                  <EyeIcon size={18} />
                  {t.videos.publish}
                </MenuItem>
              ) : (
                <MenuItem
                  onSelect={() => {
                    close();
                    void setStatus("draft");
                  }}
                >
                  <EyeOffIcon size={18} />
                  {t.videos.unpublish}
                </MenuItem>
              )}
              {video.status === "published" && (
                <a href={`/${locale}/watch/${video.id}`} target="_blank" rel="noreferrer" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-paper">
                  <ExternalIcon size={18} />
                  {t.common.viewSite}
                </a>
              )}
              <MenuItem
                danger
                onSelect={() => {
                  close();
                  setConfirm(true);
                }}
              >
                <TrashIcon size={18} />
                {t.common.delete}
              </MenuItem>
            </>
          )}
        </Popover>
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t.videos.deleteTitle}
        body={t.videos.deleteBody}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        busy={busy}
        onConfirm={async () => {
          try {
            await run(() => api.videos.remove(video.id));
            setConfirm(false);
            toast(t.videos.deleted);
          } catch {
            toast(t.common.error, "error");
          }
        }}
      />
    </li>
  );
}
