const resolveBaseWithOrigin = (): string => {
  const rawBase = import.meta.env.BASE_URL ?? '/';
  const withTrailingSlash = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  const withLeadingSlash = withTrailingSlash.startsWith('/')
    ? withTrailingSlash
    : `/${withTrailingSlash}`;

  if (typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/$/, '');
    return `${origin}${withLeadingSlash}`;
  }

  return withLeadingSlash;
};

/**
 * Returns the fully-qualified URL for an asset in the public directory, taking the Vite base
 * configuration into account so it works when the app is served from a subpath (e.g. GitHub Pages).
 */
export const publicAssetPath = (relativePath: string): string => {
  const normalizedPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  const base = resolveBaseWithOrigin();
  return `${base}${normalizedPath}`;
};

/**
 * Convenience wrapper for icon assets stored in `public/Icons`.
 */
export const iconAssetPath = (iconName: string): string =>
  publicAssetPath(`Icons/${iconName}.svg`);
