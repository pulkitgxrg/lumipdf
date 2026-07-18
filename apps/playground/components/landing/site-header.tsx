"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "/docs", label: "Docs" },
  { href: "#support", label: "Support" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 -mb-16 border-b border-black/[0.08] bg-transparent">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display relative z-10 text-[1.65rem] leading-none tracking-[-0.03em] text-ink transition-opacity hover:opacity-80"
        >
          lumipdf
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) =>
            item.href.startsWith("#") ? (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/playground">Playground</Link>
          </Button>
          <Button asChild>
            <Link href="/docs/installation">
              Install
              <Terminal className="size-3.5" />
            </Link>
          </Button>
        </div>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-xl border border-black/10 bg-white/80 text-ink backdrop-blur-sm md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-black/[0.08] bg-white/95 p-4 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV.map((item) =>
                item.href.startsWith("#") ? (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-base font-medium text-ink-soft hover:bg-black/[0.03] hover:text-ink"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-base font-medium text-ink-soft hover:bg-black/[0.03] hover:text-ink"
                  >
                    {item.label}
                  </Link>
                ),
              )}
              <Button asChild className="mt-3 w-full" size="lg">
                <Link href="/docs/installation" onClick={() => setOpen(false)}>
                  Install
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
