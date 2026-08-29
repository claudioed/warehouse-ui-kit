import type { ReactElement, ReactNode } from "react";

export function Card({
  title,
  actions,
  children,
  padded = true,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}): ReactElement {
  return (
    <section
      style={{
        background: "var(--wh-color-bg-raised)",
        border: "1px solid var(--wh-color-border)",
        borderRadius: "var(--wh-radius-lg)",
        overflow: "hidden",
      }}
    >
      {(title || actions) && (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--wh-space-4) var(--wh-space-5)",
            borderBottom: "1px solid var(--wh-color-border-subtle)",
          }}
        >
          {typeof title === "string" ? (
            <h2
              style={{
                margin: 0,
                fontSize: "var(--wh-font-size-md)",
                fontWeight: 600,
              }}
            >
              {title}
            </h2>
          ) : (
            title
          )}
          {actions}
        </header>
      )}
      <div style={{ padding: padded ? "var(--wh-space-5)" : 0 }}>{children}</div>
    </section>
  );
}
