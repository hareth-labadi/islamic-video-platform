"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { usePanel } from "../../AdminContext";
import { api, type Role } from "../../api/client";
import { useQuery } from "../../api/hooks";
import { ErrorNote, PageHeader, Panel, Skeleton } from "../../ui/display";
import { LockIcon, PlusIcon } from "../../ui/icons";
import { RequestRow, MemberRow, InvitationRow } from "./MemberRows";
import { InviteDialog } from "./InviteDialog";

export function TeamScreen() {
  const { t, sheikh, locale, member: me, can } = usePanel();
  const params = useSearchParams();
  const [inviting, setInviting] = useState(params.get("invite") === "1" && can("team.manageEditors"));
  const team = useQuery(`team:${sheikh.id}`, () => api.team.list(sheikh.id), { keepPrevious: true });
  const members = team.data?.filter((m) => m.status === "active") ?? [];
  const requests = team.data?.filter((m) => m.status === "requested") ?? [];
  const invitations = team.data?.filter((m) => m.status === "invited") ?? [];
  const manages = can("team.manageEditors");

  return (
    <div>
      <PageHeader
        title={t.team.title}
        count={team.data ? members.length : undefined}
        lead={t.team.lead(sheikh.name[locale])}
        actions={
          manages && (
            <button type="button" onClick={() => setInviting(true)} className={buttonClasses({ variant: "accent" })}>
              <PlusIcon size={18} />
              {t.team.invite}
            </button>
          )
        }
      />

      {!manages && (
        <p className="mb-5 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm font-semibold text-subtle">
          <LockIcon size={16} />
          {t.team.readOnly}
        </p>
      )}
      {!!team.error && <ErrorNote>{t.common.error}</ErrorNote>}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {manages && (
            <Panel title={`${t.team.requests} · ${requests.length}`} id="requests-title">
              {team.pending ? (
                <Skeleton className="h-24" />
              ) : requests.length === 0 ? (
                <p className="text-sm font-semibold text-muted">{t.team.noRequests}</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {requests.map((m) => (
                    <RequestRow key={m.id} member={m} />
                  ))}
                </ul>
              )}
            </Panel>
          )}

          <Panel title={`${t.team.members} · ${members.length}`} id="members-title" bodyClassName="p-2 md:p-3">
            {team.pending ? (
              <div className="flex flex-col gap-2 p-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-line-soft">
                {members.map((m) => (
                  <MemberRow key={m.id} member={m} isMe={m.id === me.id} />
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={`${t.team.invitations} · ${invitations.length}`} id="invitations-title" bodyClassName="p-2 md:p-3">
            {invitations.length === 0 ? (
              <p className="p-3 text-sm font-semibold text-muted">{t.team.noInvitations}</p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {invitations.map((m) => (
                  <InvitationRow key={m.id} member={m} inviter={team.data?.find((x) => x.id === m.invitedBy)} />
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <RolesCard />
      </div>

      {manages && <InviteDialog open={inviting} onClose={() => setInviting(false)} />}
    </div>
  );
}

function RolesCard() {
  const { t } = usePanel();
  const blocks: Array<{ role: Role; className: string; stroke: string; mark: string }> = [
    { role: "owner", className: "bg-accent text-ink", stroke: "rgb(22 22 22 / .28)", mark: "ش" },
    { role: "admin", className: "bg-ink text-white", stroke: "rgb(255 255 255 / .38)", mark: "م" },
    { role: "editor", className: "bg-card text-ink", stroke: "rgb(22 22 22 / .2)", mark: "ح" },
  ];
  return (
    <section aria-labelledby="roles-title" className="flex flex-col gap-3 xl:sticky xl:top-24">
      <h2 id="roles-title" className="px-1 text-lg font-bold">
        {t.team.rolesTitle}
      </h2>
      {blocks.map((b) => (
        <div key={b.role} className={cn("relative overflow-hidden rounded-tile p-5", b.className)}>
          <span aria-hidden="true" className="absolute -end-1 -top-5 font-sans text-[96px] leading-none font-bold text-stroke [--stroke-width:1.3px]" style={{ ["--stroke" as string]: b.stroke }}>
            {b.mark}
          </span>
          <h3 className="relative text-lg font-bold">{t.roleLong[b.role]}</h3>
          <ul className="relative mt-2 flex flex-col gap-1.5 text-[13.5px]">
            {t.roleCan[b.role].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <CheckIcon size={14} className="mt-1 shrink-0 opacity-70" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
