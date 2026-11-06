import { limits } from "../../rules";
import type { AdminApi } from "../contract";
import { ApiError } from "../errors";
import { now, sessionFor } from "./guards";
import { commit, getDb, newId, readSessionMemberId, wait, writeSessionMemberId } from "./store";

/** Demo sign-in: any 6-digit code works for a known e-mail; e-mailed links are not simulated. */
export const auth: AdminApi["auth"] = {
  async requestLink() {
    await wait(600);
  },
  async verifyCode(email, code) {
    await wait(500);
    const db = getDb();
    const member = db.members.find((m) => m.email?.toLowerCase() === email.trim().toLowerCase() && m.status !== "requested");
    if (!member || code.length !== limits.codeLength || !/^\d+$/.test(code)) throw new ApiError("bad_code", "Wrong or expired code", undefined, 400);
    // Signing in accepts a pending invitation.
    member.status = "active";
    member.lastActiveAt = now();
    writeSessionMemberId(member.id);
    commit();
    return sessionFor(member);
  },
  async verifyToken() {
    await wait();
    throw new ApiError("bad_code", "Links are not simulated in demo mode", undefined, 400);
  },
  async session() {
    await wait(120);
    const id = readSessionMemberId();
    const member = id ? getDb().members.find((m) => m.id === id && m.status === "active") : undefined;
    return member ? sessionFor(member) : null;
  },
  async signOut() {
    await wait(150);
    writeSessionMemberId(null);
  },
  async requestAccess(input) {
    await wait(600);
    getDb().members.push({
      id: newId("m-req"),
      name: input.name.trim(),
      email: input.email.trim(),
      role: "editor",
      sheikhIds: [input.sheikhId],
      status: "requested",
      createdAt: now(),
      message: input.message?.trim() || undefined,
    });
    commit();
  },
};
