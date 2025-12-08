"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Timeline from "@/components/Timeline";
import GraphExplorer from "@/components/GraphExplorer";
import PaperModal from "@/components/PaperModal";
import { ConceptLoadingSkeleton } from "@/components/LoadingSkeleton";
import { toast } from "sonner";

interface ConceptData {
  concept: {
    id: number;
    slug: string;
    originalConcept: string;
    refinedConcept: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  narrative: {
    fullNarrative: string;
    summary: string;
    keyInsights: string[];
  } | null;
}

interface LineageData {
  nodes: any[];
  links: any[];
  papers: Record<number, any>;
}

export default function ConceptPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [conceptData, setConceptData] = useState<ConceptData | null>(null);
  const [lineageData, setLineageData] = useState<LineageData | null>(null);
  const [selectedPaperId, setSelectedPaperId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchConceptData = async () => {
    try {
      const response = await fetch(`/api/linea/getConcept/${slug}`);
      if (!response.ok) throw new Error("Failed to fetch concept");
      
      const data = await response.json();
      setConceptData(data.data);

      // If completed, fetch lineage
      if (data.data.concept.status === "completed") {
        const lineageResponse = await fetch(`/api/linea/getLineage/${slug}`);
        if (lineageResponse.ok) {
          const lineageData = await lineageResponse.json();
          setLineageData(lineageData.data);
        }
        
        // Stop polling when completed
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    } catch (error) {
      console.error("Error fetching concept:", error);
      toast.error("Failed to load concept data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConceptData();

    // Poll for updates every 5 seconds until completed
    const interval = setInterval(() => {
      fetchConceptData();
    }, 5000);

    setPollingInterval(interval as unknown as NodeJS.Timeout);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [slug]);

  const selectedPaper = selectedPaperId && lineageData?.papers[selectedPaperId]
    ? lineageData.papers[selectedPaperId]
    : null;

  const selectedNode = lineageData?.nodes.find((n) => n.paper.id === selectedPaperId);

  if (isLoading) {
    return <ConceptLoadingSkeleton />;
  }

  if (!conceptData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Concept Not Found</CardTitle>
            <CardDescription>
              The concept you're looking for doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { concept, narrative } = conceptData;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-start gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="shrink-0 mt-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {concept.refinedConcept || concept.originalConcept}
                  </h1>
                  {concept.originalConcept !== concept.refinedConcept && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Originally: {concept.originalConcept}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {concept.status === "processing" && (
                    <Badge variant="secondary" className="gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Processing
                    </Badge>
                  )}
                  {concept.status === "completed" && (
                    <Badge variant="secondary" className="gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </Badge>
                  )}
                  {concept.status === "pending" && (
                    <Badge variant="outline" className="gap-1.5">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchConceptData}
                    disabled={concept.status === "processing"}
                    className="h-8 w-8"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {concept.status === "processing" && (
          <Card className="mb-8 border-blue-500/20 bg-blue-500/5">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 p-2 rounded-lg bg-blue-500/10">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1.5">Tracing Provenance</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Our agents are analyzing research papers to reconstruct the conceptual
                    lineage. This may take a few minutes...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {concept.status === "completed" && narrative && (
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Narrative</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                {narrative.summary}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {narrative.fullNarrative}
                </p>
              </div>
              {narrative.keyInsights.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-semibold">Key Insights</h4>
                  <ul className="space-y-2.5">
                    {narrative.keyInsights.map((insight, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="text-primary mt-1.5 shrink-0">•</span>
                        <span className="text-muted-foreground leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {lineageData && lineageData.nodes.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <Timeline
                nodes={lineageData.nodes}
                onNodeClick={setSelectedPaperId}
                selectedNodeId={selectedPaperId || undefined}
              />
            </div>
            <div className="lg:col-span-3">
              <GraphExplorer
                nodes={lineageData.nodes}
                links={lineageData.links}
                onNodeClick={setSelectedPaperId}
                selectedNodeId={selectedPaperId || undefined}
              />
            </div>
          </div>
        ) : concept.status === "completed" ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">No lineage data available.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Paper Modal */}
      {selectedPaper && selectedNode && (
        <PaperModal
          open={!!selectedPaperId}
          onOpenChange={(open) => !open && setSelectedPaperId(null)}
          paper={selectedPaper}
          mutationType={selectedNode.mutationType}
          mutationDescription={selectedNode.mutationDescription}
          era={selectedNode.era}
          influenceScore={selectedNode.influenceScore}
        />
      )}
    </div>
  );
}