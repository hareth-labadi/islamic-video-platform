import { localeFrom } from "@/i18n/params";
import { HomePage } from "@/features/home/HomePage";

export default async function Page({ params }: PageProps<"/[locale]">) {
  return <HomePage locale={await localeFrom(params)} />;
}
