"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { Sticker } from "@/components/ui/Sticker";
import { useAdmin } from "../../AdminContext";
import { api, isApiError, isDemo } from "../../api/client";
import { useQuery } from "../../api/hooks";
import { adminLocales } from "../../i18n";
import { safeNext, switchAdminLocale } from "../../routes";
import { Field, Select, TextArea, TextInput, focusFirstError } from "../../ui/form";
import { ErrorNote } from "../../ui/display";
import { ChevronIcon, MailIcon, SpinnerIcon } from "../../ui/icons";
import { isEmail } from "../../rules";


/** Demo accounts (mock data) — one per role, to try the permissions. */
const demoAccounts = [
  { email: "sheikh@example.org", role: "owner" as const, name: { ar: "الشيخ", fr: "Le cheikh" } },
  { email: "yacine@example.org", role: "admin" as const, name: { ar: "ياسين · شيخان", fr: "Yacine · 2 cheikhs" } },
  { email: "amina@example.org", role: "editor" as const, name: { ar: "أمينة", fr: "Amina" } },
];

type Step = "email" | "code" | "request" | "requested";

export function SignInScreen() {
  const { t, routes, session, setSession } = useAdmin();
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (session) router.replace(safeNext(params.get("next"), routes));
  }, [session, router, routes, params]);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <Art />
      <div className="flex flex-col px-5 py-6 md:px-12 md:py-10">
        <div className="flex items-center justify-between gap-3">
          <Link href={routes.site} className="inline-flex items-center gap-1 text-[13px] font-semibold text-subtle hover:text-ink">
            <ChevronIcon size={16} className="rtl:-scale-x-100" />
            {t.common.viewSite}
          </Link>
          <LocaleLinks />
        </div>
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10">
          {params.get("invite") && step === "email" && (
            <p className="mb-6 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold">{t.signIn.invitedBanner}</p>
          )}
          {step === "email" && (
            <EmailStep
              initial={email}
              onSent={(value) => {
                setEmail(value);
                setStep("code");
              }}
              onRequest={() => setStep("request")}
            />
          )}
          {step === "code" && (
            <CodeStep
              email={email}
              onBack={() => setStep("email")}
              onSignedIn={(s) => {
                setSession(s);
              }}
            />
          )}
          {step === "request" && <RequestStep initialEmail={email} onBack={() => setStep("email")} onSent={() => setStep("requested")} />}
          {step === "requested" && (
            <div className="flex flex-col items-start gap-4">
              <Sticker emoji="🤲" tone="accent" tilt={-5} className="relative" />
              <h1 className="text-[30px] leading-tight font-bold">{t.request.sentTitle}</h1>
              <p className="text-[15px] text-subtle">{t.request.sentLead}</p>
              <button type="button" onClick={() => setStep("email")} className={buttonClasses({ variant: "outline" })}>
                {t.request.backToSignIn}
              </button>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-muted">{t.signIn.footer}</p>
      </div>
    </div>
  );
}

function LocaleLinks() {
  const { locale, t } = useAdmin();
  const pathname = usePathname();
  const params = useSearchParams().toString();
  return (
    <nav aria-label={t.nav.language} className="flex h-10 items-center rounded-full border-[1.5px] border-ink p-0.5">
      {adminLocales.map((l) => (
        <Link
          key={l}
          href={switchAdminLocale(pathname, l) + (params ? `?${params}` : "")}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          className={cn("grid h-full min-w-9 place-items-center rounded-full px-2 text-[13px] font-bold", l === locale ? "bg-ink text-white" : "hover:bg-ink/5", l === "ar" ? "font-sans" : "font-latin")}
        >
          {l === "ar" ? "ع" : "FR"}
        </Link>
      ))}
    </nav>
  );
}

