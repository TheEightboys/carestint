"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, MapPin, Clock, Briefcase, FileText, Loader2,
  RefreshCw, DollarSign, AlertCircle, CheckCircle, Filter,
  SlidersHorizontal, X, Eye, Navigation, MapPinOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getOpenStints, addStintApplication, getApplicationsByProfessional } from "@/lib/firebase/firestore";
import {
  getCurrentLocation,
  getCityCoordinates,
  calculateDistance,
  formatDistance,
  DISTANCE_THRESHOLDS,
  type Coordinates
} from "@/lib/geocoding";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

interface AvailableStintsProps {
  professionalId?: string;
  professionalName?: string;
  professionalRole?: string;
}

interface Filters {
  minRate: number;
  shiftType: 'all' | 'full-day' | 'half-day';
  profession: string;
  city: string;
  distance: 'any' | 'near' | '20km' | '50km';
}

const PROFESSIONS = [
  { value: 'all', label: 'All Professions' },
  { value: 'rn', label: 'Registered Nurse' },
  { value: 'clinical-officer', label: 'Clinical Officer' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'lab-technician', label: 'Lab Technician' },
  { value: 'dentist', label: 'Dentist' },
  { value: 'physiotherapist', label: 'Physiotherapist' },
  { value: 'radiographer', label: 'Radiographer' },
];

// Comprehensive list of East African cities and towns
const CITIES = [
  'All Cities',
  // Kenya - Major Cities
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Eldoret',
  'Nakuru',
  'Thika',
  // Kenya - Other Towns
  'Malindi',
  'Nyeri',
  'Machakos',
  'Kisii',
  'Kitale',
  'Naivasha',
  'Nanyuki',
  'Garissa',
  'Kakamega',
  'Meru',
  'Kericho',
  'Embu',
  'Migori',
  'Bungoma',
  'Kiambu',
  'Ruiru',
  // Uganda
  'Kampala',
  'Entebbe',
  'Jinja',
  'Mbarara',
  'Gulu',
  // Tanzania
  'Dar es Salaam',
  'Arusha',
  'Mwanza',
  'Dodoma',
  'Zanzibar',
  // Rwanda
  'Kigali',
  'Butare',
  // Other
  'Other',
];

const DISTANCE_OPTIONS = [
  { value: 'any', label: 'Any Distance' },
  { value: 'near', label: 'Near Me (< 10km)' },
  { value: '20km', label: 'Within 20km' },
  { value: '50km', label: 'Within 50km' },
];

