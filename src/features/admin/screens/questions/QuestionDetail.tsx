"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { PenIcon } from "@/components/ui/icons";
import { usePanel } from "../../AdminContext";
import { api, isApiError, type AdminQuestion, type AdminVideo, type RejectReason } from "../../api/client";
import type { CategoryWithCount } from "../../api/contract";
import { useAction, useNow, useQuery } from "../../api/hooks";
import { dirOf, markOf, thumbOf } from "../../lib/content";
import { relativeTime } from "../../lib/format";
import { MiniCover, StatusBadge } from "../../ui/display";
import { Counter, Field, Segmented, Select, TextArea, Toggle } from "../../ui/form";
import { ChevronIcon, EyeIcon, EyeOffIcon, LockIcon } from "../../ui/icons";
import { ConfirmDialog, useToast } from "../../ui/overlay";
import { VoicePlayer } from "@/components/qa/VoicePlayer";
import { limits, questionBodyProblem } from "../../rules";
import { AnswerComposer, VideoChooser } from "./AnswerComposer";

export function QuestionDetail({ question, categories, onBack, onLeave }: { question: AdminQuestion; categories: CategoryWithCount[]; onBack: () => void; onLeave: () => void }) {
  const { t, locale, can, sheikh } = usePanel();
  const now = useNow();
  const toast = useToast();
  const [run, busy] = useAction();
  const [editing, setEditing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState<RejectReason>("spam");
  const [prefillVideo, setPrefillVideo] = useState<string | undefined>();
  const [redacting, setRedacting] = useState(false);
  const [bodyDraft, setBodyDraft] = useState(question.body);
  const [bodyError, setBodyError] = useState<string>();
  const owner = can("questions.answer");
  const videos = useQuery(`videos:${sheikh.id}:all`, () => api.videos.list({ sheikhId: sheikh.id }));
  const suggested = videos.data?.find((v) => v.id === question.suggestedVideoId);

  const patch = async (changes: Parameters<typeof api.questions.update>[1], message: string) => {
    try {
      await run(() => api.questions.update(question.id, changes));
      toast(message);
    } catch (e) {
      toast(isApiError(e) && e.code === "forbidden" ? t.common.forbidden : t.common.error, "error");
    }
  };

  return (
    <article aria-labelledby="question-body" className="flex flex-col gap-4 lg:sticky lg:top-24">
      <button type="button" onClick={onBack} className="inline-flex w-fit items-center gap-1 text-[13px] font-semibold text-subtle hover:text-ink lg:hidden">
        <ChevronIcon size={16} className="rtl:-scale-x-100" />
        {t.questions.back}
      </button>

      <section className="relative overflow-hidden rounded-tile bg-accent p-6 md:p-8">
        <span aria-hidden="true" className="pointer-events-none absolute -end-2 -top-10 font-sans text-[220px] leading-none font-bold text-stroke [--stroke:rgb(22_22_22/.22)] [--stroke-width:1.5px]">
          ؟
        </span>
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold">
            <StatusBadge status={question.status === "answered" ? "published" : question.status} label={t.status[question.status]} className="bg-white" />
            <span className="rounded-full bg-white/60 px-2.5 py-1">{now ? t.questions.asked(relativeTime(question.askedAt, locale, t, now)) : " "}</span>
            <span className="rounded-full bg-white/60 px-2.5 py-1">{t.langs[question.lang]}</span>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1", question.isPublic ? "bg-white/60" : "bg-ink text-white")}>
              {question.isPublic ? <EyeIcon size={13} /> : <EyeOffIcon size={13} />}
              {question.isPublic ? t.questions.consentYes : t.questions.consentNo}
            </span>
          </div>
          {redacting ? (
            <div className="flex flex-col gap-2">
              <Field label={t.questions.editBody} hint={<span className="text-ink/70">{t.questions.editBodyHint}</span>} error={bodyError} aside={<Counter value={bodyDraft} max={limits.questionBody.max} />}>
                <TextArea rows={4} value={bodyDraft} onChange={(e) => setBodyDraft(e.target.value)} lang={question.lang} dir={dirOf(question.lang)} className="border-ink/20 text-[17px] font-semibold" />
              </Field>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    const body = bodyDraft.trim();
                    const problem = questionBodyProblem(body);
                    if (problem) return setBodyError(problem === "short" ? t.validation.min(limits.questionBody.min) : t.validation.max(limits.questionBody.max));
                    setBodyError(undefined);
                    await patch({ body }, t.questions.bodySaved);
                    setRedacting(false);
                  }}
                  className={buttonClasses({ variant: "ink", size: "sm" })}
                >
                  {t.common.save}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRedacting(false);
                    setBodyDraft(question.body);
                    setBodyError(undefined);
                  }}
                  className={buttonClasses({ variant: "ghost", size: "sm" })}
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          ) : (
            <p id="question-body" lang={question.lang} dir={dirOf(question.lang)} className="max-w-[60ch] text-xl leading-relaxed font-bold md:text-2xl">
              {question.body}
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-wrap items-end gap-3 rounded-tile bg-card p-4">
        <Field label={t.questions.category} compact className="min-w-48 flex-1">
          <Select value={question.categoryId} disabled={busy} onChange={(e) => void patch({ categoryId: e.target.value }, t.questions.categorySaved)} className="h-11">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title[locale]}
              </option>
            ))}
          </Select>
        </Field>
        {!redacting && question.status !== "rejected" && (
          <button type="button" onClick={() => setRedacting(true)} className={buttonClasses({ variant: "outline" })} title={t.questions.editBodyHint}>
            <PenIcon size={15} />
            {t.questions.editBody}
          </button>
        )}
        {question.status === "rejected" ? (
          <div className="flex items-center gap-3">
            {question.rejection && <span className="text-[13px] font-semibold text-muted">{t.questions.reasons[question.rejection.reason]}</span>}
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                await run(() => api.questions.restore(question.id));
                toast(t.questions.restoredToast);
                onLeave();
              }}
              className={buttonClasses({ variant: "outline" })}
            >
              {t.questions.restore}
            </button>
          </div>
        ) : (
          question.status === "pending" && (
            <button type="button" onClick={() => setRejecting(true)} className={cn(buttonClasses({ variant: "ghost" }), "text-[#B42318]")}>
              {t.questions.reject}
            </button>
          )
        )}
      </section>

      {question.status === "pending" && suggested && (
        <section className="flex flex-wrap items-center gap-3 rounded-tile bg-lilac p-4">
          <MiniCover kind={suggested.kind} mark={markOf(suggested)} image={thumbOf(suggested)} className="w-20 text-[13px] sm:w-24 sm:text-[14px]" />
          <div className="min-w-0 flex-1 basis-40">
            <p className="text-xs font-bold text-ink/70">{t.questions.suggestedBy}</p>
            <p lang={suggested.lang} dir={dirOf(suggested.lang)} className="line-clamp-2 text-[15px] leading-snug font-bold">
              {suggested.title}
            </p>
          </div>
          {owner ? (
            <button type="button" onClick={() => setPrefillVideo(suggested.id)} className={buttonClasses({ variant: "ink", size: "sm" })}>
              {t.questions.useSuggested}
            </button>
          ) : (
            <button type="button" disabled={busy} onClick={() => void patch({ suggestedVideoId: null }, t.questions.suggestionSaved)} className={buttonClasses({ variant: "ghost", size: "sm" })}>
              {t.questions.clearSuggestion}
            </button>
          )}
        </section>
      )}

      {question.status === "answered" && question.answer && !editing && (
        <AnswerView question={question} videos={videos.data ?? []} onEdit={owner ? () => setEditing(true) : undefined} onTogglePublished={owner ? (published) => void patch({ published }, published ? t.questions.publishedToast : t.questions.unpublishedToast) : undefined} busy={busy} />
      )}

      {owner && (question.status === "pending" || editing) && (
        <AnswerComposer key={prefillVideo ?? "composer"} question={question} videos={videos.data ?? []} prefillVideo={prefillVideo} onDone={() => (editing ? setEditing(false) : onLeave())} onCancel={editing ? () => setEditing(false) : undefined} />
      )}

      {!owner && question.status === "pending" && (
        <section className="rounded-tile bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper">
              <LockIcon size={18} />
            </span>
            <div>
              <h2 className="font-bold">{t.questions.onlySheikhTitle}</h2>
              <p className="mt-1 text-[13.5px] text-subtle">{t.questions.onlySheikhBody}</p>
            </div>
          </div>
          <div className="mt-5">
            <Field label={t.questions.suggest} compact group>
              <VideoChooser videos={videos.data ?? []} value={question.suggestedVideoId} onChange={(id) => void patch({ suggestedVideoId: id ?? null }, t.questions.suggestionSaved)} />
            </Field>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        title={t.questions.rejectTitle}
        body={t.questions.rejectBody}
        confirmLabel={t.questions.reject}
        cancelLabel={t.common.cancel}
        busy={busy}
        onConfirm={async () => {
          try {
            await run(() => api.questions.reject(question.id, reason));
            setRejecting(false);
            toast(t.questions.rejectedToast);
            onLeave();
          } catch {
            toast(t.common.error, "error");
          }
        }}
      >
        <Field label={t.questions.reason} group compact>
          <Segmented label={t.questions.reason} value={reason} onChange={setReason} size="sm" options={(["spam", "duplicate", "off_topic", "other"] as const).map((r) => ({ value: r, label: t.questions.reasons[r] }))} />
        </Field>
      </ConfirmDialog>
    </article>
  );
}

