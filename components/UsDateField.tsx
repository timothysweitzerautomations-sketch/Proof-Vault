"use client";

import { formatUsFromIso, parseDateFormValue } from "@/lib/calendar-date";
import { CalendarDays } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { enUS } from "react-day-picker/locale";

type Props = {
  name: string;
  /** ISO `YYYY-MM-DD` from the server */
  defaultIso?: string;
  required?: boolean;
  className?: string;
};

function selectedDayFromValue(text: string): Date | undefined {
  const d = parseDateFormValue(text);
  if (!d) return undefined;
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function usTextFromPickerDay(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const day = date.getDate();
  const iso = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return formatUsFromIso(iso);
}

export function UsDateField({ name, defaultIso, required, className }: Props) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(() => (defaultIso ? formatUsFromIso(defaultIso) : ""));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setValue(defaultIso ? formatUsFromIso(defaultIso) : "");
  }, [defaultIso]);

  useLayoutEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    const pop = popoverRef.current;
    if (!root || !pop) return;

    const place = () => {
      const rr = root.getBoundingClientRect();
      const margin = 10;
      const gap = 6;
      const popW = pop.offsetWidth || 280;
      const popH = pop.offsetHeight || 300;
      let left = rr.left;
      if (left + popW + margin > window.innerWidth) {
        left = Math.max(margin, window.innerWidth - popW - margin);
      }
      if (left < margin) left = margin;
      let top = rr.bottom + gap;
      if (top + popH + margin > window.innerHeight) {
        top = Math.max(margin, rr.top - popH - gap);
      }
      if (top < margin) top = margin;
      pop.style.left = `${Math.round(left)}px`;
      pop.style.top = `${Math.round(top)}px`;
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const popover =
    open ? (
      <div
        ref={popoverRef}
        className="fixed z-[200] w-max min-w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xl shadow-slate-900/10"
        style={{ top: 0, left: 0 }}
        role="dialog"
        aria-label="Choose date"
      >
        <DayPicker
          mode="single"
          locale={enUS}
          weekStartsOn={0}
          selected={selectedDayFromValue(value)}
          defaultMonth={selectedDayFromValue(value) ?? new Date()}
          onSelect={(d) => {
            if (d) {
              setValue(usTextFromPickerDay(d));
              setOpen(false);
            }
          }}
        />
      </div>
    ) : null;

  return (
    <div ref={rootRef} className="relative flex w-full gap-2">
      <input
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required={required}
        placeholder="MM/DD/YYYY"
        autoComplete="off"
        spellCheck={false}
        className={`min-w-0 flex-1 ${className ?? ""}`}
      />
      <button
        type="button"
        className="flex h-[42px] w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-vault-700 shadow-sm transition hover:border-vault-300 hover:bg-vault-50"
        aria-label="Open calendar"
        onClick={() => setOpen((o) => !o)}
      >
        <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
      </button>
      {typeof document !== "undefined" && popover ? createPortal(popover, document.body) : null}
    </div>
  );
}
