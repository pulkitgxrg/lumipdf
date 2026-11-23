"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CodeBlock({
  code,
  language = "tsx",
  className,
}: {
  code: string;
  language?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      className={cn(
        "group relative my-5 overflow-hidden rounded-xl border border-black/[0.08] bg-[#0f1218]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
          {language}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-[#a5d6a7]" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-[#c8d0e0]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
