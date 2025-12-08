"use client";

import { Calendar, User, ExternalLink, Quote } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MutationBadge from "@/components/MutationBadge";

interface PaperCardProps {
  paper: {
    id: number;
    title: string;
    authors: string[];
    abstract?: string;
    publicationDate?: string;
    doi?: string;
    citations?: number;
    sourceUrl?: string;
  };
  mutationType?: "origin" | "refinement" | "synthesis" | "application" | "critique";
  mutationDescription?: string;
  era?: string;
  onClick?: () => void;
}

export default function PaperCard({
  paper,
  mutationType,
  mutationDescription,
  era,
  onClick,
}: PaperCardProps) {
  const year = paper.publicationDate
    ? new Date(paper.publicationDate).getFullYear()
    : "Unknown";

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50"
      onClick={onClick}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {mutationType && <MutationBadge type={mutationType} className="mb-2" />}
            <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {paper.title}
            </CardTitle>
          </div>
        </div>
        <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {paper.authors.slice(0, 2).join(", ")}
            {paper.authors.length > 2 && ` +${paper.authors.length - 2}`}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {year}
          </span>
          {paper.citations !== undefined && (
            <span className="flex items-center gap-1">
              <Quote className="h-3 w-3" />
              {paper.citations.toLocaleString()} citations
            </span>
          )}
          {era && (
            <Badge variant="secondary" className="text-xs">
              {era}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      {mutationDescription && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {mutationDescription}
          </p>
        </CardContent>
      )}
      {paper.sourceUrl && (
        <CardContent className="pt-0">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-xs h-8"
            onClick={(e) => {
              e.stopPropagation();
              window.open(paper.sourceUrl, "_blank");
            }}
          >
            <ExternalLink className="h-3 w-3" />
            View Paper
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
