import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DocsH1({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "font-display mb-3 text-balance text-3xl tracking-tight text-ink md:text-4xl",
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function DocsLead({ children }: { children: ReactNode }) {
  return (
    <p className="mb-8 text-lg leading-relaxed text-ink-soft md:text-[1.125rem]">
      {children}
    </p>
  );
}

export function DocsH2({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <h2
      id={id}
      className="mb-3 mt-12 scroll-mt-24 border-b border-black/[0.06] pb-2 text-xl font-semibold tracking-tight text-ink"
    >
      {children}
    </h2>
  );
}

export function DocsH3({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <h3
      id={id}
      className="mb-2 mt-8 scroll-mt-24 text-base font-semibold tracking-tight text-ink"
    >
      {children}
    </h3>
  );
}

export function DocsP({ children }: { children: ReactNode }) {
  return <p className="mb-4 text-[15px] leading-7 text-ink-soft">{children}</p>;
}

export function DocsUl({ children }: { children: ReactNode }) {
  return (
    <ul className="mb-5 list-disc space-y-2 pl-5 text-[15px] leading-7 text-ink-soft marker:text-meadow">
      {children}
    </ul>
  );
}

export function DocsOl({ children }: { children: ReactNode }) {
  return (
    <ol className="mb-5 list-decimal space-y-2 pl-5 text-[15px] leading-7 text-ink-soft marker:font-semibold marker:text-meadow">
      {children}
    </ol>
  );
}

export function DocsLi({ children }: { children: ReactNode }) {
  return <li className="pl-1">{children}</li>;
}

export function DocsInlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px] text-ink">
      {children}
    </code>
  );
}

export function DocsCallout({
  title = "Note",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="my-6 rounded-xl border border-meadow/20 bg-meadow-light/50 px-4 py-3.5">
      <p className="mb-1 text-[12px] font-bold uppercase tracking-wider text-meadow">
        {title}
      </p>
      <div className="text-[14px] leading-relaxed text-ink-soft [&_p]:mb-0">
        {children}
      </div>
    </div>
  );
}

export function PropsTable({
  rows,
}: {
  rows: { name: string; type: string; default?: string; description: string }[];
}) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-black/[0.08]">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-black/[0.06] bg-black/[0.02] text-[12px] uppercase tracking-wider text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Prop</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Default</th>
            <th className="px-4 py-3 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.05]">
          {rows.map((row) => (
            <tr key={row.name} className="align-top">
              <td className="px-4 py-3 font-mono text-[13px] font-medium text-ink">
                {row.name}
              </td>
              <td className="px-4 py-3 font-mono text-[12px] text-meadow">
                {row.type}
              </td>
              <td className="px-4 py-3 font-mono text-[12px] text-ink-muted">
                {row.default ?? "-"}
              </td>
              <td className="px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
