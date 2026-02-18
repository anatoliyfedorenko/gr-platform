"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";

export interface DataTableColumn<T = any> {
  key: string;
  title: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
}

type SortDirection = "asc" | "desc" | null;

interface SortState {
  key: string | null;
  direction: SortDirection;
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  pageSize = 10,
  className,
  emptyMessage = "Нет данных для отображения",
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<SortState>({ key: null, direction: null });
  const [currentPage, setCurrentPage] = React.useState(1);

  // Reset to page 1 when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const handleSort = (key: string) => {
    setSort((prev) => {
      if (prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return { key: null, direction: null };
    });
    setCurrentPage(1);
  };

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sort.key || !sort.direction) return data;

    return [...data].sort((a, b) => {
      const aVal = getNestedValue(a, sort.key!);
      const bVal = getNestedValue(b, sort.key!);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), "ru");
      }

      return sort.direction === "desc" ? -comparison : comparison;
    });
  }, [data, sort]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedData.length);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const SortIcon: React.FC<{ columnKey: string }> = ({ columnKey }) => {
    if (sort.key !== columnKey) {
      return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />;
    }
    if (sort.direction === "asc") {
      return <ChevronUp className="h-3.5 w-3.5 text-blue-600" />;
    }
    return <ChevronDown className="h-3.5 w-3.5 text-blue-600" />;
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500",
                    column.sortable && "cursor-pointer select-none hover:text-gray-700"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {column.title}
                    {column.sortable && <SortIcon columnKey={column.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "transition-colors hover:bg-gray-50",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((column) => {
                    const value = getNestedValue(row, column.key);
                    return (
                      <td key={column.key} className="px-4 py-3 text-gray-700">
                        {column.render ? column.render(value, row) : (value ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {sortedData.length > 0 && (
        <div className="flex items-center justify-between px-1 py-3">
          <span className="text-sm text-gray-500">
            Показано {startIndex + 1}–{endIndex} из {sortedData.length}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-1.5 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
              aria-label="Предыдущая страница"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (totalPages <= 7) return true;
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - currentPage) <= 1) return true;
                return false;
              })
              .map((page, idx, arr) => {
                const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && (
                      <span className="px-1.5 text-gray-400">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                        page === currentPage
                          ? "bg-blue-600 text-white font-medium"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-1.5 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
              aria-label="Следующая страница"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable };
