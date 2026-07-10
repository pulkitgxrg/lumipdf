import type { Annotation } from './types';

export interface SerializedAnnotations {
  readonly version: 1;
  readonly annotations: Annotation[];
}

export function serializeAnnotations(annotations: Annotation[]): string {
  const payload: SerializedAnnotations = {
    version: 1,
    annotations,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseAnnotations(json: string | null | undefined): Annotation[] {
  if (!json) return [];

  try {
    const parsed = JSON.parse(json) as Partial<SerializedAnnotations>;

    if (parsed?.version === 1 && Array.isArray(parsed.annotations)) {
      return parsed.annotations;
    }

    console.warn('Invalid annotation format (wrong version or structure)');
    return [];
  } catch (err) {
    console.warn('Failed to parse annotations JSON:', err);
    return [];
  }
}