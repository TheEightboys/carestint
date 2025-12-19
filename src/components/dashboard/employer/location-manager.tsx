"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { MapPin, Plus, Building2, Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FacilityLocation, FacilityType } from '@/lib/types';
import { doc, updateDoc, arrayUnion, serverTimestamp, getFirestore } from 'firebase/firestore';

interface LocationManagerProps {
    employerId: string;
    facilityType: FacilityType;
    locations: FacilityLocation[];
    onLocationsUpdate?: (locations: FacilityLocation[]) => void;
}

export function LocationManager({
    employerId,
    facilityType,
    locations = [],
    onLocationsUpdate
}: LocationManagerProps) {
    const { toast } = useToast();
    const [isAddingLocation, setIsAddingLocation] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // New location form state
    const [newLocation, setNewLocation] = useState({
        name: '',
        streetArea: '',
        town: '',
        country: 'Kenya'
    });

    const handleAddLocation = async () => {
        if (!newLocation.name || !newLocation.streetArea || !newLocation.town) {
            toast({
                variant: 'destructive',
                title: 'Missing fields',
                description: 'Please fill in all location details.',
            });
            return;
        }

        setIsAddingLocation(true);

        try {
            const firestore = getFirestore();
            const locationId = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const newLocationData: FacilityLocation = {
                id: locationId,
                name: newLocation.name,
                streetArea: newLocation.streetArea,
                town: newLocation.town,
                country: newLocation.country,
                isMainLocation: false,
                createdAt: new Date(),
            };

            // Update employer document with new location
            const employerRef = doc(firestore, 'employers', employerId);
            await updateDoc(employerRef, {
                locations: arrayUnion(newLocationData),
                updatedAt: serverTimestamp(),
            });

            // Update local state
            const updatedLocations = [...locations, newLocationData];
            onLocationsUpdate?.(updatedLocations);

            toast({
                title: 'Location added!',
                description: `${newLocation.name} has been added to your facility.`,
            });

            // Reset form and close dialog
            setNewLocation({ name: '', streetArea: '', town: '', country: 'Kenya' });
            setIsOpen(false);
        } catch (error) {
            console.error('Error adding location:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to add location. Please try again.',
            });
        } finally {
            setIsAddingLocation(false);
        }
    };

    // Single-site facilities can't add more locations
    if (facilityType === 'single-site') {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Location
                    </CardTitle>
                    <CardDescription>Your facility location</CardDescription>
                </CardHeader>
                <CardContent>
                    {locations.length > 0 ? (
                        <div className="p-4 rounded-lg bg-muted/50 border">
                            <div className="flex items-start gap-3">
                                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        {locations[0].name}
                                        <Badge variant="secondary" className="text-xs">Main</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{locations[0].streetArea}</p>
                                    <p className="text-sm text-muted-foreground">{locations[0].town}, {locations[0].country}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No location data available.</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                        Single-site facilities cannot add additional locations. Contact support to upgrade to multi-site.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Multi-site location manager
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Locations
                        </CardTitle>
                        <CardDescription>Manage your facility locations</CardDescription>
                    </div>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-1">
                                <Plus className="h-4 w-4" />
                                Add Location
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Location</DialogTitle>
                                <DialogDescription>
                                    Add another branch or location for your facility.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="loc-name">Location Name</Label>
                                    <Input
                                        id="loc-name"
                                        placeholder="e.g., Westlands Branch"
                                        value={newLocation.name}
                                        onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="loc-street">Street / Area / Landmark</Label>
                                    <Input
                                        id="loc-street"
                                        placeholder="e.g., Opposite Mall, Junction Road"
                                        value={newLocation.streetArea}
                                        onChange={(e) => setNewLocation(prev => ({ ...prev, streetArea: e.target.value }))}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="loc-town">Town / City</Label>
                                        <Input
                                            id="loc-town"
                                            placeholder="e.g., Nairobi"
                                            value={newLocation.town}
                                            onChange={(e) => setNewLocation(prev => ({ ...prev, town: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="loc-country">Country</Label>
                                        <Select
                                            value={newLocation.country}
                                            onValueChange={(value) => setNewLocation(prev => ({ ...prev, country: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                                                <SelectItem value="Uganda">🇺🇬 Uganda</SelectItem>
                                                <SelectItem value="Tanzania">🇹🇿 Tanzania</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button onClick={handleAddLocation} disabled={isAddingLocation}>
                                    {isAddingLocation ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Location'
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {locations.map((location) => (
                    <div
                        key={location.id}
                        className="p-4 rounded-lg bg-muted/50 border hover:border-accent/50 transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                                <div className="font-medium flex items-center gap-2">
                                    {location.name}
                                    {location.isMainLocation && (
                                        <Badge variant="secondary" className="text-xs gap-1">
                                            <Star className="h-3 w-3" />
                                            Main
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">{location.streetArea}</p>
                                <p className="text-sm text-muted-foreground">{location.town}, {location.country}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {locations.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No locations added yet. Click "Add Location" to get started.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
