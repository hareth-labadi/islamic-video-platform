"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { cn } from "@/lib/cn";
import { CheckIcon, ChevronDownIcon, CloseIcon } from "@/components/ui/icons";
import { useAdmin, usePanel } from "../AdminContext";
import { api, isDemo } from "../api/client";
import { useQuery } from "../api/hooks";
import { adminLocales } from "../i18n";
import { switchAdminLocale } from "../routes";
import { Avatar, personTone } from "../ui/display";
import { BoltIcon, ExternalIcon, FilmIcon, GridIcon, InboxIcon, LayersIcon, LogoutIcon, MenuIcon, UserIcon, UsersIcon } from "../ui/icons";
import { MenuItem, Popover, ToastProvider } from "../ui/overlay";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

/** Signed-in frame: waits for the session, sends signed-out visitors to the sign-in page. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { session, routes, t } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.replace(routes.signIn);
  }, [session, router, routes.signIn]);

  if (!session) return <FullPageLoading label={t.common.loading} />;
  return (
    <ToastProvider>
      <Frame>{children}</Frame>
    </ToastProvider>
  );
}

function FullPageLoading({ label }: { label: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper" role="status">
      <div className="flex flex-col items-center gap-4">
        <span className="relative grid size-16 place-items-center rounded-full bg-ink">
          <span className="absolute inset-0 animate-pulse-ring rounded-full" />
          <Image src="/brand/mark-light.png" alt="" width={242} height={164} className="h-6 w-auto" priority />
        </span>
        <span className="text-sm font-semibold text-subtle">{label}</span>
      </div>
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const { t } = usePanel();
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();

  // Close the phone drawer after navigating, and when the route is hidden.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawer(false);
  }
  useLayoutEffect(() => () => setDrawer(false), []);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[70] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:font-bold">
        {t.skipToContent}
      </a>

      <aside className="sticky top-0 hidden h-dvh lg:block">
        <Sidebar />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label={t.nav.closeMenu} className="absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 start-0 w-[min(300px,86vw)] animate-rise shadow-2xl">
            <Sidebar onClose={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <TopBar onMenu={() => setDrawer(true)} />
        <main id="main" className="mx-auto w-full max-w-[1240px] flex-1 px-4 pt-4 pb-24 md:px-8 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function useNavCounts() {
  const { sheikh } = usePanel();
  const { data } = useQuery(`nav:${sheikh.id}`, () => api.dashboard.summary(sheikh.id), { keepPrevious: true });
  return data;
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { t, routes, can } = usePanel();
  const pathname = usePathname();
  const counts = useNavCounts();

  const content: Array<{ href: string; label: string; icon: Icon; tile: string; count?: number; exact?: boolean }> = [
    { href: routes.dashboard, label: t.nav.dashboard, icon: GridIcon, tile: "bg-white/12 text-white", exact: true },
    { href: routes.videos, label: t.nav.videos, icon: FilmIcon, tile: "bg-white text-ink" },
    { href: routes.collections(), label: t.nav.playlists, icon: LayersIcon, tile: "bg-series text-white" },
    { href: routes.shorts, label: t.nav.shorts, icon: BoltIcon, tile: "bg-short text-white", count: counts?.shortsToReview },
    { href: routes.questions, label: t.nav.questions, icon: InboxIcon, tile: "bg-accent text-ink", count: counts?.pendingQuestions },
  ];
  const page: typeof content = [
    { href: routes.team, label: t.nav.team, icon: UsersIcon, tile: "bg-white/12 text-white", count: can("team.manageEditors") ? counts?.accessRequests : undefined },
    { href: routes.profile, label: t.nav.profile, icon: UserIcon, tile: "bg-white/12 text-white" },
  ];

  const isActive = (href: string, exact?: boolean) => {
    const path = href.split("?")[0];
    return exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  };

  const renderLink = (item: (typeof content)[number]) => {
    const active = isActive(item.href, item.exact);
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          onNavigate={onClose}
          className={cn(
            "group flex h-12 items-center gap-3 rounded-full ps-1.5 pe-4 text-[15px] font-semibold transition-colors",
            active ? "bg-paper text-ink" : "text-white/78 hover:bg-white/8 hover:text-white",
          )}
        >
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", item.tile, active && item.tile.includes("white/12") && "bg-ink text-white")}>
            <Icon size={18} />
          </span>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {!!item.count && (
            <span className={cn("min-w-6 rounded-full px-1.5 py-0.5 text-center font-latin text-xs font-bold", active ? "bg-ink text-white" : "bg-accent text-ink")}>{item.count}</span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label={t.nav.menu} className="flex h-full flex-col gap-6 overflow-y-auto bg-ink px-4 py-5 text-white">
      <div className="flex items-center justify-between gap-2 ps-2">
        <Link href={routes.dashboard} className="flex items-center gap-2.5" onNavigate={onClose}>
          <Image src="/brand/mark-light.png" alt="" width={242} height={164} className="h-8 w-auto" />
          <span className="flex flex-col leading-none">
            <span lang="ar" dir="rtl" className="font-sans text-xl font-bold">
              {t.brand}
            </span>
            <span className="mt-1.5 w-fit rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-bold text-ink">{t.panel}</span>
          </span>
        </Link>
        {onClose && (
          <button type="button" onClick={onClose} aria-label={t.nav.closeMenu} className="grid size-10 place-items-center rounded-full hover:bg-white/10">
            <CloseIcon size={20} />
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 px-3 text-[11px] font-bold tracking-[0.08em] text-faint uppercase">{t.nav.content}</p>
        <ul className="flex flex-col gap-1">{content.map(renderLink)}</ul>
      </div>
      <div>
        <p className="mb-2 px-3 text-[11px] font-bold tracking-[0.08em] text-faint uppercase">{t.nav.people}</p>
        <ul className="flex flex-col gap-1">{page.map(renderLink)}</ul>
      </div>

      <div className="mt-auto rounded-[1.25rem] bg-white/6 p-4">
        <p lang="ar" dir="rtl" className="font-sans text-[15px] leading-relaxed font-semibold text-white/85">
          يحمِلُ هذا العلمَ من كلِّ خلَفٍ عدولُه
        </p>
        <a href={routes.site} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-accent hover:underline">
          {t.common.viewSite}
          <ExternalIcon size={14} />
        </a>
      </div>
    </nav>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { t } = usePanel();
  return (
    <div className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-2 px-3 md:h-[72px] md:px-8">
        <button type="button" onClick={onMenu} aria-label={t.nav.openMenu} className="grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-ink lg:hidden">
          <MenuIcon size={20} />
        </button>
        <SheikhSwitcher />
        <div className="ms-auto flex items-center gap-2">
          {isDemo && (
            <span className="hidden h-8 items-center rounded-full border-[1.5px] border-dashed border-ink/50 px-3 text-xs font-bold text-subtle sm:inline-flex">{t.signIn.demoTitle}</span>
          )}
          <LocaleToggle />
          <AccountMenu />
        </div>
      </div>
    </div>
  );
}

function SheikhSwitcher() {
  const { t, sheikh, sheikhs, setSheikh, member, locale } = usePanel();
  const many = sheikhs.length > 1;
  const button = (props: Record<string, unknown>) => (
    <button
      type="button"
      {...props}
      disabled={!many}
      className="flex h-11 min-w-0 items-center gap-2.5 rounded-full bg-card ps-1 pe-3 text-start shadow-[0_1px_0_rgb(22_22_22/.06)] transition-colors enabled:hover:bg-white disabled:cursor-default md:h-12 md:pe-4"
    >
      <Avatar name={sheikh.name[locale]} photo={sheikh.photo} monogram={sheikh.monogram} size={38} tone="accent" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[14px] font-bold md:text-[15px]">{sheikh.name[locale]}</span>
        <span className="truncate text-[11.5px] font-semibold text-muted">{t.roles[member.role]}</span>
      </span>
      {many && <ChevronDownIcon size={16} className="shrink-0 text-muted" />}
    </button>
  );
  if (!many) return button({ "aria-label": sheikh.name[locale] });
  return (
    <Popover align="start" trigger={({ toggle, ...aria }) => button({ ...aria, onClick: toggle, "aria-label": `${t.nav.switchSheikh}: ${sheikh.name[locale]}` })}>
      {(close) => (
        <>
          <p className="px-3 pt-1.5 pb-2 text-xs font-bold text-muted">{t.nav.sheikhsYouManage}</p>
          {sheikhs.map((s) => (
            <MenuItem
              key={s.id}
              onSelect={() => {
                setSheikh(s.id);
                close();
              }}
            >
              <Avatar name={s.name[locale]} photo={s.photo} monogram={s.monogram} size={30} tone={s.id === sheikh.id ? "accent" : "paper"} />
              <span className="flex-1">{s.name[locale]}</span>
              {s.id === sheikh.id && <CheckIcon size={16} />}
            </MenuItem>
          ))}
        </>
      )}
    </Popover>
  );
}

function LocaleToggle() {
  const { locale, t } = usePanel();
  const pathname = usePathname();
  return (
    <nav aria-label={t.nav.language} className="flex h-10 items-center rounded-full border-[1.5px] border-ink p-0.5">
      {adminLocales.map((l) => (
        <Link
          key={l}
          href={switchAdminLocale(pathname, l)}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          className={cn(
            "grid h-full min-w-9 place-items-center rounded-full px-2 text-[13px] font-bold transition-colors",
            l === locale ? "bg-ink text-white" : "hover:bg-ink/5",
            l === "ar" ? "font-sans" : "font-latin",
          )}
        >
          {l === "ar" ? "ع" : "FR"}
        </Link>
      ))}
    </nav>
  );
}

function AccountMenu() {
  const { member, t, signOut, routes } = usePanel();
  const router = useRouter();
  return (
    <Popover
      trigger={({ toggle, ...aria }) => (
        <button type="button" {...aria} onClick={toggle} aria-label={`${t.nav.account}: ${member.name}`} className="rounded-full p-0.5 ring-ink/10 transition hover:ring-4">
          <Avatar name={member.name} size={38} tone={personTone(member.id)} />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center gap-3 px-3 pt-2 pb-3">
            <Avatar name={member.name} size={40} tone={personTone(member.id)} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{member.name}</p>
              <p className="truncate font-latin text-xs text-muted">{member.email ?? (member.telegram && `@${member.telegram}`)}</p>
            </div>
          </div>
          <div className="mb-1 border-t border-line-soft" />
          <a href={routes.site} role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-paper">
            <ExternalIcon size={18} />
            {t.common.viewSite}
          </a>
          <MenuItem
            onSelect={async () => {
              close();
              await signOut();
              router.replace(routes.signIn);
            }}
          >
            <LogoutIcon size={18} />
            {t.nav.signOut}
          </MenuItem>
        </>
      )}
    </Popover>
  );
}
