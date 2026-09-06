/* eslint-disable react/only-export-components -- this module deliberately
   exports the provider component alongside its hook and Link primitive;
   they are one cohesive contract and splitting them would obscure it. */
import { createContext, useContext } from "react";
import type { ComponentType, ReactElement, ReactNode } from "react";

/**
 * Router-agnostic link injection.
 *
 * Every navigable surface in this kit -- AppShell's nav, Breadcrumbs,
 * KpiStat's drill-down, LaunchTile -- used to render a raw `<a href>`.
 * The console runs react-router's BrowserRouter, so each of those clicks
 * was a full document navigation: it tore down the SPA and re-fetched
 * every Module Federation `remoteEntry.js` from scratch, defeating the
 * lazy()-at-module-scope work in the shell's App.tsx.
 *
 * The kit deliberately does NOT import react-router-dom. It is a Module
 * Federation shared singleton, so a library-level import would pin the
 * router version for the entire fleet and risk a second instance. Instead
 * the host injects its own link component here.
 *
 * Degrades safely: with no provider the default is exactly today's
 * `<a href>`, so the six remotes and standalone dev keep working unchanged
 * and are never forced to adopt this.
 */
export interface LinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  "aria-current"?: "page" | undefined;
  [key: string]: unknown;
}

export type LinkComponent = ComponentType<LinkProps>;

function AnchorLink({ href, children, ...rest }: LinkProps): ReactElement {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

const NavigationContext = createContext<LinkComponent>(AnchorLink);

/**
 * @param link MUST be a stable reference -- declare it at module scope, not
 * inline in JSX. React identifies a component by its function identity, so
 * passing `link={(p) => <RouterLink .../>}` creates a brand new component
 * type on every render of the provider, which unmounts and remounts every
 * link in the tree each time.
 */
export function NavigationProvider({
  link,
  children,
}: {
  link: LinkComponent;
  children: ReactNode;
}): ReactElement {
  return (
    <NavigationContext.Provider value={link}>
      {children}
    </NavigationContext.Provider>
  );
}

/** The link component the host injected, or a plain anchor. */
export function useLinkComponent(): LinkComponent {
  return useContext(NavigationContext);
}

/**
 * Internal navigation primitive. Components take an optional `renderLink`
 * as a per-instance escape hatch; otherwise the context value wins.
 */
export function Link({
  renderLink,
  ...props
}: LinkProps & { renderLink?: LinkComponent }): ReactElement {
  const FromContext = useLinkComponent();
  // Selecting an existing component reference, not defining one here: the
  // identity comes from the caller or the provider and is stable across
  // renders, so nothing remounts. (The lint rule cannot tell the two apart;
  // see NavigationProvider's note on passing a stable `link`.)
  const Component = renderLink ?? FromContext;
  // eslint-disable-next-line react/static-components
  return <Component {...props} />;
}
