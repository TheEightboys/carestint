
"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Info, Loader2, AlertTriangle, Tag, Check, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { addStint, getEmployerById } from "@/lib/firebase/firestore";
import { moderateStintPosting, calculateSettlement } from "@/lib/automation-service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ProfessionalRole, ShiftType, UrgencyType } from "@/lib/types";
import { getActivePromotions, canEmployerUsePromotion, type Promotion } from "@/lib/firebase/promotions";

const ROLE_MAP: Record<string, ProfessionalRole> = {
  "Registered Nurse (RN)": "rn",
  "Clinical Officer": "clinical-officer",
  "Lab Technician": "lab-tech",
  "Dentist": "dentist",
  "Pharmacist": "pharmacist",
  "Physiotherapist": "physiotherapist",
  "Midwife": "midwife",
  "Radiographer": "radiographer",
};

const formSchema = z.object({
  profession: z.string().min(1, "Profession is required"),
  shiftType: z.string().min(1, "Shift type is required"),
  shiftDate: z.date({ required_error: "Shift date is required" }),
  shiftDates: z.array(z.date()).optional(), // For selecting specific multiple dates
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  city: z.string().min(1, "City is required"),
  description: z.string().optional(),
  rate: z.number().min(1, "Rate must be greater than 0"),
  allowBids: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface PostStintFormProps {
  employerId?: string;
  employerName?: string;
}

export function PostStintForm({ employerId = "demo-employer", employerName = "Demo Clinic" }: PostStintFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moderationWarnings, setModerationWarnings] = useState<string[]>([]);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Currency state
  const [currency, setCurrency] = useState<'KSh' | 'UGX' | 'TZS'>('KSh');

  // Employer signup date for promo validation
  const [employerSignupDate, setEmployerSignupDate] = useState<Date>(new Date());

  // Fetch employer data on mount to get actual signup date
  useEffect(() => {
    const fetchEmployerData = async () => {
      if (employerId && employerId !== 'demo-employer') {
        try {
          const employer = await getEmployerById(employerId);
          if (employer?.createdAt) {
            // Handle Firestore Timestamp or Date
            const signupDate = employer.createdAt.toDate
              ? employer.createdAt.toDate()
              : new Date(employer.createdAt);
            setEmployerSignupDate(signupDate);
          }
        } catch (error) {
          console.error('Error fetching employer data:', error);
        }
      }
    };
    fetchEmployerData();
  }, [employerId]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profession: "",
      shiftType: "",
      startTime: "08:00",
      endTime: "17:00",
      city: "",
      description: "",
      rate: 0,
      allowBids: false,
    },
  });

  // Handle promo code validation
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setIsValidatingPromo(true);
    setPromoError(null);

    try {
      const activePromos = await getActivePromotions();
      const matchedPromo = activePromos.find(
        (p) => p.name.toLowerCase() === promoCode.trim().toLowerCase()
      );

      if (!matchedPromo) {
        setPromoError('Invalid promo code');
        setAppliedPromo(null);
        return;
      }

      // Check if employer can use this promo
      const eligibility = await canEmployerUsePromotion(
        matchedPromo.id!,
        employerId,
        employerSignupDate // Use actual employer signup date for promo validation
      );

      if (!eligibility.canUse) {
        setPromoError(eligibility.reason || 'Promo code cannot be used');
        setAppliedPromo(null);
        return;
      }

      setAppliedPromo(matchedPromo);
      setPromoError(null);
      toast({
        title: 'Promo code applied!',
        description: `You'll get ${matchedPromo.creditAmount.toLocaleString()} ${currency} off this stint.`,
      });
    } catch (error) {
      console.error('Promo validation error:', error);
      setPromoError('Failed to validate promo code');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError(null);
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);
    setModerationWarnings([]);

    try {
      const role = ROLE_MAP[data.profession] || "other";
      const shiftType: ShiftType = data.shiftType === "Half-day" ? "half-day" : "full-day";

      // Run moderation check
      const moderation = moderateStintPosting({
        role,
        offeredRate: data.rate,
        shiftType,
        description: data.description,
        employerId,
      });

      if (moderation.autoReject) {
        toast({
          title: "Stint Rejected",
          description: "This posting was flagged for review. Please contact support.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (moderation.isFlagged) {
        setModerationWarnings(moderation.flagReasons);
      }

      // Get dates array - prioritize shiftDates array, fallback to single shiftDate
      const dates: Date[] = [];
      if (data.shiftDates && data.shiftDates.length > 0) {
        // Use the specifically selected dates
        dates.push(...data.shiftDates);
      } else if (data.shiftDate) {
        dates.push(data.shiftDate);
      }

      if (dates.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one date for the shift.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Generate a unique date range ID for multi-day stints (to group related stints)
      const dateRangeId = dates.length > 1 ? `dr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined;

      // Create stints for each date
      const createdStintIds: string[] = [];
      for (const shiftDate of dates) {
        // Calculate if this is urgent (less than 48 hours notice)
        const hoursUntilShift = (shiftDate.getTime() - Date.now()) / (1000 * 60 * 60);
        const urgency: UrgencyType = hoursUntilShift < 48 ? "urgent" : "normal";

        const stintId = await addStint({
          employerId,
          employerName,
          role,
          shiftType,
          shiftDate,
          startTime: data.startTime,
          endTime: data.endTime,
          description: data.description,
          city: data.city,
          offeredRate: data.rate,
          currency: currency,
          allowBids: data.allowBids,
          urgency,
          // Multi-day stint fields
          isMultiDay: dates.length > 1,
          dateRangeId,
        });
        createdStintIds.push(stintId);
      }

      // Show success toast
      if (dates.length > 1) {
        const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
        toast({
          title: `${dates.length} Stints Posted!`,
          description: `Coverage for ${dates.length} selected dates has been created.`,
        });
      } else {
        toast({
          title: "Stint Posted Successfully!",
          description: `Your ${data.profession} stint for ${format(dates[0], "PPP")} has been posted.`,
        });
      }

      form.reset();
      setModerationWarnings([]);
    } catch (error) {
      console.error("Error posting stint:", error);
      toast({
        title: "Error",
        description: "Failed to post stint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedFees = (rate: number) => {
    const settlement = calculateSettlement(rate, false);
    const urgentSettlement = calculateSettlement(rate, true);
    const promoDiscount = appliedPromo?.creditAmount || 0;
    return {
      normalFee: settlement.bookingFee,
      urgentFee: urgentSettlement.bookingFee,
      clinicPays: settlement.clinicCharge,
      proReceives: settlement.professionalNet,
      promoDiscount,
      finalFee: Math.max(0, settlement.bookingFee - promoDiscount),
    };
  };

  const watchedRate = form.watch('rate');
  const { urgentFee, normalFee, clinicPays, proReceives, promoDiscount, finalFee } = calculatedFees(watchedRate);


  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <PlusCircle className="h-6 w-6" />
              Post a New Stint
            </CardTitle>
            <CardDescription>
              Fill in the details below to find a qualified professional for your facility.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profession</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Registered Nurse (RN)">Registered Nurse (RN)</SelectItem>
                        <SelectItem value="Clinical Officer">Clinical Officer</SelectItem>
                        <SelectItem value="Lab Technician">Lab Technician</SelectItem>
                        <SelectItem value="Dentist">Dentist</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shiftType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select shift type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Half-day">Half-day (4-6 hours)</SelectItem>
                        <SelectItem value="Full-day">Full-day (8-12 hours)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Shift Dates Selection - Always visible calendar for selecting one or more dates */}
            <FormField
              control={form.control}
              name="shiftDates"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Select Shift Date(s)
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Click on one or more dates to create shifts. Role, pay rate, hours, and location will be the same for all selected dates.
                  </FormDescription>
                  <div className="rounded-lg border p-4 bg-card">
                    <Calendar
                      mode="multiple"
                      selected={field.value || []}
                      onSelect={(dates) => {
                        field.onChange(dates);
                        // Also update the primary shiftDate to the earliest selected date for form validation
                        if (dates && dates.length > 0) {
                          const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
                          form.setValue('shiftDate', sortedDates[0]);
                        } else {
                          form.setValue('shiftDate', undefined as any);
                        }
                      }}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      numberOfMonths={1}
                      className="rounded-md"
                      classNames={{
                        months: "flex flex-col sm:flex-row gap-4",
                        month: "flex flex-col gap-4",
                        month_caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "flex items-center gap-1",
                        month_grid: "w-full border-collapse",
                        weekdays: "flex",
                        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
                        week: "flex w-full mt-2",
                        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                        day_button: "h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground",
                        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
                        today: "bg-accent text-accent-foreground rounded-md",
                        outside: "text-muted-foreground opacity-50",
                        disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                      }}
                    />

                    {/* Display selected dates as chips */}
                    {field.value && field.value.length > 0 ? (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-primary">
                            ✓ {field.value.length} date{field.value.length > 1 ? 's' : ''} selected
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange([]);
                              form.setValue('shiftDate', undefined as any);
                            }}
                            className="text-xs text-muted-foreground hover:text-destructive"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[...field.value]
                            .sort((a, b) => a.getTime() - b.getTime())
                            .map((date, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full border border-primary/20"
                              >
                                {format(date, "EEE, MMM d")}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newDates = field.value?.filter((d) => d.getTime() !== date.getTime());
                                    field.onChange(newDates);
                                    if (newDates && newDates.length > 0) {
                                      const sortedDates = [...newDates].sort((a, b) => a.getTime() - b.getTime());
                                      form.setValue('shiftDate', sortedDates[0]);
                                    } else {
                                      form.setValue('shiftDate', undefined as any);
                                    }
                                  }}
                                  className="hover:text-destructive transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                          📋 {field.value.length} independent shift{field.value.length > 1 ? 's' : ''} will be created. Professionals can accept any or all dates.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Click on dates above to select them
                        </p>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time and City Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City/Town</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select city/town" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Kenya */}
                        <SelectItem value="Nairobi">🇰🇪 Nairobi</SelectItem>
                        <SelectItem value="Mombasa">🇰🇪 Mombasa</SelectItem>
                        <SelectItem value="Kisumu">🇰🇪 Kisumu</SelectItem>
                        <SelectItem value="Nakuru">🇰🇪 Nakuru</SelectItem>
                        <SelectItem value="Eldoret">🇰🇪 Eldoret</SelectItem>
                        <SelectItem value="Thika">🇰🇪 Thika</SelectItem>
                        <SelectItem value="Malindi">🇰🇪 Malindi</SelectItem>
                        <SelectItem value="Kitale">🇰🇪 Kitale</SelectItem>
                        <SelectItem value="Garissa">🇰🇪 Garissa</SelectItem>
                        <SelectItem value="Nyeri">🇰🇪 Nyeri</SelectItem>
                        <SelectItem value="Machakos">🇰🇪 Machakos</SelectItem>
                        <SelectItem value="Meru">🇰🇪 Meru</SelectItem>
                        <SelectItem value="Lamu">🇰🇪 Lamu</SelectItem>
                        <SelectItem value="Naivasha">🇰🇪 Naivasha</SelectItem>
                        <SelectItem value="Kakamega">🇰🇪 Kakamega</SelectItem>
                        <SelectItem value="Bungoma">🇰🇪 Bungoma</SelectItem>
                        <SelectItem value="Kisii">🇰🇪 Kisii</SelectItem>
                        <SelectItem value="Migori">🇰🇪 Migori</SelectItem>
                        <SelectItem value="Embu">🇰🇪 Embu</SelectItem>
                        <SelectItem value="Kericho">🇰🇪 Kericho</SelectItem>
                        <SelectItem value="Nanyuki">🇰🇪 Nanyuki</SelectItem>
                        {/* Uganda */}
                        <SelectItem value="Kampala">🇺🇬 Kampala</SelectItem>
                        <SelectItem value="Entebbe">🇺🇬 Entebbe</SelectItem>
                        <SelectItem value="Jinja">🇺🇬 Jinja</SelectItem>
                        <SelectItem value="Mbarara">🇺🇬 Mbarara</SelectItem>
                        <SelectItem value="Gulu">🇺🇬 Gulu</SelectItem>
                        <SelectItem value="Lira">🇺🇬 Lira</SelectItem>
                        <SelectItem value="Mbale">🇺🇬 Mbale</SelectItem>
                        <SelectItem value="Masaka">🇺🇬 Masaka</SelectItem>
                        <SelectItem value="Soroti">🇺🇬 Soroti</SelectItem>
                        <SelectItem value="Fort Portal">🇺🇬 Fort Portal</SelectItem>
                        {/* Tanzania */}
                        <SelectItem value="Dar es Salaam">🇹🇿 Dar es Salaam</SelectItem>
                        <SelectItem value="Dodoma">🇹🇿 Dodoma</SelectItem>
                        <SelectItem value="Arusha">🇹🇿 Arusha</SelectItem>
                        <SelectItem value="Mwanza">🇹🇿 Mwanza</SelectItem>
                        <SelectItem value="Zanzibar City">🇹🇿 Zanzibar City</SelectItem>
                        <SelectItem value="Tanga">🇹🇿 Tanga</SelectItem>
                        <SelectItem value="Moshi">🇹🇿 Moshi</SelectItem>
                        <SelectItem value="Morogoro">🇹🇿 Morogoro</SelectItem>
                        <SelectItem value="Mbeya">🇹🇿 Mbeya</SelectItem>
                        <SelectItem value="Tabora">🇹🇿 Tabora</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requirements or notes for the professional..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add any specific requirements or context about this stint.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offered Rate</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 5000" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select value={currency} onValueChange={(v) => setCurrency(v as 'KSh' | 'UGX' | 'TZS')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KSh">🇰🇪 KSh (Kenya)</SelectItem>
                    <SelectItem value="UGX">🇺🇬 UGX (Uganda)</SelectItem>
                    <SelectItem value="TZS">🇹🇿 TZS (Tanzania)</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
              <FormField
                control={form.control}
                name="allowBids"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-8">
                    <div className="space-y-0.5">
                      <FormLabel>Allow Bids?</FormLabel>
                      <FormDescription className="text-xs">
                        Professionals can suggest a different rate.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Moderation Warnings */}
            {moderationWarnings.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This posting has been flagged for the following reasons:
                  <ul className="list-disc list-inside mt-1">
                    {moderationWarnings.map((warning, i) => (
                      <li key={i} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Promo Code Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Promo Code
              </label>
              {appliedPromo ? (
                <div className="flex items-center justify-between p-3 rounded-lg border border-green-500/50 bg-green-500/10">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      "{appliedPromo.name}" applied - {currency} {appliedPromo.creditAmount.toLocaleString()} off!
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemovePromo}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code (e.g., Welcome1000)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className={promoError ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyPromoCode}
                    disabled={isValidatingPromo}
                  >
                    {isValidatingPromo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
              )}
              {promoError && (
                <p className="text-sm text-red-500">{promoError}</p>
              )}
            </div>

            <Card className="bg-secondary/50">
              <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Fee Calculation</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2 pt-0">
                {/* Normal Fee */}
                <div className="flex justify-between items-center">
                  <div>
                    <span>Normal Notice Fee (15%)</span>
                    <p className="text-xs text-muted-foreground">24+ hours advance notice</p>
                  </div>
                  <span className={`font-medium ${promoDiscount > 0 ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {currency} {normalFee.toLocaleString()}
                  </span>
                </div>

                {promoDiscount > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Promo Discount:</span>
                      <span className="font-medium">- {currency} {promoDiscount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-accent font-bold">
                      <span>Your Fee:</span>
                      <span>{currency} {finalFee.toLocaleString()}</span>
                    </div>
                  </>
                )}

                {/* Urgent Fee */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-amber-600 dark:text-amber-500">Urgent Notice Fee (20%)</span>
                    <p className="text-xs text-muted-foreground">Less than 24 hours notice</p>
                  </div>
                  <span className="font-medium text-amber-600 dark:text-amber-500">{currency} {urgentFee.toLocaleString()}</span>
                </div>

                {watchedRate > 0 && (
                  <>
                    <hr className="my-2" />
                    <div className="flex justify-between text-green-600">
                      <span>Professional Receives (~):</span>
                      <span className="font-medium">{currency} {proReceives.toLocaleString()}</span>
                    </div>
                  </>
                )}

                <p className="pt-2 text-xs bg-muted/50 p-2 rounded-md">
                  💡 <strong>Tip:</strong> Post shifts with 24+ hours notice to pay only 15% fee instead of 20%.
                </p>
              </CardContent>
            </Card>

          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Stint"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

