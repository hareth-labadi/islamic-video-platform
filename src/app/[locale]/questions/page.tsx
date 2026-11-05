import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { localeFrom } from "@/i18n/params";
import { QuestionsPage } from "@/features/questions/QuestionsPage";

export async function generateMetadata({ params }: PageProps<"/[locale]/questions">): Promise<Metadata> {
  const t = getDictionary(await localeFrom(params)).questions;
  return { title: t.title, description: t.heroText };
}

export default async function Page({ params }: PageProps<"/[locale]/questions">) {
  return <QuestionsPage locale={await localeFrom(params)} />;
}
