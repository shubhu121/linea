"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Network, Clock, Lightbulb, LogIn, GitBranch, Zap } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { PlanBadge } from "@/components/PlanBadge";
import { UsageIndicator } from "@/components/UsageIndicator";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const handleSearch = async (concept: string) => {
    // Check if user is authenticated
    if (!session?.user) {
      toast.error("Sign in required", {
        description: "Please login or create an account to trace concepts.",
      });
      router.push(`/login?redirect=${encodeURIComponent("/")}&concept=${encodeURIComponent(concept)}`);
      return;
    }

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/linea/createBlueprint", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ concept }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle quota exceeded
        if (data.code === 'QUOTA_EXCEEDED') {
          toast.error("Usage limit reached", {
            description: `You've used ${data.data.used}/${data.data.limit} traces this month. Upgrade to continue.`,
            action: {
              label: "View Plans",
              onClick: () => router.push("/pricing"),
            },
          });
          return;
        }
        
        throw new Error(data.error || "Failed to create blueprint");
      }
      
      toast.success("Blueprint created!", {
        description: "Tracing the provenance of your concept...",
      });

      // Navigate to concept page
      router.push(`/concept/${data.data.slug}`);
      
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to trace concept", {
        description: error instanceof Error ? error.message : "Please try again or check your connection.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.1),transparent_50%)]" />
      </div>

      {/* Header with Auth */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg">Linea</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/pricing")}
              className="font-medium"
            >
              Pricing
            </Button>
          </nav>

          {isPending ? (
            <div className="h-9 w-32 animate-pulse bg-muted/50 rounded-lg" />
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              <PlanBadge />
              <UsageIndicator />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/concept")}
                className="font-medium"
              >
                My Concepts
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/settings")}
                className="font-medium"
              >
                Account
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/login")}
                className="font-medium"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/register")}
                className="gap-2 font-medium"
              >
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container relative mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-32">
          <div className="flex flex-col items-center text-center space-y-10 max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 backdrop-blur-sm animate-fade-in">
              <GitBranch className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground/90">Research Provenance Engine</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]">
                Trace the{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    lineage
                  </span>
                  <span className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl -z-10" />
                </span>
                <br />
                of ideas
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Linea reconstructs the origin, evolution, and conceptual ancestry of
                scientific concepts through AI-powered provenance analysis.
              </p>
            </div>

            {/* Search Bar */}
            <div className="w-full max-w-2xl pt-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
              {!session?.user && !isPending && (
                <p className="mt-3 text-center text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Sign in to trace concepts
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="group relative border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300 hover:border-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative space-y-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all">
                <Network className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-xl font-semibold">5-Agent Pipeline</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Concept refinement, phrase generation, strategic search, provenance
                  analysis, and narrative synthesis working in harmony.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300 hover:border-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative space-y-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center ring-1 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-xl font-semibold">Interactive Timeline</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Explore how concepts evolved across eras, from foundational origins to
                  modern applications.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="group relative border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300 hover:border-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative space-y-4">
              <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center ring-1 ring-pink-500/20 group-hover:ring-pink-500/40 transition-all">
                <Lightbulb className="h-5 w-5 text-pink-500" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-xl font-semibold">Force-Directed Graph</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Visualize conceptual mutations—refinements, syntheses, applications, and
                  critiques—as a living network.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="relative rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-border/50 p-12 md:p-16 text-center overflow-hidden backdrop-blur-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,119,198,0.1),transparent_70%)]" />
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to explore?</h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Start tracing the hidden lineage of any scientific concept. Discover how
              ideas emerged, evolved, and shaped modern understanding.
            </p>
            <div className="pt-2">
              <Button
                size="lg"
                className="gap-2 h-11 px-6 font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                onClick={() => {
                  if (!session?.user) {
                    router.push("/register");
                  } else {
                    document.querySelector("input")?.focus();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                {session?.user ? "Start Tracing" : "Get Started Free"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border/40">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Powered by</span>
          <a
            href="https://www.veritus.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <img
              src="https://www.veritus.ai/veritus-logo.svg"
              alt="Veritus.ai"
              className="h-5 w-auto"
            />
          </a>
        </div>
      </footer>
    </div>
  );
}