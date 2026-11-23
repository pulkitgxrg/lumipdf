"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp, stagger } from "@/lib/motion";

export function DocsSection() {
  const [copied, setCopied] = useState(false);

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText("npm install lumipdf");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section id="docs" className="bg-white py-20 md:py-28">
      <div className="container grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.p
            variants={fadeUp}
            className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-meadow"
          >
            Docs
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-display mb-3 text-balance text-3xl tracking-tight text-ink md:text-4xl lg:text-[2.75rem]"
          >
            Guides, API, and migration
          </motion.h2>
          <motion.p variants={fadeUp} className="mb-7 max-w-md text-ink-soft">
            Installation, quick start, annotations, theming, and a full DocumentViewer
            reference - structured like the docs you already know from other React
            libraries.
          </motion.p>
          <motion.div variants={fadeUp} className="mb-4">
            <button
              type="button"
              onClick={copyInstall}
              className="inline-flex items-center gap-3 rounded-lg border border-black/10 bg-[#0f1218] px-4 py-3 font-mono text-[13px] text-white shadow-soft transition-opacity hover:opacity-90"
            >
              <span className="text-white/40">$</span>
              <span>npm install lumipdf</span>
              {copied ? (
                <Check className="size-4 text-[#a5d6a7]" />
              ) : (
                <Copy className="size-4 text-white/50" />
              )}
            </button>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/docs">
                <BookOpen className="size-4" />
                Read the docs
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/docs/installation">Installation</Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="overflow-hidden rounded-2xl border border-black/[0.08] bg-[#0f1218] shadow-float"
        >
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex gap-1">
              <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                React
              </span>
              <span className="rounded-md px-2.5 py-1 text-xs font-semibold text-white/50">
                TypeScript
              </span>
            </div>
            <Link
              href="/docs/quick-start"
              className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-semibold text-white/50 transition-colors hover:text-white"
            >
              Quick start →
            </Link>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-7 text-[#c8d0e0]">
            <code>
              <span className="text-[#a5d6a7]">import</span>
              {" { DocumentViewer } "}
              <span className="text-[#a5d6a7]">from</span>{" "}
              <span className="text-[#c5e1a5]">&quot;lumipdf&quot;</span>
              {";\n"}
              <span className="text-[#a5d6a7]">import</span>{" "}
              <span className="text-[#c5e1a5]">&quot;lumipdf/styles&quot;</span>
              {";\n\n"}
              <span className="text-white/35">{"// Drop-in viewer"}</span>
              {"\n"}
              <span className="text-[#a5d6a7]">export function</span>{" "}
              <span className="text-[#90caf9]">App</span>
              {"() {\n"}
              {"  "}
              <span className="text-[#a5d6a7]">return</span>
              {" (\n"}
              {"    <"}
              <span className="text-[#90caf9]">DocumentViewer</span>
              {"\n"}
              {"      source={{ kind: "}
              <span className="text-[#c5e1a5]">&quot;url&quot;</span>
              {", url: "}
              <span className="text-[#c5e1a5]">&quot;/report.pdf&quot;</span>
              {" }}\n"}
              {"      theme="}
              <span className="text-[#c5e1a5]">&quot;light&quot;</span>
              {"\n"}
              {"    />\n"}
              {"  );\n"}
              {"}"}
            </code>
          </pre>
        </motion.div>
      </div>
    </section>
  );
}
