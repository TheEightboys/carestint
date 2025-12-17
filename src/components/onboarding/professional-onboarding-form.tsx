
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, CheckCircle, Camera, ExternalLink } from 'lucide-react';
import { CameraCapture } from './camera-capture';
import { addProfessional } from '@/lib/firebase/firestore';

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "A valid phone number is required"),
  locations: z.string().min(3, "Preferred location is required"),
  licenseNumber: z.string().min(5, "A valid license number is required"),
  issuingBody: z.string().min(3, "Issuing body/country is required"),
  licenseDocument: z.string().optional(),
  idDocument: z.string().optional(),
  primaryRole: z.string().min(1, "Primary role is required"),
  experience: z.string().min(1, "Years of experience is required"),
  dailyRate: z.string().min(1, "Typical daily rate is required"),
  currency: z.string().default("KSh"),
  shiftTypes: z.string().min(1, "Available shift types are required"),
  mpesaPhone: z.string().min(10, "A valid M-Pesa phone number is required"),
  bankAccount: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: 'Professional Profile', fields: ['fullName', 'email', 'phone', 'locations'] },
  { id: 2, title: 'Credentials', fields: ['licenseNumber', 'issuingBody', 'licenseDocument', 'idDocument'] },
  { id: 3, title: 'Role & Experience', fields: ['primaryRole', 'experience', 'dailyRate', 'shiftTypes'] },
  { id: 4, title: 'Payout Details', fields: ['mpesaPhone', 'bankAccount'] },
  { id: 5, title: 'Review & Submit' },
];