/** The ink block: the brand, the outlined numerals and floating stickers. */
function Art() {
  const { t } = useAdmin();
  return (
    <div className="relative hidden overflow-hidden bg-ink p-10 text-white lg:m-3 lg:flex lg:flex-col lg:rounded-tile xl:p-14">
      <div className="flex items-center gap-3">
        <Image src="/brand/mark-light.png" alt="" width={242} height={164} className="h-10 w-auto" priority />
        <span lang="ar" dir="rtl" className="font-sans text-2xl font-bold">
          {t.brand}
        </span>
      </div>

      <div className="relative mt-auto mb-auto py-10">
        <p
          lang="ar"
          dir="rtl"
          aria-hidden="true"
          className="font-sans text-[clamp(5rem,11vw,10rem)] leading-[0.95] font-bold text-stroke [--stroke-width:1.5px] [--stroke:rgb(255_255_255/.38)]"
        >
          {t.brand}
        </p>
        <p className="mt-6 max-w-[30ch] text-[22px] leading-snug font-semibold text-white/90">{t.signIn.tagline}</p>
      </div>

      <div className="grid grid-cols-3 gap-3" aria-hidden="true">
        <div className="relative flex aspect-[4/3] items-end rounded-cover bg-series p-3">
          <span className="font-latin text-6xl leading-none font-extrabold tracking-[-0.06em] text-stroke [--stroke:rgb(255_255_255/.38)]">12</span>
          <Sticker emoji="📚" label={t.signIn.stickers.lessons} tone="white" tilt={-6} className="absolute -top-5 start-3" />
        </div>
        <div className="relative flex aspect-[4/3] items-end rounded-cover bg-short p-3">
          <span className="font-latin text-6xl leading-none font-extrabold tracking-[-0.06em] text-stroke [--stroke:rgb(255_255_255/.38)]">1′</span>
        </div>
        <div className="relative flex aspect-[4/3] items-end rounded-cover bg-accent p-3 text-ink">
          <span className="font-sans text-6xl leading-none font-bold text-stroke [--stroke:rgb(22_22_22/.28)]">؟</span>
          <Sticker emoji="🎙️" label={t.signIn.stickers.voice} tone="pink" tilt={5} delay={600} className="absolute -top-6 end-2" />
        </div>
      </div>
      <Sticker emoji="🤝" label={t.signIn.stickers.team} tone="lilac" tilt={-4} delay={1200} className="absolute end-10 top-24" />
    </div>
  );
}

function EmailStep({ initial, onSent, onRequest }: { initial: string; onSent: (email: string) => void; onRequest: () => void }) {
  const { t, locale } = useAdmin();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  const send = async (email: string) => {
    if (!isEmail(email)) {
      setError(email.trim() ? t.validation.email : t.validation.required);
      focusFirstError(form.current);
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      await api.auth.requestLink(email.trim(), locale);
      onSent(email.trim());
    } catch {
      setError(t.common.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      ref={form}
      noValidate
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        void send(value);
      }}
      className="flex flex-col gap-6"
    >
      <div>
        <span className="mb-4 inline-flex h-7 items-center rounded-full bg-accent px-3 text-xs font-bold">{t.panel}</span>
        <h1 className="text-[32px] leading-[1.15] font-bold tracking-[-0.01em] md:text-[40px]">{t.signIn.title}</h1>
        <p className="mt-2 text-[15px] text-subtle">{t.signIn.lead}</p>
      </div>
      <Field label={t.signIn.emailLabel} error={error} hint={t.signIn.noPassword}>
        <TextInput type="email" inputMode="email" autoComplete="email" dir="ltr" placeholder="name@example.com" value={value} onChange={(e) => setValue(e.target.value)} className="h-14 text-start text-base" />
      </Field>
      <button type="submit" disabled={busy} className={buttonClasses({ variant: "accent", size: "lg", className: "w-full" })}>
        {busy ? <SpinnerIcon size={18} /> : <MailIcon size={18} />}
        {t.signIn.sendLink}
      </button>
      <button type="button" onClick={onRequest} className="text-sm font-semibold text-subtle underline-offset-4 hover:text-ink hover:underline">
        {t.signIn.requestAccess}
      </button>

      {isDemo && (
        <div className="rounded-tile border-[1.5px] border-dashed border-ink/40 p-4">
          <p className="text-sm font-bold">{t.signIn.demoTitle}</p>
          <p className="mt-1 text-[13px] text-subtle">{t.signIn.demoLead}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  setValue(a.email);
                  void send(a.email);
                }}
                className="inline-flex h-9 items-center gap-2 rounded-full border-[1.5px] border-ink bg-card ps-1 pe-3.5 text-[13px] font-semibold transition-colors hover:bg-ink hover:text-white"
              >
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", a.role === "owner" ? "bg-accent text-ink" : a.role === "admin" ? "bg-ink text-white" : "bg-paper text-ink")}>
                  {t.roles[a.role]}
                </span>
                {a.name[locale]}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}

function CodeStep({ email, onBack, onSignedIn }: { email: string; onBack: () => void; onSignedIn: (s: Awaited<ReturnType<typeof api.auth.verifyCode>>) => void }) {
  const { t, locale } = useAdmin();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(30);
  const [note, setNote] = useState<string>();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const verify = async (value: string) => {
    if (!/^\d{6}$/.test(value)) {
      setError(t.validation.code);
      input.current?.focus();
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      onSignedIn(await api.auth.verifyCode(email, value));
    } catch (e) {
      setError(isApiError(e) && e.code === "bad_code" ? t.signIn.badCode : t.common.error);
      input.current?.select();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void verify(code);
      }}
      className="flex flex-col gap-6"
    >
      <div>
        <Sticker emoji="📬" tone="accent" tilt={-6} className="relative mb-4" />
        <h1 className="text-[32px] leading-[1.15] font-bold md:text-[40px]">{t.signIn.checkTitle}</h1>
        <p className="mt-2 text-[15px] text-subtle">{t.signIn.checkLead(email)}</p>
      </div>
      <Field label={t.signIn.codeLabel} error={error} hint={isDemo ? t.signIn.demoLead : undefined}>
        <TextInput
          ref={input}
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          dir="ltr"
          value={code}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(digits);
            if (digits.length === 6) void verify(digits);
          }}
          placeholder="••••••"
          className="h-16 text-center font-latin text-[28px] font-bold tracking-[0.5em]"
        />
      </Field>
      <button type="submit" disabled={busy} className={buttonClasses({ variant: "ink", size: "lg", className: "w-full" })}>
        {busy && <SpinnerIcon size={18} />}
        {t.signIn.verify}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <button type="button" onClick={onBack} className="font-semibold text-subtle hover:text-ink">
          {t.signIn.otherEmail}
        </button>
        <button
          type="button"
          disabled={wait > 0}
          onClick={async () => {
            await api.auth.requestLink(email, locale);
            setWait(30);
            setNote(t.signIn.resent);
          }}
          className="font-semibold underline-offset-4 enabled:hover:underline disabled:text-muted"
        >
          {wait > 0 ? t.signIn.resendIn(wait) : t.signIn.resend}
        </button>
      </div>
      <p aria-live="polite" className="text-sm font-semibold text-series">
        {note}
      </p>
    </form>
  );
}

