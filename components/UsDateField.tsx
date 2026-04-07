"use client";

import { formatUsFromIso, parseDateFormValue } from "@/lib/calendar-date";
import { CalendarDays } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { enUS } from "react-day-picker/locale";
import "react-day-picker/style.css";

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
  const [value, setValue] = useState(() => (defaultIso ? formatUsFromIso(defaultIso) : ""));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setValue(defaultIso ? formatUsFromIso(defaultIso) : "");
  }, [defaultIso]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

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
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-[100] max-w-[calc(100vw-2rem)] overflow-x-auto rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xl shadow-slate-900/10">
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
      ) : null}
    </div>
  );
}
