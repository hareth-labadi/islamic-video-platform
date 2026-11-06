"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { usePanel } from "../../AdminContext";
import { api, isApiError, type AdminVideo, type ContentKind, type PublishStatus } from "../../api/client";
import { useAction, useQuery } from "../../api/hooks";
import { dirOf, markOf } from "../../lib/content";
import { clock, formatDate, megabytes, todayISO } from "../../lib/format";
import { parseYouTubeId, youTubeThumb } from "../../lib/links";
import { Dot, EmptyState, MiniCover, PageHeader, Panel, Skeleton, StatusBadge } from "../../ui/display";
import { Counter, Field, Segmented, Select, TextArea, TextInput, focusFirstError } from "../../ui/form";
import { FilmIcon, SpinnerIcon, UploadIcon } from "../../ui/icons";
import { TagInput, UploadDrop, checkFile, imageRule, videoRule } from "../../ui/inputs";
import { useToast } from "../../ui/overlay";
import { useUnsavedWarning } from "../../ui/useUnsavedWarning";
import { limits } from "../../rules";
import { toForm, toInput, validate, type Errors, type FormValues } from "./videoForm";

/** /admin/videos/new and /admin/videos/[id]. */
export function VideoEditorScreen() {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id || id === "new";
  const { t, sheikh, routes } = usePanel();
  const params = useSearchParams();
  const video = useQuery(isNew ? null : `video:${id}`, () => api.videos.get(id!));

  if (!isNew && video.error) {
    return (
      <div>
        <PageHeader title={t.videoForm.editTitle} back={{ href: routes.videos, label: t.videoForm.backToList }} />
        <EmptyState emoji="🔎" title={isApiError(video.error) && video.error.code === "not_found" ? t.videoForm.notFound : t.common.error} />
      </div>
    );
  }
  if (!isNew && !video.data) return <EditorSkeleton />;
  return <VideoForm key={video.data?.id ?? "new"} video={video.data} initial={toForm(video.data, sheikh.id, params.get("series") ?? undefined)} />;
}

function EditorSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]" role="status">
      <div className="flex flex-col gap-5">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-64 rounded-tile" />
        <Skeleton className="h-96 rounded-tile" />
      </div>
      <Skeleton className="h-[480px] rounded-tile" />
    </div>
  );
}

