import type { ReactElement, ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Rendered instead of rows when rows.length === 0. */
  emptyState?: ReactNode;
  /** Rendered instead of the table body while data is loading -- a fixed
   *  number of skeleton rows, never a spinner-over-blank-table (spinners
   *  hide layout shift; skeleton rows preview it). */
  loading?: boolean;
  loadingRowCount?: number;
  onRowClick?: (row: T) => void;
}

/**
 * The one table component every remote should reach for. Dense, monospace-
 * friendly for ids/quantities, sticky header, and loading/empty states
 * baked in so no screen ships a bare spinner or a silent blank table.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyState,
  loading,
  loadingRowCount = 5,
  onRowClick,
}: DataTableProps<T>): ReactElement {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align ?? "left",
                  width: col.width,
                  fontSize: "var(--wh-font-size-xs)",
                  color: "var(--wh-color-text-faint)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontWeight: 600,
                  padding: "var(--wh-space-2) var(--wh-space-3)",
                  borderBottom: "1px solid var(--wh-color-border)",
                  position: "sticky",
                  top: 0,
                  background: "var(--wh-color-bg-raised)",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: loadingRowCount }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ padding: "var(--wh-space-2) var(--wh-space-3)" }}
                    >
                      <div
                        style={{
                          height: 14,
                          borderRadius: 4,
                          background: "var(--wh-color-border-subtle)",
                          animation: "wh-shimmer 1.4s ease-in-out infinite",
                          width: `${60 + ((i * 13) % 30)}%`,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            : rows.length === 0
              ? (
                  <tr>
                    <td colSpan={columns.length} style={{ padding: "var(--wh-space-6)" }}>
                      {emptyState ?? (
                        <div
                          style={{
                            textAlign: "center",
                            color: "var(--wh-color-text-muted)",
                            fontSize: "var(--wh-font-size-sm)",
                          }}
                        >
                          No data.
                        </div>
                      )}
                    </td>
                  </tr>
                )
              : rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    style={{
                      cursor: onRowClick ? "pointer" : undefined,
                      borderBottom: "1px solid var(--wh-color-border-subtle)",
                    }}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          textAlign: col.align ?? "left",
                          padding: "var(--wh-space-3)",
                          fontSize: "var(--wh-font-size-sm)",
                        }}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
        </tbody>
      </table>
      <style>{`
        @keyframes wh-shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
