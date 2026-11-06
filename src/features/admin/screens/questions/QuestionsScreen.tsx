"use client";

import { useSearchParams } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { MicIcon, PenIcon } from "@/components/ui/icons";
import { usePanel } from "../../AdminContext";
import { api, type AdminQuestion, type QuestionStatus } from "../../api/client";
import type { CategoryWithCount } from "../../api/contract";
import { useNow, useQuery } from "../../api/hooks";
import { dirOf } from "../../lib/content";
import { relativeTime } from "../../lib/format";
import { EmptyState, ErrorNote, PageHeader, Skeleton } from "../../ui/display";
import { Segmented, Select } from "../../ui/form";
import { EyeIcon, EyeOffIcon, FilmIcon, LockIcon, TagIcon } from "../../ui/icons";
import { SearchField } from "../../ui/inputs";
import { QuestionDetail } from "./QuestionDetail";
import { CategoriesDialog } from "./CategoriesDialog";

export function QuestionsScreen() {
  const { t, locale, sheikh } = usePanel();
  const params = useSearchParams();
  const [tab, setTab] = useState<QuestionStatus>("pending");
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(params.get("id"));
  const [manage, setManage] = useState(false);
  const query = useDeferredValue(q);

  const [lastSheikh, setLastSheikh] = useState(sheikh.id);
  if (lastSheikh !== sheikh.id) {
    setLastSheikh(sheikh.id);
    setSelectedId(null);
  }

  const filter = { status: tab, categoryId: categoryId || undefined, q: query || undefined };
  const list = useQuery(`questions:${sheikh.id}:${JSON.stringify(filter)}`, () => api.questions.list(sheikh.id, filter), { keepPrevious: true });
  const counts = useQuery(`question-counts:${sheikh.id}`, () => api.questions.counts(sheikh.id), { keepPrevious: true });
  const categories = useQuery(`categories:${sheikh.id}`, () => api.questions.categories(sheikh.id), { keepPrevious: true });
  const selected = list.data?.find((x) => x.id === selectedId) ?? null;
  // A question opened from the dashboard may sit in another tab: fetch it with the pending list.
  const [checkedDeepLink, setCheckedDeepLink] = useState(false);
  if (!checkedDeepLink && list.data && selectedId && !selected) {
    setCheckedDeepLink(true);
    setSelectedId(null);
  }

  return (
    <div>
      <PageHeader
        title={t.questions.title}
        count={counts.data?.pending}
        lead={
          <span className="inline-flex items-center gap-1.5">
            <LockIcon size={14} />
            {t.questions.anonymous}
          </span>
        }
        actions={
          <button type="button" onClick={() => setManage(true)} className={buttonClasses({ variant: "outline" })}>
            <TagIcon size={17} />
            {t.questions.manageCategories}
          </button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Segmented
          label={t.questions.title}
          value={tab}
          onChange={(v) => {
            setTab(v);
            setSelectedId(null);
          }}
          options={(["pending", "answered", "rejected"] as const).map((s) => ({
            value: s,
            label: `${t.questions.tabs[s]} · ${counts.data ? counts.data[s] : "–"}`,
            dotClass: s === "pending" ? "bg-accent" : s === "answered" ? "bg-series" : "bg-muted",
          }))}
        />
        <div className="flex flex-1 flex-wrap gap-2 lg:justify-end">
          <SearchField value={q} onChange={setQ} placeholder={t.questions.search} label={t.common.search} className="min-w-56 flex-1 lg:max-w-80" />
          <div className="w-full sm:w-52">
            <Select aria-label={t.questions.category} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-11 rounded-full text-[13.5px]">
              <option value="">{t.questions.allCategories}</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title[locale]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {!!list.error && <ErrorNote>{t.common.error}</ErrorNote>}

      <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className={cn("flex flex-col gap-2.5", selected && "hidden lg:flex")}>
          {list.pending ? (
            [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-tile" />)
          ) : list.data?.length === 0 ? (
            <EmptyState emoji={tab === "pending" ? "🤲" : "🗂️"} title={t.questions.empty[tab]} />
          ) : (
            <ul className={cn("flex flex-col gap-2.5 transition-opacity", list.loading && "opacity-60")}>
              {list.data?.map((question) => (
                <QuestionCard key={question.id} question={question} category={categories.data?.find((c) => c.id === question.categoryId)} selected={question.id === selectedId} onSelect={() => setSelectedId(question.id)} />
              ))}
            </ul>
          )}
        </div>
        <div className={cn(!selected && "hidden lg:block")}>
          {selected ? (
            <QuestionDetail key={`${selected.id}:${selected.status}`} question={selected} categories={categories.data ?? []} onBack={() => setSelectedId(null)} onLeave={() => setSelectedId(null)} />
          ) : (
            <div className="grid min-h-80 place-items-center rounded-tile border-[1.5px] border-dashed border-line p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <span aria-hidden="true" className="font-sans text-[120px] leading-none font-bold text-stroke [--stroke:var(--color-accent)] [--stroke-width:2px]">
                  ؟
                </span>
                <p className="text-[15px] font-semibold text-subtle">{t.questions.pickOne}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CategoriesDialog open={manage} onClose={() => setManage(false)} categories={categories.data ?? []} />
    </div>
  );
}

function QuestionCard({ question, category, selected, onSelect }: { question: AdminQuestion; category?: CategoryWithCount; selected: boolean; onSelect: () => void }) {
  const { t, locale } = usePanel();
  const now = useNow();
  const AnswerIcon = question.answer?.kind === "voice" ? MicIcon : question.answer?.kind === "video" ? FilmIcon : PenIcon;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected || undefined}
        className={cn(
          "relative flex w-full flex-col gap-2 rounded-tile border-[1.5px] bg-card p-4 text-start transition-colors",
          selected ? "border-ink shadow-[0_10px_30px_-18px_rgb(22_22_22/.5)]" : "border-transparent hover:border-line",
        )}
      >
        {selected && <span aria-hidden="true" className="absolute inset-y-4 start-0 w-1 rounded-e-full bg-accent" />}
        <span lang={question.lang} dir={dirOf(question.lang)} className="line-clamp-3 text-[14.5px] leading-relaxed font-semibold">
          {question.body}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-muted">
          {category && <span className="rounded-full bg-paper px-2 py-0.5 text-ink">{category.title[locale]}</span>}
          <span>{now ? relativeTime(question.askedAt, locale, t, now) : ""}</span>
          <span className="ms-auto flex items-center gap-1.5">
            {question.suggestedVideoId && question.status === "pending" && (
              <span className="grid size-6 place-items-center rounded-full bg-lilac text-ink" title={t.questions.suggested}>
                <FilmIcon size={13} />
              </span>
            )}
            {question.answer && (
              <span className="grid size-6 place-items-center rounded-full bg-fresh text-ink" title={t.questions.answer}>
                <AnswerIcon size={13} />
              </span>
            )}
            <span className={cn("grid size-6 place-items-center rounded-full", question.isPublic ? "bg-paper" : "bg-ink text-white")} title={question.isPublic ? t.questions.consentYes : t.questions.consentNo}>
              {question.isPublic ? <EyeIcon size={13} /> : <EyeOffIcon size={13} />}
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}
