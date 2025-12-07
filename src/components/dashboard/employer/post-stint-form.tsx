
"use client";

import { useState } from "react";
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
import { CalendarIcon, PlusCircle, Info, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { addStint } from "@/lib/firebase/firestore";
import { moderateStintPosting, calculateSettlement } from "@/lib/automation-service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ProfessionalRole, ShiftType, UrgencyType } from "@/lib/types";

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

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);
    setModerationWarnings([]);

    try {
      const role = ROLE_MAP[data.profession] || "other";
      const shiftType: ShiftType = data.shiftType === "Half-day" ? "half-day" : "full-day";

      // Calculate if this is urgent (less than 48 hours notice)
      const hoursUntilShift = (data.shiftDate.getTime() - Date.now()) / (1000 * 60 * 60);
      const urgency: UrgencyType = hoursUntilShift < 48 ? "urgent" : "normal";

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

      // Save to Firestore
      const stintId = await addStint({
        employerId,
        employerName,
        role,
        shiftType,
        shiftDate: data.shiftDate,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
        city: data.city,
        offeredRate: data.rate,
        currency: "KES",
        allowBids: data.allowBids,
        urgency,
      });

      toast({
        title: "Stint Posted Successfully!",
        description: `Your ${data.profession} stint for ${format(data.shiftDate, "PPP")} has been posted. ID: ${stintId.slice(0, 8)}...`,
      });

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
    return {
      normalFee: settlement.bookingFee,
      urgentFee: urgentSettlement.bookingFee,
      clinicPays: settlement.clinicCharge,
      proReceives: settlement.professionalNet,
    };
  };

  const watchedRate = form.watch('rate');
  const { urgentFee, normalFee, clinicPays, proReceives } = calculatedFees(watchedRate);


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
            <FormField
              control={form.control}
              name="shiftDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Shift Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                    <FormLabel>City</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Nairobi">Nairobi</SelectItem>
                        <SelectItem value="Mombasa">Mombasa</SelectItem>
                        <SelectItem value="Kisumu">Kisumu</SelectItem>
                        <SelectItem value="Nakuru">Nakuru</SelectItem>
                        <SelectItem value="Eldoret">Eldoret</SelectItem>
                        <SelectItem value="Thika">Thika</SelectItem>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offered Rate (KSh)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 5000" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

            <Card className="bg-secondary/50">
              <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Fee Calculation</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1 pt-0">
                <div className="flex justify-between">
                  <span>Normal Notice Fee (15%):</span>
                  <span className="font-medium text-foreground">KSh {normalFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Urgent Notice Fee (20%):</span>
                  <span className="font-medium text-foreground">KSh {urgentFee.toLocaleString()}</span>
                </div>
                {watchedRate > 0 && (
                  <>
                    <hr className="my-2" />
                    <div className="flex justify-between text-green-600">
                      <span>Professional Receives (~):</span>
                      <span className="font-medium">KSh {proReceives.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <p className="pt-2 text-xs">The final fee is determined by how far in advance the stint is booked.</p>
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

