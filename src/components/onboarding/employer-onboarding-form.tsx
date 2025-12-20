
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
import { addEmployer, getEmployerByEmail } from '@/lib/firebase/firestore';
import { useUser } from '@/lib/user-context';

const formSchema = z.object({
  facilityName: z.string().min(2, "Facility name is required"),
  facilityType: z.string().min(1, "Facility type is required"),
  // Multi-location: single or multi-site
  siteType: z.enum(['single-site', 'multi-site'], { required_error: "Please select if you have one or multiple locations" }),
  // First location details
  locationName: z.string().min(2, "Location name is required (e.g., Main Branch, Westlands)"),
  streetArea: z.string().min(2, "Street/Area/Landmark is required"),
  city: z.string().min(2, "Town/City is required"),
  country: z.string().default("Kenya"),
  // Contact
  contactPerson: z.string().min(2, "Contact person is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "A valid phone number is required"),
  operatingDays: z.string().min(1, "Operating days are required"),
  staffSize: z.string().min(1, "Staff size is required"),
  // License
  licenseNumber: z.string().min(5, "A valid business license number is required"),
  licenseExpiryDate: z.string().min(1, "License expiry date is required"),
  licenseDocument: z.string().optional(),
  // Billing
  payoutMethod: z.string().min(1, "Payout method is required"),
  billingEmail: z.string().email("Invalid billing email address"),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: 'Facility Info', fields: ['facilityName', 'facilityType', 'siteType'] },
  { id: 2, title: 'Location Details', fields: ['locationName', 'streetArea', 'city', 'country'] },
  { id: 3, title: 'Contact & Operations', fields: ['contactPerson', 'email', 'phone', 'operatingDays', 'staffSize'] },
  { id: 4, title: 'Business License', fields: ['licenseNumber', 'licenseExpiryDate', 'licenseDocument'] },
  { id: 5, title: 'Billing & Payout', fields: ['payoutMethod', 'billingEmail'] },
  { id: 6, title: 'Review & Submit' },
];

export function EmployerOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Check if user already has employer data - redirect to dashboard if so
  useEffect(() => {
    const checkExistingEmployer = async () => {
      if (authLoading) return;

      // Get email from user or search params
      const email = user?.email || searchParams.get('email');

      if (!email) {
        setCheckingExisting(false);
        return;
      }

      try {
        const existingEmployer = await getEmployerByEmail(email);
        if (existingEmployer) {
          // User already has employer data, redirect to dashboard
          toast({
            title: "Welcome back!",
            description: "Your facility account already exists. Redirecting to dashboard...",
          });
          window.location.href = '/dashboard/employer';
          return;
        }
      } catch (error) {
        console.error('Error checking existing employer:', error);
      } finally {
        setCheckingExisting(false);
      }
    };

    checkExistingEmployer();
  }, [authLoading, user, searchParams, toast]);

  // Redirect after successful submission
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        window.location.href = '/dashboard/employer';
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      facilityName: '',
      facilityType: '',
      siteType: undefined,
      locationName: '',
      streetArea: '',
      city: '',
      country: 'Kenya',
      contactPerson: searchParams.get('name') || '',
      email: searchParams.get('email') || '',
      phone: searchParams.get('phone') || '',
      operatingDays: '',
      staffSize: '',
      licenseNumber: '',
      licenseExpiryDate: '',
      licenseDocument: '',
      payoutMethod: '',
      billingEmail: searchParams.get('email') || '',
    },
  });

  const { trigger, getValues, setValue } = form;

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
      await addEmployer(data);
      toast({
        title: "Submission successful!",
        description: "Your facility details have been submitted for review. Redirecting to dashboard...",
      });
      // Trigger redirect via useEffect
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting employer profile:", error);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "There was an error submitting your details. Please try again."
      })
      setIsLoading(false);
    }
  };

  // Show loading while checking for existing account
  if (authLoading || checkingExisting) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Checking your account status...</p>
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
          {/* Step 1: Facility Info */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField name="facilityName" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Facility Name</FormLabel><FormControl><Input placeholder="e.g., City Health Clinic" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="facilityType" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Facility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select facility type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="hospital">Hospital</SelectItem>
                        <SelectItem value="clinic">Clinic</SelectItem>
                        <SelectItem value="dental-clinic">Dental Clinic</SelectItem>
                        <SelectItem value="nursing-home">Nursing Home</SelectItem>
                        <SelectItem value="lab">Laboratory</SelectItem>
                        <SelectItem value="pharmacy">Pharmacy</SelectItem>
                        <SelectItem value="maternity">Maternity Center</SelectItem>
                        <SelectItem value="diagnostic">Diagnostic Center</SelectItem>
                        <SelectItem value="rehab">Rehabilitation Center</SelectItem>
                        <SelectItem value="hospice">Hospice</SelectItem>
                        <SelectItem value="urgent-care">Urgent Care Center</SelectItem>
                        <SelectItem value="other">Other Healthcare Facility</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="space-y-3">
                <FormLabel className="text-base font-semibold">How many locations does your facility have?</FormLabel>
                <p className="text-sm text-muted-foreground">This helps us set up your account correctly. Single-site facilities cannot add more locations later.</p>
                <FormField name="siteType" control={form.control} render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        onClick={() => field.onChange('single-site')}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${field.value === 'single-site' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}`}
                      >
                        <div className="font-medium">🏥 Single Location</div>
                        <p className="text-sm text-muted-foreground mt-1">One facility at one address</p>
                      </div>
                      <div
                        onClick={() => field.onChange('multi-site')}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${field.value === 'multi-site' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}`}
                      >
                        <div className="font-medium">🏢 Multiple Locations</div>
                        <p className="text-sm text-muted-foreground mt-1">Multiple branches under same license</p>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          )}

          {/* Step 2: Location Details */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in-50">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm">📍 Enter details for your <strong>main location</strong>. {getValues().siteType === 'multi-site' && 'You can add more locations after account setup.'}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField name="locationName" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Location Name</FormLabel><FormControl><Input placeholder="e.g., Main Branch, Westlands, CBD" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="streetArea" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Street / Area / Landmark</FormLabel><FormControl><Input placeholder="e.g., Kenyatta Avenue, Near City Hall" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="city" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Town / City</FormLabel><FormControl><Input placeholder="e.g., Nairobi" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="country" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'Kenya'}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                        <SelectItem value="Uganda">🇺🇬 Uganda</SelectItem>
                        <SelectItem value="Tanzania">🇹🇿 Tanzania</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          )}

          {/* Step 3: Contact & Operations */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-in fade-in-50">
              <FormField name="contactPerson" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="email" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="phone" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="operatingDays" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Operating Days</FormLabel><FormControl><Input placeholder="e.g., Mon - Fri" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="staffSize" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Staff Size</FormLabel><FormControl><Input placeholder="e.g., 10-50" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          )}

          {/* Step 4: Business License */}
          {currentStep === 4 && (
            <div className="animate-in fade-in-50 space-y-4">
              <FormField name="licenseNumber" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Business License Number</FormLabel><FormControl><Input placeholder="Enter your facility's business license number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="licenseExpiryDate" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>License Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="date" placeholder="Select expiry date" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">When does your business license expire?</p>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="licenseDocument" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Business License Document</FormLabel>
                  <FormControl>
                    <CameraCapture onCapture={(dataUrl) => field.onChange(dataUrl)} documentType="Business License" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}

          {/* Step 5: Billing & Payout */}
          {currentStep === 5 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-in fade-in-50">
              <FormField name="payoutMethod" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Payout Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="billingEmail" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Billing Contact Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          )}

          {/* Step 6: Review & Submit */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in-50">
              <h3 className="font-headline text-lg font-semibold">Review Your Details</h3>
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                {Object.entries(getValues()).map(([key, value]) => {
                  if (key === 'licenseDocument' && value) {
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
