/**
 * Returns the fully-qualified URL for an asset in the public directory, taking the Vite base
 * configuration into account so it works when the app is served from a subpath (e.g. GitHub Pages).
 */
export const publicAssetPath = (relativePath: string): string => {
  const baseUrl = import.meta.env.BASE_URL ?? '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = relativePath.startsWith('/')
    ? relativePath.slice(1)
    : relativePath;
  return `${normalizedBase}${normalizedPath}`;
};

/**
 * Convenience wrapper for icon assets stored in `public/Icons`.
 */
export const iconAssetPath = (iconName: string): string =>
  publicAssetPath(`Icons/${iconName}.svg`);
