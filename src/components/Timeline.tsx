"use client";

import { useMemo } from "react";
import { Calendar, ArrowDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import MutationBadge from "@/components/MutationBadge";

interface TimelineNode {
  id: number;
  paper: {
    id: number;
    title: string;
    authors: string[];
    publicationDate?: string;
  };
  mutationType: "origin" | "refinement" | "synthesis" | "application" | "critique";
  mutationDescription: string;
  era: string;
  influenceScore: number;
}

interface TimelineProps {
  nodes: TimelineNode[];
  onNodeClick?: (nodeId: number) => void;
  selectedNodeId?: number;
}

export default function Timeline({ nodes, onNodeClick, selectedNodeId }: TimelineProps) {
  // Group nodes by era and sort chronologically
  const timelineData = useMemo(() => {
    const nodesByEra = nodes.reduce((acc: any, node) => {
      if (!acc[node.era]) {
        acc[node.era] = [];
      }
      acc[node.era].push(node);
      return acc;
    }, {});

    // Sort each era's nodes by publication date
    Object.keys(nodesByEra).forEach((era) => {
      nodesByEra[era].sort((a: TimelineNode, b: TimelineNode) => {
        const dateA = a.paper.publicationDate || "0";
        const dateB = b.paper.publicationDate || "0";
        return dateA.localeCompare(dateB);
      });
    });

    // Sort eras chronologically
    const sortedEras = Object.keys(nodesByEra).sort((a, b) => {
      const firstDateA = nodesByEra[a][0]?.paper.publicationDate || "0";
      const firstDateB = nodesByEra[b][0]?.paper.publicationDate || "0";
      return firstDateA.localeCompare(firstDateB);
    });

    return sortedEras.map((era) => ({
      era,
      nodes: nodesByEra[era],
    }));
  }, [nodes]);

  if (nodes.length === 0) {
    return (
      <Card className="h-[calc(100vh-12rem)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No timeline data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col overflow-hidden">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Calendar className="h-4 w-4" />
          Conceptual Evolution
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="px-6 pb-6">
            <div className="space-y-6">
              {timelineData.map((eraData, eraIndex) => (
                <div key={eraData.era} className="relative">
                  {/* Era Label */}
                  <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm py-2 mb-3">
                    <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                      {eraData.era}
                    </h3>
                  </div>

                  {/* Era Nodes */}
                  <div className="space-y-3 relative">
                    {/* Timeline Line */}
                    {eraIndex < timelineData.length - 1 && (
                      <div className="absolute left-[7px] top-10 bottom-0 w-px bg-gradient-to-b from-border to-transparent" />
                    )}

                    {eraData.nodes.map((node: TimelineNode, nodeIndex: number) => {
                      const year = node.paper.publicationDate
                        ? new Date(node.paper.publicationDate).getFullYear()
                        : "Unknown";
                      const isSelected = selectedNodeId === node.paper.id;

                      return (
                        <div key={node.id} className="relative pl-8">
                          {/* Timeline Dot */}
                          <div
                            className={`absolute left-0 top-3 h-4 w-4 rounded-full border-2 transition-all duration-300 ${
                              isSelected
                                ? "bg-foreground border-foreground scale-110 shadow-lg"
                                : "bg-background border-border hover:border-foreground/50"
                            }`}
                          />

                          {/* Node Card */}
                          <button
                            onClick={() => onNodeClick?.(node.paper.id)}
                            className={`w-full text-left group rounded-lg border p-3.5 transition-all duration-200 ${
                              isSelected
                                ? "bg-accent border-foreground/20 shadow-sm"
                                : "bg-card border-border hover:border-foreground/30 hover:bg-accent/50"
                            }`}
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <MutationBadge type={node.mutationType} />
                                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                                  {year}
                                </span>
                              </div>
                              <h4 className="text-sm font-medium leading-snug line-clamp-2 transition-colors">
                                {node.paper.title}
                              </h4>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                {node.mutationDescription}
                              </p>
                              
                              {/* Influence Score */}
                              <div className="flex items-center gap-2 pt-0.5">
                                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-foreground/80 transition-all duration-500"
                                    style={{
                                      width: `${Math.max(node.influenceScore * 100, 5)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                                  {(node.influenceScore * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </button>

                          {/* Connector Arrow */}
                          {nodeIndex < eraData.nodes.length - 1 && (
                            <div className="absolute left-[7px] top-full h-3 flex items-center justify-center">
                              <ArrowDown className="h-2.5 w-2.5 text-border" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}