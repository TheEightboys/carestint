
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
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

  // Redirect after successful submission
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        window.location.href = '/dashboard/professional';
      }, 1000);
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

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    try {
      // Images are now compressed in CameraCapture component
      // Safe to store directly in Firestore
      await addProfessional(data);
      toast({
        title: "Profile submitted!",
        description: "Your details are now under review. We'll notify you once approved. Redirecting to dashboard...",
      });
      // Trigger redirect via useEffect
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
              <FormField name="dailyRate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Typical Daily Rate (KSh)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
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
