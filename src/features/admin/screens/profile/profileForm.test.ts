import { describe, expect, it } from "vitest";
import type { AdminSheikh } from "../../api/types";
import { getAdminDictionary } from "../../i18n";
import { toInput, toValues, validate, type Values } from "./profileForm";

const t = getAdminDictionary("fr");

const sheikh: AdminSheikh = {
  id: "sheikh-1",
  slug: "sheikh",
  name: { ar: "الشيخ محمد", fr: "Cheikh Mohamed", kab: "Ccix Muḥend" },
  monogram: "م",
  socials: { tiktok: "https://www.tiktok.com/@sheikh" },
  takesQuestions: true,
};

const values = (patch: Partial<Values> = {}): Values => ({ ...toValues(sheikh), ...patch });

describe("validate", () => {
  it("passes the saved profile", () => {
    expect(validate(values(), t)).toEqual({});
  });

  it("needs the Arabic and French names", () => {
    const errors = validate(values({ name: { ar: "", fr: "", kab: "" } }), t);
    expect(errors["name.ar"]).toBe(t.validation.required);
    expect(errors["name.fr"]).toBe(t.validation.required);
    expect(errors["name.kab"]).toBeUndefined();
  });

  it("needs a one-character monogram", () => {
    expect(validate(values({ monogram: "" }), t).monogram).toBe(t.validation.required);
    expect(validate(values({ monogram: "مح" }), t).monogram).toBe(t.validation.monogram);
  });

  it("checks the social links", () => {
    const errors = validate(values({ telegram: "a b", tiktok: "https://www.tiktok.com/@x/video/7312345678901234567", youtube: "https://vimeo.com/x" }), t);
    expect(errors.telegram).toBe(t.validation.telegramUrl);
    expect(errors.tiktok).toBe(t.validation.tiktokUrl);
    expect(errors.youtube).toBe(t.validation.youtubeUrl);
  });

  it("limits the bio to 300 characters per language", () => {
    expect(validate(values({ bio: { ar: "", fr: "x".repeat(301), kab: "" } }), t)["bio.fr"]).toBe(t.validation.max(300));
  });
});

describe("toInput", () => {
  it("fills missing Kabyle from French and normalizes links", () => {
    const input = toInput(values({ name: { ar: " الشيخ محمد ", fr: "Cheikh Mohamed", kab: "" }, telegram: "@ilm_nafi", youtube: " " }));
    expect(input.name).toEqual({ ar: "الشيخ محمد", fr: "Cheikh Mohamed", kab: "Cheikh Mohamed" });
    expect(input.socials).toEqual({ telegram: "https://t.me/ilm_nafi", tiktok: "https://www.tiktok.com/@sheikh", youtube: undefined });
  });

  it("drops an empty bio and honorific", () => {
    const input = toInput(values());
    expect(input.bio).toBeUndefined();
    expect(input.honorific).toBeUndefined();
  });
});
