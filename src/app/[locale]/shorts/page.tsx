import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { localeFrom } from "@/i18n/params";
import { ShortsFeed } from "@/features/shorts/ShortsFeed";

export async function generateMetadata({ params }: PageProps<"/[locale]/shorts">): Promise<Metadata> {
  const t = getDictionary(await localeFrom(params)).shorts;
  return { title: t.title, description: t.intro };
}

export default async function Page({ params }: PageProps<"/[locale]/shorts">) {
  return <ShortsFeed locale={await localeFrom(params)} />;
}
