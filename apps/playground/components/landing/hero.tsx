"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Copy, Check, Terminal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fadeUp, stagger } from "@/lib/motion";

const INSTALL_CMD = "npm install lumipdf";

export function Hero() {
  const [copied, setCopied] = useState(false);

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/background.png"
          alt=""
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/20 to-white/50" />
      </div>

      <div className="container relative z-10 pb-10 pt-24 md:pb-14 md:pt-28">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div
            variants={fadeUp}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft shadow-soft backdrop-blur-md"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-meadow opacity-40" />
              <span className="relative inline-flex size-2 rounded-full bg-meadow" />
            </span>
            <span>Open source</span>
            <span className="text-black/20">·</span>
            <span>MIT</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display mb-6 text-balance text-[2.85rem] leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl md:text-[3.65rem] lg:text-[4.1rem]"
          >
            A modern React
            <br />
            PDF viewer
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mb-9 max-w-[36rem] text-pretty text-[16px] leading-relaxed text-ink/80 md:text-[17px]"
          >
            LumiPDF is a high-performance pdf viewer with virtualized
            rendering, search, annotations, and a clean TypeScript API. Built on PDF.js.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mx-auto flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:items-stretch"
          >
            <button
              type="button"
              onClick={copyInstall}
              className="flex h-12 flex-1 items-center gap-3 rounded-lg border border-black/10 bg-white/95 px-4 text-left shadow-soft backdrop-blur-sm transition-colors hover:border-black/15"
            >
              <Terminal className="size-4 shrink-0 text-ink-muted" />
              <code className="flex-1 truncate font-mono text-[13px] text-ink">
                {INSTALL_CMD}
              </code>
              {copied ? (
                <Check className="size-4 shrink-0 text-meadow" />
              ) : (
                <Copy className="size-4 shrink-0 text-ink-muted" />
              )}
            </button>
            <Button asChild size="lg" className="h-12 shrink-0 rounded-lg px-5">
              <Link href="/playground">
                Open playground
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
