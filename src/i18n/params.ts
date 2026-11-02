import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";

/** Reads and checks the [locale] route segment; unknown languages give a 404. */
export async function localeFrom(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
