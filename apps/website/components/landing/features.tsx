"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Code2,
  Layers,
  Palette,
  Search,
  Shield,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Tab = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bannerTitle: string;
  bannerDesc: string;
};

type Card = {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
};

const TABS: Tab[] = [
  {
    id: "viewer",
    label: "Fast viewer",
    icon: Zap,
    color: "#e11d48",
    bannerTitle: "Virtualized rendering that stays smooth at scale.",
    bannerDesc:
      "PDF.js under the hood - zoom, search, and navigate thousand-page documents without jank.",
  },
  {
    id: "search",
    label: "Search",
    icon: Search,
    color: "#0d9488",
    bannerTitle: "Find anything across every page, instantly.",
    bannerDesc:
      "Full-text search with live match highlighting and one-click jump to any occurrence.",
  },
  {
    id: "annotations",
    label: "Annotations",
    icon: Layers,
    color: "#d97706",
    bannerTitle: "Markup that feels native to review workflows.",
    bannerDesc:
      "Highlights, notes, shapes, and free text built for product UIs - not bolted on later.",
  },
  {
    id: "api",
    label: "React API",
    icon: Code2,
    color: "#2563eb",
    bannerTitle: "One import. Full control. TypeScript-first.",
    bannerDesc:
      "Themes, hooks, and a clean component surface so the viewer fits your stack - not the other way around.",
  },
];

const CARDS: Card[] = [
  {
    icon: Palette,
    title: "Themes & composition",
    desc: "Light and dark themes out of the box. Compose toolbar, sidebar, and viewer the way your product needs.",
    color: "#e11d48",
  },
  {
    icon: Shield,
    title: "Private by design",
    desc: "Runs fully client-side. Documents stay in the browser - no backend required to render or search.",
    color: "#0d9488",
  },
  {
    icon: Code2,
    title: "Drop-in React component",
    desc: "Ship a full PDF experience with a single component. TypeScript types, hooks, and gradual-migration helpers included.",
    color: "#7c3aed",
  },
];

export function Features() {
  const [activeId, setActiveId] = useState(TABS[0].id);
  const active = TABS.find((tab) => tab.id === activeId) ?? TABS[0];

  return (
    <section id="features" className="bg-[#f3f4f6] py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-black/[0.04] bg-white px-5 py-12 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_64px_rgba(15,23,42,0.06)] sm:px-10 sm:py-14 md:px-14 md:py-16">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="mx-auto mb-10 max-w-xl text-center md:mb-12"
          >
            <motion.h2
              variants={fadeUp}
              className="mb-3 text-balance text-[1.85rem] font-semibold tracking-tight text-ink sm:text-3xl md:text-[2.15rem]"
              style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
            >
              Capabilities
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-pretty text-[15px] leading-relaxed text-ink-soft"
            >
              A focused React PDF viewer - high-performance rendering, search,
              annotations, and a developer-friendly API.
            </motion.p>
          </motion.div>

          {/* Tab bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="mb-4 overflow-x-auto rounded-2xl border border-black/[0.06] bg-[#fafafa] p-1.5"
          >
            <div className="flex min-w-max gap-1 sm:min-w-0 sm:grid sm:grid-cols-4">
              {TABS.map((tab) => {
                const isActive = tab.id === activeId;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveId(tab.id)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all sm:px-4",
                      isActive
                        ? "bg-white text-ink shadow-[0_1px_3px_rgba(15,23,42,0.08),0_4px_12px_rgba(15,23,42,0.04)]"
                        : "text-ink-muted hover:bg-white/70 hover:text-ink-soft",
                    )}
                  >
                    <tab.icon
                      className="size-3.5 shrink-0"
                      style={{ color: tab.color }}
                      strokeWidth={2.25}
                    />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* CTA banner */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mb-4 flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6"
          >
            <div className="min-w-0 flex-1 text-left">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-[15px] font-semibold tracking-tight text-ink sm:text-base">
                    {active.bannerTitle}
                  </p>
                  <p className="mt-1 max-w-lg text-sm leading-relaxed text-ink-soft">
                    {active.bannerDesc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <Button asChild size="lg" variant="primary" className="h-11 shrink-0 rounded-xl px-5">
              <Link href="/playground">
                Get started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid gap-3 sm:grid-cols-3 sm:gap-4"
          >
            {CARDS.map((card) => (
              <motion.article
                key={card.title}
                variants={fadeUp}
                className="rounded-2xl border border-black/[0.06] bg-white p-5 text-left transition-shadow hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-6"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <card.icon
                    className="size-4 shrink-0"
                    style={{ color: card.color }}
                    strokeWidth={2.25}
                  />
                  <h3 className="text-[15px] font-semibold tracking-tight text-ink">
                    {card.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-ink-soft">{card.desc}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
