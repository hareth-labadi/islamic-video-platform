import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Brand } from "@/components/layout/SiteHeader";
import { BrandMark } from "./BrandMark";

describe("BrandMark", () => {
  it("is decorative by default, so screen readers skip it next to the site name", () => {
    const { container } = render(<BrandMark />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
  });

  it("is announced as an image when it carries a title", () => {
    render(<BrandMark title="Qalam" />);
    expect(screen.getByRole("img", { name: "Qalam" })).toBeInTheDocument();
  });

  it("paints with the current text colour", () => {
    const { container } = render(<BrandMark className="text-series" />);
    expect(container.querySelector("svg")).toHaveAttribute("fill", "currentColor");
    expect(container.querySelector("svg")).toHaveClass("text-series");
  });
});

describe("Brand", () => {
  it("uses the green mark on paper and the gold mark on ink", () => {
    const { container, rerender } = render(<Brand />);
    expect(container.querySelector("svg")).toHaveClass("text-series");
    rerender(<Brand light />);
    expect(container.querySelector("svg")).toHaveClass("text-accent");
  });
});
