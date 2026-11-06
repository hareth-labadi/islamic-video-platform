"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/icons";
import { usePanel } from "../../AdminContext";
import { api, isApiError, type AdminPlaylist, type AdminSeries, type AdminVideo, type ContentKind } from "../../api/client";
import { useAction, useQuery } from "../../api/hooks";
import { dirOf, markOf, thumbOf } from "../../lib/content";
import { pad2, slugify } from "../../lib/format";
import { EmptyState, MiniCover, PageHeader, Panel, Skeleton, StatusBadge } from "../../ui/display";
import { Counter, Field, Segmented, Select, TextArea, TextInput, Toggle, focusFirstError } from "../../ui/form";
import { PlusIcon, SpinnerIcon, TrashIcon } from "../../ui/icons";
import { UploadDrop, imageRule } from "../../ui/inputs";
import { ConfirmDialog, useToast } from "../../ui/overlay";
import { SortableList } from "../../ui/SortableList";
import { useUnsavedWarning } from "../../ui/useUnsavedWarning";
import { Block } from "./CollectionsScreen";
import { blank, fromPlaylist, fromSeries, toPlaylistInput, toSeriesInput, validate, type Errors, type Type, type Values } from "./collectionForm";
import { VideoPicker } from "./VideoPicker";

/** /admin/playlists/new?type=… and /admin/playlists/s-<id> | p-<id>. */
export function CollectionEditorScreen() {
  const { id: param } = useParams<{ id?: string }>();
  const query = useSearchParams();
  const { sheikh, t, routes } = usePanel();
  const type: Type = param ? (param.startsWith("p-") ? "playlist" : "series") : query.get("type") === "playlist" ? "playlist" : "series";
  const id = param?.slice(2);
  const existing = useQuery<AdminSeries | AdminPlaylist>(id ? `${type}:${id}` : null, () => (type === "series" ? api.series.get(id!) : api.playlists.get(id!)));

  if (id && existing.error)
    return (
      <div>
        <PageHeader title={t.collections.title} back={{ href: routes.collections(), label: t.collectionForm.backToList }} />
        <EmptyState emoji="🔎" title={isApiError(existing.error) && existing.error.code === "not_found" ? t.collectionForm.notFound : t.common.error} />
      </div>
    );
  if (id && !existing.data)
    return (
      <div className="flex flex-col gap-5" role="status">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-[520px] rounded-tile" />
      </div>
    );

  const initial = existing.data ? (type === "series" ? fromSeries(existing.data as AdminSeries) : fromPlaylist(existing.data as AdminPlaylist)) : blank(type, sheikh.id);
  return <Editor key={`${type}:${id ?? "new"}`} type={type} id={id} initial={initial} />;
}

