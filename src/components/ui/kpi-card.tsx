"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

const trendConfig = {
  up: {
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  down: {
    icon: TrendingDown,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  neutral: {
    icon: Minus,
    color: "text-gray-500",
    bg: "bg-gray-50",
  },
};

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  trend,
  icon,
  className,
}) => {
  const trendInfo = trend ? trendConfig[trend] : null;
  const TrendIcon = trendInfo?.icon;

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </p>

          {(change || trend) && (
            <div className="mt-1 flex items-center gap-1.5">
              {TrendIcon && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full p-0.5",
                    trendInfo?.bg
                  )}
                >
                  <TrendIcon className={cn("h-3.5 w-3.5", trendInfo?.color)} />
                </span>
              )}
              {change && (
                <span
                  className={cn(
                    "text-sm font-medium",
                    trendInfo?.color ?? "text-gray-500"
                  )}
                >
                  {change}
                </span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className="ml-4 flex-shrink-0 rounded-lg bg-blue-50 p-3 text-blue-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
KPICard.displayName = "KPICard";

export { KPICard };
