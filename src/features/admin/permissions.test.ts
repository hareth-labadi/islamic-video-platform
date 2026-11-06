import { describe, expect, it } from "vitest";
import type { Member, Role } from "./api/types";
import { can, canManageMember, grantableRoles, type Action } from "./permissions";

const member = (id: string, role: Role): Member => ({ id, name: id, role, sheikhIds: ["sheikh-1"], status: "active", createdAt: "2026-01-01T00:00:00Z" });

describe("can", () => {
  // The agreed rules: editors = admins for content; only the sheikh answers; only the sheikh manages admins.
  const expected: Record<Action, Role[]> = {
    "content.manage": ["owner", "admin", "editor"],
    "questions.triage": ["owner", "admin", "editor"],
    "questions.answer": ["owner"],
    "team.view": ["owner", "admin", "editor"],
    "team.manageEditors": ["owner", "admin"],
    "team.manageAdmins": ["owner"],
    "profile.edit": ["owner", "admin"],
  };

  for (const [action, roles] of Object.entries(expected) as Array<[Action, Role[]]>) {
    it(`${action}: ${roles.join(", ")}`, () => {
      for (const role of ["owner", "admin", "editor"] as Role[]) expect(can(role, action)).toBe(roles.includes(role));
    });
  }

  it("nobody can do anything when signed out", () => {
    expect(can(undefined, "content.manage")).toBe(false);
  });
});

describe("grantableRoles", () => {
  it("the sheikh gives admin or editor, an admin only editor, an editor nothing", () => {
    expect(grantableRoles("owner")).toEqual(["admin", "editor"]);
    expect(grantableRoles("admin")).toEqual(["editor"]);
    expect(grantableRoles("editor")).toEqual([]);
    expect(grantableRoles(undefined)).toEqual([]);
  });
});

describe("canManageMember", () => {
  const owner = member("o", "owner");
  const admin = member("a", "admin");
  const admin2 = member("a2", "admin");
  const editor = member("e", "editor");

  it("the sheikh manages admins and editors", () => {
    expect(canManageMember(owner, admin)).toBe(true);
    expect(canManageMember(owner, editor)).toBe(true);
  });

  it("an admin manages editors but not other admins", () => {
    expect(canManageMember(admin, editor)).toBe(true);
    expect(canManageMember(admin, admin2)).toBe(false);
  });

  it("nobody manages the sheikh, themself, or anyone as an editor", () => {
    expect(canManageMember(admin, owner)).toBe(false);
    expect(canManageMember(owner, owner)).toBe(false);
    expect(canManageMember(editor, member("e2", "editor"))).toBe(false);
    expect(canManageMember(undefined, editor)).toBe(false);
  });
});