function RequestStep({ initialEmail, onBack, onSent }: { initialEmail: string; onBack: () => void; onSent: () => void }) {
  const { t, locale } = useAdmin();
  const { data: sheikhs } = useQuery("directory", () => api.sheikhs.directory());
  const [values, setValues] = useState({ name: "", email: initialEmail, sheikhId: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const set = (key: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (values.name.trim().length < 2) next.name = values.name.trim() ? t.validation.min(2) : t.validation.required;
    if (!isEmail(values.email)) next.email = values.email.trim() ? t.validation.email : t.validation.required;
    if (!values.sheikhId) next.sheikhId = t.validation.required;
    if (values.message.length > 500) next.message = t.validation.max(500);
    setErrors(next);
    if (Object.keys(next).length) return focusFirstError(form.current);
    setBusy(true);
    setFailed(false);
    try {
      await api.auth.requestAccess({ name: values.name, email: values.email, sheikhId: values.sheikhId, message: values.message });
      onSent();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form ref={form} noValidate onSubmit={submit} className="flex flex-col gap-5">
      <button type="button" onClick={onBack} className="inline-flex w-fit items-center gap-1 text-[13px] font-semibold text-subtle hover:text-ink">
        <ChevronIcon size={16} className="rtl:-scale-x-100" />
        {t.request.backToSignIn}
      </button>
      <div>
        <h1 className="text-[28px] leading-[1.15] font-bold md:text-[34px]">{t.request.title}</h1>
        <p className="mt-2 text-[15px] text-subtle">{t.request.lead}</p>
      </div>
      <Field label={t.request.name} error={errors.name}>
        <TextInput autoComplete="name" value={values.name} onChange={set("name")} />
      </Field>
      <Field label={t.request.email} error={errors.email}>
        <TextInput type="email" dir="ltr" autoComplete="email" value={values.email} onChange={set("email")} className="text-start" />
      </Field>
      <Field label={t.request.sheikh} error={errors.sheikhId}>
        <Select value={values.sheikhId} onChange={set("sheikhId")}>
          <option value="">—</option>
          {sheikhs?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name[locale]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t.request.message} optional={t.common.optional} error={errors.message}>
        <TextArea rows={3} placeholder={t.request.messagePlaceholder} value={values.message} onChange={set("message")} />
      </Field>
      {failed && <ErrorNote>{t.common.error}</ErrorNote>}
      <button type="submit" disabled={busy} className={buttonClasses({ variant: "accent", size: "lg", className: "w-full" })}>
        {busy && <SpinnerIcon size={18} />}
        {t.request.send}
      </button>
    </form>
  );
}
