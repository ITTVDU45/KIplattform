"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string;
}

interface Filter {
  key: string;
  label: string;
  options: FilterOption[];
  value?: string;
  onChange: (value: string) => void;
}

interface FiltersBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Filter[];
  onReset?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function FiltersBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Suchen...",
  filters = [],
  onReset,
  actions,
  className,
}: FiltersBarProps) {
  const hasActiveFilters =
    searchValue || filters.some((f) => f.value && f.value !== "all");

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {onSearchChange && (
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-muted/50 border-border focus:border-primary/50 focus:bg-surface transition-all"
          />
        </div>
      )}
      
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={filter.value || "all"}
          onValueChange={filter.onChange}
        >
          <SelectTrigger className="w-[180px] bg-muted/50 border-border">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent className="bg-popover/95 backdrop-blur-xl border-border">
            <SelectItem value="all">Alle {filter.label}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      
      {hasActiveFilters && onReset && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onReset}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1.5" />
          Zurücksetzen
        </Button>
      )}
      
      {actions && <div className="ml-auto flex items-center gap-3">{actions}</div>}
    </div>
  );
}
