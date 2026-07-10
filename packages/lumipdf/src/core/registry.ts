import type {
  Adapter,
  AdapterConstructor,
  AdapterLoader,
  AdapterManifest,
  AdapterRegistry,
} from './types';

const PROTOCOL_VERSION = 1;

type RegistryEntry = {
  manifest: AdapterManifest;
  loader: AdapterLoader;
  cachedConstructor: AdapterConstructor | null;
};

export function createRegistry(): AdapterRegistry {
  const entries = new Map<string, RegistryEntry>();

  return {
    register(newManifest: AdapterManifest, newLoader: AdapterLoader): void {
      if (newManifest.protocolVersion !== PROTOCOL_VERSION) {
        throw new Error(
          `PDF adapter uses protocol version ${newManifest.protocolVersion}, ` +
          `but expected version ${PROTOCOL_VERSION}.`
        );
      }

      entries.set(newManifest.id, {
        manifest: newManifest,
        loader: newLoader,
        cachedConstructor: null,
      });
    },

    getManifest(): AdapterManifest | null {
      return entries.values().next().value?.manifest ?? null;
    },

    detectFormat(name: string, mimeType: string): string | null {
      const normalizedName = name.toLowerCase();
      const dotIndex = normalizedName.lastIndexOf('.');
      const extension = dotIndex >= 0 ? normalizedName.slice(dotIndex + 1) : '';

      for (const entry of entries.values()) {
        if (entry.manifest.mimeTypes.includes(mimeType)) {
          return entry.manifest.id;
        }
        if (extension && entry.manifest.extensions.includes(extension)) {
          return entry.manifest.id;
        }
      }

      return null;
    },

    async loadAdapter(format: string): Promise<Adapter> {
      const entry = entries.get(format);
      if (!entry) {
        throw new Error(`No PDF adapter has been registered for format "${format}".`);
      }

      if (!entry.cachedConstructor) {
        const mod = await entry.loader();
        const Ctor = mod.default;

        if (typeof Ctor !== 'function') {
          throw new Error('PDF adapter module must default-export a class constructor.');
        }

        entry.cachedConstructor = Ctor;
      }

      const adapter = new entry.cachedConstructor();

      if (!adapter.manifest) {
        throw new Error('PDF adapter must expose a manifest.');
      }

      return adapter;
    },

    unloadAdapter(format?: string): void {
      if (format) {
        const entry = entries.get(format);
        if (entry) {
          entry.cachedConstructor = null;
        }
        return;
      }

      for (const entry of entries.values()) {
        entry.cachedConstructor = null;
      }
    },
  };
}