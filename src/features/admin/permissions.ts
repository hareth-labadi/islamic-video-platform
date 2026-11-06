import type { Member, Role } from "./api/types";

/*
 * Who can do what. The backend enforces the same table (docs/specs/admin-api.md);
 * the UI uses it only to hide or disable what a person cannot do.
 *
 *   owner  — the sheikh: everything on his page; the only one who answers
 *            questions, publishes Q&A and makes or removes admins.
 *   admin  — all content; triages questions; invites, approves and removes
 *            editors; edits the sheikh's profile.
 *   editor — all content (same as admin); triages questions; no team or profile.
 */
export type Action =
  | "content.manage" // create, edit, publish, hide, delete videos, series, playlists, shorts
  | "questions.triage" // categorize, reject, restore, suggest a video, manage categories
  | "questions.answer" // answer, edit answers, publish Q&A on the site
  | "team.view"
  | "team.manageEditors" // invite, approve, decline, remove editors
  | "team.manageAdmins" // invite, approve, remove admins; change roles
  | "profile.edit";

export const permissionTable: Record<Action, Role[]> = {
  "content.manage": ["owner", "admin", "editor"],
  "questions.triage": ["owner", "admin", "editor"],
  "questions.answer": ["owner"],
  "team.view": ["owner", "admin", "editor"],
  "team.manageEditors": ["owner", "admin"],
  "team.manageAdmins": ["owner"],
  "profile.edit": ["owner", "admin"],
};

export function can(role: Role | undefined, action: Action): boolean {
  return !!role && permissionTable[action].includes(role);
}

/** Roles this person may give when inviting or approving someone. */
export function grantableRoles(role: Role | undefined): Array<Exclude<Role, "owner">> {
  if (can(role, "team.manageAdmins")) return ["admin", "editor"];
  if (can(role, "team.manageEditors")) return ["editor"];
  return [];
}

/** Whether `actor` may change, remove or decline `target`. Nobody manages the owner or themself. */
export function canManageMember(actor: Member | undefined, target: Member): boolean {
  if (!actor || target.role === "owner" || actor.id === target.id) return false;
  return target.role === "admin" ? can(actor.role, "team.manageAdmins") : can(actor.role, "team.manageEditors");
}

