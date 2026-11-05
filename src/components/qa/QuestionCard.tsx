import Link from "next/link";
import { getCategory, getSheikh, getVideo } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { markOf, toneOf } from "@/lib/tones";
import type { AnswerKind, Locale, Question } from "@/lib/types";
import { Highlight, excerpt } from "@/components/search/Highlight";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";
import { ArrowIcon, MicIcon, PenIcon, PlayIcon } from "@/components/ui/icons";
import { VoicePlayer } from "./VoicePlayer";

const kindStyle: Record<AnswerKind, string> = {
  text: "bg-paper text-ink",
  voice: "bg-ink text-accent",
  video: "bg-short text-white",
};

/** Small pill telling how the sheikh answered: written, voice note or video. */
export function AnswerKindBadge({ kind, locale, onDark, className }: { kind: AnswerKind; locale: Locale; /** On an ink block. */ onDark?: boolean; className?: string }) {
  const t = getDictionary(locale).questions;
  const Icon = kind === "voice" ? MicIcon : kind === "video" ? PlayIcon : PenIcon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs leading-none font-bold whitespace-nowrap", onDark ? "bg-white/10 text-white" : kindStyle[kind], className)}>
      <Icon size={13} />
      {t.kindBadge[kind]}
    </span>
  );
}

interface QuestionCardProps {
  question: Question;
  locale: Locale;
  /** Words to highlight (from the Q&A search box). */
  query?: string;
  /** Hide the sheikh line (on a sheikh's own page). */
  hideSheikh?: boolean;
  className?: string;
}

/**
 * One answered question: topic, how it was answered, the question, then a
 * preview of the answer — an excerpt, the voice note itself, or the video.
 * The question links to its own page; the player and video stay clickable on top.
 */
export function QuestionCard({ question, locale, query = "", hideSheikh, className }: QuestionCardProps) {
  const t = getDictionary(locale).questions;
  const answer = question.answer!;
  const category = getCategory(question.categoryId);
  const sheikh = getSheikh(question.sheikhId);
  const video = answer.videoId ? getVideo(answer.videoId) : undefined;
  const ltr = question.lang !== "ar";
  const href = routes.question(locale, question.id);

  return (
    <article className={cn("relative flex flex-col gap-3.5 rounded-[22px] bg-card p-5 transition-shadow hover:shadow-[0_10px_30px_-18px_rgb(22_22_22/.35)] md:p-6", className)}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {category && <span className="rounded-full border border-line px-2.5 py-1 font-semibold">{category.title[locale]}</span>}
        <AnswerKindBadge kind={answer.kind} locale={locale} />
        <span className="ms-auto text-muted">{formatDate(answer.answeredAt, locale)}</span>
      </div>

      <h3 dir={ltr ? "ltr" : "rtl"} lang={question.lang} className={cn("text-[17px] leading-[1.6] font-bold md:text-lg", ltr ? "font-latin" : "font-sans")}>
        <Link href={href} className="after:absolute after:inset-0 after:rounded-[22px] focus-visible:outline-none focus-visible:after:outline-[2.5px] focus-visible:after:outline-accent focus-visible:after:outline-solid">
          <Highlight text={question.body} query={query} />
        </Link>
      </h3>

      {!hideSheikh && (
        <p className="flex items-center gap-2 text-[13px] font-semibold">
          <SheikhAvatar sheikh={sheikh} size="sm" />
          <span>{sheikh.name[locale]}</span>
        </p>
      )}

      {answer.kind === "voice" && answer.audioUrl && (
        <VoicePlayer id={question.id} src={answer.audioUrl} duration={answer.audioDuration} locale={locale} />
      )}

      {answer.kind === "video" && video && (
        <Link href={routes.watch(locale, video.id)} className="relative z-10 grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3 rounded-2xl bg-paper p-2 pe-4 hover:bg-line-soft">
          <span className={cn("relative grid aspect-video place-items-center overflow-hidden rounded-xl", toneOf(video).bg, toneOf(video).fg)}>
            <OutlineNumeral value={markOf(video)} stroke="rgb(255 255 255 / .4)" className="text-[64px]" />
            <span className="relative grid size-8 place-items-center rounded-full bg-accent text-ink">
              <PlayIcon size={12} />
            </span>
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[13px] font-bold">{t.videoAnswer}</span>
            <span dir="rtl" lang="ar" className="truncate font-sans text-xs text-muted">
              {video.title} · <span className="font-latin">{video.duration}</span>
            </span>
          </span>
        </Link>
      )}

      {answer.text && answer.kind === "text" && (
        <p dir="auto" className="line-clamp-3 text-[15px] leading-[1.85] whitespace-pre-line text-subtle">
          <Highlight text={excerpt(answer.text, query, 220)} query={query} />
        </p>
      )}

      <span className="mt-auto inline-flex items-center gap-1.5 self-start text-[13px] font-bold text-series">
        {t.readAnswer} <ArrowIcon size={14} />
      </span>
    </article>
  );
}
