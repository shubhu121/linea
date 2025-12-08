"use client";

import { useRouter } from "next/navigation";
import { Zap, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface UpgradePromptProps {
  title?: string;
  description?: string;
  variant?: "card" | "banner" | "inline";
  showFeatures?: boolean;
}

export const UpgradePrompt = ({
  title = "Upgrade to continue",
  description = "You've reached your monthly limit. Upgrade to unlock more traces and advanced features.",
  variant = "card",
  showFeatures = false,
}: UpgradePromptProps) => {
  const router = useRouter();

  const features = [
    "Up to 500 concept traces per month",
    "Priority AI processing",
    "Advanced analytics",
    "Export capabilities",
  ];

  if (variant === "banner") {
    return (
      <div className="w-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-border/50 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Button onClick={() => router.push("/pricing")} className="shrink-0 gap-2">
            View Plans
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => router.push("/pricing")}>
          Upgrade
        </Button>
      </div>
    );
  }

  // Default: card variant
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showFeatures && (
          <ul className="space-y-2">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        )}
        <Button onClick={() => router.push("/pricing")} className="w-full gap-2">
          <Sparkles className="h-4 w-4" />
          View Pricing Plans
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