export function AnswerView({ question, videos, onEdit, onTogglePublished, busy }: { question: AdminQuestion; videos: AdminVideo[]; onEdit?: () => void; onTogglePublished?: (v: boolean) => void; busy: boolean }) {
  const { t, locale } = usePanel();
  const now = useNow();
  const answer = question.answer!;
  const video = videos.find((v) => v.id === answer.videoId);
  return (
    <section className="rounded-tile bg-card p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-[17px] font-bold">{t.questions.answer}</h2>
        <span className="text-xs font-semibold text-muted">{now ? t.questions.answeredOn(relativeTime(answer.answeredAt, locale, t, now)) : ""}</span>
        {onEdit && (
          <button type="button" onClick={onEdit} className={cn(buttonClasses({ variant: "outline", size: "sm" }), "ms-auto")}>
            <PenIcon size={15} />
            {t.questions.editAnswer}
          </button>
        )}
      </div>
      {answer.kind === "voice" && answer.audioUrl && (
        <div className="mb-4 rounded-2xl bg-paper p-3">
          <VoicePlayer id={question.id} src={answer.audioUrl} duration={answer.audioDuration} locale={locale} />
        </div>
      )}
      {answer.kind === "video" && video && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-paper p-3">
          <MiniCover kind={video.kind} mark={markOf(video)} image={thumbOf(video)} className="w-28 text-[15px]" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted">{t.questions.linkedVideo}</p>
            <p lang={video.lang} dir={dirOf(video.lang)} className="truncate font-bold">
              {video.title}
            </p>
          </div>
        </div>
      )}
      {answer.text && (
        <p lang={question.lang} dir={dirOf(question.lang)} className="text-[15px] leading-loose whitespace-pre-line">
          {answer.text}
        </p>
      )}
      <div className="mt-5 border-t border-line-soft pt-4">
        {onTogglePublished ? (
          <Toggle checked={question.published} disabled={!question.isPublic || busy} onChange={onTogglePublished} label={t.questions.publish} hint={question.isPublic ? t.questions.publishHint : t.questions.publishBlocked} />
        ) : (
          <StatusBadge status={question.published ? "published" : "hidden"} label={question.published ? t.questions.onSite : t.questions.offSite} />
        )}
      </div>
    </section>
  );
}
