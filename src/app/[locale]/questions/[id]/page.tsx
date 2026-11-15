import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAnsweredQuestions, getQuestion } from "@/data/content";
import { ensureContent } from "@/data/ensure";
import { localeFrom } from "@/i18n/params";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { QuestionDetail } from "@/features/questions/QuestionDetail";

export async function generateStaticParams() {
  await ensureContent();
  return getAnsweredQuestions().map((q) => ({ id: q.id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/questions/[id]">): Promise<Metadata> {
  const { id } = await params;
  await ensureContent();
  const q = getQuestion(id);
  return { title: q?.body.slice(0, 70), description: q?.answer?.text?.slice(0, 160) };
}

export default function Page({ params }: PageProps<"/[locale]/questions/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton tone="accent" />}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: PageProps<"/[locale]/questions/[id]">["params"] }) {
  const { id } = await params;
  await ensureContent();
  const question = getQuestion(id);
  if (!question) notFound();
  return <QuestionDetail question={question} locale={await localeFrom(params)} />;
}
