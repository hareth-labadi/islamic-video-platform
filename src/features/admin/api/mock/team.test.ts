import { beforeEach, describe, expect, it } from "vitest";
import { accounts, api, getDb, resetDemo, S1, S2, signInAs } from "../../test/demo";

beforeEach(() => resetDemo(accounts.owner));

const member = (id: string) => getDb().members.find((m) => m.id === id);

describe("team list", () => {
  it("shows the sheikh first, then admins, then editors", async () => {
    const roles = (await api.team.list(S1)).map((m) => m.role);
    expect(roles).toEqual([...roles].sort((a, b) => ["owner", "admin", "editor"].indexOf(a) - ["owner", "admin", "editor"].indexOf(b)));
    expect(roles[0]).toBe("owner");
  });
});

describe("invitations", () => {
  it("invites by e-mail and returns a sign-in link", async () => {
    const { member: invited, inviteUrl } = await api.team.invite({ sheikhIds: [S1], role: "editor", email: " Lina@Example.org " });
    expect(invited).toMatchObject({ email: "lina@example.org", name: "lina@example.org", status: "invited", role: "editor", invitedBy: accounts.owner });
    expect(inviteUrl).toMatch(/\/admin\/sign-in\?invite=/);
  });

  it("invites by Telegram username", async () => {
    const { member: invited } = await api.team.invite({ sheikhIds: [S1], role: "editor", telegram: "@lina_dz" });
    expect(invited).toMatchObject({ telegram: "lina_dz", name: "@lina_dz" });
  });

  it("needs an e-mail or a Telegram name (422)", async () => {
    await expect(api.team.invite({ sheikhIds: [S1], role: "editor" })).rejects.toMatchObject({ code: "validation", status: 422 });
  });

  it("an active member cannot be invited again (409)", async () => {
    await expect(api.team.invite({ sheikhIds: [S1], role: "editor", email: "amina@example.org" })).rejects.toMatchObject({ code: "conflict", fields: { email: "taken" } });
  });

  it("inviting someone who asked for access turns the request into an invitation", async () => {
    const { member: invited } = await api.team.invite({ sheikhIds: [S1], role: "editor", email: "omar@example.org" });
    expect(invited.id).toBe("m-req-1");
    expect(invited.status).toBe("invited");
  });

  it("an admin invites editors only; an editor invites nobody", async () => {
    signInAs(accounts.admin);
    await expect(api.team.invite({ sheikhIds: [S1], role: "admin", email: "x@example.org" })).rejects.toMatchObject({ code: "forbidden" });
    await expect(api.team.invite({ sheikhIds: [S1, S2], role: "editor", email: "x@example.org" })).resolves.toMatchObject({ member: { sheikhIds: [S1, S2] } });
    signInAs(accounts.editor);
    await expect(api.team.invite({ sheikhIds: [S1], role: "editor", email: "y@example.org" })).rejects.toMatchObject({ code: "forbidden" });
  });

  it("cannot invite to a sheikh you do not manage", async () => {
    await expect(api.team.invite({ sheikhIds: [S2], role: "editor", email: "x@example.org" })).rejects.toMatchObject({ code: "forbidden" });
  });

  it("resending is limited to people you may manage", async () => {
    await expect(api.team.resendInvite("m-inv-2")).resolves.toMatchObject({ member: { id: "m-inv-2" } });
    signInAs(accounts.admin);
    // m-inv-2 is an invited admin: only the sheikh may resend.
    await expect(api.team.resendInvite("m-inv-2")).rejects.toMatchObject({ code: "forbidden" });
    await expect(api.team.resendInvite("m-inv-1")).resolves.toBeTruthy();
    await expect(api.team.resendInvite("m-editor-1")).rejects.toMatchObject({ code: "conflict" });
    signInAs(accounts.owner2);
    await expect(api.team.resendInvite("m-inv-1")).rejects.toMatchObject({ code: "forbidden" });
  });
});

describe("access requests", () => {
  it("approve makes the person an active member with the chosen role", async () => {
    const approved = await api.team.approve("m-req-1", S1, "admin");
    expect(approved).toMatchObject({ status: "active", role: "admin" });
    expect(approved).not.toHaveProperty("message");
  });

  it("an admin can only approve as editor", async () => {
    signInAs(accounts.admin);
    await expect(api.team.approve("m-req-1", S1, "admin")).rejects.toMatchObject({ code: "forbidden" });
    await expect(api.team.approve("m-req-1", S1, "editor")).resolves.toMatchObject({ status: "active" });
  });

  it("only pending requests for that sheikh can be approved", async () => {
    await expect(api.team.approve("m-editor-1", S1, "editor")).rejects.toMatchObject({ code: "conflict" });
    signInAs(accounts.admin);
    await expect(api.team.approve("m-req-1", S2, "editor")).rejects.toMatchObject({ code: "not_found" });
  });

  it("decline deletes the request", async () => {
    await api.team.decline("m-req-2", S1);
    expect(member("m-req-2")).toBeUndefined();
  });
});

describe("roles and removal", () => {
  it("only the sheikh changes roles", async () => {
    await expect(api.team.updateRole("m-editor-1", "admin")).resolves.toMatchObject({ role: "admin" });
    signInAs(accounts.admin);
    await expect(api.team.updateRole("m-editor-2", "admin")).rejects.toMatchObject({ code: "forbidden" });
  });

  it("the other sheikh cannot change this sheikh's team", async () => {
    signInAs(accounts.owner2);
    await expect(api.team.updateRole("m-editor-1", "admin")).rejects.toMatchObject({ code: "forbidden" });
  });

  it("nobody changes the sheikh or themself", async () => {
    await expect(api.team.updateRole(accounts.owner, "admin")).rejects.toMatchObject({ code: "forbidden" });
    await expect(api.team.revoke(accounts.owner, S1)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("revoke removes one sheikh; the member disappears with the last one", async () => {
    await api.team.revoke(accounts.admin, S1);
    expect(member(accounts.admin)?.sheikhIds).toEqual([S2]);
    await api.team.revoke("m-editor-1", S1);
    expect(member("m-editor-1")).toBeUndefined();
  });

  it("an admin removes editors, not admins", async () => {
    signInAs(accounts.admin);
    await expect(api.team.revoke("m-editor-2", S1)).resolves.toBeUndefined();
    await expect(api.team.revoke("m-inv-2", S1)).rejects.toMatchObject({ code: "forbidden" });
  });
});
