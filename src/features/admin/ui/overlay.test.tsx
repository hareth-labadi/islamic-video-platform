import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { ConfirmDialog, Dialog, ToastProvider, useToast } from "./overlay";

it("Dialog opens as a named dialog and closes from its button", async () => {
  function Demo() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Ouvrir</button>
        <Dialog open={open} onClose={() => setOpen(false)} title="Inviter" closeLabel="Fermer">
          <p>Contenu</p>
        </Dialog>
      </>
    );
  }
  const user = userEvent.setup();
  render(<Demo />);
  expect(screen.queryByText("Contenu")).not.toBeInTheDocument();
  await user.click(screen.getByText("Ouvrir"));
  expect(screen.getByRole("dialog", { name: "Inviter" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Fermer" }));
  expect(screen.queryByText("Contenu")).not.toBeInTheDocument();
});

it("ConfirmDialog confirms or cancels", async () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(<ConfirmDialog open onClose={onClose} onConfirm={onConfirm} title="Supprimer ?" body="Irréversible." confirmLabel="Supprimer" cancelLabel="Annuler" />);
  expect(screen.getByRole("dialog", { name: "Supprimer ?" })).toHaveAccessibleDescription("Irréversible.");
  await user.click(screen.getByRole("button", { name: "Supprimer" }));
  expect(onConfirm).toHaveBeenCalledOnce();
  await user.click(screen.getAllByRole("button", { name: "Annuler" })[0]);
  expect(onClose).toHaveBeenCalled();
});

it("ConfirmDialog disables the danger button while busy", () => {
  render(<ConfirmDialog open busy onClose={() => {}} onConfirm={() => {}} title="Supprimer ?" confirmLabel="Supprimer" cancelLabel="Annuler" />);
  expect(screen.getByRole("button", { name: "Supprimer" })).toBeDisabled();
});

it("toasts are announced and go away", async () => {
  vi.useFakeTimers();
  function Demo() {
    const toast = useToast();
    return <button onClick={() => toast("Enregistré")}>Go</button>;
  }
  render(
    <ToastProvider>
      <Demo />
    </ToastProvider>,
  );
  act(() => screen.getByText("Go").click());
  expect(screen.getByRole("status")).toHaveTextContent("Enregistré");
  act(() => vi.advanceTimersByTime(4000));
  expect(screen.getByRole("status")).not.toHaveTextContent("Enregistré");
  vi.useRealTimers();
});
