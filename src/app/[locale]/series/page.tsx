import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { localeFrom } from "@/i18n/params";
import { ensureContent } from "@/data/ensure";
import { LibraryPage } from "@/features/library/LibraryPage";

export async function generateMetadata({ params }: PageProps<"/[locale]/series">): Promise<Metadata> {
  const t = getDictionary(await localeFrom(params)).library;
  return { title: t.title, description: t.intro };
}

export default async function Page({ params }: PageProps<"/[locale]/series">) {
  const locale = await localeFrom(params);
  await ensureContent();
  return <LibraryPage locale={locale} />;
}
