"use client";

import { useEffect, useState } from "react";
import { Crown, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlanBadgeProps {
  clickable?: boolean;
}

export const PlanBadge = ({ clickable = true }: PlanBadgeProps) => {
  const router = useRouter();
  const [planType, setPlanType] = useState<string>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/billing/subscription", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlanType(data.data.subscription?.planType || "free");
      }
    } catch (error) {
      console.error("Failed to fetch plan:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  const getPlanConfig = () => {
    switch (planType) {
      case "pro":
        return {
          name: "Researcher",
          icon: Star,
          color: "from-blue-500 to-purple-600",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/20",
          textColor: "text-blue-600 dark:text-blue-400",
        };
      case "enterprise":
        return {
          name: "Institution",
          icon: Crown,
          color: "from-amber-500 to-orange-600",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/20",
          textColor: "text-amber-600 dark:text-amber-400",
        };
      default:
        return {
          name: "Explorer",
          icon: Sparkles,
          color: "from-gray-500 to-gray-600",
          bgColor: "bg-muted/50",
          borderColor: "border-border/50",
          textColor: "text-muted-foreground",
        };
    }
  };

  const config = getPlanConfig();
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} border ${config.borderColor} backdrop-blur-sm ${
        clickable ? "cursor-pointer hover:scale-105 transition-transform" : ""
      }`}
      onClick={() => clickable && router.push("/billing")}
    >
      <Icon className={`h-3.5 w-3.5 ${config.textColor}`} />
      <span className={`text-xs font-medium ${config.textColor}`}>
        {config.name}
      </span>
    </div>
  );
};
