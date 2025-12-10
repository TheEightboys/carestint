"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, List, Loader2, ArrowLeft } from "lucide-react";
import { getAllEmployers } from "@/lib/firebase/firestore";
import { EmployerReviewClientPage } from "@/components/dashboard/superadmin/employer-review-client-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SuperAdminEmployersPage() {
  const [employers, setEmployers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEmployers = async () => {
      try {
        const data = await getAllEmployers();
        setEmployers(data);
      } catch (error) {
        console.error("Error loading employers:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadEmployers();
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
            Manage Employers
          </h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <List className="h-5 w-5" />
                <CardTitle>Manage Employers</CardTitle>
              </div>
              <CardDescription>Review pending applications, and manage active or suspended employer accounts.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading employers...</span>
                </div>
              ) : (
                <EmployerReviewClientPage employers={employers} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
