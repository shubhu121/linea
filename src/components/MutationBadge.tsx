"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Layers, Rocket, AlertCircle } from "lucide-react";

interface MutationBadgeProps {
  type: "origin" | "refinement" | "synthesis" | "application" | "critique";
  className?: string;
}

const mutationConfig = {
  origin: {
    icon: Sparkles,
    label: "Origin",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  refinement: {
    icon: RefreshCw,
    label: "Refinement",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  synthesis: {
    icon: Layers,
    label: "Synthesis",
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  application: {
    icon: Rocket,
    label: "Application",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  critique: {
    icon: AlertCircle,
    label: "Critique",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
};

export default function MutationBadge({ type, className }: MutationBadgeProps) {
  const config = mutationConfig[type];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`gap-1 px-2 py-0.5 text-[10px] font-medium ${config.className} ${className || ""}`}
    >
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </Badge>
  );
}