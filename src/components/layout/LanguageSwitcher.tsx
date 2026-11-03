"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { localeConfig, locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { switchLocale } from "@/lib/routes";

interface LanguageSwitcherProps {
  locale: Locale;
  label: string;
  /** "pill" = outline pills in the header, "list" = plain links in the footer. */
  variant?: "pill" | "list";
  className?: string;
}

/** Links to the same page in the other languages. */
export function LanguageSwitcher(props: LanguageSwitcherProps) {
  // useSearchParams needs a Suspense boundary; the fallback keeps the links without the query.
  return (
    <Suspense fallback={<Links {...props} query="" />}>
      <WithQuery {...props} />
    </Suspense>
  );
}

function WithQuery(props: LanguageSwitcherProps) {
  const query = useSearchParams().toString();
  return <Links {...props} query={query ? `?${query}` : ""} />;
}

function Links({ locale, label, variant = "pill", className, query }: LanguageSwitcherProps & { query: string }) {
  const pathname = usePathname();
  const others = locales.filter((l) => l !== locale);
  return (
    <nav aria-label={label} className={className}>
      <ul className={cn("flex", variant === "pill" ? "gap-1.5 md:gap-2" : "flex-col gap-2.5")}>
        {others.map((l) => (
          <li key={l}>
            <Link
              href={switchLocale(pathname, l) + query}
              hrefLang={l}
              lang={l}
              dir={localeConfig[l].dir}
              className={cn(
                l === "ar" ? "font-sans" : "font-latin",
                variant === "pill"
                  ? "flex h-[38px] items-center rounded-full border-[1.5px] border-ink px-3 text-[12.5px] font-semibold whitespace-nowrap transition-colors hover:bg-ink hover:text-white md:h-11 md:px-4 md:text-sm"
                  : "text-[15px] hover:text-accent",
              )}
            >
              {localeConfig[l].label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
