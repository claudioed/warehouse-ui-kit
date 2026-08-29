import type { CSSProperties, ReactElement } from "react";

export interface LaunchTileProps {
  /** The bounded context's own name, e.g. "order-management". */
  context: string;
  /** Human title, e.g. "Orders". */
  title: string;
  /** One-line description of what this screen does. */
  description: string;
  href: string;
  /** Small live status, e.g. a KPI number or "3 sites" -- optional. */
  badge?: string;
}

/**
 * A single launchpad tile: the SAP Fiori pattern of a flat grid of
 * clickable tiles, one per app/context, each carrying its own live badge.
 * warehouse-console's Overview screen uses a row of these as the entry
 * point into every remote, instead of relying on the top nav alone --
 * useful the moment there are more than ~5 contexts, which is exactly
 * this system's shape (6 remotes).
 */
export function LaunchTile({
  context,
  title,
  description,
  href,
  badge,
}: LaunchTileProps): ReactElement {
  const style: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--wh-space-2)",
    background: "var(--wh-color-bg-raised)",
    border: "1px solid var(--wh-color-border)",
    borderRadius: "var(--wh-radius-lg)",
    padding: "var(--wh-space-5)",
    textDecoration: "none",
    color: "inherit",
    transition: `border-color var(--wh-motion-base) var(--wh-motion-ease), transform var(--wh-motion-fast) var(--wh-motion-ease)`,
    cursor: "pointer",
  };

  return (
    <a
      href={href}
      style={style}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--wh-color-accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--wh-color-border)";
      }}
    >
      <span
        style={{
          fontSize: "var(--wh-font-size-xs)",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--wh-color-text-faint)",
        }}
      >
        {context}
      </span>
      <span
        style={{
          fontSize: "var(--wh-font-size-lg)",
          fontWeight: 600,
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: "var(--wh-font-size-sm)",
          color: "var(--wh-color-text-muted)",
          flex: 1,
        }}
      >
        {description}
      </span>
      {badge && (
        <span
          style={{
            alignSelf: "flex-start",
            fontFamily: "var(--wh-font-mono)",
            fontSize: "var(--wh-font-size-xs)",
            fontWeight: 600,
            color: "var(--wh-color-accent)",
            background: "var(--wh-color-accent-muted)",
            borderRadius: "var(--wh-radius-sm)",
            padding: "2px 8px",
          }}
        >
          {badge}
        </span>
      )}
    </a>
  );
}
