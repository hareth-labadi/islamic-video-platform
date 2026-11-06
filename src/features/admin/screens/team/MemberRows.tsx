"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { CheckIcon, CopyIcon, TelegramIcon } from "@/components/ui/icons";
import { usePanel } from "../../AdminContext";
import { api, type Member, type Role } from "../../api/client";
import { useAction, useNow } from "../../api/hooks";
import { relativeTime } from "../../lib/format";
import { canManageMember, grantableRoles } from "../../permissions";
import { Avatar, StatusBadge, personTone } from "../../ui/display";
import { Select } from "../../ui/form";
import { MailIcon, TrashIcon } from "../../ui/icons";
import { ConfirmDialog, useToast } from "../../ui/overlay";

export function RequestRow({ member }: { member: Member }) {
  const { t, locale, sheikh, member: me } = usePanel();
  const now = useNow();
  const toast = useToast();
  const [run, busy] = useAction();
  const roles = grantableRoles(me.role);
  const [role, setRole] = useState<Exclude<Role, "owner">>("editor");
  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-paper p-4 md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Avatar name={member.name} size={42} tone={personTone(member.id)} />
        <div className="min-w-0">
          <p className="font-bold">{member.name}</p>
          <p className="truncate font-latin text-xs text-muted" dir="ltr">
            {member.email}
          </p>
          {member.message && <p className="mt-2 border-s-2 border-accent ps-3 text-[13.5px] leading-relaxed text-subtle">{member.message}</p>}
          <p className="mt-1.5 text-xs font-semibold text-muted">{now ? t.team.requestedAt(relativeTime(member.createdAt, locale, t, now)) : ""}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {roles.length > 1 ? (
          <Select aria-label={t.team.approveAs} value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="h-9 w-36 rounded-full text-[13px]">
            {roles.map((r) => (
              <option key={r} value={r}>
                {t.roles[r]}
              </option>
            ))}
          </Select>
        ) : (
          <span className="text-xs font-semibold text-muted">
            {t.team.approveAs} {t.roles.editor}
          </span>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            try {
              await run(() => api.team.approve(member.id, sheikh.id, role));
              toast(t.team.approved(member.name));
            } catch {
              toast(t.common.error, "error");
            }
          }}
          className={buttonClasses({ variant: "accent", size: "sm" })}
        >
          <CheckIcon size={15} />
          {t.team.approve}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            await run(() => api.team.decline(member.id, sheikh.id)).catch(() => undefined);
            toast(t.team.declined);
          }}
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          {t.team.decline}
        </button>
      </div>
    </li>
  );
}

