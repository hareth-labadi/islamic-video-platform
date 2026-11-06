import { describe, expect, it } from "vitest";
import { isEmail, limits, parseImportLimit, questionBodyProblem } from "./rules";

it("isEmail accepts ordinary addresses and trims", () => {
  expect(isEmail(" sheikh@example.org ")).toBe(true);
  expect(isEmail("sheikh@example")).toBe(false);
  expect(isEmail("sheikh example.org")).toBe(false);
  expect(isEmail("")).toBe(false);
});

describe("questionBodyProblem", () => {
  it("checks the trimmed length against 20–1500", () => {
    expect(questionBodyProblem("x".repeat(limits.questionBody.min))).toBeNull();
    expect(questionBodyProblem(`  ${"x".repeat(19)}  `)).toBe("short");
    expect(questionBodyProblem("x".repeat(limits.questionBody.max + 1))).toBe("long");
  });
});

describe("parseImportLimit", () => {
  it("is undefined when empty (use the default)", () => {
    expect(parseImportLimit("  ")).toBeUndefined();
  });

  it("accepts whole numbers from 1 to the max", () => {
    expect(parseImportLimit("1")).toBe(1);
    expect(parseImportLimit(String(limits.importClips.max))).toBe(limits.importClips.max);
  });

  it.each(["0", "-3", "2.5", "abc", String(limits.importClips.max + 1)])("rejects %s", (value) => {
    expect(parseImportLimit(value)).toBeNull();
  });
});
