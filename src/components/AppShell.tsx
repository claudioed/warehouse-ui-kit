import type { ReactElement, ReactNode } from "react";

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
 */
export function AppShell({
  nav,
  siteSwitcher,
  children,
}: {
  nav: NavItem[];
  /** Slot for the site/building switcher -- most screens are scoped to
   *  one physical site, so this lives in the persistent chrome, not
   *  re-implemented per remote. */
  siteSwitcher?: ReactNode;
  children: ReactNode;
}): ReactElement {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: "var(--wh-z-nav)" as unknown as number,
          display: "flex",
          alignItems: "center",
          gap: "var(--wh-space-5)",
          padding: "0 var(--wh-space-5)",
          height: 56,
          background: "var(--wh-color-bg-raised)",
          borderBottom: "1px solid var(--wh-color-border)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: "var(--wh-font-size-md)",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: "var(--wh-color-accent)",
            }}
          />
          Warehouse Console
        </div>
        <nav style={{ display: "flex", gap: "var(--wh-space-1)", flex: 1 }}>
          {nav.map((item) => (
            <a
              key={item.id}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 var(--wh-space-3)",
                height: 56,
                fontSize: "var(--wh-font-size-sm)",
                fontWeight: item.active ? 600 : 500,
                color: item.active
                  ? "var(--wh-color-text)"
                  : "var(--wh-color-text-muted)",
                textDecoration: "none",
                borderBottom: item.active
                  ? "2px solid var(--wh-color-accent)"
                  : "2px solid transparent",
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        {siteSwitcher}
      </header>
      <main style={{ flex: 1, padding: "var(--wh-space-5)" }}>{children}</main>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav
      aria-label="breadcrumb"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: "var(--wh-font-size-sm)",
        color: "var(--wh-color-text-muted)",
        marginBottom: "var(--wh-space-4)",
      }}
    >
      {items.map((item, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {i > 0 && <span aria-hidden>/</span>}
          {item.href ? (
            <a href={item.href} style={{ color: "inherit", textDecoration: "none" }}>
              {item.label}
            </a>
          ) : (
            <span style={{ color: "var(--wh-color-text)" }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
