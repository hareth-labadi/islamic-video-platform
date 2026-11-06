import { can, type Action } from "../../permissions";
import { slugify } from "../../lib/format";
import { ApiError } from "../errors";
import type { Member, Session } from "../types";
import { clone, getDb, readSessionMemberId } from "./store";

/*
 * The checks every demo endpoint starts with. They are the server-side rules
 * the real backend must apply too (docs/specs/admin-api.md → Roles).
 */

/** The signed-in, active member — else 401. */
export function me(): Member {
  const id = readSessionMemberId();
  const member = id ? getDb().members.find((m) => m.id === id && m.status === "active") : undefined;
  if (!member) throw new ApiError("unauthenticated", "Sign in again", undefined, 401);
  return member;
}

/** The signed-in member, who must manage this sheikh — else 403. */
export function access(sheikhId: string): Member {
  const member = me();
  if (!member.sheikhIds.includes(sheikhId)) throw new ApiError("forbidden", "No access to this sheikh", undefined, 403);
  return member;
}

/** `access` plus a permission from the role table — else 403. */
export function allow(sheikhId: string, action: Action): Member {
  const member = access(sheikhId);
  if (!can(member.role, action)) throw new ApiError("forbidden", `Not allowed: ${action}`, undefined, 403);
  return member;
}

export function forbidden(message = "Not allowed"): ApiError {
  return new ApiError("forbidden", message, undefined, 403);
}

export function find<T extends { id: string }>(list: T[], id: string): T {
  const item = list.find((x) => x.id === id);
  if (!item) throw new ApiError("not_found", "Not found", undefined, 404);
  return item;
}

export function now(): string {
  return new Date().toISOString();
}

export function sessionFor(member: Member): Session {
  const db = getDb();
  return { member: clone(member), sheikhs: clone(db.sheikhs.filter((s) => member.sheikhIds.includes(s.id))) };
}

/** Latin slug from the title, made unique with -2, -3…; Arabic-only titles use the fallback (the id). */
export function uniqueSlug(base: string, taken: string[], fallback: string): string {
  const root = slugify(base) || fallback;
  let slug = root;
  for (let i = 2; taken.includes(slug); i++) slug = `${root}-${i}`;
  return slug;
}
