import type { Metadata } from "next";
import { getSheikh } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { localeFrom } from "@/i18n/params";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  return { title: getDictionary(await localeFrom(params)).about.title };
}

/** About the sheikh — placeholder text until the site team writes it. */
export default async function Page({ params }: PageProps<"/[locale]/about">) {
  const locale = await localeFrom(params);
  const t = getDictionary(locale);
  const sheikh = getSheikh();
  return (
    <div className="px-3 pb-20 md:px-0">
      <section className="relative isolate flex min-h-[320px] flex-col justify-end gap-4 overflow-hidden rounded-[28px] bg-ink p-8 text-white md:p-12">
        <OutlineNumeral value="ع" stroke="rgb(242 176 53 / .2)" strokeWidth="2px" className="-z-10 -top-16 font-sans text-[320px]" />
        <span className="text-[13px] font-semibold text-accent">{t.about.title}</span>
        <h1 className="text-[40px] leading-[1.2] font-bold md:text-6xl">{sheikh.name[locale]}</h1>
        {sheikh.bio && <p className="max-w-xl text-lg leading-[1.8] opacity-85">{sheikh.bio[locale]}</p>}
      </section>
      <p className="mt-8 max-w-3xl text-lg leading-[1.9] text-subtle">{t.about.body}</p>
    </div>
  );
}
