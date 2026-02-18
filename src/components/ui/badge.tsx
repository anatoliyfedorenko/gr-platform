"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800 border border-gray-200",
        blue: "bg-blue-50 text-blue-700 border border-blue-200",
        yellow: "bg-yellow-50 text-yellow-700 border border-yellow-200",
        green: "bg-green-50 text-green-700 border border-green-200",
        red: "bg-red-50 text-red-700 border border-red-200",
        purple: "bg-purple-50 text-purple-700 border border-purple-200",
        orange: "bg-orange-50 text-orange-700 border border-orange-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, className }))}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

/**
 * Maps Russian legislative status strings to badge variants.
 */
const statusVariantMap: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
  "Разработка": "blue",
  "Рассмотрение": "yellow",
  "Принят": "green",
  "Отклонён": "red",
};

/**
 * Maps risk level strings to badge variants.
 */
const riskVariantMap: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
  "Высокий": "red",
  "Средний": "yellow",
  "Низкий": "green",
};

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, ...props }) => {
  const variant = statusVariantMap[status] || "default";
  return (
    <Badge variant={variant} className={className} {...props}>
      {status}
    </Badge>
  );
};
StatusBadge.displayName = "StatusBadge";

export interface RiskBadgeProps extends Omit<BadgeProps, "variant"> {
  risk: string;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, className, ...props }) => {
  const variant = riskVariantMap[risk] || "default";
  return (
    <Badge variant={variant} className={className} {...props}>
      {risk}
    </Badge>
  );
};
RiskBadge.displayName = "RiskBadge";

export { Badge, badgeVariants, StatusBadge, RiskBadge };
