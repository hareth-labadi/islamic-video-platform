import Link from "next/link";
import { getAnsweredQuestions, getCategory, getSheikh, getVideo } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { Locale, Question } from "@/lib/types";
import { Cover } from "@/components/media/Cover";
import { AnswerKindBadge, QuestionCard } from "@/components/qa/QuestionCard";
import { VoicePlayer } from "@/components/qa/VoicePlayer";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";
import { PlayIcon } from "@/components/ui/icons";

/** One question and the sheikh's answer, with related questions and a way to ask your own. */
export function QuestionDetail({ question, locale }: { question: Question; locale: Locale }) {
  const t = getDictionary(locale);
  const tq = t.questions;
  const answer = question.answer!;
  const sheikh = getSheikh(question.sheikhId);
  const category = getCategory(question.categoryId);
  const video = answer.videoId ? getVideo(answer.videoId) : undefined;
  const related = getAnsweredQuestions({ categoryId: question.categoryId })
    .filter((q) => q.id !== question.id)
    .slice(0, 3);
  const ltr = question.lang !== "ar";

  return (
    <div className="grid items-start gap-8 px-3 pb-20 md:px-0 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
      <article className="flex min-w-0 flex-col gap-3.5">
        <nav aria-label={t.series.breadcrumb} className="px-1 text-[13px] text-muted">
          <Link href={routes.home(locale)} className="hover:text-ink">
            {t.nav.home}
          </Link>
          {" ‹ "}
          <Link href={routes.questions(locale)} className="hover:text-ink">
            {tq.title}
          </Link>
          {category && (
            <>
              {" ‹ "}
              <Link href={routes.questions(locale, { category: category.id })} className="hover:text-ink">
                {category.title[locale]}
              </Link>
            </>
          )}
        </nav>

        {/* The question */}
        <section aria-labelledby="q-h" className="relative isolate overflow-hidden rounded-[22px] bg-card p-6 md:rounded-[28px] md:p-10">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <span className="font-bold text-ink">{tq.anonymous}</span>
            <span aria-hidden="true">·</span>
            <span>{tq.askedOn(formatDate(question.askedAt, locale, true))}</span>
            {category && <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-ink">{category.title[locale]}</span>}
          </div>
          <h1
            id="q-h"
            dir={ltr ? "ltr" : "rtl"}
            lang={question.lang}
            className={cn("text-[26px] leading-[1.55] font-bold md:text-[36px] md:leading-[1.45]", ltr ? "font-latin" : "font-sans")}
          >
            {question.body}
          </h1>
        </section>

        {/* The answer */}
        <section aria-labelledby="a-h" className="flex flex-col gap-5 rounded-[22px] bg-ink p-6 text-white md:rounded-[28px] md:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <SheikhAvatar sheikh={sheikh} size="md" tone="accent" />
            <span className="flex flex-col">
              <h2 id="a-h" className="text-[15px] font-bold">
                <Link href={routes.sheikh(locale, sheikh.slug)} className="hover:text-accent">
                  {sheikh.name[locale]}
                </Link>
              </h2>
              <span className="text-xs text-faint">{tq.answeredOn(formatDate(answer.answeredAt, locale, true))}</span>
            </span>
            <AnswerKindBadge kind={answer.kind} locale={locale} onDark className="ms-auto" />
          </div>

          {answer.kind === "voice" && answer.audioUrl && (
            <VoicePlayer id={question.id} src={answer.audioUrl} duration={answer.audioDuration} locale={locale} tone="ink" size="lg" />
          )}

          {answer.kind === "video" && video && (
            <Link href={routes.watch(locale, video.id)} className="group grid gap-4 rounded-2xl bg-white/5 p-3 md:grid-cols-[260px_minmax(0,1fr)] md:items-center">
              <div className="relative">
                <Cover video={video} radiusClass="rounded-xl" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid size-14 place-items-center rounded-full bg-accent text-ink transition-transform group-hover:scale-105">
                    <PlayIcon size={20} />
                  </span>
                </span>
              </div>
              <span className="flex flex-col gap-1 px-1">
                <span className="text-[13px] font-bold text-accent">{tq.videoAnswer}</span>
                <span dir="rtl" lang="ar" className="font-sans text-lg leading-[1.5] font-bold">
                  {video.title}
                </span>
                <span className="font-latin text-[13px] text-faint">{video.duration}</span>
              </span>
            </Link>
          )}

          {answer.text && (
            <div className="flex flex-col gap-2">
              {answer.kind !== "text" && <span className="text-xs font-bold text-faint">{tq.summary}</span>}
              <p dir="auto" className="text-[17px] leading-[2] whitespace-pre-line md:text-lg">
                {answer.text}
              </p>
            </div>
          )}
        </section>
      </article>

      <aside className="flex flex-col gap-3.5 lg:sticky lg:top-6 lg:pt-8">
        <div className="flex flex-col gap-3 rounded-[var(--radius-tile)] bg-accent p-6 text-ink">
          <span className="text-xl font-bold">{tq.askOwn}</span>
          <span className="text-sm leading-[1.7]">{tq.askOwnText}</span>
          <Link href={routes.ask(locale, sheikh.slug)} className="mt-1 inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-bold text-white">
            {tq.askCta}
          </Link>
        </div>
        {related.length > 0 && (
          <section aria-labelledby="rel-h" className="flex flex-col gap-3">
            <h2 id="rel-h" className="px-1 pt-2 text-lg font-bold">
              {tq.related}
            </h2>
            {related.map((q) => (
              <QuestionCard key={q.id} question={q} locale={locale} />
            ))}
          </section>
        )}
      </aside>
    </div>
  );
}
