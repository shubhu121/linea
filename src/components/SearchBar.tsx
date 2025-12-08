"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (concept: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  isLoading = false,
  placeholder = "Enter a scientific concept...",
}: SearchBarProps) {
  const [concept, setConcept] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (concept.trim() && !isLoading) {
      onSearch(concept.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex items-center gap-2 bg-card border border-border rounded-xl p-2 shadow-lg transition-all duration-200 hover:border-primary/50">
          <Search className="ml-3 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            disabled={!concept.trim() || isLoading}
            className="gap-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Tracing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Trace Lineage
              </>
            )}
          </Button>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Try: "neural networks", "CRISPR gene editing", or "quantum entanglement"
      </p>
    </form>
  );
}
