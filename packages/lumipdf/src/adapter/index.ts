import { pdfManifest } from './PDFAdapter';
import { PdfAdapter } from './PDFAdapter';
import type { AdapterRegistry } from '../core/types';

export function registerBuiltInAdapters(registry: AdapterRegistry): void {
  registry.register(pdfManifest, async () => ({ default: PdfAdapter }));
}