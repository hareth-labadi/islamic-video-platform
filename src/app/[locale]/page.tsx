import { localeFrom } from "@/i18n/params";
import { HomePage } from "@/features/home/HomePage";
import { KabyleHomePage } from "@/features/home/KabyleHomePage";

export default async function Page({ params }: PageProps<"/[locale]">) {
  const locale = await localeFrom(params);
  return locale === "kab" ? <KabyleHomePage /> : <HomePage locale={locale} />;
}
