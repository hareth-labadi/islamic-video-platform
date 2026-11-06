import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { TagInput, checkFile, imageRule, videoRule } from "./inputs";

function Tags({ initial = [] as string[], max = 3 }) {
  const [tags, setTags] = useState(initial);
  return (
    <>
      <TagInput value={tags} onChange={setTags} max={max} placeholder="Sujets" removeLabel={(t) => `Retirer ${t}`} />
      <output data-testid="tags">{tags.join("|")}</output>
    </>
  );
}

describe("TagInput", () => {
  it("adds with Enter or a comma (Latin or Arabic), without # or duplicates", async () => {
    const user = userEvent.setup();
    render(<Tags max={5} />);
    const input = screen.getByPlaceholderText("Sujets");
    await user.type(input, "#prière{Enter}jeûne,زكاة،prière,");
    expect(screen.getByTestId("tags")).toHaveTextContent("prière|jeûne|زكاة");
  });

  it("stops at the maximum", async () => {
    const user = userEvent.setup();
    render(<Tags initial={["a", "b"]} max={3} />);
    await user.type(screen.getByRole("textbox"), "c{Enter}d{Enter}");
    expect(screen.getByTestId("tags")).toHaveTextContent("a|b|c");
  });

  it("Backspace on an empty input removes the last tag; the chip button removes one", async () => {
    const user = userEvent.setup();
    render(<Tags initial={["a", "b", "c"]} />);
    await user.type(screen.getByRole("textbox"), "{Backspace}");
    expect(screen.getByTestId("tags")).toHaveTextContent("a|b");
    await user.click(screen.getByRole("button", { name: "Retirer a" }));
    expect(screen.getByTestId("tags")).toHaveTextContent(/^b$/);
  });

  it("adds what is typed when leaving the field", async () => {
    const user = userEvent.setup();
    render(<Tags />);
    await user.type(screen.getByPlaceholderText("Sujets"), "sira");
    await user.tab();
    expect(screen.getByTestId("tags")).toHaveTextContent("sira");
  });
});

describe("checkFile", () => {
  const file = (type: string, size: number) => {
    const f = new File(["x"], "f", { type });
    Object.defineProperty(f, "size", { value: size });
    return f;
  };

  it("accepts the right type and size", () => {
    expect(checkFile(file("image/png", 1024), imageRule)).toBeNull();
    expect(checkFile(file("video/mp4", 500 * 1024 * 1024), videoRule)).toBeNull();
  });

  it("refuses other types and big files", () => {
    expect(checkFile(file("image/gif", 10), imageRule)).toBe("type");
    expect(checkFile(file("image/png", 6 * 1024 * 1024), imageRule)).toBe("size");
    expect(checkFile(file("video/x-msvideo", 10), videoRule)).toBe("type");
  });
});