function Editor({ type, id, initial }: { type: Type; id?: string; initial: Values }) {
  const { t, locale, sheikhs, routes } = usePanel();
  const router = useRouter();
  const toast = useToast();
  const [run, saving] = useAction();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);
  const [picker, setPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [failure, setFailure] = useState<string>();
  const form = useRef<HTMLFormElement>(null);

  const videosQ = useQuery(`videos:${values.sheikhId}:all`, () => api.videos.list({ sheikhId: values.sheikhId }));
  const othersQ = useQuery<Array<AdminSeries | AdminPlaylist>>(`${type}:list:${values.sheikhId}`, () => (type === "series" ? api.series.list(values.sheikhId) : api.playlists.list(values.sheikhId)));
  const seriesQ = useQuery(type === "series" ? `series:${values.sheikhId}` : null, () => api.series.list(values.sheikhId));
  const byId = useMemo(() => new Map((videosQ.data ?? []).map((v) => [v.id, v])), [videosQ.data]);
  const takenSlugs = (othersQ.data ?? []).filter((c) => c.id !== id).map((c) => c.slug);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  useUnsavedWarning(dirty && !saving, t.common.leaveConfirm);

  const patch = (changes: Partial<Values>) => {
    const next = { ...values, ...changes };
    setValues(next);
    if (submitted) setErrors(validate(next, type, t, takenSlugs));
  };

  const save = async (e?: FormEvent) => {
    e?.preventDefault();
    setSubmitted(true);
    const found = validate(values, type, t, takenSlugs);
    setErrors(found);
    setFailure(undefined);
    if (Object.keys(found).length) return focusFirstError(form.current);
    try {
      if (type === "series") {
        const input = toSeriesInput(values);
        const saved = await run(() => (id ? api.series.update(id, input) : api.series.create(input)));
        toast(id ? t.collectionForm.updated : t.collectionForm.created);
        if (!id) router.replace(routes.collection("series", saved.id));
      } else {
        const input = toPlaylistInput(values);
        const saved = await run(() => (id ? api.playlists.update(id, input) : api.playlists.create(input)));
        toast(id ? t.collectionForm.updated : t.collectionForm.created);
        if (!id) router.replace(routes.collection("playlist", saved.id));
      }
    } catch (err) {
      setFailure(isApiError(err) && err.code === "forbidden" ? t.common.forbidden : t.common.error);
    }
  };

  const isSeries = type === "series";
  const title = id ? (isSeries ? t.collectionForm.editSeries : t.collectionForm.editPlaylist) : isSeries ? t.collectionForm.newSeries : t.collectionForm.newPlaylist;
  const tone: ContentKind = isSeries ? "series" : values.kind;
  const items = values.items.map((vid) => byId.get(vid)).filter((v): v is AdminVideo => !!v);

  return (
    <form ref={form} noValidate onSubmit={save}>
      <PageHeader
        title={title}
        back={{ href: routes.collections(isSeries ? "series" : "playlists"), label: t.collectionForm.backToList }}
        actions={
          id && (
            <button type="button" onClick={() => setConfirmDelete(true)} className={cn(buttonClasses({ variant: "ghost", size: "sm" }), "text-[#B42318]")}>
              <TrashIcon size={16} />
              {t.common.delete}
            </button>
          )
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel title={t.collectionForm.about} id="about-title" bodyClassName="flex flex-col gap-5">
            <Field label={t.collectionForm.titleLabel} error={errors.title} aside={<Counter value={values.title} max={120} />}>
              <TextInput
                value={values.title}
                lang={values.lang}
                dir={dirOf(values.lang)}
                onChange={(e) => patch({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
                className="text-[16px] font-semibold"
              />
            </Field>
            <Field label={t.collectionForm.slug} error={errors.slug} hint={t.collectionForm.slugHint(`/${locale}/series/${values.slug || "…"}`)}>
              <TextInput
                dir="ltr"
                value={values.slug}
                placeholder="dalail-an-nubuwwa"
                onChange={(e) => {
                  setSlugTouched(true);
                  patch({ slug: e.target.value.toLowerCase().replace(/\s+/g, "-") });
                }}
                className="text-start font-latin"
              />
            </Field>
            {isSeries && (
              <Field label={t.collectionForm.tagline} optional={t.common.optional} error={errors.tagline} aside={<Counter value={values.tagline} max={120} />}>
                <TextInput value={values.tagline} lang={values.lang} dir={dirOf(values.lang)} onChange={(e) => patch({ tagline: e.target.value })} />
              </Field>
            )}
            <Field label={t.collectionForm.description} optional={isSeries ? undefined : t.common.optional} error={errors.description} aside={<Counter value={values.description} max={2000} />}>
              <TextArea rows={4} value={values.description} lang={values.lang} dir={dirOf(values.lang)} onChange={(e) => patch({ description: e.target.value })} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-[160px_minmax(0,1fr)]">
              <Field label={t.collectionForm.glyph} error={errors.glyph} hint={t.collectionForm.glyphHint}>
                <TextInput value={values.glyph} maxLength={4} onChange={(e) => patch({ glyph: e.target.value })} className="h-14 text-center font-sans text-3xl font-bold" />
              </Field>
              {isSeries ? (
                <Field label={t.collectionForm.lang} group>
                  <Segmented label={t.collectionForm.lang} value={values.lang} onChange={(v) => patch({ lang: v })} size="sm" options={(["ar", "kab", "fr"] as const).map((l) => ({ value: l, label: t.langs[l] }))} />
                </Field>
              ) : (
                <Field label={t.collectionForm.tone} group>
                  <Segmented
                    label={t.collectionForm.tone}
                    value={values.kind}
                    onChange={(v) => patch({ kind: v })}
                    size="sm"
                    options={(["mixed", "qa", "kabyle", "short"] as const).map((k) => ({ value: k, label: t.kinds[k], dotClass: { mixed: "bg-ink", qa: "bg-accent", kabyle: "bg-kabyle", short: "bg-short" }[k] }))}
                  />
                </Field>
              )}
            </div>
            <Field label={t.collectionForm.cover} optional={t.common.optional} hint={t.collectionForm.coverHint}>
              <UploadDrop
                value={values.coverUrl}
                onChange={(url) => setValues((v) => ({ ...v, coverUrl: url }))}
                purpose="cover"
                rule={imageRule}
                shape="wide"
                labels={t.upload}
                errors={{ type: t.validation.fileType, size: t.validation.fileSize(imageRule.maxMb) }}
              />
            </Field>
          </Panel>

          <Panel
            title={
              <span className="flex items-center gap-2">
                {isSeries ? t.collectionForm.episodes : t.collectionForm.videos}
                <span className="font-latin text-base font-extrabold text-stroke [--stroke:var(--color-ink)] [--stroke-width:1px]">{values.items.length}</span>
              </span>
            }
            id="items-title"
            aside={
              <button type="button" onClick={() => setPicker(true)} className={buttonClasses({ variant: "ink", size: "sm" })}>
                <PlusIcon size={16} />
                {t.collectionForm.addVideos}
              </button>
            }
          >
            <p id="reorder-hint" className="mb-4 text-[13px] text-muted">
              {isSeries ? t.collectionForm.reorderHint : t.collectionForm.reorderHintPlaylist}
            </p>
            {videosQ.pending ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-[68px]" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState emoji="🎞️" title={t.collectionForm.noItems} className="py-10" />
            ) : (
              <SortableList
                items={items}
                getId={(v) => v.id}
                onReorder={(next) => patch({ items: next.map((v) => v.id) })}
                hintId="reorder-hint"
                handleLabel={(v) => t.collectionForm.handle(v.title)}
                movedMessage={(v, pos) => t.collectionForm.moved(v.title, pos)}
                renderItem={(video, index, handle, dragging) => (
                  <div className={cn("flex items-center gap-2 rounded-2xl border border-line-soft bg-card p-2 pe-3 md:gap-3", dragging && "border-ink")}>
                    <button type="button" {...handle} />
                    {isSeries ? (
                      <span className="grid w-12 shrink-0 place-items-center" aria-hidden="true">
                        <span className="font-latin text-[30px] leading-none font-extrabold tracking-[-0.05em] text-stroke [--stroke-width:1.2px] [--stroke:var(--color-series)]">{pad2(index + 1)}</span>
                      </span>
                    ) : (
                      <span className="w-6 shrink-0 text-center font-latin text-xs font-bold text-muted">{index + 1}</span>
                    )}
                    <MiniCover kind={video.kind} mark={isSeries ? pad2(index + 1) : markOf(video)} image={thumbOf(video)} className="hidden w-20 text-[13px] sm:flex" />
                    <div className="min-w-0 flex-1">
                      <p lang={video.lang} dir={dirOf(video.lang)} className="truncate text-[14.5px] font-bold">
                        {video.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 font-latin text-xs text-muted">
                        {video.duration}
                        {video.status === "draft" && <StatusBadge status="draft" label={t.status.draft} className="h-5 font-sans" />}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => patch({ items: values.items.filter((x) => x !== video.id) })}
                      aria-label={`${t.collectionForm.removeItem}: ${video.title}`}
                      className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-paper hover:text-ink"
                    >
                      <CloseIcon size={16} />
                    </button>
                  </div>
                )}
              />
            )}
          </Panel>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
          <div className="relative overflow-visible rounded-tile bg-card">
            <Block kind={tone} glyph={values.glyph || "؟"} cover={values.coverUrl} />
            <div className="p-4">
              <p lang={values.lang} dir={dirOf(values.lang)} className="line-clamp-2 text-lg leading-snug font-bold">
                {values.title || t.collectionForm.titleLabel}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted">
                {isSeries ? t.collections.episodesOf(values.items.length, Number(values.plannedCount) || 0) : t.collections.items(values.items.length)}
              </p>
            </div>
          </div>

          <Panel bodyClassName="flex flex-col gap-5">
            <Field label={t.collectionForm.visibility} group compact>
              <Segmented
                label={t.collectionForm.visibility}
                value={values.visibility}
                onChange={(v) => patch({ visibility: v })}
                size="sm"
                options={[
                  { value: "draft", label: t.status.draft },
                  { value: "published", label: t.status.published },
                ]}
              />
            </Field>
            {sheikhs.length > 1 && !id && (
              <Field label={t.collectionForm.sheikh} compact>
                <Select value={values.sheikhId} onChange={(e) => patch({ sheikhId: e.target.value, items: [] })} className="h-11">
                  {sheikhs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name[locale]}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            {isSeries && (
              <>
                <Field label={t.collectionForm.planned} compact error={errors.plannedCount}>
                  <TextInput type="number" min={1} inputMode="numeric" value={values.plannedCount} onChange={(e) => patch({ plannedCount: e.target.value })} className="h-11 font-latin" />
                </Field>
                <Field label={t.collectionForm.progress} group compact>
                  <Segmented
                    label={t.collectionForm.progress}
                    value={values.progress}
                    onChange={(v) => patch({ progress: v })}
                    size="sm"
                    options={[
                      { value: "ongoing", label: t.status.ongoing },
                      { value: "complete", label: t.status.complete },
                    ]}
                  />
                </Field>
                <Toggle checked={values.featured} onChange={(v) => patch({ featured: v })} label={t.collectionForm.featured} />
              </>
            )}
          </Panel>
        </aside>
      </div>

      <div className="sticky bottom-3 z-20 mt-6 flex flex-wrap items-center gap-3 rounded-full bg-ink p-2 ps-5 text-white shadow-[0_18px_40px_-20px_rgb(22_22_22/.8)]">
        <span className="me-auto text-[13px] font-semibold text-white/75" aria-live="polite">
          {failure ? <span className="text-accent">{failure}</span> : dirty ? t.common.unsaved : ""}
        </span>
        <button type="submit" disabled={saving} className={buttonClasses({ variant: "accent" })}>
          {saving && <SpinnerIcon size={16} />}
          {t.common.save}
        </button>
      </div>

      <VideoPicker
        open={picker}
        onClose={() => setPicker(false)}
        videos={videosQ.data ?? []}
        exclude={values.items}
        seriesTitles={new Map((seriesQ.data ?? []).filter((s) => s.id !== id).map((s) => [s.id, s.title]))}
        onAdd={(ids) => {
          patch({ items: [...values.items, ...ids] });
          setPicker(false);
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t.collectionForm.deleteTitle}
        body={t.collectionForm.deleteBody}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        busy={saving}
        onConfirm={async () => {
          if (!id) return;
          try {
            await run(() => (isSeries ? api.series.remove(id) : api.playlists.remove(id)));
            toast(t.collectionForm.deleted);
            router.replace(routes.collections(isSeries ? "series" : "playlists"));
          } catch {
            toast(t.common.error, "error");
          }
        }}
      />
    </form>
  );
}