export function AvailableStints({
  professionalId = "demo-professional",
  professionalName = "Demo User",
  professionalRole = "rn"
}: AvailableStintsProps) {
  const { toast } = useToast();
  const [stints, setStints] = useState<any[]>([]);
  const [appliedStintIds, setAppliedStintIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [bidAmount, setBidAmount] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState<Filters>({
    minRate: 0,
    shiftType: 'all',
    profession: 'all',
    city: 'All Cities',
    distance: 'any',
  });
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // GPS Location state
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [stintsWithDistance, setStintsWithDistance] = useState<any[]>([]);

  const loadStints = async () => {
    setIsLoading(true);
    try {
      const openStints = await getOpenStints();
      setStints(openStints);

      if (professionalId && professionalId !== 'demo-professional') {
        const applications = await getApplicationsByProfessional(professionalId);
        const appliedIds = new Set<string>(
          applications.map((app: any) => app.stintId)
        );
        setAppliedStintIds(appliedIds);
      }
    } catch (error) {
      console.error("Error loading stints:", error);
      toast({
        title: "Error",
        description: "Failed to load available stints",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's GPS location
  const fetchUserLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);

    const location = await getCurrentLocation();

    if (location) {
      setUserLocation(location);
      toast({
        title: "Location updated",
        description: "Stints will now show distances from your location",
      });
    } else {
      setLocationError("Unable to get your location. Please enable location services.");
      toast({
        title: "Location unavailable",
        description: "Enable location services to see distance-based filtering",
        variant: "destructive",
      });
    }

    setIsLocating(false);
  }, [toast]);

  useEffect(() => {
    loadStints();
  }, [professionalId]);

  // Calculate distances when stints or user location changes
  useEffect(() => {
    if (!stints.length) {
      setStintsWithDistance([]);
      return;
    }

    const stintsWithDist = stints.map(stint => {
      if (!userLocation) {
        return { ...stint, distance: null };
      }

      const stintCoords = getCityCoordinates(stint.city);
      if (!stintCoords) {
        return { ...stint, distance: null };
      }

      const distance = calculateDistance(userLocation, stintCoords);
      return { ...stint, distance };
    });

    // Sort by distance if user location is available
    if (userLocation) {
      stintsWithDist.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    setStintsWithDistance(stintsWithDist);
  }, [stints, userLocation]);

  // Update active filter count
  useEffect(() => {
    let count = 0;
    if (filters.minRate > 0) count++;
    if (filters.shiftType !== 'all') count++;
    if (filters.profession !== 'all') count++;
    if (filters.city !== 'All Cities') count++;
    if (filters.distance !== 'any') count++;
    setActiveFilterCount(count);
  }, [filters]);

  const handleApply = async (stint: any, isBid: boolean = false) => {
    setApplyingTo(stint.id);
    try {
      await addStintApplication({
        stintId: stint.id,
        professionalId,
        professionalName,
        professionalRole: professionalRole as any,
        isBid,
        bidAmount: isBid ? bidAmount || undefined : undefined,
        message: applicationMessage || undefined,
      });

      toast({
        title: isBid ? "Bid Submitted!" : "Application Submitted!",
        description: `Your ${isBid ? 'bid' : 'application'} for ${stint.role} at ${stint.employerName} has been sent.`,
      });

      setAppliedStintIds(prev => new Set([...prev, stint.id]));
      setDialogOpen(null);
      setApplicationMessage("");
      setBidAmount(null);
    } catch (error) {
      console.error("Error applying to stint:", error);
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setApplyingTo(null);
    }
  };

  const clearFilters = () => {
    setFilters({
      minRate: 0,
      shiftType: 'all',
      profession: 'all',
      city: 'All Cities',
      distance: 'any',
    });
  };

  // Use stintsWithDistance if available, otherwise use stints
  const baseStints = stintsWithDistance.length > 0 ? stintsWithDistance : stints;

  const filteredStints = baseStints.filter((stint) => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        stint.role?.toLowerCase().includes(query) ||
        stint.city?.toLowerCase().includes(query) ||
        stint.employerName?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Min rate filter
    if (filters.minRate > 0 && (stint.offeredRate || 0) < filters.minRate) {
      return false;
    }

    // Shift type filter
    if (filters.shiftType !== 'all' && stint.shiftType !== filters.shiftType) {
      return false;
    }

    // Profession filter
    if (filters.profession !== 'all' && stint.role !== filters.profession) {
      return false;
    }

    // City filter
    if (filters.city !== 'All Cities' && stint.city !== filters.city) {
      return false;
    }

    // Distance filter (only apply if user location is available)
    if (filters.distance !== 'any' && userLocation) {
      const maxDistance = DISTANCE_THRESHOLDS[filters.distance as keyof typeof DISTANCE_THRESHOLDS];
      if (stint.distance !== null && stint.distance > maxDistance) {
        return false;
      }
    }

    return true;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "TBD";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const hasApplied = (stintId: string) => appliedStintIds.has(stintId);

  const getStintDetails = (stintId: string) => stints.find(s => s.id === stintId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Find a Stint
            <Button variant="outline" size="sm" onClick={loadStints} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Search for available stints in your area that match your skills.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Status Banner */}
          {userLocation ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <Navigation className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-700 dark:text-green-400">
                Location active - showing distances from your position
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs"
                onClick={fetchUserLocation}
                disabled={isLocating}
              >
                {isLocating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Update'}
              </Button>
            </div>
          ) : locationError ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <MapPinOff className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{locationError}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs"
                onClick={fetchUserLocation}
                disabled={isLocating}
              >
                Try Again
              </Button>
            </div>
          ) : null}

          {/* Search and Filters Row */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by role, city, or facility name..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Get My Location Button */}
            <Button
              variant={userLocation ? "secondary" : "outline"}
              onClick={fetchUserLocation}
              disabled={isLocating}
              className="shrink-0"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : userLocation ? (
                <Navigation className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              {userLocation ? 'Located' : 'My Location'}
            </Button>
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filter Stints
                  </SheetTitle>
                  <SheetDescription>
                    Narrow down stints based on your preferences.
                  </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                  {/* Min Rate Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Minimum Rate: KES {filters.minRate.toLocaleString()}
                    </Label>
                    <Slider
                      value={[filters.minRate]}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, minRate: value[0] }))}
                      max={20000}
                      step={500}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>KES 0</span>
                      <span>KES 20,000</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Shift Type Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Shift Type</Label>
                    <Select
                      value={filters.shiftType}
                      onValueChange={(value: any) => setFilters(prev => ({ ...prev, shiftType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="full-day">Full Day</SelectItem>
                        <SelectItem value="half-day">Half Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Profession Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Profession</Label>
                    <Select
                      value={filters.profession}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, profession: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select profession" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROFESSIONS.map(prof => (
                          <SelectItem key={prof.value} value={prof.value}>
                            {prof.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* City Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">City / Town</Label>
                    <Select
                      value={filters.city}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map(city => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Distance Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Distance Preference</Label>
                    <Select
                      value={filters.distance}
                      onValueChange={(value: any) => setFilters(prev => ({ ...prev, distance: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select distance" />
                      </SelectTrigger>
                      <SelectContent>
                        {DISTANCE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Note: Distance filtering requires location services to be fully functional.
                    </p>
                  </div>
                </div>

                <SheetFooter className="flex gap-2">
                  <Button variant="outline" onClick={clearFilters} className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                  <Button onClick={() => setFiltersOpen(false)} className="flex-1">
                    Apply Filters
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.minRate > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Min: KES {filters.minRate.toLocaleString()}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters(prev => ({ ...prev, minRate: 0 }))}
                  />
                </Badge>
              )}
              {filters.shiftType !== 'all' && (
                <Badge variant="secondary" className="gap-1 capitalize">
                  {filters.shiftType.replace('-', ' ')}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters(prev => ({ ...prev, shiftType: 'all' }))}
                  />
                </Badge>
              )}
              {filters.profession !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {PROFESSIONS.find(p => p.value === filters.profession)?.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters(prev => ({ ...prev, profession: 'all' }))}
                  />
                </Badge>
              )}
              {filters.city !== 'All Cities' && (
                <Badge variant="secondary" className="gap-1">
                  {filters.city}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters(prev => ({ ...prev, city: 'All Cities' }))}
                  />
                </Badge>
              )}
              {filters.distance !== 'any' && (
                <Badge variant="secondary" className="gap-1">
                  {DISTANCE_OPTIONS.find(d => d.value === filters.distance)?.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters(prev => ({ ...prev, distance: 'any' }))}
                  />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredStints.length} of {stints.length} available stints
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStints.map((stint) => (
              <Card key={stint.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="font-headline text-lg capitalize">
                      {stint.role?.replace('-', ' ') || 'Healthcare Role'}
                    </CardTitle>
                    {stint.urgency === 'urgent' && (
                      <Badge variant="destructive" className="text-xs">Urgent</Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-2 pt-1">
                    <Briefcase className="h-4 w-4" /> {stint.employerName || 'Healthcare Facility'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm flex-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{stint.city || 'Location TBD'}</span>
                    {stint.distance !== null && stint.distance !== undefined && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${stint.distance < 10 ? 'border-green-500 text-green-600' :
                            stint.distance < 30 ? 'border-yellow-500 text-yellow-600' :
                              'border-muted-foreground'
                          }`}
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        {formatDistance(stint.distance)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {stint.shiftType?.replace('-', ' ')} • {formatDate(stint.shiftDate)}
                      {stint.startTime && ` • ${stint.startTime}-${stint.endTime}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-semibold text-accent">
                      KES {stint.offeredRate?.toLocaleString() || 0}
                    </span>
                    <Badge variant="outline" className="capitalize">{stint.shiftType || 'shift'}</Badge>
                  </div>
                  {stint.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{stint.description}</p>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2 pt-0">
                  {/* View Details Button */}
                  <Dialog open={detailsOpen === stint.id} onOpenChange={(open) => setDetailsOpen(open ? stint.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="capitalize">
                          {stint.role?.replace('-', ' ')} at {stint.employerName}
                        </DialogTitle>
                        <DialogDescription>
                          Full stint details and requirements
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="font-medium flex items-center gap-1">
                              <MapPin className="h-4 w-4" /> {stint.city}
                            </p>
                            {stint.address && <p className="text-sm text-muted-foreground">{stint.address}</p>}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Date & Time</p>
                            <p className="font-medium">{formatDate(stint.shiftDate)}</p>
                            <p className="text-sm text-muted-foreground">{stint.startTime} - {stint.endTime}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Rate</p>
                            <p className="font-medium text-green-600">KES {stint.offeredRate?.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground capitalize">{stint.shiftType?.replace('-', ' ')}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant={stint.urgency === 'urgent' ? 'destructive' : 'secondary'} className="capitalize">
                              {stint.urgency || 'Normal'}
                            </Badge>
                          </div>
                        </div>
                        {stint.description && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Description</p>
                            <p className="text-sm">{stint.description}</p>
                          </div>
                        )}
                        <Separator />
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">About the Employer</p>
                          <p className="font-medium">{stint.employerName}</p>
                        </div>
                      </div>
                      <DialogFooter>
                        {hasApplied(stint.id) ? (
                          <Button variant="secondary" disabled className="w-full">
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            Already Applied
                          </Button>
                        ) : (
                          <Button
                            onClick={() => {
                              setDetailsOpen(null);
                              setDialogOpen(stint.id);
                            }}
                            className="w-full"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Apply for this Stint
                          </Button>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {hasApplied(stint.id) ? (
                    <Button className="flex-1" variant="secondary" disabled>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Applied
                    </Button>
                  ) : (
                    <Dialog open={dialogOpen === stint.id} onOpenChange={(open) => setDialogOpen(open ? stint.id : null)}>
                      <DialogTrigger asChild>
                        <Button className="flex-1">
                          <FileText className="mr-2 h-4 w-4" />
                          Apply Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Apply for {stint.role?.replace('-', ' ')}</DialogTitle>
                          <DialogDescription>
                            Submit your application to {stint.employerName}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Message (Optional)</Label>
                            <Textarea
                              placeholder="Add a message to the employer..."
                              value={applicationMessage}
                              onChange={(e) => setApplicationMessage(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => handleApply(stint, false)}
                            disabled={applyingTo === stint.id}
                          >
                            {applyingTo === stint.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Application'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {stint.allowBids && !hasApplied(stint.id) && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="sm">
                          Bid
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Make a Bid</DialogTitle>
                          <DialogDescription>
                            Suggest a different rate for this stint
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Your Bid (KES)</Label>
                            <Input
                              type="number"
                              placeholder={`Current: KES ${stint.offeredRate}`}
                              value={bidAmount || ''}
                              onChange={(e) => setBidAmount(parseInt(e.target.value) || null)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Message (Optional)</Label>
                            <Textarea
                              placeholder="Explain why you're worth this rate..."
                              value={applicationMessage}
                              onChange={(e) => setApplicationMessage(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => handleApply(stint, true)}
                            disabled={applyingTo === stint.id}
                          >
                            {applyingTo === stint.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Bid'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {filteredStints.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 text-center p-12">
              <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No stints match your criteria.</p>
              <p className="text-sm text-muted-foreground/80">Try adjusting your filters or check back later.</p>
              <div className="flex gap-2 mt-4">
                {activeFilterCount > 0 && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
                <Button variant="outline" onClick={loadStints}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
