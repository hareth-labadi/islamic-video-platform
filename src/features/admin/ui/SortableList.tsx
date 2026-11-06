"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { GripIcon } from "./icons";

interface DragState {
  id: string;
  from: number;
  to: number;
  startY: number;
  dy: number;
  /** Top and height of every row when the drag started. */
  rects: Array<{ top: number; height: number }>;
  gap: number;
}

export interface HandleProps {
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  "aria-label": string;
  "aria-describedby"?: string;
  "data-handle": string;
  className: string;
  children: ReactNode;
}

interface SortableListProps<T> {
  items: T[];
  getId: (item: T) => string;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, handle: HandleProps, dragging: boolean) => ReactNode;
  handleLabel: (item: T) => string;
  movedMessage: (item: T, position: number) => string;
  /** id of the element that explains how to reorder. */
  hintId?: string;
  className?: string;
  disabled?: boolean;
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Vertical list you reorder by dragging the grip (mouse, pen or touch) or, with
 * the grip focused, with ↑ / ↓. Other rows slide out of the way while dragging.
 */
export function SortableList<T>({ items, getId, onReorder, renderItem, handleLabel, movedMessage, hintId, className, disabled }: SortableListProps<T>) {
  const list = useRef<HTMLOListElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [announce, setAnnounce] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);

  // Keep keyboard focus on the grip of the row that just moved.
  useEffect(() => {
    if (!focusId) return;
    list.current?.querySelector<HTMLElement>(`[data-handle="${CSS.escape(focusId)}"]`)?.focus();
  }, [focusId, items]);

  const start = (e: PointerEvent<HTMLButtonElement>, index: number, id: string) => {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    // Measure from the event (not a ref): handlers are handed to renderItem during render.
    const rects = Array.from(e.currentTarget.closest("ol")?.children ?? [], (node) => {
      const r = node.getBoundingClientRect();
      return { top: r.top, height: r.height };
    });
    const gap = rects.length > 1 ? Math.max(0, rects[1].top - rects[0].top - rects[0].height) : 0;
    setDrag({ id, from: index, to: index, startY: e.clientY, dy: 0, rects, gap });
  };

  const moveTo = (e: PointerEvent<Element>) => {
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    const self = drag.rects[drag.from];
    const center = self.top + self.height / 2 + dy;
    // New position = how many other rows sit above the dragged row's centre.
    const to = drag.rects.filter((r, i) => i !== drag.from && r.top + r.height / 2 < center).length;
    if (to !== drag.to || dy !== drag.dy) setDrag({ ...drag, dy, to });
  };

  const end = () => {
    if (!drag) return;
    const { from, to } = drag;
    setDrag(null);
    if (from !== to) {
      const next = move(items, from, to);
      onReorder(next);
      setAnnounce(movedMessage(next[to], to + 1));
    }
  };

  const keyMove = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (disabled) return;
    const delta = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : e.key === "Home" ? -index : e.key === "End" ? items.length - 1 - index : 0;
    if (!delta) return;
    e.preventDefault();
    const to = Math.min(items.length - 1, Math.max(0, index + delta));
    if (to === index) return;
    const next = move(items, index, to);
    onReorder(next);
    setFocusId(getId(next[to]));
    setAnnounce(movedMessage(next[to], to + 1));
  };

  const offsetFor = (index: number): number => {
    if (!drag) return 0;
    if (index === drag.from) return drag.dy;
    const shift = drag.rects[drag.from].height + drag.gap;
    if (drag.from < drag.to && index > drag.from && index <= drag.to) return -shift;
    if (drag.from > drag.to && index < drag.from && index >= drag.to) return shift;
    return 0;
  };

  return (
    <>
      <ol ref={list} className={cn("flex flex-col gap-2", className)}>
        {items.map((item, index) => {
          const id = getId(item);
          const dragging = drag?.id === id;
          const handle: HandleProps = {
            onPointerDown: (e) => start(e, index, id),
            onKeyDown: (e) => keyMove(e, index),
            "aria-label": handleLabel(item),
            "aria-describedby": hintId,
            "data-handle": id,
            className: cn(
              "grid size-10 shrink-0 touch-none place-items-center rounded-xl text-muted transition-colors hover:bg-paper hover:text-ink",
              disabled ? "cursor-not-allowed opacity-40" : dragging ? "cursor-grabbing" : "cursor-grab",
            ),
            children: <GripIcon size={18} />,
          };
          return (
            <li
              key={id}
              onPointerMove={dragging ? moveTo : undefined}
              onPointerUp={dragging ? end : undefined}
              onPointerCancel={dragging ? end : undefined}
              style={{ transform: drag ? `translateY(${offsetFor(index)}px)` : undefined }}
              className={cn(
                "relative",
                drag && !dragging && "transition-transform duration-200 ease-out",
                dragging && "z-20 scale-[1.015] shadow-[0_22px_40px_-22px_rgb(22_22_22/.55)]",
              )}
            >
              {renderItem(item, drag && dragging ? drag.to : drag ? previewIndex(index, drag) : index, handle, dragging)}
            </li>
          );
        })}
      </ol>
      <p aria-live="assertive" className="sr-only">
        {announce}
      </p>
    </>
  );
}

/** Where a row will land if the drag ends now (for live episode numbers). */
function previewIndex(index: number, drag: DragState): number {
  if (drag.from < drag.to && index > drag.from && index <= drag.to) return index - 1;
  if (drag.from > drag.to && index < drag.from && index >= drag.to) return index + 1;
  return index;
}
