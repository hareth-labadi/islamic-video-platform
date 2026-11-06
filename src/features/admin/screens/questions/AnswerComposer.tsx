"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { usePanel } from "../../AdminContext";
import { api, type AdminQuestion, type AdminVideo, type AnswerKind } from "../../api/client";
import { useAction } from "../../api/hooks";
import { dirOf, markOf, thumbOf } from "../../lib/content";
import { clock, parseDuration } from "../../lib/format";
import { MiniCover } from "../../ui/display";
import { Counter, DANGER, Field, Segmented, TextArea, Toggle } from "../../ui/form";
import { SpinnerIcon } from "../../ui/icons";
import { SearchField } from "../../ui/inputs";
import { useToast } from "../../ui/overlay";
import { VoiceRecorder, type Recording } from "../../ui/VoiceRecorder";

export function AnswerComposer({ question, videos, prefillVideo, onDone, onCancel }: { question: AdminQuestion; videos: AdminVideo[]; prefillVideo?: string; onDone: () => void; onCancel?: () => void }) {
  const { t } = usePanel();
  const toast = useToast();
  const [run, busy] = useAction();
  const previous = question.answer;
  const [kind, setKind] = useState<AnswerKind>(prefillVideo ? "video" : (previous?.kind ?? "text"));
  const [text, setText] = useState(previous?.text ?? "");
  const [recording, setRecording] = useState<Recording | null>(
    previous?.kind === "voice" && previous.audioUrl ? { url: previous.audioUrl, duration: parseDuration(previous.audioDuration ?? "") ?? 0 } : null,
  );
  const [videoId, setVideoId] = useState<string | undefined>(prefillVideo ?? previous?.videoId);
  const [published, setPublished] = useState(question.isPublic && (previous ? question.published : true));
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const hintId = useId();
  const section = useRef<HTMLElement>(null);

  const submit = async () => {
    const problem =
      kind === "text"
        ? !text.trim()
          ? t.validation.required
          : text.trim().length < 10
            ? t.validation.min(10)
            : text.length > 5000
              ? t.validation.max(5000)
              : undefined
        : kind === "voice"
          ? !recording
            ? t.validation.recording
            : text.length > 1000
              ? t.validation.max(1000)
              : undefined
          : !videoId
            ? t.validation.pickVideo
            : undefined;
    setError(problem);
    if (problem) {
      section.current?.querySelector<HTMLElement>("[aria-invalid='true'], button[aria-describedby]")?.focus();
      return;
    }
    try {
      let audioUrl = recording?.url;
      if (kind === "voice" && recording?.blob) {
        setUploading(true);
        const ext = recording.mimeType?.includes("mp4") ? "m4a" : recording.mimeType?.includes("ogg") ? "ogg" : "webm";
        const file = new File([recording.blob], `answer-${question.id}.${ext}`, { type: recording.blob.type });
        audioUrl = (await api.uploads.create(file, "voice")).url;
        setUploading(false);
      }
      await run(() =>
        api.questions.answer(question.id, {
          kind,
          text: text.trim() || undefined,
          audioUrl: kind === "voice" ? audioUrl : undefined,
          audioDuration: kind === "voice" && recording ? clock(recording.duration) : undefined,
          videoId: kind === "video" ? videoId : undefined,
          published,
        }),
      );
      toast(t.questions.sent);
      onDone();
    } catch {
      setUploading(false);
      toast(t.common.error, "error");
    }
  };

  return (
    <section ref={section} aria-labelledby="composer-title" className="rounded-tile bg-card p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="composer-title" className="text-[17px] font-bold">
          {previous ? t.questions.editAnswer : t.questions.answer}
        </h2>
        <Segmented
          label={t.questions.answer}
          value={kind}
          onChange={(v) => {
            setKind(v);
            setError(undefined);
          }}
          size="sm"
          options={[
            { value: "text", label: t.questions.answerText },
            { value: "voice", label: t.questions.answerVoice },
            { value: "video", label: t.questions.answerVideo },
          ]}
        />
      </div>

      <div className="flex flex-col gap-4">
        {kind === "voice" && (
          <div className="flex flex-col gap-1.5">
            <VoiceRecorder value={recording} onChange={setRecording} t={t.recorder} invalid={!!error} describedBy={error ? hintId : undefined} />
            {error && (
              <p id={hintId} className="text-[13px] font-semibold" style={{ color: DANGER }}>
                {error}
              </p>
            )}
          </div>
        )}
        {kind === "video" && (
          <Field label={t.questions.pickVideo} error={error} group>
            <VideoChooser videos={videos} value={videoId} onChange={setVideoId} />
          </Field>
        )}
        {kind === "text" ? (
          <Field label={t.questions.answerText} error={error} aside={<Counter value={text} max={5000} />}>
            <TextArea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.questions.textPlaceholder} lang={question.lang} dir={dirOf(question.lang)} className="leading-loose" />
          </Field>
        ) : (
          <Field label={t.questions.summary} optional={t.common.optional} hint={t.questions.summaryHint}>
            <TextArea rows={3} value={text} onChange={(e) => setText(e.target.value)} lang={question.lang} dir={dirOf(question.lang)} />
          </Field>
        )}

        <Toggle checked={published} disabled={!question.isPublic} onChange={setPublished} label={t.questions.publish} hint={question.isPublic ? t.questions.publishHint : t.questions.publishBlocked} />

        <div className="flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
          <button type="button" onClick={() => void submit()} disabled={busy || uploading} className={buttonClasses({ variant: "accent" })}>
            {(busy || uploading) && <SpinnerIcon size={16} />}
            {uploading ? t.recorder.uploading : previous ? t.questions.update : t.questions.send}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className={buttonClasses({ variant: "ghost" })}>
              {t.common.cancel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** Pick one video: shows the choice, or a search with results. */
export function VideoChooser({ videos, value, onChange }: { videos: AdminVideo[]; value?: string; onChange: (id: string | undefined) => void }) {
  const { t } = usePanel();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(!value);
  const chosen = videos.find((v) => v.id === value);
  const query = q.trim().toLowerCase();
  const results = videos.filter((v) => v.status === "published" && (!query || v.title.toLowerCase().includes(query) || v.topics.some((x) => x.toLowerCase().includes(query)))).slice(0, 6);

  if (chosen && !open)
    return (
      <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-ink p-2 pe-3">
        <MiniCover kind={chosen.kind} mark={markOf(chosen)} image={thumbOf(chosen)} className="w-24 text-[14px]" />
        <p lang={chosen.lang} dir={dirOf(chosen.lang)} className="min-w-0 flex-1 truncate text-[14.5px] font-bold">
          {chosen.title}
        </p>
        <button type="button" onClick={() => setOpen(true)} className={buttonClasses({ variant: "outline", size: "sm" })}>
          {t.common.edit}
        </button>
      </div>
    );

  return (
    <div className="flex flex-col gap-2">
      <SearchField value={q} onChange={setQ} placeholder={t.questions.pickVideoPlaceholder} label={t.questions.pickVideo} />
      <ul className="flex flex-col gap-1" role="listbox" aria-label={t.questions.pickVideo}>
        {results.map((v) => (
          <li key={v.id} role="option" aria-selected={v.id === value}>
            <button
              type="button"
              onClick={() => {
                onChange(v.id);
                setOpen(false);
                setQ("");
              }}
              className={cn("flex w-full items-center gap-3 rounded-2xl p-1.5 pe-3 text-start transition-colors hover:bg-paper", v.id === value && "bg-accent/20")}
            >
              <MiniCover kind={v.kind} mark={markOf(v)} image={thumbOf(v)} className="w-16 text-[11px]" />
              <span lang={v.lang} dir={dirOf(v.lang)} className="line-clamp-1 flex-1 text-[13.5px] font-semibold">
                {v.title}
              </span>
              <span className="font-latin text-xs text-muted">{v.duration}</span>
            </button>
          </li>
        ))}
      </ul>
      {value && (
        <button type="button" onClick={() => onChange(undefined)} className="self-start text-[13px] font-semibold text-subtle hover:text-ink">
          {t.questions.clearSuggestion}
        </button>
      )}
    </div>
  );
}
