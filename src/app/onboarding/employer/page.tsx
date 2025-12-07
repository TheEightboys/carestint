import { EmployerOnboardingForm } from '@/components/onboarding/employer-onboarding-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
import { Suspense } from 'react';

function OnboardingForm() {
  return <EmployerOnboardingForm />;
}

export default function EmployerOnboardingPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Employer/Facility Onboarding</CardTitle>
          <CardDescription>Complete the following steps to set up your facility account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <OnboardingForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