function VideoForm({ video, initial }: { video?: AdminVideo; initial: FormValues }) {
  const { t, locale, sheikhs, routes } = usePanel();
  const router = useRouter();
  const toast = useToast();
  const [run, saving] = useAction();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [failure, setFailure] = useState<string>();
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const seriesQ = useQuery(`series:${values.sheikhId}`, () => api.series.list(values.sheikhId));
  const topicsQ = useQuery(`topics:${values.sheikhId}`, () => api.videos.topics(values.sheikhId));
  const series = seriesQ.data?.find((s) => s.id === values.seriesId);
  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(initial), [values, initial]);
  useUnsavedWarning(dirty && !saving, t.common.leaveConfirm);

  /** Applies changes from an event handler (re-validates once the form was submitted). */
  const patch = (changes: Partial<FormValues>) => {
    const next = { ...values, ...changes };
    setValues(next);
    if (submitted) setErrors(validate(next, t, seriesQ.data?.find((s) => s.id === next.seriesId), video?.id));
  };
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => patch({ [key]: value } as Partial<FormValues>);
  /** For async results (upload done, file length read): merges into the latest values. */
  const patchLater = (changes: Partial<FormValues>) => setValues((v) => ({ ...v, ...changes }));

  const nextEpisode = series ? series.episodeIds.filter((x) => x !== video?.id).length + 1 : undefined;
  const youtubeId = values.sourceKind === "youtube" ? parseYouTubeId(values.youtubeUrl) : null;
  const previewImage = values.thumbnail ?? (youtubeId && !/DemoAb$/.test(youtubeId) ? youTubeThumb(youtubeId) : undefined);
  const scheduled = values.status === "published" && values.publishedAt > todayISO();

  const save = async (status: PublishStatus) => {
    const next = { ...values, status };
    setValues(next);
    setSubmitted(true);
    const found = validate(next, t, series, video?.id);
    setErrors(found);
    setFailure(undefined);
    if (Object.keys(found).length) {
      focusFirstError(form.current);
      return;
    }
    try {
      const saved = await run(() => (video ? api.videos.update(video.id, toInput(next)) : api.videos.create(toInput(next))));
      toast(video ? t.videoForm.updated : t.videoForm.created);
      if (!video) router.replace(routes.video(saved.id));
    } catch (e) {
      if (isApiError(e) && e.fields?.episode) {
        setErrors((x) => ({ ...x, episode: t.validation.episodeTaken(Number(next.episode)) }));
        focusFirstError(form.current);
      } else setFailure(isApiError(e) && e.code === "forbidden" ? t.common.forbidden : t.common.error);
    }
  };

  const pickVideoFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = checkFile(file, videoRule);
    if (problem) {
      setErrors((x) => ({ ...x, upload: problem === "type" ? t.validation.fileType : t.validation.fileSize(videoRule.maxMb) }));
      return;
    }
    setErrors((x) => ({ ...x, upload: undefined }));
    // Read the length from the file itself.
    const probe = document.createElement("video");
    const local = URL.createObjectURL(file);
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      if (Number.isFinite(probe.duration)) patchLater({ duration: clock(probe.duration) });
      URL.revokeObjectURL(local);
    };
    probe.src = local;
    setUploadPct(0);
    try {
      const result = await api.uploads.create(file, "video", setUploadPct);
      patchLater({ upload: { url: result.url, fileName: file.name, sizeBytes: file.size } });
    } catch {
      setErrors((x) => ({ ...x, upload: t.common.error }));
    } finally {
      setUploadPct(null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void save(values.status);
  };

  const kinds: ContentKind[] = ["mixed", "qa", "kabyle", "series"];

  return (
    <form ref={form} noValidate onSubmit={onSubmit}>
      <PageHeader
        title={video ? t.videoForm.editTitle : t.videoForm.newTitle}
        back={{ href: routes.videos, label: t.videoForm.backToList }}
        actions={video && <StatusBadge status={video.status} label={t.status[video.status]} />}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel title={t.videoForm.source} id="source-title">
            <Segmented
              label={t.videoForm.source}
              value={values.sourceKind}
              onChange={(v) => set("sourceKind", v)}
              options={[
                { value: "youtube", label: t.videoForm.youtube },
                { value: "upload", label: t.videoForm.upload },
              ]}
              className="mb-5"
            />
            {values.sourceKind === "youtube" ? (
              <Field label={t.videoForm.youtubeLabel} hint={youtubeId ? undefined : t.videoForm.youtubeHint} error={errors.youtubeUrl}>
                <TextInput dir="ltr" inputMode="url" placeholder="https://www.youtube.com/watch?v=…" value={values.youtubeUrl} onChange={(e) => set("youtubeUrl", e.target.value)} className="text-start font-latin" />
                {youtubeId && (
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-series">
                    <CheckIcon size={15} />
                    {t.videoForm.youtubeFound(youtubeId)}
                  </p>
                )}
              </Field>
            ) : (
              <Field label={t.videoForm.upload} error={errors.upload} group>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void pickVideoFile(e.dataTransfer.files[0]);
                  }}
                  className={cn("flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-dashed px-6 py-8 text-center", errors.upload ? "border-[#B42318]" : "border-line bg-paper/60")}
                >
                  {values.upload ? (
                    <>
                      <span className="grid size-12 place-items-center rounded-full bg-series text-white">
                        <FilmIcon size={22} />
                      </span>
                      <p className="font-latin text-sm font-bold" dir="ltr">
                        {values.upload.fileName ?? values.upload.url}
                      </p>
                      {values.upload.sizeBytes && <p className="font-latin text-xs text-muted">{megabytes(values.upload.sizeBytes)}</p>}
                    </>
                  ) : (
                    <span className="grid size-12 place-items-center rounded-full bg-ink text-white">
                      <UploadIcon size={22} />
                    </span>
                  )}
                  {uploadPct !== null ? (
                    <div className="w-full max-w-xs">
                      <p className="mb-2 text-sm font-semibold">{t.videoForm.uploading(uploadPct)}</p>
                      <div className="h-2 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={uploadPct} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${uploadPct}%` }} />
                      </div>
                    </div>
                  ) : (
                    <>
                      {!values.upload && <p className="text-sm font-semibold">{t.videoForm.uploadDrop}</p>}
                      <button type="button" onClick={() => videoInput.current?.click()} className={buttonClasses({ variant: values.upload ? "outline" : "ink", size: "sm" })} aria-describedby={errors.upload ? "upload-error" : undefined}>
                        {values.upload ? t.videoForm.replaceFile : t.upload.choose}
                      </button>
                      <p className="text-xs text-muted">{t.videoForm.uploadHint}</p>
                    </>
                  )}
                  <input ref={videoInput} type="file" accept={videoRule.accept} className="sr-only" tabIndex={-1} onChange={(e) => void pickVideoFile(e.target.files?.[0]).finally(() => (e.target.value = ""))} />
                </div>
              </Field>
            )}
          </Panel>

          <Panel title={t.videoForm.details} id="details-title" bodyClassName="flex flex-col gap-5">
            <Field label={t.videoForm.titleLabel} error={errors.title} aside={<Counter value={values.title} max={limits.video.title} />}>
              <TextInput value={values.title} onChange={(e) => set("title", e.target.value)} lang={values.lang} dir={dirOf(values.lang)} className="text-[16px] font-semibold" />
            </Field>
            <Field label={t.videoForm.summary} optional={t.common.optional} hint={t.videoForm.summaryHint} error={errors.summary} aside={<Counter value={values.summary} max={limits.video.summary} />}>
              <TextInput value={values.summary} onChange={(e) => set("summary", e.target.value)} lang={values.lang} dir={dirOf(values.lang)} />
            </Field>
            <Field label={t.videoForm.description} optional={t.common.optional} error={errors.description} aside={<Counter value={values.description} max={limits.video.description} />}>
              <TextArea rows={6} value={values.description} onChange={(e) => set("description", e.target.value)} lang={values.lang} dir={dirOf(values.lang)} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t.videoForm.lang} group>
                <Segmented
                  label={t.videoForm.lang}
                  value={values.lang}
                  onChange={(v) => set("lang", v)}
                  size="sm"
                  options={(["ar", "kab", "fr"] as const).map((l) => ({ value: l, label: t.langs[l] }))}
                />
              </Field>
              <Field label={t.videoForm.duration} optional={values.sourceKind === "youtube" ? t.common.optional : undefined} hint={t.videoForm.durationHint} error={errors.duration}>
                <TextInput dir="ltr" inputMode="numeric" placeholder="18:42" value={values.duration} onChange={(e) => set("duration", e.target.value)} className="text-start font-latin" />
              </Field>
            </div>
            {!values.seriesId && (
              <Field label={t.videoForm.kind} hint={t.videoForm.kindHint} group>
                <Segmented
                  label={t.videoForm.kind}
                  value={values.kind === "series" ? "mixed" : values.kind}
                  onChange={(v) => set("kind", v)}
                  size="sm"
                  options={kinds
                    .filter((k) => k !== "series")
                    .map((k) => ({ value: k, label: t.kinds[k], dotClass: k === "mixed" ? "bg-ink" : k === "qa" ? "bg-accent" : "bg-kabyle" }))}
                />
              </Field>
            )}
            <Field label={t.videoForm.topics} optional={t.common.optional} hint={t.videoForm.topicsHint} error={errors.topics}>
              <TagInput value={values.topics} onChange={(v) => set("topics", v)} suggestions={topicsQ.data} placeholder={t.videoForm.topicsPlaceholder} max={limits.video.topics} removeLabel={(tag) => `${t.common.remove}: ${tag}`} />
            </Field>
          </Panel>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
          <Panel title={t.videoForm.publishing} id="publishing-title" bodyClassName="flex flex-col gap-4">
            <Field label={t.videoForm.status} group compact>
              <Segmented
                label={t.videoForm.status}
                value={values.status}
                onChange={(v) => set("status", v)}
                size="sm"
                options={[
                  { value: "draft", label: t.status.draft },
                  { value: "published", label: t.status.published },
                ]}
              />
            </Field>
            <Field label={t.videoForm.publishedAt} compact error={errors.publishedAt} hint={scheduled ? t.videoForm.scheduledHint(formatDate(values.publishedAt, locale)) : undefined}>
              <TextInput type="date" value={values.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} className="h-11 font-latin" />
            </Field>
          </Panel>

          <Panel title={t.videoForm.placement} id="placement-title" bodyClassName="flex flex-col gap-4">
            {sheikhs.length > 1 && (
              <Field label={t.videoForm.sheikh} compact>
                <Select
                  value={values.sheikhId}
                  onChange={(e) => patch({ sheikhId: e.target.value, seriesId: "", episode: "", sectionId: "" })}
                  className="h-11"
                >
                  {sheikhs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name[locale]}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label={t.videoForm.series} compact>
              <Select
                value={values.seriesId}
                onChange={(e) => {
                  const id = e.target.value;
                  const chosen = seriesQ.data?.find((s) => s.id === id);
                  patch({
                    seriesId: id,
                    episode: chosen ? String(chosen.episodeIds.filter((x) => x !== video?.id).length + 1) : "",
                    // New episodes usually continue the last section.
                    sectionId: chosen?.sections.at(-1)?.id ?? "",
                    ...(chosen ? { lang: chosen.lang } : {}),
                  });
                }}
                className="h-11"
              >
                <option value="">{t.videoForm.noSeries}</option>
                {seriesQ.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </Select>
            </Field>
            {values.seriesId && (
              <Field label={t.videoForm.episode} compact error={errors.episode} hint={nextEpisode ? t.videoForm.nextEpisode(nextEpisode) : undefined}>
                <TextInput type="number" min={1} inputMode="numeric" value={values.episode} onChange={(e) => set("episode", e.target.value)} className="h-11 font-latin" />
              </Field>
            )}
            {series && series.sections.length > 0 && (
              <Field label={t.videoForm.section} compact optional={t.common.optional}>
                <Select value={values.sectionId} onChange={(e) => set("sectionId", e.target.value)} className="h-11">
                  <option value="">{t.videoForm.noSection}</option>
                  {series.sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </Panel>

          <Panel title={t.videoForm.thumbnail} id="thumb-title" bodyClassName="flex flex-col gap-3">
            <Field label={t.videoForm.thumbnail} compact optional={t.common.optional} hint={!values.thumbnail && !previewImage ? t.videoForm.brandedCover : undefined}>
              <UploadDrop
                value={values.thumbnail}
                onChange={(url) => set("thumbnail", url)}
                purpose="thumbnail"
                rule={imageRule}
                labels={{ ...t.upload, hint: t.videoForm.thumbnailHint }}
                errors={{ type: t.validation.fileType, size: t.validation.fileSize(imageRule.maxMb) }}
              />
            </Field>
          </Panel>

          <section aria-label={t.videoForm.preview} className="rounded-tile border-[1.5px] border-dashed border-ink/30 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold text-muted">
              <span className="size-1.5 rounded-full bg-fresh ring-2 ring-series/40" />
              {t.videoForm.preview}
            </p>
            <MiniCover kind={values.seriesId ? "series" : values.kind} mark={markOf({ kind: values.seriesId ? "series" : values.kind, episode: values.seriesId ? Number(values.episode) || undefined : undefined })} image={previewImage} chip={values.duration || undefined} className="w-full text-[34px]" />
            <p lang={values.lang} dir={dirOf(values.lang)} className="mt-3 line-clamp-2 text-[15px] leading-snug font-bold">
              {values.title || t.videoForm.titleLabel}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Dot kind={values.seriesId ? "series" : values.kind} />
              {series ? `${series.title} · ${t.videos.episode(Number(values.episode) || 0)}` : t.kinds[values.kind]}
            </p>
          </section>
        </aside>
      </div>

      <div className="sticky bottom-3 z-20 mt-6 flex flex-wrap items-center gap-3 rounded-full bg-ink p-2 ps-5 text-white shadow-[0_18px_40px_-20px_rgb(22_22_22/.8)]">
        <span className="me-auto text-[13px] font-semibold text-white/75" aria-live="polite">
          {failure ? <span className="text-accent">{failure}</span> : dirty ? t.common.unsaved : ""}
        </span>
        <Link href={routes.videos} className="hidden h-11 items-center rounded-full px-4 text-sm font-semibold text-white/80 hover:text-white sm:inline-flex">
          {t.common.cancel}
        </Link>
        {values.status === "draft" ? (
          <>
            <button type="button" disabled={saving} onClick={() => void save("draft")} className={cn(buttonClasses({ variant: "outline", size: "md" }), "border-white/70 text-white hover:border-white hover:bg-white hover:text-ink")}>
              {t.videoForm.saveDraft}
            </button>
            <button type="button" disabled={saving} onClick={() => void save("published")} className={buttonClasses({ variant: "accent", size: "md" })}>
              {saving && <SpinnerIcon size={16} />}
              {t.videoForm.publish}
            </button>
          </>
        ) : (
          <button type="submit" disabled={saving} className={buttonClasses({ variant: "accent", size: "md" })}>
            {saving && <SpinnerIcon size={16} />}
            {video ? t.videoForm.saveChanges : t.videoForm.publish}
          </button>
        )}
      </div>
    </form>
  );
}
