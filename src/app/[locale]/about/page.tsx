import { redirect } from "next/navigation";
import { getSheikh } from "@/data/content";
import { ensureContent } from "@/data/ensure";
import { localeFrom } from "@/i18n/params";
import { routes } from "@/lib/routes";

/** Old "about the sheikh" URL: the main sheikh's page now holds this. */
export default async function Page({ params }: PageProps<"/[locale]/about">) {
  const locale = await localeFrom(params);
  await ensureContent();
  redirect(routes.sheikh(locale, getSheikh().slug));
}
