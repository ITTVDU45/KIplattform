"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  mobileHidden?: boolean; // Hide this column on mobile card view
  mobileLabel?: string; // Custom label for mobile card view
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  className,
}: DataTableProps<T>) {
  const t = useTranslations("common");
  const totalPages = total ? Math.ceil(total / pageSize) : 1;
  const showPagination = total && total > pageSize;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl opacity-30">📭</div>
                    <span>{t("states.empty")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    "animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <div className="text-4xl opacity-30">📭</div>
                <span>{t("states.empty")}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          data.map((row, index) => (
            <Card 
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "animate-fade-in transition-all active:scale-[0.99]",
                onRowClick && "cursor-pointer active:bg-muted/50"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4 space-y-3">
                {columns
                  .filter((col) => !col.mobileHidden)
                  .map((column, colIndex) => (
                    <div 
                      key={column.key} 
                      className={cn(
                        "flex items-start justify-between gap-2",
                        colIndex === 0 && "pb-2 border-b border-border"
                      )}
                    >
                      {colIndex > 0 && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {column.mobileLabel || column.header}
                        </span>
                      )}
                      <div className={cn(
                        colIndex === 0 ? "font-medium text-foreground" : "text-right flex-1",
                        column.className
                      )}>
                        {column.cell(row)}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {showPagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            {t("pagination.page")} <span className="font-medium text-foreground">{page}</span> {t("pagination.of")}{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
            {" "}({total} {t("pagination.entries")})
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="h-10 min-w-[80px]"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("pagination.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="h-10 min-w-[80px]"
            >
              {t("pagination.next")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
