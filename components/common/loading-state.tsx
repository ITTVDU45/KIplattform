import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
  rows?: number;
}

export function LoadingState({ className, rows = 5 }: LoadingStateProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center space-x-4 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="h-12 w-12 rounded-xl bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-3/4 rounded-lg bg-muted" />
            <div className="h-3 w-1/2 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="rounded-xl border border-border bg-card p-6 space-y-4 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-1/3 rounded-lg bg-muted" />
            <div className="h-10 w-10 rounded-xl bg-muted" />
          </div>
          <div className="h-8 w-2/3 rounded-lg bg-muted" />
          <div className="h-3 w-full rounded-lg bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function LoadingTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border p-4">
        <div className="flex gap-6">
          {Array.from({ length: cols }).map((_, i) => (
            <div 
              key={i} 
              className="h-4 flex-1 rounded-lg bg-muted animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="border-b border-border last:border-0 p-4"
        >
          <div className="flex gap-6">
            {Array.from({ length: cols }).map((_, j) => (
              <div 
                key={j} 
                className="h-4 flex-1 rounded-lg bg-muted animate-pulse"
                style={{ animationDelay: `${(i * cols + j) * 30}ms` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-muted" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>
    </div>
  );
}
