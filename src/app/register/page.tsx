"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Start tracing the provenance of scientific concepts
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}

function RegisterContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();

  const concept = searchParams.get("concept");

  // Redirect if already logged in
  useEffect(() => {
    if (!isPending && session?.user) {
      if (concept) {
        router.push(`/?concept=${encodeURIComponent(concept)}`);
      } else {
        router.push("/");
      }
    }
  }, [session, isPending, router, concept]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure your passwords match.",
      });
      return;
    }

    if (password.length < 8) {
      toast.error("Password too short", {
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        name,
        password,
      });

      if (error?.code) {
        const errorMessages: Record<string, string> = {
          USER_ALREADY_EXISTS: "An account with this email already exists.",
        };
        toast.error(errorMessages[error.code] || "Registration failed", {
          description: "Please try again with different credentials.",
        });
        return;
      }

      toast.success("Account created!", {
        description: "Redirecting you to sign in...",
      });

      // Redirect to login
      const loginUrl = concept 
        ? `/login?registered=true&concept=${encodeURIComponent(concept)}`
        : "/login?registered=true";
      router.push(loginUrl);
    } catch (error) {
      toast.error("Registration failed", {
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
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Start tracing the provenance of scientific concepts
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
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
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link
                href={concept ? `/login?concept=${encodeURIComponent(concept)}` : "/login"}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RegisterContent />
    </Suspense>
  );
}