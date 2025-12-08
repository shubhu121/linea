"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface UsageData {
  month: string;
  conceptTracesUsed: number;
  conceptTracesLimit: number;
  remaining: number;
}

export const UsageIndicator = () => {
  const router = useRouter();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/billing/usage/current", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) {
    return null;
  }

  const percentage = (usage.conceptTracesUsed / usage.conceptTracesLimit) * 100;
  const isLow = percentage >= 80;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 backdrop-blur-sm">
        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">
          {usage.remaining}/{usage.conceptTracesLimit} traces
        </span>
      </div>
      {isLow && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs gap-1"
          onClick={() => router.push("/pricing")}
        >
          <Zap className="h-3 w-3" />
          Upgrade
        </Button>
      )}
    </div>
  );
};
