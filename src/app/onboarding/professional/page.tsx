import { ProfessionalOnboardingForm } from '@/components/onboarding/professional-onboarding-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope } from 'lucide-react';
import { Suspense } from 'react';

function OnboardingForm() {
  return <ProfessionalOnboardingForm />;
}

export default function ProfessionalOnboardingPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Stethoscope className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="font-headline text-2xl">Professional Onboarding</CardTitle>
          <CardDescription>Complete your profile to start finding healthcare stints.</CardDescription>
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
