import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/[0.06] bg-white pb-8 pt-12">
      <div className="container">
        <div className="mb-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link
              href="/"
              className="font-display text-[1.5rem] leading-none tracking-[-0.03em] text-ink"
            >
              lumipdf
            </Link>
            <p className="mt-3.5 max-w-xs text-sm leading-relaxed text-ink-soft">
              High-performance React PDF viewer. Built for products that treat
              documents as first-class.
            </p>
          </div>
          <div>
            <h4 className="mb-3.5 text-[13px] font-semibold text-ink">Product</h4>
            <div className="flex flex-col gap-2 text-sm text-ink-soft">
              <a href="#features" className="hover:text-ink">
                Features
              </a>
              <Link href="/playground" className="hover:text-ink">
                Playground
              </Link>
              <a href="#support" className="hover:text-ink">
                Support
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-3.5 text-[13px] font-semibold text-ink">Docs</h4>
            <div className="flex flex-col gap-2 text-sm text-ink-soft">
              <Link href="/docs" className="hover:text-ink">
                Introduction
              </Link>
              <Link href="/docs/installation" className="hover:text-ink">
                Installation
              </Link>
              <a
                href="https://www.npmjs.com/package/lumipdf"
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink"
              >
                Node Package Manager
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-3.5 text-[13px] font-semibold text-ink">Links</h4>
            <div className="flex flex-col gap-2 text-sm text-ink-soft">
              <a
                href="https://github.com/pulkitgxrg/lumipdf"
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink"
              >
                GitHub
              </a>
              <Link href="/docs/support" className="hover:text-ink">
                Support guide
              </Link>
              <a
                href="https://github.com/pulkitgxrg/lumipdf"
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink"
              >
                License
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-black/[0.06] pt-6 text-center text-[13px] text-ink-muted sm:flex-row sm:text-left">
          <span>© {new Date().getFullYear()} LumiPDF. All rights reserved.</span>
          <span>Made with ❤️ by Pulkit Garg</span>
        </div>
      </div>
    </footer>
  );
}
