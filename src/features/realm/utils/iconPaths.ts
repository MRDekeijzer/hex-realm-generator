/**
 * @file utils/iconPaths.ts
 * Provides access to Lucide icon node definitions so they can be rendered outside
 * the React component tree (e.g., onto a canvas for the icon spray textures).
 */
import type { IconNode } from 'lucide-react';
import type { ForwardRefExoticComponent, ReactElement, Ref, SVGProps } from 'react';

import { iconComponentMap } from '@/features/realm/components/Icon';

type LucideForwardRefComponent = ForwardRefExoticComponent<SVGProps<SVGSVGElement>> & {
  render?: (
    props: Record<string, unknown>,
    ref: Ref<SVGSVGElement> | null
  ) => ReactElement<{ iconNode: IconNode }>;
};

const iconNodeCache = new Map<string, IconNode | null>();

/**
 * Resolves the Lucide icon node data for a given icon name.
 * The result is cached so the icon definition is only extracted once.
 */
export const getIconNode = (iconName: string): IconNode | null => {
  if (iconNodeCache.has(iconName)) {
    return iconNodeCache.get(iconName) ?? null;
  }

  const component = iconComponentMap[iconName] as LucideForwardRefComponent | undefined;
  if (!component || typeof component.render !== 'function') {
    iconNodeCache.set(iconName, null);
    return null;
  }

  try {
    const element = component.render({}, null);
    const iconNode = (element?.props?.iconNode ?? null) as IconNode | null;
    iconNodeCache.set(iconName, iconNode);
    return iconNode;
  } catch (error) {
    console.warn(`Failed to extract Lucide icon node for '${iconName}'`, error);
  }

  iconNodeCache.set(iconName, null);
  return null;
};