export function ProfessionalOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  // Redirect after successful submission - show verification first
  useEffect(() => {
    if (isSubmitted) {
      // Show verification prompt first, then redirect after delay
      setShowVerificationPrompt(true);
      const timer = setTimeout(() => {
        window.location.href = '/dashboard/professional';
      }, 8000); // Give user time to read verification info
      return () => clearTimeout(timer);
    }
  }, [isSubmitted]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: searchParams.get('name') || '',
      email: searchParams.get('email') || '',
      phone: searchParams.get('phone') || '',
      locations: '',
      licenseNumber: '',
      issuingBody: '',
      licenseDocument: '',
      idDocument: '',
      primaryRole: '',
      experience: '',
      dailyRate: '',
      currency: 'KSh',
      shiftTypes: '',
      mpesaPhone: searchParams.get('phone') || '',
      bankAccount: '',
    },
  });

  const { trigger, getValues } = form;

  const handleNext = async () => {
    const fields = steps[currentStep - 1].fields;
    const isValid = await trigger(fields as (keyof FormData)[]);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };
  const [verificationLink, setVerificationLink] = useState<string | null>(null);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    try {
      // Images are now compressed in CameraCapture component
      // Safe to store directly in Firestore
      const professionalId = await addProfessional(data);

      // Generate verification token for identity verification
      if (professionalId) {
        const { generateVerificationToken } = await import('@/lib/firebase/firestore');
        const token = await generateVerificationToken(professionalId);
        if (token) {
          // Create verification link
          const link = `${window.location.origin}/verify/${token}`;
          setVerificationLink(link);
          console.log('Verification link generated:', link);
        }
      }

      toast({
        title: "Profile submitted!",
        description: "Please complete identity verification to finish your registration.",
      });
      // Trigger redirect via useEffect - show verification step first
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting professional profile:", error);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "There was an error submitting your details. Please try again."
      })
      setIsLoading(false);
    }
  };

  const copyVerificationLink = () => {
    if (verificationLink) {
      navigator.clipboard.writeText(verificationLink);
      toast({
        title: "Link copied!",
        description: "Paste this link in your browser to complete verification.",
      });
    }
  };

  // Show verification success screen
  if (showVerificationPrompt) {
    return (
      <div className="space-y-6">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-headline">Profile Submitted!</CardTitle>
            <CardDescription>
              One more step: Complete your identity verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <Camera className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
                    Identity Verification Required
                  </h4>
                  <p className="text-sm text-amber-600 dark:text-amber-400/80">
                    Take a selfie while holding your ID next to your face. This helps us verify your identity and is required before account approval.
                  </p>
                </div>
              </div>
            </div>

            {verificationLink && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Click the button below to complete verification now, or copy the link to do it later:
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.location.href = verificationLink}
                    className="flex-1"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Verify Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={copyVerificationLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <code className="text-xs break-all text-muted-foreground">
                    {verificationLink}
                  </code>
                </div>
              </div>
            )}

            <div className="text-center pt-2">
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/dashboard/professional'}
                className="text-muted-foreground"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Skip for now - Go to Dashboard
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                You can complete verification later from your dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Progress value={(currentStep / steps.length) * 100} className="w-full" />
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Step {currentStep} of {steps.length}</span>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === 1 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-in fade-in-50">
              <FormField name="fullName" control={form.control} render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="email" control={form.control} render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="phone" control={form.control} render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="locations" control={form.control} render={({ field }) => (<FormItem><FormLabel>Preferred Locations</FormLabel><FormControl><Input placeholder="e.g., Nairobi, Kampala" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField name="licenseNumber" control={form.control} render={({ field }) => (<FormItem><FormLabel>License Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="issuingBody" control={form.control} render={({ field }) => (<FormItem><FormLabel>Issuing Body / Country</FormLabel><FormControl><Input placeholder="e.g., KMPDC / Kenya" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField name="licenseDocument" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Capture License Document</FormLabel>
                  <FormControl>
                    <CameraCapture onCapture={(dataUrl) => field.onChange(dataUrl)} documentType="License" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="idDocument" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Capture ID Document</FormLabel>
                  <FormControl>
                    <CameraCapture onCapture={(dataUrl) => field.onChange(dataUrl)} documentType="ID" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}

          {currentStep === 3 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-in fade-in-50">
              <FormField name="primaryRole" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Type of Professional</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select your profession" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor / Physician</SelectItem>
                      <SelectItem value="dentist">Dentist</SelectItem>
                      <SelectItem value="rn">Registered Nurse (RN)</SelectItem>
                      <SelectItem value="enrolled-nurse">Enrolled Nurse</SelectItem>
                      <SelectItem value="clinical-officer">Clinical Officer</SelectItem>
                      <SelectItem value="lab-tech">Lab Technician</SelectItem>
                      <SelectItem value="pharmacist">Pharmacist</SelectItem>
                      <SelectItem value="pharm-tech">Pharmacy Technician</SelectItem>
                      <SelectItem value="radiographer">Radiographer</SelectItem>
                      <SelectItem value="physiotherapist">Physiotherapist</SelectItem>
                      <SelectItem value="midwife">Midwife</SelectItem>
                      <SelectItem value="nutritionist">Nutritionist / Dietitian</SelectItem>
                      <SelectItem value="other">Other Healthcare Professional</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage /></FormItem>)} />
              <FormField name="experience" control={form.control} render={({ field }) => (<FormItem><FormLabel>Years of Experience</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="dailyRate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Typical Daily Rate</FormLabel><FormControl><Input type="number" placeholder="e.g., 5000" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="currency" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="KSh">🇰🇪 KSh (Kenya)</SelectItem>
                      <SelectItem value="UGX">🇺🇬 UGX (Uganda)</SelectItem>
                      <SelectItem value="TZS">🇹🇿 TZS (Tanzania)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage /></FormItem>)} />
              <FormField name="shiftTypes" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Available Shift Types</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select shift types" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="half-day">Half-day</SelectItem>
                      <SelectItem value="full-day">Full-day</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage /></FormItem>)} />
            </div>
          )}

          {currentStep === 4 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-in fade-in-50">
              <FormField name="mpesaPhone" control={form.control} render={({ field }) => (<FormItem><FormLabel>M-Pesa Phone for Payouts</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="bankAccount" control={form.control} render={({ field }) => (<FormItem><FormLabel>Bank Account (Optional)</FormLabel><FormControl><Input placeholder="Bank, Account Number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in-50">
              <h3 className="font-headline text-lg font-semibold">Review Your Profile</h3>
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                {Object.entries(getValues()).map(([key, value]) => {
                  if ((key === 'licenseDocument' || key === 'idDocument') && value) {
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span className="font-medium capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-right text-green-500">Captured</span>
                      </div>
                    );
                  }
                  if (value && typeof value === 'string') {
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-right">{String(value)}</span>
                      </div>
                    )
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {currentStep > 1 ? (
              <Button type="button" variant="outline" onClick={handlePrev}>Previous</Button>
            ) : <div />}
            {currentStep < steps.length && <Button type="button" onClick={handleNext}>Next</Button>}
            {currentStep === steps.length && <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : 'Submit for Review'}</Button>}
          </div>
        </form>
      </Form>
    </div>
  );
}
