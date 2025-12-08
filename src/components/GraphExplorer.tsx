"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, Network } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import react-force-graph-2d to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface GraphNode {
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

interface GraphLink {
  source: number;
  target: number;
  type: string;
}

interface GraphExplorerProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick?: (nodeId: number) => void;
  selectedNodeId?: number;
}

const mutationColors: Record<string, string> = {
  origin: "#f59e0b",
  refinement: "#3b82f6",
  synthesis: "#a855f7",
  application: "#10b981",
  critique: "#ef4444",
};

export default function GraphExplorer({
  nodes,
  links,
  onNodeClick,
  selectedNodeId,
}: GraphExplorerProps) {
  const graphRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const updateDimensions = () => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
          });
        }
      };

      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }
  }, []);

  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 1.2, 400);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 0.8, 400);
    }
  };

  const handleFitView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  };

  // Memoize graphData to prevent unnecessary re-renders
  const graphData = useMemo(() => ({
    nodes: nodes.map((node) => ({
      ...node,
      id: node.id,
      label: node.paper.title,
      color: mutationColors[node.mutationType] || "#666",
      val: node.influenceScore * 10 + 5,
    })),
    links: links.map((link) => ({
      source: link.source,
      target: link.target,
      color: "#ffffff20",
    })),
  }), [nodes, links]);

  if (nodes.length === 0) {
    return (
      <Card className="h-[calc(100vh-12rem)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Network className="h-4 w-4" />
            Lineage Graph
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-sm text-muted-foreground">
            No graph data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Network className="h-4 w-4" />
            Lineage Graph
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleFitView} className="h-8 w-8">
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative bg-black rounded-b-lg overflow-hidden border-t"
          style={{ height: "calc(100vh - 16rem)" }}
        >
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            nodeLabel={(node: any) => node.paper?.title || node.label}
            nodeColor={(node: any) => node.color}
            nodeVal={(node: any) => node.val}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const label = node.paper?.title || node.label;
              const fontSize = 11 / globalScale;
              const isSelected = selectedNodeId === node.paper?.id;

              // Draw node circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
              ctx.fillStyle = node.color;
              ctx.fill();

              // Draw selection ring
              if (isSelected) {
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2.5 / globalScale;
                ctx.stroke();
                
                // Draw outer glow
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.val + 3 / globalScale, 0, 2 * Math.PI, false);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
                ctx.lineWidth = 1 / globalScale;
                ctx.stroke();
              }

              // Draw label
              ctx.font = `${fontSize}px Inter, sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillStyle = isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.9)";
              ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
              ctx.shadowBlur = 3 / globalScale;
              
              const maxWidth = 100 / globalScale;
              const words = String(label || "").split(" ");
              let line = "";
              let y = node.y + node.val + 6 / globalScale;
              let lineCount = 0;

              for (let i = 0; i < words.length && lineCount < 2; i++) {
                const testLine = line + words[i] + " ";
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && line !== "") {
                  ctx.fillText(line, node.x, y);
                  line = words[i] + " ";
                  y += fontSize * 1.3;
                  lineCount++;
                } else {
                  line = testLine;
                }
              }
              
              if (line && lineCount < 2) {
                ctx.fillText(line, node.x, y);
              }
              
              ctx.shadowBlur = 0;
            }}
            onNodeClick={(node: any) => {
              onNodeClick?.(node.paper?.id || node.id);
            }}
            linkDirectionalArrowLength={5}
            linkDirectionalArrowRelPos={1}
            linkColor={(link: any) => link.color}
            linkWidth={1.5}
            d3VelocityDecay={0.3}
            cooldownTime={3000}
            backgroundColor="transparent"
          />
        </div>
      </CardContent>
    </Card>
  );
}