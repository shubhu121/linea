"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Calendar, User, Quote, FileText } from "lucide-react";
import MutationBadge from "@/components/MutationBadge";

interface PaperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paper: {
    id: number;
    title: string;
    authors: string[];
    abstract?: string;
    publicationDate?: string;
    doi?: string;
    arxivId?: string;
    citations?: number;
    sourceUrl?: string;
  };
  mutationType?: "origin" | "refinement" | "synthesis" | "application" | "critique";
  mutationDescription?: string;
  era?: string;
  influenceScore?: number;
}

export default function PaperModal({
  open,
  onOpenChange,
  paper,
  mutationType,
  mutationDescription,
  era,
  influenceScore,
}: PaperModalProps) {
  const year = paper.publicationDate
    ? new Date(paper.publicationDate).getFullYear()
    : "Unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="space-y-3">
            {mutationType && <MutationBadge type={mutationType} />}
            <DialogTitle className="text-xl leading-tight pr-8">
              {paper.title}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {paper.authors.slice(0, 3).join(", ")}
                {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {year}
              </span>
              {paper.citations !== undefined && (
                <span className="flex items-center gap-1.5">
                  <Quote className="h-3.5 w-3.5" />
                  {paper.citations.toLocaleString()} citations
                </span>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Separator />

        <div className="space-y-6">
          {/* Metadata */}
          <div className="flex flex-wrap gap-2">
            {era && (
              <Badge variant="secondary" className="gap-1.5">
                <FileText className="h-3 w-3" />
                {era}
              </Badge>
            )}
            {influenceScore !== undefined && (
              <Badge variant="outline" className="font-medium">
                Influence: {(influenceScore * 100).toFixed(0)}%
              </Badge>
            )}
            {paper.doi && (
              <Badge variant="outline" className="font-mono text-xs">
                DOI: {paper.doi}
              </Badge>
            )}
            {paper.arxivId && (
              <Badge variant="outline" className="font-mono text-xs">
                arXiv: {paper.arxivId}
              </Badge>
            )}
          </div>

          {/* Mutation Description */}
          {mutationDescription && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Conceptual Mutation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {mutationDescription}
              </p>
            </div>
          )}

          {/* Abstract */}
          {paper.abstract && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Abstract</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {paper.abstract}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {paper.sourceUrl && (
              <Button
                onClick={() => window.open(paper.sourceUrl, "_blank")}
                className="gap-2"
                size="sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Full Paper
              </Button>
            )}
            {paper.doi && (
              <Button
                variant="outline"
                onClick={() => window.open(`https://doi.org/${paper.doi}`, "_blank")}
                className="gap-2"
                size="sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on DOI
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}