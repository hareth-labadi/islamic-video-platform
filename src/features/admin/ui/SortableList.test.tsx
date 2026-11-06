import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it } from "vitest";
import { SortableList } from "./SortableList";

function Episodes({ disabled = false }) {
  const [items, setItems] = useState(["Un", "Deux", "Trois", "Quatre"]);
  return (
    <SortableList
      items={items}
      getId={(x) => x}
      onReorder={setItems}
      disabled={disabled}
      handleLabel={(x) => `Déplacer ${x}`}
      movedMessage={(x, n) => `${x} est maintenant n° ${n}`}
      renderItem={(x, i, handle) => (
        <div>
          <button type="button" {...handle} />
          <span data-testid="row">
            {i + 1}. {x}
          </span>
        </div>
      )}
    />
  );
}

const order = () => screen.getAllByTestId("row").map((r) => r.textContent);

it("moves a row with the arrow keys, keeps focus on it and announces it", async () => {
  const user = userEvent.setup();
  render(<Episodes />);
  screen.getByRole("button", { name: "Déplacer Un" }).focus();
  await user.keyboard("{ArrowDown}");
  expect(order()).toEqual(["1. Deux", "2. Un", "3. Trois", "4. Quatre"]);
  expect(screen.getByRole("button", { name: "Déplacer Un" })).toHaveFocus();
  expect(screen.getByText("Un est maintenant n° 2")).toBeInTheDocument();
});

it("Home and End jump to the ends", async () => {
  const user = userEvent.setup();
  render(<Episodes />);
  screen.getByRole("button", { name: "Déplacer Deux" }).focus();
  await user.keyboard("{End}");
  expect(order().at(-1)).toBe("4. Deux");
  await user.keyboard("{Home}");
  expect(order()[0]).toBe("1. Deux");
});

it("does not move past the ends or when disabled", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<Episodes />);
  screen.getByRole("button", { name: "Déplacer Un" }).focus();
  await user.keyboard("{ArrowUp}");
  expect(order()[0]).toBe("1. Un");
  unmount();

  render(<Episodes disabled />);
  screen.getByRole("button", { name: "Déplacer Un" }).focus();
  await user.keyboard("{ArrowDown}");
  expect(order()[0]).toBe("1. Un");
});
