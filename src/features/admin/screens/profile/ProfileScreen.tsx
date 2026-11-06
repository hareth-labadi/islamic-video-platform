"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { TelegramIcon, TikTokIcon, YouTubeIcon } from "@/components/ui/icons";
import { Sticker } from "@/components/ui/Sticker";
import { usePanel } from "../../AdminContext";
import { api, type AdminSheikh, type Locale } from "../../api/client";
import { useAction, useQuery } from "../../api/hooks";
import { normalizeTelegram } from "../../lib/links";
import { Avatar, ErrorNote, PageHeader, Panel, Skeleton } from "../../ui/display";
import { Counter, Field, Segmented, TextArea, TextInput, Toggle, focusFirstError } from "../../ui/form";
import { LockIcon, SpinnerIcon } from "../../ui/icons";
import { UploadDrop, imageRule } from "../../ui/inputs";
import { useToast } from "../../ui/overlay";
import { useUnsavedWarning } from "../../ui/useUnsavedWarning";
import { limits } from "../../rules";
import { LANGS, toInput, toValues, validate, type Errors, type Values } from "./profileForm";

export function ProfileScreen() {
  const { t, sheikh } = usePanel();
  const query = useQuery(`sheikh:${sheikh.id}`, () => api.sheikhs.get(sheikh.id));
  if (query.error) return <ErrorNote>{t.common.error}</ErrorNote>;
  if (!query.data)
    return (
      <div className="flex flex-col gap-5" role="status">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[560px] rounded-tile" />
      </div>
    );
  return <ProfileForm key={query.data.id} sheikh={query.data} />;
}

