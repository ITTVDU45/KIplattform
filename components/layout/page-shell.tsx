import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageShell({
  title,
  description,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn("space-y-6 animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 text-foreground tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1.5 text-[15px]">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
