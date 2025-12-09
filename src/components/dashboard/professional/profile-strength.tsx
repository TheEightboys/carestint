"use client";

import { useState, useEffect } from 'react';
import {
    User,
    FileCheck,
    MapPin,
    Clock,
    Star,
    Shield,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProfileItem {
    id: string;
    label: string;
    completed: boolean;
    icon: React.ReactNode;
    action?: string;
    href?: string;
}

interface ProfileStrengthProps {
    professionalId: string;
    profileData?: {
        hasProfilePhoto: boolean;
        hasLicense: boolean;
        hasIdVerified: boolean;
        hasPreferredLocations: boolean;
        hasAvailability: boolean;
        hasExperience: boolean;
        hasBio: boolean;
        rating?: number;
        completedStints?: number;
    };
    onActionClick?: (action: string) => void;
}

export function ProfileStrength({ professionalId, profileData, onActionClick }: ProfileStrengthProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Default profile data
    const data = profileData || {
        hasProfilePhoto: false,
        hasLicense: false,
        hasIdVerified: false,
        hasPreferredLocations: false,
        hasAvailability: false,
        hasExperience: false,
        hasBio: false,
        rating: 0,
        completedStints: 0,
    };

    const profileItems: ProfileItem[] = [
        {
            id: 'photo',
            label: 'Add profile photo',
            completed: data.hasProfilePhoto,
            icon: <User className="h-4 w-4" />,
            action: 'upload_photo',
        },
        {
            id: 'license',
            label: 'Upload license document',
            completed: data.hasLicense,
            icon: <FileCheck className="h-4 w-4" />,
            action: 'upload_license',
        },
        {
            id: 'id',
            label: 'Verify ID document',
            completed: data.hasIdVerified,
            icon: <Shield className="h-4 w-4" />,
            action: 'verify_id',
        },
        {
            id: 'locations',
            label: 'Set preferred locations',
            completed: data.hasPreferredLocations,
            icon: <MapPin className="h-4 w-4" />,
            action: 'set_locations',
        },
        {
            id: 'availability',
            label: 'Update availability',
            completed: data.hasAvailability,
            icon: <Clock className="h-4 w-4" />,
            action: 'set_availability',
        },
        {
            id: 'experience',
            label: 'Add work experience',
            completed: data.hasExperience,
            icon: <Star className="h-4 w-4" />,
            action: 'add_experience',
        },
    ];

    const completedCount = profileItems.filter(item => item.completed).length;
    const totalCount = profileItems.length;
    const percentage = Math.round((completedCount / totalCount) * 100);

    const getStrengthLevel = () => {
        if (percentage >= 100) return { label: 'Excellent', color: 'text-green-500', bg: 'bg-green-500' };
        if (percentage >= 80) return { label: 'Strong', color: 'text-green-400', bg: 'bg-green-400' };
        if (percentage >= 60) return { label: 'Good', color: 'text-yellow-500', bg: 'bg-yellow-500' };
        if (percentage >= 40) return { label: 'Fair', color: 'text-orange-500', bg: 'bg-orange-500' };
        return { label: 'Needs Improvement', color: 'text-red-500', bg: 'bg-red-500' };
    };

    const strength = getStrengthLevel();
    const incompleteItems = profileItems.filter(item => !item.completed);

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="h-5 w-5 text-accent" />
                        Profile Strength
                    </CardTitle>
                    <span className={cn("text-sm font-semibold", strength.color)}>
                        {strength.label}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{completedCount} of {totalCount} complete</span>
                        <span className="font-bold">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-3" />
                </div>

                {/* Completion Benefits */}
                {percentage < 100 && (
                    <div className="bg-accent/10 rounded-lg p-3 text-sm">
                        <p className="font-medium text-accent">Complete your profile to:</p>
                        <ul className="mt-1 space-y-0.5 text-muted-foreground text-xs">
                            <li>• Appear higher in employer searches</li>
                            <li>• Get matched to more stints</li>
                            <li>• Build trust with facilities</li>
                        </ul>
                    </div>
                )}

                {/* Profile Items */}
                <div className="space-y-2">
                    {(isExpanded ? profileItems : incompleteItems.slice(0, 3)).map((item) => (
                        <div
                            key={item.id}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-lg transition-colors",
                                item.completed
                                    ? "bg-green-500/10 text-green-600"
                                    : "bg-muted/50 hover:bg-muted cursor-pointer"
                            )}
                            onClick={() => !item.completed && item.action && onActionClick?.(item.action)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "rounded-full p-1.5",
                                    item.completed ? "bg-green-500/20" : "bg-background"
                                )}>
                                    {item.completed ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                        item.icon
                                    )}
                                </div>
                                <span className={cn(
                                    "text-sm",
                                    item.completed && "line-through"
                                )}>
                                    {item.label}
                                </span>
                            </div>
                            {!item.completed && (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Show More/Less */}
                {incompleteItems.length > 3 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? 'Show Less' : `Show ${incompleteItems.length - 3} More`}
                    </Button>
                )}

                {/* Stats Summary */}
                {data.completedStints && data.completedStints > 0 && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{data.completedStints}</p>
                            <p className="text-xs text-muted-foreground">Stints Completed</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold flex items-center justify-center gap-1">
                                {data.rating?.toFixed(1) || '-'}
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            </p>
                            <p className="text-xs text-muted-foreground">Average Rating</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
