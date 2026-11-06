import { beforeEach, describe, expect, it } from "vitest";
import { accounts, api, getDb, resetDemo, S1, signInAs } from "../../test/demo";

beforeEach(() => resetDemo());

describe("auth (demo)", () => {
  it("is signed out at first", async () => {
    expect(await api.auth.session()).toBeNull();
  });

  it("signs in with a known e-mail and any 6-digit code", async () => {
    const session = await api.auth.verifyCode(" Sheikh@Example.org ", "123456");
    expect(session.member.id).toBe(accounts.owner);
    expect(session.sheikhs.map((s) => s.id)).toEqual([S1]);
    expect((await api.auth.session())?.member.id).toBe(accounts.owner);
  });

  it("an admin of two sheikhs gets both in the switcher", async () => {
    const session = await api.auth.verifyCode("yacine@example.org", "000000");
    expect(session.sheikhs.map((s) => s.id)).toEqual(["sheikh-1", "sheikh-2"]);
  });

  it.each([
    ["unknown e-mail", "nobody@example.org", "123456"],
    ["code too short", "sheikh@example.org", "12345"],
    ["code with letters", "sheikh@example.org", "12a456"],
    ["pending access request", "omar@example.org", "123456"],
  ])("refuses %s", async (_, email, code) => {
    await expect(api.auth.verifyCode(email, code)).rejects.toMatchObject({ code: "bad_code", status: 400 });
  });

  it("signing in accepts an invitation", async () => {
    await api.auth.verifyCode("nadia@example.org", "123456");
    expect(getDb().members.find((m) => m.email === "nadia@example.org")?.status).toBe("active");
  });

  it("signs out", async () => {
    signInAs(accounts.owner);
    await api.auth.signOut();
    expect(await api.auth.session()).toBeNull();
  });

  it("an access request creates a 'requested' editor for that sheikh", async () => {
    await api.auth.requestAccess({ name: " Lina ", email: "lina@example.org", sheikhId: S1, message: "  " });
    const request = getDb().members.find((m) => m.email === "lina@example.org");
    expect(request).toMatchObject({ name: "Lina", status: "requested", role: "editor", sheikhIds: [S1], message: undefined });
  });

  it("every other call needs a session", async () => {
    await expect(api.videos.list({})).rejects.toMatchObject({ code: "unauthenticated", status: 401 });
    await expect(api.dashboard.summary(S1)).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("the sheikh directory is public", async () => {
    const list = await api.sheikhs.directory();
    expect(list.map((s) => s.id)).toEqual(["sheikh-1", "sheikh-2"]);
    expect(Object.keys(list[0]).sort()).toEqual(["id", "monogram", "name", "photo"]);
  });
});
