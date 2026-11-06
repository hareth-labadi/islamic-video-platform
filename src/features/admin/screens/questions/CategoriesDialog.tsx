"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { usePanel } from "../../AdminContext";
import { api } from "../../api/client";
import type { CategoryWithCount } from "../../api/contract";
import { useAction } from "../../api/hooks";
import { DANGER, TextInput } from "../../ui/form";
import { PlusIcon, TrashIcon } from "../../ui/icons";
import { Dialog, useToast } from "../../ui/overlay";

export function CategoriesDialog({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: CategoryWithCount[] }) {
  const { t, can } = usePanel();
  const toast = useToast();
  const [run, busy] = useAction();
  const [drafts, setDrafts] = useState<Record<string, { ar: string; fr: string; kab: string }>>({});
  const [adding, setAdding] = useState({ ar: "", fr: "", kab: "" });
  const [error, setError] = useState<string>();
  const editable = can("questions.triage");

  const save = async (id: string | undefined, title: { ar: string; fr: string; kab: string }) => {
    if (!title.ar.trim() || !title.fr.trim()) {
      setError(t.validation.required);
      return;
    }
    setError(undefined);
    try {
      await run(() => api.questions.saveCategory({ id, title: { ar: title.ar.trim(), fr: title.fr.trim(), kab: title.kab.trim() || title.fr.trim() } }));
      toast(t.questions.categorySaved);
      if (id)
        setDrafts((d) => {
          const next = { ...d };
          delete next[id];
          return next;
        });
      else setAdding({ ar: "", fr: "", kab: "" });
    } catch {
      toast(t.common.error, "error");
    }
  };

  const row = (value: { ar: string; fr: string; kab: string }, set: (v: { ar: string; fr: string; kab: string }) => void, label: string) => (
    <div className="grid flex-1 gap-2 sm:grid-cols-3">
      {(["ar", "fr", "kab"] as const).map((l) => (
        <TextInput key={l} aria-label={`${label} — ${t.langs[l]}`} placeholder={t.langs[l]} dir={l === "ar" ? "rtl" : "ltr"} value={value[l]} disabled={!editable} onChange={(e) => set({ ...value, [l]: e.target.value })} className="h-10 text-[14px]" />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onClose={onClose} title={t.questions.categoriesTitle} description={t.questions.categoriesLead} closeLabel={t.common.close} size="lg">
      <ul className="flex flex-col gap-3">
        {categories.map((c) => {
          const draft = drafts[c.id] ?? { ar: c.title.ar, fr: c.title.fr, kab: c.title.kab };
          const changed = !!drafts[c.id];
          return (
            <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-paper p-2.5">
              {row(draft, (v) => setDrafts((d) => ({ ...d, [c.id]: v })), c.title.fr)}
              <span className="w-20 text-center text-xs font-semibold text-muted">{t.questions.inUse(c.questionCount)}</span>
              {changed ? (
                <button type="button" disabled={busy} onClick={() => void save(c.id, draft)} className={buttonClasses({ variant: "ink", size: "sm" })}>
                  {t.common.save}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy || c.questionCount > 0 || !editable}
                  title={c.questionCount > 0 ? t.questions.cannotDelete : undefined}
                  aria-label={`${t.common.delete}: ${c.title.fr}`}
                  onClick={async () => {
                    try {
                      await run(() => api.questions.removeCategory(c.id));
                    } catch {
                      toast(t.questions.cannotDelete, "error");
                    }
                  }}
                  className="grid size-9 place-items-center rounded-full text-muted hover:bg-card hover:text-[#B42318] disabled:opacity-30"
                >
                  <TrashIcon size={16} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {editable && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-line p-2.5">
          {row(adding, setAdding, t.questions.newCategory)}
          <button type="button" disabled={busy} onClick={() => void save(undefined, adding)} className={buttonClasses({ variant: "accent", size: "sm" })}>
            <PlusIcon size={15} />
            {t.common.add}
          </button>
        </div>
      )}
      {error && (
        <p className="mt-3 text-[13px] font-semibold" style={{ color: DANGER }}>
          {error}
        </p>
      )}
    </Dialog>
  );
}
