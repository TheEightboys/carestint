"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, List, Loader2, ArrowLeft, AlertTriangle, RefreshCw, Users } from "lucide-react";
import { getAllProfessionals } from "@/lib/firebase/firestore";
import { ProfessionalReviewClientPage } from "@/components/dashboard/superadmin/professional-review-client-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SuperAdminProfessionalsPage() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfessionals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllProfessionals();
      setProfessionals(data || []);
    } catch (err) {
      console.error("Error loading professionals:", err);
      setError("Failed to load professionals. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfessionals();
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/superadmin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          <h1 className="font-headline text-xl font-semibold">
            Manage Professionals
          </h1>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={loadProfessionals} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <List className="h-5 w-5" />
                <CardTitle>Manage Professionals</CardTitle>
              </div>
              <CardDescription>Review pending applications, and manage active or suspended professional accounts.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading professionals...</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <AlertTriangle className="h-10 w-10 text-destructive" />
                  <p className="text-destructive">{error}</p>
                  <Button onClick={loadProfessionals}>Try Again</Button>
                </div>
              ) : professionals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 border-2 border-dashed rounded-lg">
                  <Users className="h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground font-medium">No professionals registered yet</p>
                  <p className="text-sm text-muted-foreground">Professionals will appear here once they sign up and complete onboarding.</p>
                </div>
              ) : (
                <ProfessionalReviewClientPage professionals={professionals} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
