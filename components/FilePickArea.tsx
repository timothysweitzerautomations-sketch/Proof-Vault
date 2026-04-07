"use client";

import { UploadCloud } from "lucide-react";
import { useId, useState } from "react";

type Props = {
  name?: string;
  accept?: string;
  multiple?: boolean;
};

/** Styled file picker for forms — keeps native `name` for Server Actions. */
export function FilePickArea({
  name = "files",
  accept = "image/*,.pdf,application/pdf",
  multiple = true,
}: Props) {
  const id = useId();
  const [count, setCount] = useState(0);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={(e) => setCount(e.target.files?.length ?? 0)}
        className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      />
      <label
        htmlFor={id}
        className="flex min-h-[9.5rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-vault-300/80 bg-gradient-to-b from-vault-50/50 to-white/60 px-6 py-8 text-center transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-vault-500 hover:border-vault-400 hover:bg-vault-50/40"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-vault-100 text-vault-700 shadow-inner shadow-vault-900/5">
          <UploadCloud className="h-6 w-6" strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">Drop receipts here or tap to browse</p>
          <p className="mt-1 text-xs text-slate-500">Photos, scans, or PDF — you can add several at once</p>
        </div>
        {count > 0 ? (
          <p className="text-xs font-medium text-vault-800">{count} file{count === 1 ? "" : "s"} selected</p>
        ) : (
          <p className="text-xs text-slate-400">PNG, JPG, HEIC, PDF</p>
        )}
      </label>
    </div>
  );
}
