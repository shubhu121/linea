"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, CreditCard, TrendingUp, Calendar, ExternalLink, Loader2, AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { PLANS } from "@/config/plans";
import { PlanBadge } from "@/components/PlanBadge";
import { UsageIndicator } from "@/components/UsageIndicator";

interface Subscription {
  id: number;
  planType: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  dodoCustomerId: string | null;
  dodoSubscriptionId: string | null;
}

interface Usage {
  month: string;
  conceptTracesUsed: number;
  conceptTracesLimit: number;
  remaining: number;
}

export default function BillingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/billing");
    } else if (session?.user) {
      fetchBillingData();
    }
  }, [session, isPending, router]);

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/billing/subscription", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.data.subscription);
        setUsage(data.data.usage);
      }
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
      toast.error("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerPortal = async () => {
    if (!subscription?.dodoCustomerId) {
      toast.error("No subscription found", {
        description: "Please subscribe to a plan first.",
      });
      router.push("/pricing");
      return;
    }

    setPortalLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/dodo/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const data = await response.json();
      window.open(data.portalUrl, "_blank");
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Failed to open customer portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription || subscription.planType === "free") {
      return;
    }

    setCancelLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/billing/subscription/cancel", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      toast.success("Subscription will cancel at period end", {
        description: "You'll continue to have access until your billing period ends.",
      });
      
      fetchBillingData();
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = PLANS.find(p => p.id === subscription?.planType) || PLANS[0];
  const usagePercentage = usage ? (usage.conceptTracesUsed / usage.conceptTracesLimit) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.1),transparent_50%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg">Linea</span>
          </div>

          <div className="flex items-center gap-3">
            <PlanBadge />
            <UsageIndicator />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/concept")}
            >
              My Concepts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Billing & Usage</h1>
          <p className="text-muted-foreground">
            Manage your subscription and monitor your usage
          </p>
        </div>

        <div className="grid gap-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Plan
                  </CardTitle>
                  <CardDescription className="mt-2">
                    You are currently on the <span className="font-semibold text-foreground">{currentPlan.name}</span> plan
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">${currentPlan.price}</div>
                  <div className="text-sm text-muted-foreground">per {currentPlan.interval}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription?.cancelAtPeriodEnd && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-600 dark:text-amber-400">
                      Subscription Ending
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Your subscription will end on{" "}
                      {subscription.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                        : "the end of the billing period"}
                      . You'll be moved to the free plan.
                    </p>
                  </div>
                </div>
              )}

              {subscription?.currentPeriodEnd && !subscription.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                {subscription?.planType !== "free" && subscription?.dodoCustomerId && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCustomerPortal}
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Manage Payment
                    </Button>
                    {!subscription?.cancelAtPeriodEnd && (
                      <Button
                        variant="outline"
                        onClick={handleCancelSubscription}
                        disabled={cancelLoading}
                      >
                        {cancelLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Cancel Subscription
                      </Button>
                    )}
                  </>
                )}
                <Button onClick={() => router.push("/pricing")}>
                  {subscription?.planType === "free" ? "Upgrade Plan" : "Change Plan"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Usage This Month
              </CardTitle>
              <CardDescription>
                Your concept trace usage for {usage?.month || "this month"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">
                    {usage?.conceptTracesUsed || 0}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    of {usage?.conceptTracesLimit || 0} traces used
                  </span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      usagePercentage >= 90
                        ? "bg-red-500"
                        : usagePercentage >= 70
                        ? "bg-amber-500"
                        : "bg-gradient-to-r from-blue-500 to-purple-600"
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {usage?.remaining || 0} traces remaining this month
                </p>
              </div>

              {usagePercentage >= 90 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    You're running low on traces
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Consider upgrading your plan to continue tracing concepts without
                    interruption.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push("/pricing")}
                  >
                    View Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}