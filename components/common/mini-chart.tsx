"use client";

import { cn } from "@/lib/utils";

interface MiniChartProps {
  data: number[];
  height?: number;
  className?: string;
  color?: "primary" | "success" | "warning" | "danger" | "purple";
  showArea?: boolean;
}

const colorMap = {
  primary: { stroke: "hsl(var(--primary))", fill: "hsl(var(--primary) / 0.15)" },
  success: { stroke: "hsl(var(--accent-success))", fill: "hsl(var(--accent-success) / 0.15)" },
  warning: { stroke: "hsl(var(--accent-warning))", fill: "hsl(var(--accent-warning) / 0.15)" },
  danger: { stroke: "hsl(var(--accent-danger))", fill: "hsl(var(--accent-danger) / 0.15)" },
  purple: { stroke: "hsl(var(--accent-purple))", fill: "hsl(var(--accent-purple) / 0.15)" },
};

export function MiniChart({
  data,
  height = 60,
  className,
  color = "primary",
  showArea = true,
}: MiniChartProps) {
  if (!data.length) return null;

  const colors = colorMap[color];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const width = 200;
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return { x, y };
  });

  const linePath = points
    .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-full", className)}
      style={{ height }}
    >
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colors.stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showArea && (
        <path
          d={areaPath}
          fill={`url(#gradient-${color})`}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={colors.stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point with glow */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={4}
        fill={colors.stroke}
        filter="url(#glow)"
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={6}
        fill={colors.stroke}
        fillOpacity={0.3}
      />
    </svg>
  );
}

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  className?: string;
  color?: "primary" | "success" | "warning" | "danger" | "purple";
}

export function MiniBarChart({ 
  data, 
  height = 120, 
  className,
  color = "primary"
}: BarChartProps) {
  if (!data.length) return null;

  const colors = colorMap[color];
  const max = Math.max(...data.map((d) => d.value));
  
  return (
    <div className={cn("flex items-end gap-1.5", className)} style={{ height }}>
      {data.map((item, index) => {
        const barHeight = (item.value / max) * 100;
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-1.5 group">
            <div
              className="w-full rounded-t-md transition-all duration-200 group-hover:scale-105"
              style={{ 
                height: `${barHeight}%`,
                background: `linear-gradient(to top, ${colors.stroke}, ${colors.stroke}80)`,
              }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-[10px] text-muted-foreground truncate max-w-full font-medium">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface DonutChartProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: "primary" | "success" | "warning" | "danger" | "purple";
  label?: string;
  className?: string;
}

export function MiniDonutChart({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  color = "primary",
  label,
  className,
}: DonutChartProps) {
  const colors = colorMap[color];
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </div>
      )}
    </div>
  );
}
