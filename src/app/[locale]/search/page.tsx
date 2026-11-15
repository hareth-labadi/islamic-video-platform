import type { Metadata } from "next";
import { Suspense } from "react";
import { getDictionary } from "@/i18n/dictionaries";
import { localeFrom } from "@/i18n/params";
import { ensureContent } from "@/data/ensure";
import { SearchResults } from "@/features/search/SearchResults";

export async function generateMetadata({ params }: PageProps<"/[locale]/search">): Promise<Metadata> {
  return { title: getDictionary(await localeFrom(params)).search.pill };
}

export default async function Page({ params }: PageProps<"/[locale]/search">) {
  const locale = await localeFrom(params);
  await ensureContent();
  return (
    <Suspense>
      <SearchResults locale={locale} />
    </Suspense>
  );
}
