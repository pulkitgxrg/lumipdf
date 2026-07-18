"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Menu, X } from "lucide-react";
import { DOCS_NAV, getDocsPageMeta } from "@/lib/docs-nav";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function DocsSidebar({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("space-y-7", className)} aria-label="Documentation">
      {DOCS_NAV.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    {...(onNavigate ? { onClick: onNavigate } : {})}
                    className={cn(
                      "block rounded-lg px-2.5 py-1.5 text-[13.5px] transition-colors",
                      active
                        ? "bg-meadow-light font-semibold text-meadow"
                        : "text-ink-soft hover:bg-black/[0.03] hover:text-ink",
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DocsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { prev, next } = getDocsPageMeta(pathname);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-svh bg-white text-ink">
      <header className="sticky top-0 z-50 border-b border-black/[0.08] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid size-9 place-items-center rounded-lg border border-black/10 text-ink lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
            <Link
              href="/"
              className="font-display text-[1.45rem] leading-none tracking-[-0.03em] text-ink"
            >
              lumipdf
            </Link>
            <span className="hidden rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted sm:inline">
              Docs
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Site">
            <Link
              href="/docs"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-ink"
            >
              Docs
            </Link>
            <Link
              href="/playground"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft hover:text-ink"
            >
              Playground
            </Link>
            <a
              href="https://github.com/pulkitgxrg/lumipdf"
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft hover:text-ink"
            >
              GitHub
            </a>
          </nav>

          <Button size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/docs/installation">Install</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-60 shrink-0 border-r border-black/[0.06] lg:block xl:w-64">
          <ScrollArea className="h-full">
            <div className="p-5 pb-10">
              <DocsSidebar pathname={pathname} />
            </div>
          </ScrollArea>
        </aside>

        {open ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/20"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] border-r border-black/[0.08] bg-white shadow-float">
              <div className="flex h-14 items-center border-b border-black/[0.06] px-4">
                <span className="text-sm font-semibold text-ink">Documentation</span>
              </div>
              <ScrollArea className="h-[calc(100svh-3.5rem)]">
                <div className="p-4 pb-10">
                  <DocsSidebar pathname={pathname} onNavigate={() => setOpen(false)} />
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-4 py-10 sm:px-8 lg:px-12 lg:py-12">
          <article className="mx-auto max-w-3xl">{children}</article>

          <div className="mx-auto mt-14 max-w-3xl border-t border-black/[0.08] pt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link
                  href={prev.href}
                  className="group flex flex-col rounded-xl border border-black/[0.08] p-4 transition-colors hover:border-meadow/30 hover:bg-meadow-light/40"
                >
                  <span className="mb-1 flex items-center gap-1 text-xs font-medium text-ink-muted">
                    <ArrowLeft className="size-3.5" />
                    Previous
                  </span>
                  <span className="text-sm font-semibold text-ink group-hover:text-meadow">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  href={next.href}
                  className="group flex flex-col items-end rounded-xl border border-black/[0.08] p-4 text-right transition-colors hover:border-meadow/30 hover:bg-meadow-light/40"
                >
                  <span className="mb-1 flex items-center gap-1 text-xs font-medium text-ink-muted">
                    Next
                    <ArrowRight className="size-3.5" />
                  </span>
                  <span className="text-sm font-semibold text-ink group-hover:text-meadow">
                    {next.title}
                  </span>
                </Link>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
