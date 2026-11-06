"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { CheckIcon, CopyIcon, TelegramIcon } from "@/components/ui/icons";
import { usePanel } from "../../AdminContext";
import { api, isApiError, type InviteResult, type Role } from "../../api/client";
import { useAction } from "../../api/hooks";
import { telegramUsername } from "../../lib/links";
import { grantableRoles } from "../../permissions";
import { Avatar } from "../../ui/display";
import { Field, Segmented, TextArea, TextInput, focusFirstError } from "../../ui/form";
import { SpinnerIcon } from "../../ui/icons";
import { Dialog, useToast } from "../../ui/overlay";
import { isEmail } from "../../rules";

export function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, locale, sheikh, sheikhs, member } = usePanel();
  const toast = useToast();
  const [run, busy] = useAction();
  const roles = grantableRoles(member.role);
  const [via, setVia] = useState<"email" | "telegram">("email");
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Exclude<Role, "owner">>("editor");
  const [sheikhIds, setSheikhIds] = useState<string[]>([sheikh.id]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ contact?: string; sheikhIds?: string; message?: string }>({});
  const [result, setResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  const reset = () => {
    setContact("");
    setName("");
    setMessage("");
    setErrors({});
    setResult(null);
    setCopied(false);
    setSheikhIds([sheikh.id]);
    onClose();
  };

  const submit = async () => {
    const next: typeof errors = {};
    if (!contact.trim()) next.contact = t.validation.required;
    else if (via === "email" && !isEmail(contact)) next.contact = t.validation.email;
    else if (via === "telegram" && !telegramUsername(contact)) next.contact = t.validation.telegram;
    if (sheikhIds.length === 0) next.sheikhIds = t.validation.sheikhs;
    if (message.length > 500) next.message = t.validation.max(500);
    setErrors(next);
    if (Object.keys(next).length) return focusFirstError(form.current);
    try {
      const res = await run(() =>
        api.team.invite({
          sheikhIds,
          role,
          name: name.trim() || undefined,
          email: via === "email" ? contact.trim() : undefined,
          telegram: via === "telegram" ? (telegramUsername(contact) ?? undefined) : undefined,
          message: message.trim() || undefined,
        }),
      );
      if (via === "email") {
        toast(t.inviteForm.sent(contact.trim()));
        reset();
      } else setResult(res);
    } catch (e) {
      setErrors({ contact: isApiError(e) && e.code === "conflict" ? `${contact} — ${t.status.active}` : isApiError(e) && e.code === "forbidden" ? t.common.forbidden : t.common.error });
    }
  };

  const user = telegramUsername(contact);

  return (
    <Dialog
      open={open}
      onClose={reset}
      title={result ? t.inviteForm.linkReady : t.inviteForm.title}
      closeLabel={t.common.close}
      footer={
        result ? (
          <button type="button" onClick={reset} className={buttonClasses({ variant: "ink" })}>
            {t.inviteForm.done}
          </button>
        ) : (
          <>
            <button type="button" onClick={reset} className={buttonClasses({ variant: "ghost" })}>
              {t.common.cancel}
            </button>
            <button type="button" onClick={() => void submit()} disabled={busy} className={buttonClasses({ variant: "accent" })}>
              {busy && <SpinnerIcon size={16} />}
              {via === "email" ? t.inviteForm.send : t.inviteForm.createLink}
            </button>
          </>
        )
      }
    >
      {result ? (
        <div className="flex flex-col gap-4">
          <p className="text-[14.5px] text-subtle">{t.inviteForm.linkLead(`@${user}`)}</p>
          <div className="flex items-center gap-2 rounded-2xl bg-paper p-2 ps-4">
            <code dir="ltr" className="min-w-0 flex-1 truncate font-latin text-[13px]">
              {result.inviteUrl}
            </code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard?.writeText(result.inviteUrl).catch(() => undefined);
                setCopied(true);
              }}
              className={buttonClasses({ variant: copied ? "ink" : "accent", size: "sm" })}
            >
              {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
              {copied ? t.common.copied : t.common.copy}
            </button>
          </div>
          <a href={`https://t.me/${user}`} target="_blank" rel="noreferrer" className={cn(buttonClasses({ variant: "outline" }), "self-start")}>
            <TelegramIcon size={18} />
            {t.inviteForm.openTelegram}
          </a>
        </div>
      ) : (
        <form
          ref={form}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="flex flex-col gap-5"
        >
          <Field label={t.inviteForm.via} group compact>
            <Segmented
              label={t.inviteForm.via}
              value={via}
              onChange={(v) => {
                setVia(v);
                setErrors({});
              }}
              options={[
                { value: "email", label: t.inviteForm.email },
                { value: "telegram", label: t.inviteForm.telegram },
              ]}
            />
          </Field>
          <Field label={via === "email" ? t.inviteForm.emailLabel : t.inviteForm.telegramLabel} error={errors.contact} hint={via === "telegram" ? t.inviteForm.telegramHint : undefined}>
            <TextInput dir="ltr" type={via === "email" ? "email" : "text"} value={contact} onChange={(e) => setContact(e.target.value)} placeholder={via === "email" ? "name@example.com" : "@username"} className="text-start font-latin" />
          </Field>
          <Field label={t.inviteForm.name} optional={t.common.optional}>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={t.inviteForm.namePlaceholder} />
          </Field>
          <Field label={t.inviteForm.role} group compact hint={roles.includes("admin") ? undefined : t.inviteForm.adminOnlyOwner}>
            <Segmented
              label={t.inviteForm.role}
              value={role}
              onChange={setRole}
              options={(["editor", "admin"] as const).map((r) => ({ value: r, label: t.roles[r], disabled: !roles.includes(r) }))}
            />
          </Field>
          {sheikhs.length > 1 && (
            <Field label={t.inviteForm.sheikhs} group compact error={errors.sheikhIds}>
              <div className="flex flex-wrap gap-2">
                {sheikhs.map((s) => {
                  const checked = sheikhIds.includes(s.id);
                  return (
                    <label key={s.id} className={cn("inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-[1.5px] ps-1 pe-3.5 text-[13.5px] font-semibold", checked ? "border-ink bg-ink text-white" : "border-line bg-card")}>
                      <input type="checkbox" className="sr-only" checked={checked} onChange={() => setSheikhIds((ids) => (checked ? ids.filter((x) => x !== s.id) : [...ids, s.id]))} />
                      <Avatar name={s.name[locale]} monogram={s.monogram} size={30} tone={checked ? "accent" : "paper"} />
                      {s.name[locale]}
                    </label>
                  );
                })}
              </div>
            </Field>
          )}
          <Field label={t.inviteForm.message} optional={t.common.optional} error={errors.message}>
            <TextArea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
        </form>
      )}
    </Dialog>
  );
}
