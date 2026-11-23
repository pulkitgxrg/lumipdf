"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  GitBranch,
  LifeBuoy,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fadeUp, stagger } from "@/lib/motion";

const CHANNELS = [
  {
    icon: GitBranch,
    title: "GitHub Issues",
    desc: "Report bugs, request features, and track releases.",
    href: "https://github.com/pulkitgxrg/lumipdf/issues",
    cta: "Open issues",
    external: true,
  },
  {
    icon: BookOpen,
    title: "Documentation",
    desc: "Installation, guides, migration, and API reference.",
    href: "/docs",
    cta: "Browse docs",
    external: false,
  },
  {
    icon: MessageCircle,
    title: "Community",
    desc: "Star the repo, open discussions, and contribute PRs.",
    href: "https://github.com/pulkitgxrg/lumipdf",
    cta: "View repository",
    external: true,
  },
];

export function SupportSection() {
  return (
    <section id="support" className="bg-[#f7f8f6] py-20 md:py-28">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <motion.p
            variants={fadeUp}
            className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-meadow"
          >
            Support
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-display mb-3 text-balance text-3xl tracking-tight text-ink md:text-4xl lg:text-[2.75rem]"
          >
            We&apos;re here when you ship.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-ink-soft">
            LumiPDF is free and open source. Get help from the docs, report issues on
            GitHub, or contribute improvements.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3"
        >
          {CHANNELS.map((channel) => (
            <motion.div key={channel.title} variants={fadeUp}>
              <Card className="h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-4 grid size-11 place-items-center rounded-xl bg-meadow-light text-meadow">
                    <channel.icon className="size-5" />
                  </div>
                  <h3 className="mb-2 text-[17px] font-semibold tracking-tight text-ink">
                    {channel.title}
                  </h3>
                  <p className="mb-5 flex-1 text-sm leading-relaxed text-ink-soft">
                    {channel.desc}
                  </p>
                  {channel.external ? (
                    <a
                      href={channel.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-meadow hover:underline"
                    >
                      {channel.cta}
                      <ArrowRight className="size-3.5" />
                    </a>
                  ) : (
                    <Link
                      href={channel.href}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-meadow hover:underline"
                    >
                      {channel.cta}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-10 flex max-w-4xl flex-col items-center justify-between gap-4 rounded-2xl border border-black/[0.06] bg-white px-6 py-5 sm:flex-row"
        >
          <div className="flex items-start gap-3 text-left">
            <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-meadow-light text-meadow">
              <LifeBuoy className="size-4" />
            </div>
            <div>
              <p className="font-semibold text-ink">Need a deeper dive?</p>
              <p className="text-sm text-ink-soft">
                Start with the support guide in the documentation.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/docs/support">
              Support guide
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