function ProfileForm({ sheikh }: { sheikh: AdminSheikh }) {
  const { t, locale, can, refreshSession } = usePanel();
  const toast = useToast();
  const [run, saving] = useAction();
  const initial = toValues(sheikh);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [previewLang, setPreviewLang] = useState<Locale>(locale);
  const form = useRef<HTMLFormElement>(null);
  const editable = can("profile.edit");
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  useUnsavedWarning(dirty && !saving, t.common.leaveConfirm);

  const patch = (changes: Partial<Values>) => {
    const next = { ...values, ...changes };
    setValues(next);
    if (submitted) setErrors(validate(next, t));
  };
  const setLang = (key: "name" | "honorific" | "bio", lang: Locale, value: string) => patch({ [key]: { ...values[key], [lang]: value } } as Partial<Values>);

  const save = async () => {
    setSubmitted(true);
    const found = validate(values, t);
    setErrors(found);
    if (Object.keys(found).length) return focusFirstError(form.current);
    try {
      await run(() => api.sheikhs.update(sheikh.id, toInput(values)));
      await refreshSession();
      toast(t.profile.saved);
    } catch {
      toast(t.common.error, "error");
    }
  };

  const perLang = (key: "name" | "honorific" | "bio", render: (lang: Locale) => ReactNode) => (
    <div className="grid gap-3 md:grid-cols-3">
      {LANGS.map((l) => (
        <div key={l} className="flex flex-col gap-1">
          <span className="text-[11.5px] font-bold text-muted">{t.inLang[l]}</span>
          {render(l)}
          {errors[`${key}.${l}`] && (
            <span className="text-[12.5px] font-semibold text-[#B42318]" role="alert">
              {errors[`${key}.${l}`]}
            </span>
          )}
        </div>
      ))}
    </div>
  );

  const name = (values.name[previewLang] || values.name.fr).trim();
  const honorific = (values.honorific[previewLang] || "").trim();
  const bio = (values.bio[previewLang] || values.bio.fr).trim();

  return (
    <form
      ref={form}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <PageHeader title={t.profile.title} lead={t.profile.lead} />
      {!editable && (
        <p className="mb-5 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm font-semibold text-subtle">
          <LockIcon size={16} />
          {t.profile.readOnly}
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <fieldset disabled={!editable} className="flex min-w-0 flex-col gap-5">
          <Panel title={t.profile.identity} id="identity-title" bodyClassName="flex flex-col gap-6">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_180px]">
              <Field label={t.profile.photo} optional={t.common.optional} hint={t.profile.photoHint}>
                <UploadDrop
                  value={values.photo}
                  onChange={(url) => setValues((v) => ({ ...v, photo: url }))}
                  purpose="avatar"
                  rule={imageRule}
                  shape="square"
                  labels={{ ...t.upload, replace: t.profile.changePhoto, remove: t.profile.removePhoto }}
                  errors={{ type: t.validation.fileType, size: t.validation.fileSize(imageRule.maxMb) }}
                  disabled={!editable}
                />
              </Field>
              <Field label={t.profile.monogram} hint={t.profile.monogramHint} error={errors.monogram}>
                <TextInput value={values.monogram} maxLength={2} onChange={(e) => patch({ monogram: e.target.value })} className="h-14 text-center font-sans text-3xl font-bold" />
              </Field>
            </div>
            <Field label={t.profile.name} hint={`${t.profile.nameHint} ${t.profile.kabFallback}`} group>
              {perLang("name", (l) => (
                <TextInput aria-label={`${t.profile.name} — ${t.langs[l]}`} aria-invalid={!!errors[`name.${l}`] || undefined} dir={l === "ar" ? "rtl" : "ltr"} lang={l} value={values.name[l]} onChange={(e) => setLang("name", l, e.target.value)} className="font-semibold" />
              ))}
            </Field>
            <Field label={t.profile.honorific} optional={t.common.optional} group>
              {perLang("honorific", (l) => (
                <TextInput aria-label={`${t.profile.honorific} — ${t.langs[l]}`} aria-invalid={!!errors[`honorific.${l}`] || undefined} dir={l === "ar" ? "rtl" : "ltr"} lang={l} value={values.honorific[l]} placeholder={l === "ar" ? "حفظه الله" : l === "fr" ? "qu’Allah le préserve" : ""} onChange={(e) => setLang("honorific", l, e.target.value)} />
              ))}
            </Field>
            <Field label={t.profile.bio} optional={t.common.optional} group>
              <div className="flex flex-col gap-3">
                {LANGS.map((l) => (
                  <div key={l} className="flex flex-col gap-1">
                    <span className="flex justify-between text-[11.5px] font-bold text-muted">
                      {t.inLang[l]}
                      <Counter value={values.bio[l]} max={limits.sheikh.bio} />
                    </span>
                    <TextArea aria-label={`${t.profile.bio} — ${t.langs[l]}`} aria-invalid={!!errors[`bio.${l}`] || undefined} rows={2} dir={l === "ar" ? "rtl" : "ltr"} lang={l} value={values.bio[l]} onChange={(e) => setLang("bio", l, e.target.value)} className="min-h-20" />
                    {errors[`bio.${l}`] && <span className="text-[12.5px] font-semibold text-[#B42318]">{errors[`bio.${l}`]}</span>}
                  </div>
                ))}
              </div>
            </Field>
          </Panel>

          <Panel title={t.profile.socials} id="socials-title" bodyClassName="flex flex-col gap-4">
            <p className="-mt-1 text-[13px] text-muted">{t.profile.socialsHint}</p>
            <Social icon={<TelegramIcon size={20} />} tile="bg-[#2AABEE] text-white" label={t.profile.telegram} error={errors.telegram}>
              <TextInput dir="ltr" value={values.telegram} placeholder="https://t.me/…" onChange={(e) => patch({ telegram: e.target.value })} onBlur={() => values.telegram && normalizeTelegram(values.telegram) && patch({ telegram: normalizeTelegram(values.telegram)! })} className="text-start font-latin" />
            </Social>
            <Social icon={<TikTokIcon size={20} />} tile="bg-ink text-white" label={t.profile.tiktok} error={errors.tiktok}>
              <TextInput dir="ltr" value={values.tiktok} placeholder="https://www.tiktok.com/@…" onChange={(e) => patch({ tiktok: e.target.value })} className="text-start font-latin" />
            </Social>
            <Social icon={<YouTubeIcon size={20} />} tile="bg-[#FF0033] text-white" label={t.profile.youtube} error={errors.youtube}>
              <TextInput dir="ltr" value={values.youtube} placeholder="https://www.youtube.com/@…" onChange={(e) => patch({ youtube: e.target.value })} className="text-start font-latin" />
            </Social>
          </Panel>

          <Panel title={t.profile.questions} id="questions-title">
            <Toggle checked={values.takesQuestions} onChange={(v) => patch({ takesQuestions: v })} label={t.profile.takesQuestions} hint={t.profile.takesQuestionsHint} disabled={!editable} />
          </Panel>
        </fieldset>

        <aside aria-label={t.profile.preview} className="flex flex-col gap-3 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-sm font-bold">{t.profile.preview}</span>
            <Segmented label={t.profile.preview} value={previewLang} onChange={setPreviewLang} size="sm" options={LANGS.map((l) => ({ value: l, label: l === "ar" ? "ع" : l.toUpperCase() }))} />
          </div>
          <div lang={previewLang} dir={previewLang === "ar" ? "rtl" : "ltr"} className={cn("relative overflow-visible rounded-tile bg-ink p-6 text-white", previewLang !== "ar" && "font-latin")}>
            <span aria-hidden="true" className="pointer-events-none absolute end-4 -top-6 font-sans text-[150px] leading-none font-bold text-stroke [--stroke:rgb(255_255_255/.2)] [--stroke-width:1.5px]">
              {values.monogram || "؟"}
            </span>
            <Avatar name={name} photo={values.photo} monogram={values.monogram || "؟"} size={84} tone="accent" className="relative ring-4 ring-ink" />
            <p className="relative mt-4 text-2xl leading-tight font-bold">{name || "—"}</p>
            {honorific && <p className="relative mt-1 text-sm font-semibold text-accent">{honorific}</p>}
            {bio && <p className="relative mt-3 text-[14px] leading-relaxed text-white/80">{bio}</p>}
            <div className="relative mt-5 flex flex-wrap gap-2">
              {values.telegram && (
                <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[13px] font-semibold">
                  <TelegramIcon size={16} /> Telegram
                </span>
              )}
              {values.tiktok && (
                <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[13px] font-semibold">
                  <TikTokIcon size={16} /> TikTok
                </span>
              )}
              {values.youtube && (
                <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[13px] font-semibold">
                  <YouTubeIcon size={16} /> YouTube
                </span>
              )}
            </div>
            {values.takesQuestions && <Sticker emoji="🎙️" label={t.profile.askSticker} tone="accent" tilt={-6} className="absolute -bottom-4 start-6" />}
          </div>
        </aside>
      </div>

      {editable && (
        <div className="sticky bottom-3 z-20 mt-8 flex flex-wrap items-center gap-3 rounded-full bg-ink p-2 ps-5 text-white shadow-[0_18px_40px_-20px_rgb(22_22_22/.8)]">
          <span className="me-auto text-[13px] font-semibold text-white/75">{dirty ? t.common.unsaved : ""}</span>
          <button type="submit" disabled={saving} className={buttonClasses({ variant: "accent" })}>
            {saving && <SpinnerIcon size={16} />}
            {t.common.save}
          </button>
        </div>
      )}
    </form>
  );
}

function Social({ icon, tile, label, error, children }: { icon: ReactNode; tile: string; label: string; error?: string; children: ReactNode }) {
  return (
    <Field label={label} error={error}>
      <div className="flex items-center gap-3">
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", tile)}>{icon}</span>
        <div className="flex-1">{children}</div>
      </div>
    </Field>
  );
}
