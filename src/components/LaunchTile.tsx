import type { ReactElement } from "react";
import { Link } from "../navigation/NavigationContext";

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
 *
 * Hover and focus are CSS (see LaunchTile.css). They used to be a pair of
 * onMouseEnter/onMouseLeave handlers mutating inline styles, which meant
 * the tile's only affordance was invisible to anyone navigating by
 * keyboard -- there was no onFocus equivalent and inline styles cannot
 * express :focus-visible.
 */
export function LaunchTile({
  context,
  title,
  description,
  href,
  badge,
}: LaunchTileProps): ReactElement {
  return (
    <Link href={href} className="wh-launch-tile">
      <span className="wh-launch-tile__context">{context}</span>
      <span className="wh-launch-tile__title">{title}</span>
      <span className="wh-launch-tile__description">{description}</span>
      {badge && <span className="wh-launch-tile__badge">{badge}</span>}
    </Link>
  );
}