export function MemberRow({ member, isMe }: { member: Member; isMe: boolean }) {
  const { t, locale, sheikh, sheikhs, member: me, can } = usePanel();
  const now = useNow();
  const toast = useToast();
  const [run, busy] = useAction();
  const [revoking, setRevoking] = useState(false);
  const manageable = canManageMember(me, member);
  const others = member.sheikhIds.filter((id) => id !== sheikh.id);
  const contact = member.email ?? (member.telegram ? `@${member.telegram}` : "");
  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-3">
      <Avatar name={member.name} size={42} tone={member.role === "owner" ? "accent" : personTone(member.id)} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-bold">
          <span className="truncate">{member.name}</span>
          {isMe && <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] font-bold text-subtle">{t.common.you}</span>}
        </p>
        <p className="truncate font-latin text-xs text-muted" dir="ltr">
          {contact}
        </p>
      </div>
      {others.length > 0 && (
        <span className="hidden items-center gap-1.5 text-xs font-semibold text-muted md:flex" title={t.team.manages}>
          +
          {others.map((id) => {
            const s = sheikhs.find((x) => x.id === id);
            return <Avatar key={id} name={s?.name[locale] ?? id} monogram={s?.monogram ?? "?"} size={24} tone="paper" />;
          })}
        </span>
      )}
      <span className="hidden w-32 text-end text-xs font-semibold text-muted lg:block">{member.lastActiveAt && now ? t.team.lastActive(relativeTime(member.lastActiveAt, locale, t, now)) : ""}</span>
      {manageable && can("team.manageAdmins") ? (
        <Select
          aria-label={`${t.team.role}: ${member.name}`}
          value={member.role}
          disabled={busy}
          onChange={async (e) => {
            try {
              await run(() => api.team.updateRole(member.id, e.target.value as Exclude<Role, "owner">));
              toast(t.team.roleChanged);
            } catch {
              toast(t.common.error, "error");
            }
          }}
          className="h-9 w-32 rounded-full text-[13px]"
        >
          <option value="admin">{t.roles.admin}</option>
          <option value="editor">{t.roles.editor}</option>
        </Select>
      ) : (
        <RoleBadge role={member.role} />
      )}
      {manageable ? (
        <button type="button" onClick={() => setRevoking(true)} aria-label={`${t.team.revoke}: ${member.name}`} className="grid size-9 place-items-center rounded-full text-muted hover:bg-paper hover:text-[#B42318]">
          <TrashIcon size={16} />
        </button>
      ) : (
        <span className="size-9" aria-hidden="true" />
      )}
      <ConfirmDialog
        open={revoking}
        onClose={() => setRevoking(false)}
        title={t.team.revokeTitle(member.name)}
        body={t.team.revokeBody(sheikh.name[locale])}
        confirmLabel={t.team.revoke}
        cancelLabel={t.common.cancel}
        busy={busy}
        onConfirm={async () => {
          try {
            await run(() => api.team.revoke(member.id, sheikh.id));
            setRevoking(false);
            toast(t.team.revoked);
          } catch {
            toast(t.common.error, "error");
          }
        }}
      />
    </li>
  );
}

export function InvitationRow({ member, inviter }: { member: Member; inviter?: Member }) {
  const { t, locale, sheikh, member: me } = usePanel();
  const now = useNow();
  const toast = useToast();
  const [run, busy] = useAction();
  const manageable = canManageMember(me, member);
  const viaTelegram = !member.email && !!member.telegram;
  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-3">
      <span className={cn("grid size-[42px] shrink-0 place-items-center rounded-full", viaTelegram ? "bg-[#2AABEE]/15 text-[#1E88C7]" : "bg-paper")}>{viaTelegram ? <TelegramIcon size={20} /> : <MailIcon size={19} />}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-latin font-bold" dir="ltr">
          {member.email ?? `@${member.telegram}`}
        </p>
        <p className="text-xs font-semibold text-muted">
          {viaTelegram ? t.team.viaTelegram : t.team.viaEmail}
          {inviter && now && <> · {t.team.invitedBy(inviter.name, relativeTime(member.createdAt, locale, t, now))}</>}
        </p>
      </div>
      <RoleBadge role={member.role} />
      <StatusBadge status="invited" label={t.status.invited} />
      {manageable && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              const result = await run(() => api.team.resendInvite(member.id));
              if (viaTelegram) {
                await navigator.clipboard?.writeText(result.inviteUrl).catch(() => undefined);
                toast(t.common.copied);
              } else toast(t.team.resent);
            }}
            className={buttonClasses({ variant: "outline", size: "sm" })}
          >
            {viaTelegram ? <CopyIcon size={15} /> : <MailIcon size={15} />}
            {viaTelegram ? t.team.copyLink : t.team.resend}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              await run(() => api.team.revoke(member.id, sheikh.id));
              toast(t.team.canceled);
            }}
            aria-label={`${t.team.cancelInvite}: ${member.email ?? member.telegram}`}
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-paper hover:text-[#B42318]"
          >
            <TrashIcon size={16} />
          </button>
        </div>
      )}
    </li>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const { t } = usePanel();
  return (
    <span className={cn("inline-flex h-7 items-center rounded-full px-3 text-xs font-bold", role === "owner" ? "bg-accent" : role === "admin" ? "bg-ink text-white" : "border-[1.5px] border-ink")}>{t.roles[role]}</span>
  );
}
