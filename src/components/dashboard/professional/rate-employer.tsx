"use client";

import { useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface RateEmployerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    employerId: string;
    employerName: string;
    stintId: string;
    onRatingSubmitted?: () => void;
}

export function RateEmployer({
    isOpen,
    onOpenChange,
    employerId,
    employerName,
    stintId,
    onRatingSubmitted
}: RateEmployerProps) {
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({
                variant: 'destructive',
                title: 'Rating Required',
                description: 'Please select a star rating before submitting.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            // In production, this would call the API
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast({
                title: 'Rating Submitted',
                description: `Thank you for rating ${employerName}.`,
            });

            onRatingSubmitted?.();
            onOpenChange(false);
            setRating(0);
            setFeedback('');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to submit rating. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayRating = hoveredRating || rating;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Rate Facility</DialogTitle>
                    <DialogDescription>
                        How was your experience working at {employerName}?
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {/* Star Rating */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={cn(
                                            "h-10 w-10 transition-colors",
                                            star <= displayRating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-muted-foreground/30"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className={cn(
                            "text-lg font-medium transition-opacity",
                            displayRating > 0 ? "opacity-100" : "opacity-0"
                        )}>
                            {ratingLabels[displayRating]}
                        </p>
                    </div>

                    {/* Rating Categories */}
                    <div className="mt-6 space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">Rate specific aspects:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                                <span>Work Environment</span>
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} className="h-3 w-3 text-muted-foreground/30" />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                                <span>Communication</span>
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} className="h-3 w-3 text-muted-foreground/30" />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                                <span>On-time Payments</span>
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} className="h-3 w-3 text-muted-foreground/30" />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                                <span>Would Work Again</span>
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} className="h-3 w-3 text-muted-foreground/30" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feedback */}
                    <div className="mt-6">
                        <Textarea
                            placeholder="Share your experience (optional)"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Your feedback helps other professionals make informed decisions.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        Submit Rating
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
