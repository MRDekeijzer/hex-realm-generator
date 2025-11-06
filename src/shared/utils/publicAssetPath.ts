interface ImportMetaEnvWithBase {
  readonly BASE_URL?: string;
}

interface ImportMetaWithBase extends ImportMeta {
  readonly env: ImportMetaEnvWithBase;
}

const normalizeBasePath = (value: string): string => {
  const trimmed = value.trim();
  const ensuredTrailingSlash = trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
  return ensuredTrailingSlash.startsWith('/') ? ensuredTrailingSlash : `/${ensuredTrailingSlash}`;
};

const resolveBaseWithOrigin = (): string => {
  const rawBaseValue = (import.meta as ImportMetaWithBase).env?.BASE_URL;
  const baseCandidate =
    typeof rawBaseValue === 'string' && rawBaseValue.length > 0 ? rawBaseValue : '/';
  const normalizedBase = normalizeBasePath(baseCandidate);

  if (typeof window !== 'undefined' && typeof window.location?.origin === 'string') {
    try {
      return new URL(normalizedBase, window.location.origin).href;
    } catch {
      const origin = window.location.origin.replace(/\/$/, '');
      return `${origin}${normalizedBase}`;
    }
  }

  return normalizedBase;
};

/**
 * Returns the fully-qualified URL for an asset in the public directory, taking the Vite base
 * configuration into account so it works when the app is served from a subpath (e.g. GitHub Pages).
 */
export const publicAssetPath = (relativePath: string): string => {
  const normalizedPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  const base = resolveBaseWithOrigin();
  const ensuredBase = base.endsWith('/') ? base : `${base}/`;
  return `${ensuredBase}${normalizedPath}`;
};

/**
 * Convenience wrapper for icon assets stored in `public/Icons`.
 */
export const iconAssetPath = (iconName: string): string => publicAssetPath(`Icons/${iconName}.svg`);
