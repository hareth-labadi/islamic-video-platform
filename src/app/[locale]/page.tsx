import { localeFrom } from "@/i18n/params";
import { ensureContent } from "@/data/ensure";
import { HomePage } from "@/features/home/HomePage";
import { KabyleHomePage } from "@/features/home/KabyleHomePage";

export default async function Page({ params }: PageProps<"/[locale]">) {
  const locale = await localeFrom(params);
  await ensureContent();
  return locale === "kab" ? <KabyleHomePage /> : <HomePage locale={locale} />;
}
