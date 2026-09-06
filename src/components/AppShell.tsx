import type { ReactElement, ReactNode } from "react";
import { Link } from "../navigation/NavigationContext";
import type { LinkComponent } from "../navigation/NavigationContext";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  active?: boolean;
}

/**
 * Consistent top chrome across the shell and, when a remote is run
 * standalone in dev, the remote too -- so switching between bounded
 * contexts never feels like leaving the app. See mfe-architecture notes:
 * this is the #1 place plain Module Federation setups look "federated"
 * instead of like one product.
 *
 * Styling lives in AppShell.css rather than inline style objects, because
 * inline styles cannot express :hover or :focus-visible -- until that
 * moved to a stylesheet the nav had no hover affordance and no visible
 * keyboard focus anywhere in the product.
 */
export function AppShell({
  nav,
  siteSwitcher,
  brand = "Warehouse Console",
  renderLink,
  children,
}: {
  nav: NavItem[];
  /** Per-instance override of the injected link component. Normally you
   *  want NavigationProvider instead, which covers nested screens too. */
  renderLink?: LinkComponent;
  /** Slot for the site/building switcher -- most screens are scoped to
   *  one physical site, so this lives in the persistent chrome, not
   *  re-implemented per remote. */
  siteSwitcher?: ReactNode;
  /** Wordmark, so a remote running standalone in dev can say which one it
   *  is instead of claiming to be the whole console. */
  brand?: ReactNode;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="wh-shell">
      <a className="wh-shell__skip" href="#wh-main">
        Skip to content
      </a>
      <header className="wh-shell__header">
        <div className="wh-shell__brand">
          <span aria-hidden className="wh-shell__brand-mark" />
          {brand}
        </div>
        <nav className="wh-shell__nav" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              renderLink={renderLink}
              // aria-current is the only signal a screen reader gets for
              // "you are here" -- the accent underline and text color are
              // invisible to it.
              aria-current={item.active ? "page" : undefined}
              className={
                item.active
                  ? "wh-shell__nav-item wh-shell__nav-item--active"
                  : "wh-shell__nav-item"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {siteSwitcher && (
          <div className="wh-shell__site-switcher">{siteSwitcher}</div>
        )}
      </header>
      {/* tabIndex=-1 so the skip link can move focus here, not just scroll. */}
      <main id="wh-main" className="wh-shell__main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}): ReactElement {
  return (
    <nav aria-label="Breadcrumb" className="wh-breadcrumbs">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="wh-breadcrumbs__item">
          {i > 0 && (
            <span aria-hidden className="wh-breadcrumbs__sep">
              /
            </span>
          )}
          {item.href ? (
            <Link href={item.href} className="wh-breadcrumbs__link">
              {item.label}
            </Link>
          ) : (
            <span className="wh-breadcrumbs__current" aria-current="page">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
