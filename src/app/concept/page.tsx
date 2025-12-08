"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { GitBranch, Clock, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UsageIndicator } from "@/components/UsageIndicator";
import { PlanBadge } from "@/components/PlanBadge";

interface Concept {
  id: number;
  slug: string;
  originalConcept: string;
  refinedConcept: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ConceptHistoryPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/concept");
    } else if (session?.user) {
      fetchConcepts();
    }
  }, [session, isPending, router]);

  const fetchConcepts = async () => {
    if (!session?.user) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/linea/getUserConcepts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login?redirect=/concept");
          return;
        }
        throw new Error("Failed to fetch concepts");
      }

      const data = await response.json();
      setConcepts(data.data || []);
    } catch (error) {
      console.error("Error fetching concepts:", error);
      setError("Failed to load your concepts");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          bgColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          borderColor: "border-emerald-500/20",
          textColor: "text-emerald-600 dark:text-emerald-400",
          label: "Completed"
        };
      case "processing":
        return {
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
          bgColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          borderColor: "border-blue-500/20",
          textColor: "text-blue-600 dark:text-blue-400",
          label: "Processing"
        };
      case "pending":
        return {
          icon: <Clock className="h-3.5 w-3.5" />,
          bgColor: "border-border",
          borderColor: "border-border",
          textColor: "text-muted-foreground",
          label: "Pending"
        };
      case "failed":
        return {
          icon: <XCircle className="h-3.5 w-3.5" />,
          bgColor: "bg-red-500/10 text-red-600 dark:text-red-400",
          borderColor: "border-red-500/20",
          textColor: "text-red-600 dark:text-red-400",
          label: "Failed"
        };
      default:
        return {
          icon: <Clock className="h-3.5 w-3.5" />,
          bgColor: "border-border",
          borderColor: "border-border",
          textColor: "text-muted-foreground",
          label: "Unknown"
        };
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

          <div className="flex items-center gap-4">
            <PlanBadge />
            <UsageIndicator />
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/billing")}
            >
              Billing
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Concepts</h1>
          <p className="text-muted-foreground">
            View and manage your traced concepts
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-500/20 bg-red-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-600 dark:text-red-400">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {concepts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <GitBranch className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No concepts yet</h3>
              <p className="text-muted-foreground mb-6">
                Start tracing your first concept to see it here
              </p>
              <Button onClick={() => router.push("/")}>
                Trace Your First Concept
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {concepts.map((concept) => {
              const statusConfig = getStatusConfig(concept.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card
                  key={concept.id}
                  className="group hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => router.push(`/concept/${concept.slug}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {concept.originalConcept}
                        </CardTitle>
                        {concept.refinedConcept && (
                          <CardDescription className="text-sm">
                            Refined: {concept.refinedConcept}
                          </CardDescription>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full ${statusConfig.bgColor} border ${statusConfig.borderColor} flex items-center gap-2 shrink-0`}>
                        <StatusIcon className={`h-3.5 w-3.5 ${statusConfig.textColor}`} />
                        <span className={`text-xs font-medium ${statusConfig.textColor}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Created {new Date(concept.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}