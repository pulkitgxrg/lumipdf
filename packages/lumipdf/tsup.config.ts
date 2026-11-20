import { readFile, writeFile } from "node:fs/promises";
import { defineConfig } from "tsup";

// Bundled ESM build. tsc alone emits extensionless relative imports
// (moduleResolution "Bundler"), which Node ESM cannot load; bundling into a
// single dist/index.js avoids that without rewriting every import in src/.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "es2022",
  platform: "browser",
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  // dependencies + peerDependencies are external by default; listed for clarity.
  external: ["react", "react-dom", "react/jsx-runtime", "pdfjs-dist", "tesseract.js"],
  // Components use hooks; mark the bundle as a client module so it can be
  // imported from React Server Components (Next.js App Router) directly.
  // tsup's `banner` strips module-level directives when bundling, so the
  // directive is prepended after the build (shifting the source map one line).
  async onSuccess() {
    const js = "dist/index.js";
    const map = "dist/index.js.map";
    const code = await readFile(js, "utf8");
    if (code.startsWith('"use client"')) return;
    await writeFile(js, `"use client";\n${code}`);
    const sourceMap = JSON.parse(await readFile(map, "utf8"));
    sourceMap.mappings = `;${sourceMap.mappings}`;
    await writeFile(map, JSON.stringify(sourceMap));
  },
});
