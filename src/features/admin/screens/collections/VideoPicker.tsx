"use client";

import { useDeferredValue, useState } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { usePanel } from "../../AdminContext";
import type { AdminVideo } from "../../api/client";
import { dirOf, markOf, thumbOf } from "../../lib/content";
import { MiniCover, StatusBadge } from "../../ui/display";
import { SearchField } from "../../ui/inputs";
import { Dialog } from "../../ui/overlay";

export function VideoPicker({
  open,
  onClose,
  videos,
  exclude,
  seriesTitles,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  videos: AdminVideo[];
  exclude: string[];
  seriesTitles: Map<string, string>;
  onAdd: (ids: string[]) => void;
}) {
  const { t } = usePanel();
  const [q, setQ] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const query = useDeferredValue(q.trim().toLowerCase());
  const list = videos.filter((v) => !exclude.includes(v.id) && (!query || v.title.toLowerCase().includes(query) || v.topics.some((x) => x.toLowerCase().includes(query))));
  const close = () => {
    setChosen([]);
    setQ("");
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      title={t.collectionForm.pickerTitle}
      closeLabel={t.common.close}
      size="lg"
      footer={
        <>
          <button type="button" onClick={close} className={buttonClasses({ variant: "ghost" })}>
            {t.common.cancel}
          </button>
          <button
            type="button"
            disabled={chosen.length === 0}
            onClick={() => {
              onAdd(chosen);
              setChosen([]);
              setQ("");
            }}
            className={cn(buttonClasses({ variant: "accent" }), "disabled:opacity-50")}
          >
            {t.collectionForm.addSelected(chosen.length)}
          </button>
        </>
      }
    >
      <SearchField value={q} onChange={setQ} placeholder={t.collectionForm.pickerSearch} label={t.common.search} className="mb-4" />
      {list.length === 0 ? (
        <p className="py-8 text-center text-sm font-semibold text-muted">{t.collectionForm.pickerEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {list.map((v) => {
            const checked = chosen.includes(v.id);
            const other = v.seriesId ? seriesTitles.get(v.seriesId) : undefined;
            return (
              <li key={v.id}>
                <label className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] p-2 pe-3 transition-colors", checked ? "border-ink bg-accent/15" : "border-transparent hover:bg-paper")}>
                  <input type="checkbox" checked={checked} onChange={() => setChosen((c) => (checked ? c.filter((x) => x !== v.id) : [...c, v.id]))} className="size-5 shrink-0 accent-[#161616]" />
                  <MiniCover kind={v.kind} mark={markOf(v)} image={thumbOf(v)} className="w-20 text-[13px]" />
                  <span className="min-w-0 flex-1">
                    <span lang={v.lang} dir={dirOf(v.lang)} className="line-clamp-1 block text-[14px] font-bold">
                      {v.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      <span className="font-latin">{v.duration}</span>
                      {other && <> · {t.collectionForm.inOtherSeries(other)}</>}
                    </span>
                  </span>
                  {v.status === "draft" && <StatusBadge status="draft" label={t.status.draft} />}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
