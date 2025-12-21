
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
import { CalendarIcon, PlusCircle, Info, Loader2, AlertTriangle, Tag, Check, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { addStint, getEmployerById } from "@/lib/firebase/firestore";
import { moderateStintPosting, calculateSettlement } from "@/lib/automation-service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProfessionalRole, ShiftType, UrgencyType, FacilityLocation } from "@/lib/types";
import { getActivePromotions, canEmployerUsePromotion, recordPromotionUsage, type Promotion } from "@/lib/firebase/promotions";
import { Timestamp } from "firebase/firestore";

// Time options for the enhanced time picker
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  const hour12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
  const period = i < 12 ? 'AM' : 'PM';
  return { value: hour, label: `${hour12}:00 ${period}` };
});

const MINUTE_OPTIONS = [
  { value: '00', label: '00' },
  { value: '15', label: '15' },
  { value: '30', label: '30' },
  { value: '45', label: '45' },
];

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
  const [timeValidationError, setTimeValidationError] = useState<string | null>(null);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Currency state
  const [currency, setCurrency] = useState<'KSh' | 'UGX' | 'TZS'>('KSh');

  // Employer signup date for promo validation
  const [employerSignupDate, setEmployerSignupDate] = useState<Date>(new Date());

  // Employer location state for location selection
  const [employerLocations, setEmployerLocations] = useState<FacilityLocation[]>([]);
  const [facilityType, setFacilityType] = useState<'single-site' | 'multi-site'>('single-site');

  // Multi-day confirmation state
  const [pendingSubmitData, setPendingSubmitData] = useState<FormData | null>(null);
  const [showMultiDayConfirm, setShowMultiDayConfirm] = useState(false);

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

  // Fetch employer data on mount to get actual signup date and locations
  useEffect(() => {
    const fetchEmployerData = async () => {
      if (employerId && employerId !== 'demo-employer') {
        try {
          const employer = await getEmployerById(employerId);
          if (employer?.createdAt) {
            // Handle Firestore Timestamp or Date
            const signupDate = (employer.createdAt as any).toDate
              ? (employer.createdAt as any).toDate()
              : new Date(employer.createdAt as any);
            setEmployerSignupDate(signupDate);
          }
          // Set employer locations for location selection
          if (employer?.locations && employer.locations.length > 0) {
            setEmployerLocations(employer.locations);
            setFacilityType(employer.facilityType || 'single-site');
            // For single-site, auto-set the city to the first (only) location
            if (employer.facilityType === 'single-site') {
              form.setValue('city', employer.locations[0].town);
            }
          } else if (employer?.city) {
            // Fallback for legacy data without locations array
            setEmployerLocations([{
              id: 'legacy',
              name: 'Main Location',
              streetArea: '',
              town: employer.city,
              country: employer.country || 'Kenya',
              isMainLocation: true,
              createdAt: new Date()
            }]);
            setFacilityType('single-site');
            form.setValue('city', employer.city);
          }
        } catch (error) {
          console.error('Error fetching employer data:', error);
        }
      }
    };
    fetchEmployerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employerId]);

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

  // Handle form submission - check if multi-day confirmation is needed
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    // Validate time before submission
    const hours = calculateHoursDuration(data.startTime, data.endTime);
    const timeValidation = validateTimeForShiftType(data.shiftType, hours);

    if (!timeValidation.valid) {
      toast({
        title: "Invalid Time Range",
        description: timeValidation.message,
        variant: "destructive",
      });
      return;
    }

    // Check if this is a multi-day posting - require confirmation
    const dates = data.shiftDates && data.shiftDates.length > 0 ? data.shiftDates : (data.shiftDate ? [data.shiftDate] : []);
    if (dates.length > 1) {
      // Store the data and show confirmation dialog
      setPendingSubmitData(data);
      setShowMultiDayConfirm(true);
      return;
    }

    // Single day - proceed directly
    await executeSubmit(data);
  };

  // Execute the actual submission (after confirmation if multi-day)
  const executeSubmit = async (data: FormData) => {
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

        // CRITICAL LOG: Track the exact rate being saved per day
        console.log('📊 STINT CREATION DEBUG:', {
          date: shiftDate.toISOString(),
          enteredRate: data.rate,
          totalDays: dates.length,
          savingOfferedRate: data.rate, // This should be the per-day rate, NOT multiplied
          isMultiDay: dates.length > 1,
        });

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
          offeredRate: data.rate, // IMPORTANT: This is the per-day rate entered by user
          currency: currency,
          allowBids: data.allowBids,
          urgency,
          // Multi-day stint fields
          isMultiDay: dates.length > 1,
          dateRangeId,
        });
        createdStintIds.push(stintId);
      }

      // Record promo usage to prevent reuse
      if (appliedPromo && appliedPromo.id && createdStintIds.length > 0) {
        try {
          console.log('Recording promo usage:', { promotionId: appliedPromo.id, employerId, stintId: createdStintIds[0] });
          await recordPromotionUsage({
            promotionId: appliedPromo.id,
            employerId: employerId,
            stintId: createdStintIds[0], // Record usage for the first stint
            usedAt: Timestamp.now(),
            creditApplied: appliedPromo.creditAmount,
          });
          console.log('Promo usage recorded successfully');
        } catch (promoError) {
          console.error('Error recording promo usage:', promoError);
          // Don't fail the stint creation if promo recording fails
        }
      }

      // Show success toast
      if (dates.length > 1) {
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

      // Clear promo after successful use
      setAppliedPromo(null);
      setPromoCode('');
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

  // Calculate fees for multi-day shifts with proper 15%/20% split
  const calculatedFees = (rate: number, dates: Date[] = []) => {
    const promoDiscount = appliedPromo?.creditAmount || 0;
    const now = Date.now();
    const HOURS_24 = 24 * 60 * 60 * 1000;

    // If no dates selected yet, show single-day estimates
    if (!dates || dates.length === 0) {
      const normalFeePerDay = Math.round(rate * 0.15);
      const urgentFeePerDay = Math.round(rate * 0.20);
      return {
        normalDays: 0,
        urgentDays: 0,
        normalFeePerDay,
        urgentFeePerDay,
        normalFeeTotal: 0,
        urgentFeeTotal: 0,
        totalDailyRate: 0,
        totalFee: 0,
        totalCost: 0,
        promoDiscount,
        finalTotalCost: 0,
      };
    }

    // Calculate how many days are urgent vs normal
    let normalDays = 0;
    let urgentDays = 0;
    dates.forEach(date => {
      const hoursUntil = date.getTime() - now;
      if (hoursUntil < HOURS_24) {
        urgentDays++;
      } else {
        normalDays++;
      }
    });

    const normalFeePerDay = Math.round(rate * 0.15);
    const urgentFeePerDay = Math.round(rate * 0.20);
    const normalFeeTotal = normalDays * normalFeePerDay;
    const urgentFeeTotal = urgentDays * urgentFeePerDay;
    const totalFee = normalFeeTotal + urgentFeeTotal;
    const totalDailyRate = dates.length * rate;
    const totalCost = totalDailyRate + totalFee;
    const finalTotalCost = Math.max(0, totalCost - promoDiscount);

    return {
      normalDays,
      urgentDays,
      normalFeePerDay,
      urgentFeePerDay,
      normalFeeTotal,
      urgentFeeTotal,
      totalDailyRate,
      totalFee,
      totalCost,
      promoDiscount,
      finalTotalCost,
    };
  };

  const watchedRate = form.watch('rate');
  const watchedDates = form.watch('shiftDates') || [];
  const watchedStartTime = form.watch('startTime');
  const watchedEndTime = form.watch('endTime');
  const watchedShiftType = form.watch('shiftType');
  const feeCalc = calculatedFees(watchedRate, watchedDates);

  // Calculate hours between start and end time
  const calculateHoursDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle overnight shifts
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    return (endMinutes - startMinutes) / 60;
  };

  // Validate time against shift type
  const validateTimeForShiftType = (shiftType: string, hours: number): { valid: boolean; message: string | null } => {
    if (!shiftType) return { valid: true, message: null };

    if (shiftType === 'Half-day') {
      if (hours > 6) {
        return {
          valid: false,
          message: `Half-day shift should be 4-6 hours. You selected ${hours.toFixed(1)} hours. Please reduce the time range or select Full-day shift type.`
        };
      }
      if (hours < 4) {
        return {
          valid: false,
          message: `Half-day shift should be at least 4 hours. You selected ${hours.toFixed(1)} hours. Please increase the time range.`
        };
      }
    } else if (shiftType === 'Full-day') {
      if (hours < 8) {
        return {
          valid: false,
          message: `Full-day shift should be 8-12 hours. You selected ${hours.toFixed(1)} hours. Please increase the time range or select Half-day shift type.`
        };
      }
      if (hours > 12) {
        return {
          valid: false,
          message: `Full-day shift should not exceed 12 hours. You selected ${hours.toFixed(1)} hours. Please reduce the time range.`
        };
      }
    }

    return { valid: true, message: null };
  };

  // Watch for time and shift type changes to validate
  useEffect(() => {
    const hours = calculateHoursDuration(watchedStartTime, watchedEndTime);
    const validation = validateTimeForShiftType(watchedShiftType, hours);
    setTimeValidationError(validation.message);
  }, [watchedStartTime, watchedEndTime, watchedShiftType]);

  // Calculate display hours for current selection
  const currentHours = calculateHoursDuration(watchedStartTime, watchedEndTime);


  return (
    <>
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

              {/* Time Selection - Enhanced UI */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => {
                    const [hour, minute] = (field.value || '08:00').split(':');
                    return (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <div className="flex gap-2">
                          <Select
                            value={hour}
                            onValueChange={(newHour) => {
                              field.onChange(`${newHour}:${minute}`);
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Hour" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[280px]">
                              {HOUR_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={minute}
                            onValueChange={(newMin) => {
                              field.onChange(`${hour}:${newMin}`);
                            }}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                            <SelectContent>
                              {MINUTE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  :{opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => {
                    const [hour, minute] = (field.value || '17:00').split(':');
                    return (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <div className="flex gap-2">
                          <Select
                            value={hour}
                            onValueChange={(newHour) => {
                              field.onChange(`${newHour}:${minute}`);
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Hour" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[280px]">
                              {HOUR_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={minute}
                            onValueChange={(newMin) => {
                              field.onChange(`${hour}:${newMin}`);
                            }}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                            <SelectContent>
                              {MINUTE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  :{opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              {/* Time Duration Display & Validation Alert */}
              {watchedShiftType && watchedStartTime && watchedEndTime && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Shift duration: <strong className="text-foreground">{currentHours.toFixed(1)} hours</strong>
                      {watchedShiftType === 'Half-day' && ' (expected: 4-6 hours)'}
                      {watchedShiftType === 'Full-day' && ' (expected: 8-12 hours)'}
                    </span>
                  </div>
                  {timeValidationError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {timeValidationError}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* City/Town Field */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {facilityType === 'single-site' ? 'Location' : 'Select Location'}
                    </FormLabel>
                    {facilityType === 'single-site' && employerLocations.length > 0 ? (
                      // Single-site: Show locked location (no dropdown)
                      <>
                        <FormControl>
                          <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50">
                            <span className="text-sm">
                              📍 {employerLocations[0]?.name} - {employerLocations[0]?.town}
                            </span>
                          </div>
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Location is locked to your facility profile
                        </p>
                      </>
                    ) : employerLocations.length > 0 ? (
                      // Multi-site: Show dropdown with employer's locations only
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employerLocations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.town}>
                              📍 {loc.name} - {loc.town}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      // Fallback: No locations loaded yet
                      <FormControl>
                        <Input placeholder="Loading location..." disabled />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <FormLabel>
                        Offered Rate{watchedDates.length > 1 ? ' (per day)' : ''}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 5000" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                      </FormControl>
                      {watchedDates.length > 1 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ℹ️ This rate applies to EACH of the {watchedDates.length} selected days independently.
                        </p>
                      )}
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
                  {/* Daily Rate Info */}
                  <div className="flex justify-between items-center">
                    <span>Daily Rate (per shift)</span>
                    <span className="font-medium text-foreground">{currency} {watchedRate.toLocaleString()}</span>
                  </div>

                  {/* Show date breakdown if dates are selected */}
                  {watchedDates.length > 0 && (
                    <>
                      <hr className="my-2" />

                      {/* CRITICAL: Multi-day alert to prevent confusion */}
                      {watchedDates.length > 1 && (
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 my-3">
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            ⚠️ Multi-Day Posting: You are creating {watchedDates.length} independent shifts
                          </p>
                          <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                            Each professional will be paid <strong>{currency} {watchedRate.toLocaleString()} per day</strong> they work.
                            If a professional accepts only 1 day, they receive {currency} {watchedRate.toLocaleString()}, not the total.
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span>Total Days Selected</span>
                        <span className="font-medium text-foreground">{watchedDates.length} day{watchedDates.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Subtotal (rates)</span>
                        <span className="font-medium text-foreground">{currency} {feeCalc.totalDailyRate.toLocaleString()}</span>
                      </div>
                      <hr className="my-2" />

                      {/* Fee breakdown by urgency */}
                      {feeCalc.normalDays > 0 && (
                        <div className="flex justify-between items-center">
                          <div>
                            <span>Normal Fee (15%)</span>
                            <p className="text-xs text-muted-foreground">{feeCalc.normalDays} day{feeCalc.normalDays > 1 ? 's' : ''} with 24+ hours notice</p>
                          </div>
                          <span className="font-medium">{currency} {feeCalc.normalFeeTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {feeCalc.urgentDays > 0 && (
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-amber-600 dark:text-amber-500">Urgent Fee (20%)</span>
                            <p className="text-xs text-muted-foreground">{feeCalc.urgentDays} day{feeCalc.urgentDays > 1 ? 's' : ''} with &lt;24 hours notice</p>
                          </div>
                          <span className="font-medium text-amber-600 dark:text-amber-500">{currency} {feeCalc.urgentFeeTotal.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Promo discount */}
                      {feeCalc.promoDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Promo Discount:</span>
                          <span className="font-medium">- {currency} {feeCalc.promoDiscount.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Total employer pays */}
                      <hr className="my-2" />
                      <div className="flex justify-between font-bold text-lg pt-2">
                        <span className="text-foreground">Total You Pay:</span>
                        <span className="text-green-500 dark:text-green-400 text-xl">{currency} {feeCalc.finalTotalCost.toLocaleString()}</span>
                      </div>
                    </>
                  )}

                  {/* If no dates selected yet, show per-day fee estimates */}
                  {watchedDates.length === 0 && watchedRate > 0 && (
                    <>
                      <hr className="my-2" />
                      <p className="text-xs text-muted-foreground italic">Select dates above to see total cost breakdown</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <span>Normal Fee (15%)</span>
                          <p className="text-xs text-muted-foreground">24+ hours advance notice</p>
                        </div>
                        <span className="font-medium">{currency} {feeCalc.normalFeePerDay.toLocaleString()} / day</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-amber-600 dark:text-amber-500">Urgent Fee (20%)</span>
                          <p className="text-xs text-muted-foreground">Less than 24 hours notice</p>
                        </div>
                        <span className="font-medium text-amber-600 dark:text-amber-500">{currency} {feeCalc.urgentFeePerDay.toLocaleString()} / day</span>
                      </div>
                    </>
                  )}
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
      </Card >

      {/* Multi-Day Confirmation Dialog */}
      <Dialog open={showMultiDayConfirm} onOpenChange={setShowMultiDayConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Multi-Day Posting
            </DialogTitle>
            <DialogDescription>
              Please verify the per-day rate before posting.
            </DialogDescription>
          </DialogHeader>

          {pendingSubmitData && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  You are about to create <strong>{pendingSubmitData?.shiftDates?.length ?? 0} independent shifts</strong>
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate per day:</span>
                    <span className="font-bold text-lg">{currency} {(pendingSubmitData?.rate ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Number of days:</span>
                    <span className="font-medium">{pendingSubmitData?.shiftDates?.length ?? 1} days</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total if all days filled:</span>
                    <span className="font-medium">{currency} {((pendingSubmitData?.shiftDates?.length ?? 1) * (pendingSubmitData?.rate ?? 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
                <p className="text-blue-700 dark:text-blue-400">
                  <strong>Important:</strong> If a professional applies for only 1 day, they will be paid <strong>{currency} {(pendingSubmitData?.rate ?? 0).toLocaleString()}</strong> for that single day - not the total amount.
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                Is <strong>{currency} {(pendingSubmitData?.rate ?? 0).toLocaleString()} per day</strong> the correct rate?
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowMultiDayConfirm(false);
                setPendingSubmitData(null);
              }}
            >
              Go Back & Edit
            </Button>
            <Button
              onClick={() => {
                setShowMultiDayConfirm(false);
                if (pendingSubmitData) {
                  executeSubmit(pendingSubmitData);
                }
                setPendingSubmitData(null);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="mr-2 h-4 w-4" />
              Yes, Post Stints
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

