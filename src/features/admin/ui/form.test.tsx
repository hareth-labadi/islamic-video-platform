import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Counter, Field, Segmented, TextInput, Toggle, focusFirstError } from "./form";

describe("Field", () => {
  it("labels the control and links its hint and error", () => {
    render(
      <Field label="Titre" hint="Court et clair" error="Obligatoire">
        <TextInput />
      </Field>,
    );
    const input = screen.getByLabelText("Titre");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Court et clair Obligatoire");
  });

  it("is not marked invalid without an error", () => {
    render(
      <Field label="Titre" optional="facultatif">
        <TextInput />
      </Field>,
    );
    expect(screen.getByLabelText(/Titre/)).not.toHaveAttribute("aria-invalid");
    expect(screen.getByText("(facultatif)")).toBeInTheDocument();
  });

  it("as a group, names the group", () => {
    render(
      <Field label="Statut" group>
        <input type="radio" aria-label="x" />
      </Field>,
    );
    expect(screen.getByRole("group", { name: "Statut" })).toBeInTheDocument();
  });
});

it("Counter turns red past the limit", () => {
  const { rerender } = render(<Counter value="abc" max={5} />);
  expect(screen.getByText("3/5")).not.toHaveStyle({ color: "#B42318" });
  rerender(<Counter value="abcdef" max={5} />);
  expect(screen.getByText("6/5")).toHaveStyle({ color: "#B42318" });
});

it("Segmented is a radio group", async () => {
  const onChange = vi.fn();
  render(
    <Segmented
      label="Statut"
      value="draft"
      onChange={onChange}
      options={[
        { value: "draft", label: "Brouillon" },
        { value: "published", label: "Publié" },
        { value: "hidden", label: "Masqué", disabled: true },
      ]}
    />,
  );
  const group = screen.getByRole("radiogroup", { name: "Statut" });
  expect(group).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Brouillon" })).toBeChecked();
  await userEvent.click(screen.getByRole("radio", { name: "Publié" }));
  expect(onChange).toHaveBeenCalledWith("published");
  expect(screen.getByRole("radio", { name: "Masqué" })).toBeDisabled();
});

it("Toggle is a switch with its label and hint", async () => {
  function Demo() {
    const [on, setOn] = useState(false);
    return <Toggle checked={on} onChange={setOn} label="Publier" hint="Visible sur le site" />;
  }
  render(<Demo />);
  const toggle = screen.getByRole("switch", { name: "Publier" });
  expect(toggle).toHaveAttribute("aria-checked", "false");
  expect(toggle).toHaveAccessibleDescription("Visible sur le site");
  await userEvent.click(screen.getByText("Publier"));
  expect(toggle).toHaveAttribute("aria-checked", "true");
});

it("focusFirstError focuses the first invalid control", async () => {
  render(
    <form data-testid="form">
      <Field label="A">
        <TextInput />
      </Field>
      <Field label="B" error="Erreur">
        <TextInput />
      </Field>
      <Field label="C" error="Erreur">
        <TextInput />
      </Field>
    </form>,
  );
  focusFirstError(screen.getByTestId("form"));
  await vi.waitFor(() => expect(screen.getByLabelText("B")).toHaveFocus());
});
