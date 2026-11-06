import { describe, expect, it } from "vitest";
import { ar } from "./ar";
import { fr } from "./fr";
import { adminLocales, getAdminDictionary, isAdminLocale } from "./index";

type Entry = [path: string, value: unknown];

function flatten(value: unknown, path = ""): Entry[] {
  if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => flatten(v, path ? `${path}.${k}` : k));
  return [[path, value]];
}

describe("admin dictionaries", () => {
  const arEntries = new Map(flatten(ar));
  const frEntries = new Map(flatten(fr));

  it("have the same keys", () => {
    expect([...frEntries.keys()].sort()).toEqual([...arEntries.keys()].sort());
  });

  it("have no empty strings", () => {
    const empty = [...arEntries, ...frEntries].filter(([, v]) => v === "").map(([k]) => k);
    expect(empty).toEqual([]);
  });

  it("take the same parameters in both languages", () => {
    const mismatched = [...arEntries].filter(([k, v]) => typeof v === "function" && (v as () => string).length !== (frEntries.get(k) as () => string).length).map(([k]) => k);
    expect(mismatched).toEqual([]);
  });

  it("French has no Arabic left in it, except the brand and examples", () => {
    const arabic = /[؀-ۿ]/;
    const allowed = ["brand", "collectionForm.glyphHint"];
    const leftovers = [...frEntries].filter(([k, v]) => typeof v === "string" && arabic.test(v) && !allowed.includes(k)).map(([k]) => k);
    expect(leftovers).toEqual([]);
  });
});

it("only Arabic and French are admin languages", () => {
  expect(adminLocales).toEqual(["ar", "fr"]);
  expect(isAdminLocale("kab")).toBe(false);
  expect(getAdminDictionary("fr").panel).toBe("Administration");
});
