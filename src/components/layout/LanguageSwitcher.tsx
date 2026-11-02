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
  /** "pill" for the header, "list" for the footer. */
  variant?: "pill" | "list";
  className?: string;
}

/** Links to the same page in every other language. */
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
  return (
    <nav aria-label={label} className={className}>
      <ul className={cn("flex", variant === "pill" ? "gap-0.5 rounded-full border-[1.5px] border-ink p-0.5" : "flex-col gap-2.5")}>
        {locales.map((l) => {
          const active = l === locale;
          const { label: name, short } = localeConfig[l];
          return (
            <li key={l}>
              <Link
                href={switchLocale(pathname, l) + query}
                hrefLang={l}
                lang={l}
                aria-current={active ? "true" : undefined}
                title={name}
                className={cn(
                  variant === "pill"
                    ? "grid h-8 min-w-9 place-items-center rounded-full px-2.5 text-[12.5px] font-bold transition-colors"
                    : "text-sm font-semibold hover:text-accent",
                  variant === "pill" && (active ? "bg-ink text-white" : "hover:bg-ink/10"),
                  variant === "list" && active && "text-accent",
                  l === "ar" ? "font-sans" : "font-latin",
                )}
              >
                {variant === "pill" ? short : name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
