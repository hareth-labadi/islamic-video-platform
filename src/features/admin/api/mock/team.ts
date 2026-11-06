import { can, canManageMember, grantableRoles } from "../../permissions";
import type { AdminApi } from "../contract";
import { ApiError } from "../errors";
import type { Member, Role } from "../types";
import { access, find, forbidden, me, now } from "./guards";
import { clone, commit, getDb, newId, wait } from "./store";

/*
 * Team rules (same as the backend): admins invite and manage editors; only the
 * sheikh (owner) makes or removes admins; nobody manages the owner or themself.
 */

const roleOrder: Record<Role, number> = { owner: 0, admin: 1, editor: 2 };

function sharesSheikh(actor: Member, member: Member): boolean {
  return member.sheikhIds.some((id) => actor.sheikhIds.includes(id));
}

function memberOf(sheikhId: string, memberId: string): Member {
  const member = find(getDb().members, memberId);
  if (!member.sheikhIds.includes(sheikhId)) throw new ApiError("not_found", "Not found", undefined, 404);
  return member;
}

function checkGrant(actor: Member, role: Exclude<Role, "owner">): void {
  if (!grantableRoles(actor.role).includes(role)) throw forbidden("Cannot grant this role");
}

export const team: AdminApi["team"] = {
  async list(sheikhId) {
    await wait();
    access(sheikhId);
    const members = getDb().members.filter((m) => m.sheikhIds.includes(sheikhId));
    return clone(members.sort((a, b) => roleOrder[a.role] - roleOrder[b.role] || a.name.localeCompare(b.name)));
  },
  async invite(input) {
    await wait(500);
    if (input.sheikhIds.length === 0) throw new ApiError("validation", "No sheikh", { sheikhIds: "required" }, 422);
    let actor: Member | undefined;
    for (const sheikhId of input.sheikhIds) {
      actor = access(sheikhId);
      checkGrant(actor, input.role);
    }
    const db = getDb();
    const email = input.email?.trim().toLowerCase() || undefined;
    const telegram = input.telegram?.trim().replace(/^@/, "") || undefined;
    if (!email && !telegram) throw new ApiError("validation", "E-mail or Telegram needed", { email: "required" }, 422);
    const existing = db.members.find((m) => (email && m.email?.toLowerCase() === email) || (telegram && m.telegram === telegram));
    if (existing?.status === "active") throw new ApiError("conflict", "Already a member", { [email ? "email" : "telegram"]: "taken" }, 409);
    const member: Member = existing ?? {
      id: newId("m-inv"),
      name: input.name?.trim() || (email ?? `@${telegram}`),
      email,
      telegram,
      role: input.role,
      sheikhIds: [],
      status: "invited",
      createdAt: now(),
      invitedBy: actor?.id,
    };
    // Inviting someone who asked for access turns the request into an invitation.
    member.status = "invited";
    member.role = input.role;
    member.sheikhIds = [...new Set([...member.sheikhIds, ...input.sheikhIds])];
    if (!existing) db.members.push(member);
    commit();
    return { member: clone(member), inviteUrl: inviteUrl(member.id) };
  },
  async approve(memberId, sheikhId, role) {
    await wait(350);
    const actor = access(sheikhId);
    checkGrant(actor, role);
    const member = memberOf(sheikhId, memberId);
    if (member.status !== "requested") throw new ApiError("conflict", "No pending request", undefined, 409);
    member.status = "active";
    member.role = role;
    delete member.message;
    commit();
    return clone(member);
  },
  async decline(memberId, sheikhId) {
    await wait(300);
    const actor = access(sheikhId);
    const member = memberOf(sheikhId, memberId);
    if (!canManageMember(actor, member)) throw forbidden();
    const db = getDb();
    db.members = db.members.filter((m) => m.id !== memberId);
    commit();
  },
  async updateRole(memberId, role) {
    await wait(300);
    const actor = me();
    const member = find(getDb().members, memberId);
    if (!sharesSheikh(actor, member) || !can(actor.role, "team.manageAdmins") || !canManageMember(actor, member)) throw forbidden();
    member.role = role;
    commit();
    return clone(member);
  },
  async revoke(memberId, sheikhId) {
    await wait(300);
    const actor = access(sheikhId);
    const member = memberOf(sheikhId, memberId);
    if (!canManageMember(actor, member)) throw forbidden();
    member.sheikhIds = member.sheikhIds.filter((id) => id !== sheikhId);
    const db = getDb();
    if (member.sheikhIds.length === 0) db.members = db.members.filter((m) => m.id !== memberId);
    commit();
  },
  async resendInvite(memberId) {
    await wait(400);
    const actor = me();
    const member = find(getDb().members, memberId);
    if (!sharesSheikh(actor, member) || !canManageMember(actor, member)) throw forbidden();
    if (member.status !== "invited") throw new ApiError("conflict", "Not an invitation", undefined, 409);
    return { member: clone(member), inviteUrl: inviteUrl(member.id) };
  },
};

/** The link a Telegram invitation carries: /<locale>/admin/sign-in?invite=<token>. */
function inviteUrl(memberId: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const locale = typeof window === "undefined" ? "ar" : window.location.pathname.split("/")[1] || "ar";
  return `${origin}/${locale}/admin/sign-in?invite=${encodeURIComponent(btoa(memberId).replace(/=+$/, ""))}`;
}
