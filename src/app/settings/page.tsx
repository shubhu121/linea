"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, User, CreditCard, LogOut, Loader2, AlertCircle, Shield, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useSession, authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { PlanBadge } from "@/components/PlanBadge";
import { UsageIndicator } from "@/components/UsageIndicator";
import { PLANS } from "@/config/plans";

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

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/settings");
    } else if (session?.user) {
      fetchAccountData();
    }
  }, [session, isPending, router]);

  const fetchAccountData = async () => {
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
      console.error("Failed to fetch account data:", error);
      toast.error("Failed to load account information");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      const { error } = await authClient.signOut();
      if (error?.code) {
        toast.error("Sign out failed", {
          description: error.message || "Please try again",
        });
        setSignOutLoading(false);
      } else {
        localStorage.removeItem("bearer_token");
        toast.success("Signed out successfully");
        refetch(); // Update session state
        router.push("/");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Sign out failed");
      setSignOutLoading(false);
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, subscription, and preferences
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Name</span>
                    </div>
                    <p className="font-medium">{session?.user?.name || "No name set"}</p>
                  </div>
                </div>

                <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <p className="font-medium">{session?.user?.email}</p>
                  </div>
                </div>

                {session?.user?.createdAt && (
                  <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Member Since</span>
                      </div>
                      <p className="font-medium">
                        {new Date(session.user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription & Billing
              </CardTitle>
              <CardDescription>
                Manage your plan and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-lg border border-border/50">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{currentPlan.name}</p>
                    <PlanBadge clickable={false} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ${currentPlan.price}/{currentPlan.interval}
                  </p>
                </div>
                <Button onClick={() => router.push("/pricing")}>
                  {subscription?.planType === "free" ? "Upgrade Plan" : "Change Plan"}
                </Button>
              </div>

              {usage && (
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Usage This Month</p>
                    <p className="text-sm text-muted-foreground">
                      {usage.conceptTracesUsed} / {usage.conceptTracesLimit} traces
                    </p>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                      style={{
                        width: `${Math.min((usage.conceptTracesUsed / usage.conceptTracesLimit) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/billing")}
              >
                View Full Billing Details
              </Button>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your account security and sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Sign Out</p>
                    <p className="text-sm text-muted-foreground">
                      Sign out from this device and end your current session
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleSignOut}
                disabled={signOutLoading}
              >
                {signOutLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing Out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common actions and helpful links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push("/concept")}
                >
                  View My Concepts
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push("/pricing")}
                >
                  Compare Plans
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push("/")}
                >
                  Trace New Concept
                </Button>
                {subscription?.planType !== "free" && (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push("/billing")}
                  >
                    Manage Billing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border/40">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Linea</span>
            <span className="text-muted-foreground">· Research Provenance Engine</span>
          </div>
          <p className="text-muted-foreground">
            Questions? <span className="font-medium cursor-pointer hover:text-foreground">Contact Support</span>
          </p>
        </div>
      </footer>
    </div>
  );
}