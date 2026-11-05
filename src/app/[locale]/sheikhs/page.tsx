import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { localeFrom } from "@/i18n/params";
import { SheikhsIndex } from "@/features/sheikhs/SheikhPages";

export async function generateMetadata({ params }: PageProps<"/[locale]/sheikhs">): Promise<Metadata> {
  const t = getDictionary(await localeFrom(params)).sheikhs;
  return { title: t.title, description: t.intro };
}

export default async function Page({ params }: PageProps<"/[locale]/sheikhs">) {
  return <SheikhsIndex locale={await localeFrom(params)} />;
}
