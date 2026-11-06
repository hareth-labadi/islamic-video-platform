"use client";

import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CheckIcon, CloseIcon } from "@/components/ui/icons";
import { buttonClasses } from "@/components/ui/Button";
import { AlertIcon } from "./icons";

/* ----------------------------------------------------------- Dialog */

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  closeLabel: string;
  size?: "sm" | "md" | "lg";
}

/** Native <dialog> (focus trap, Esc, inert page) styled as a white tile. */
export function Dialog({ open, onClose, title, description, children, footer, closeLabel, size = "md" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // When the route is hidden by Next's <Activity>, close so it doesn't come back open.
  useLayoutEffect(() => {
    const dialog = ref.current;
    return () => {
      if (dialog?.open) {
        dialog.close();
        onCloseRef.current();
      }
    };
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={() => open && onClose()}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "m-auto max-h-[min(90dvh,860px)] w-[calc(100%-2rem)] overflow-visible rounded-tile bg-transparent p-0 text-ink backdrop:bg-ink/45 backdrop:backdrop-blur-[2px] open:animate-rise",
        size === "sm" ? "max-w-md" : size === "md" ? "max-w-xl" : "max-w-3xl",
      )}
    >
      {open && (
        <div className="flex max-h-[min(90dvh,860px)] flex-col overflow-hidden rounded-tile bg-card shadow-[0_30px_80px_-30px_rgb(22_22_22/.55)]">
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
            <div>
              <h2 id={titleId} className="text-xl font-bold">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-[14px] text-subtle">
                  {description}
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} aria-label={closeLabel} className="-me-2 -mt-1 rounded-full p-2 hover:bg-ink/5">
              <CloseIcon size={20} />
            </button>
          </div>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>}
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line-soft px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/** "Are you sure?" with a danger button. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  cancelLabel,
  busy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  children?: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={body}
      closeLabel={cancelLabel}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonClasses({ variant: "ghost", size: "md" })}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className={cn(buttonClasses({ variant: "ink", size: "md" }), "bg-[#B42318] hover:bg-[#912018] disabled:opacity-60")}>
            {confirmLabel}
          </button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}

/* ----------------------------------------------------------- Toasts */

interface Toast {
  id: number;
  message: string;
  tone: "ok" | "error";
}

const ToastContext = createContext<(message: string, tone?: Toast["tone"]) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), tone === "error" ? 6000 : 3200);
  }, []);
  return (
    <ToastContext value={push}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto inline-flex animate-rise items-center gap-2.5 rounded-full py-2.5 ps-3 pe-5 text-sm font-semibold shadow-[0_14px_34px_-14px_rgb(22_22_22/.6)]",
              toast.tone === "ok" ? "bg-ink text-white" : "bg-[#B42318] text-white",
            )}
          >
            <span className={cn("grid size-6 place-items-center rounded-full", toast.tone === "ok" ? "bg-accent text-ink" : "bg-white/20")}>
              {toast.tone === "ok" ? <CheckIcon size={14} /> : <AlertIcon size={14} />}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/* ----------------------------------------------------------- Menu */

/** Small popover menu (row actions, switchers). Closes on outside click, Esc and when hidden. */
export function Popover({
  trigger,
  children,
  align = "end",
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void; "aria-expanded": boolean; "aria-haspopup": "menu" }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useLayoutEffect(() => () => setOpen(false), []);

  return (
    <div ref={root} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o), "aria-expanded": open, "aria-haspopup": "menu" })}
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-[calc(100%+6px)] z-40 min-w-52 animate-rise rounded-2xl border border-line bg-card p-1.5 shadow-[0_18px_40px_-18px_rgb(22_22_22/.45)]",
            align === "end" ? "end-0" : "start-0",
            className,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ onSelect, children, danger, disabled }: { onSelect: () => void; children: ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-sm font-semibold transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-45",
        danger && "text-[#B42318]",
      )}
    >
      {children}
    </button>
  );
}
