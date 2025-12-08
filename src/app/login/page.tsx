"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { authClient, useSession } from "@/lib/auth-client";

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
        <Sparkles className="h-6 w-6" />
        <span className="text-xl font-bold">Linea</span>
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to continue tracing the lineage of ideas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();

  const redirect = searchParams.get("redirect") || "/";
  const concept = searchParams.get("concept");
  const registered = searchParams.get("registered");

  // Redirect if already logged in
  useEffect(() => {
    if (!isPending && session?.user) {
      if (concept) {
        router.push(`/?concept=${encodeURIComponent(concept)}`);
      } else {
        router.push(redirect);
      }
    }
  }, [session, isPending, router, redirect, concept]);

  // Show success message if just registered
  useEffect(() => {
    if (registered === "true") {
      toast.success("Account created!", {
        description: "Please sign in with your new account.",
      });
    }
  }, [registered]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
        callbackURL: redirect,
      });

      if (error?.code) {
        toast.error("Invalid email or password", {
          description: "Please make sure you have already registered an account and try again.",
        });
        return;
      }

      toast.success("Signed in successfully!");
      
      // Redirect after successful login
      if (concept) {
        router.push(`/?concept=${encodeURIComponent(concept)}`);
      } else {
        router.push(redirect);
      }
    } catch (error) {
      toast.error("Sign in failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
        <Sparkles className="h-6 w-6" />
        <span className="text-xl font-bold">Linea</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to continue tracing the lineage of ideas
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Remember me
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{" "}
              <Link
                href={concept ? `/register?concept=${encodeURIComponent(concept)}` : "/register"}
                className="text-primary hover:underline font-medium"
              >
                Create one
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
}