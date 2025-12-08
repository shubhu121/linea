"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, GitBranch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { PLANS } from "@/config/plans";
import { toast } from "sonner";

export default function PricingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");

  useEffect(() => {
    if (session?.user) {
      fetchCurrentPlan();
    }
  }, [session]);

  const fetchCurrentPlan = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/billing/subscription", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.data.subscription?.planType || "free");
      }
    } catch (error) {
      console.error("Failed to fetch current plan:", error);
    }
  };

  const handleCheckout = async (planId: string, productId: string) => {
    if (!session?.user) {
      toast.error("Please sign in to subscribe", {
        description: "You need to create an account first.",
      });
      router.push(`/login?redirect=${encodeURIComponent("/pricing")}`);
      return;
    }

    if (planId === "free") {
      return;
    }

    setLoading(planId);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/dodo/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: productId,
          email: session.user.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();
      
      // Redirect to Dodo checkout
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout", {
        description: "Please try again or contact support.",
      });
    } finally {
      setLoading(null);
    }
  };

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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(session?.user ? "/concept" : "/")}
          >
            {session?.user ? "My Concepts" : "Back to Home"}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 backdrop-blur-sm mb-6">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">Simple, transparent pricing</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start for free, upgrade when you need more. All plans include access to our
          full provenance analysis pipeline.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const isPopular = plan.popular;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  isPopular
                    ? "border-primary shadow-lg shadow-primary/10 scale-105"
                    : "border-border/50"
                } bg-card/50 backdrop-blur-sm`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                <CardHeader className="space-y-4">
                  <div>
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">
                      Perfect for{" "}
                      {plan.id === "free"
                        ? "students & casual users"
                        : plan.id === "pro"
                        ? "active researchers"
                        : "institutions & teams"}
                    </CardDescription>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold tracking-tight">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.id === "free" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(session?.user ? "/concept" : "/register")}
                    >
                      {session?.user ? "Your Current Plan" : "Get Started"}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleCheckout(plan.id, plan.dodoProductId)}
                      disabled={loading === plan.id}
                    >
                      {loading === plan.id ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Upgrade to {plan.name}
                        </>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">What counts as a concept trace?</h3>
              <p className="text-muted-foreground">
                Each time you submit a new concept for provenance analysis, it counts as one
                trace. Your monthly limit resets on the 1st of each month.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Can I upgrade or downgrade anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                immediately, and we'll prorate your billing accordingly.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards and debit cards via our secure payment
                partner, DodoPayments.
              </p>
            </div>
          </div>
        </div>
      </section>

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
