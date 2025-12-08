"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, GitBranch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

function BillingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // You could verify the session with Dodo here if needed
    console.log("Checkout session:", sessionId);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.1),transparent_50%)]" />
      </div>

      <Card className="max-w-lg w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription className="mt-2">
              Your subscription has been activated successfully
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm">
              <span className="font-semibold">What's next?</span>
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Your new limits are now active</li>
              <li>Start tracing concepts immediately</li>
              <li>Access your billing portal anytime</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={() => router.push("/concept")} className="w-full">
              Start Tracing Concepts
            </Button>
            <Button variant="outline" onClick={() => router.push("/billing")} className="w-full">
              View Billing
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => router.push("/")}
              className="text-sm text-muted-foreground"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.1),transparent_50%)]" />
      </div>
      <Card className="max-w-lg w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BillingSuccessContent />
    </Suspense>
  );
}