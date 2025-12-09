"use client";

import { useState } from "react";
import { Smartphone, Mail, Loader2, CheckCircle2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { addWaitlistEntry } from "@/lib/firebase/firestore";

interface WaitlistModalProps {
    trigger?: React.ReactNode;
}

export function WaitlistModal({ trigger }: WaitlistModalProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [userType, setUserType] = useState<"professional" | "employer">("professional");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast({
                variant: "destructive",
                title: "Email required",
                description: "Please enter your email address.",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Save to Firestore
            await addWaitlistEntry({
                email,
                name: name || undefined,
                userType,
            });

            // Send confirmation email
            try {
                await fetch('/api/send-waitlist-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, name, userType }),
                });
            } catch (emailError) {
                console.log('Email sending skipped or failed:', emailError);
                // Don't fail the whole signup if email fails
            }

            setIsSuccess(true);
            toast({
                title: "You're on the list! 🎉",
                description: "Check your inbox for a confirmation email.",
            });

            // Reset form after delay
            setTimeout(() => {
                setOpen(false);
                setIsSuccess(false);
                setEmail("");
                setName("");
            }, 3000);
        } catch (error: any) {
            console.error("Waitlist signup error:", error);
            toast({
                variant: "destructive",
                title: "Something went wrong",
                description: error.message || "Please try again later.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const defaultTrigger = (
        <Button className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-accent/30 hover:scale-105 transition-all duration-300">
            <Smartphone className="h-5 w-5" />
            Join Waitlist
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-accent/30 bg-background/95 backdrop-blur-xl shadow-2xl">
                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mb-4 animate-bounce">
                            <CheckCircle2 className="h-8 w-8 text-accent" />
                        </div>
                        <h3 className="font-headline text-2xl font-bold mb-2">You're on the list!</h3>
                        <p className="text-muted-foreground">
                            We'll send you an email when our {userType === "professional" ? "CareStint Pro" : "CareStint Hire"} app launches.
                        </p>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <div className="flex items-center justify-center mb-4">
                                <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center">
                                    <Sparkles className="h-7 w-7 text-accent" />
                                </div>
                            </div>
                            <DialogTitle className="text-center font-headline text-2xl">
                                Be the first to know
                            </DialogTitle>
                            <DialogDescription className="text-center">
                                Get early access when our iOS & Android apps launch. No spam, just one email.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            {/* User Type Selection */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setUserType("professional")}
                                    className={`p-4 rounded-xl border-2 transition-all ${userType === "professional"
                                        ? "border-accent bg-accent/10"
                                        : "border-border hover:border-accent/50"
                                        }`}
                                >
                                    <div className="text-sm font-medium">I'm a Professional</div>
                                    <div className="text-xs text-muted-foreground mt-1">Find shifts & earn</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUserType("employer")}
                                    className={`p-4 rounded-xl border-2 transition-all ${userType === "employer"
                                        ? "border-accent bg-accent/10"
                                        : "border-border hover:border-accent/50"
                                        }`}
                                >
                                    <div className="text-sm font-medium">I'm an Employer</div>
                                    <div className="text-xs text-muted-foreground mt-1">Hire staff easily</div>
                                </button>
                            </div>

                            {/* Name Input */}
                            <div className="space-y-2">
                                <Label htmlFor="waitlist-name">Name (optional)</Label>
                                <Input
                                    id="waitlist-name"
                                    placeholder="Your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-background/50"
                                />
                            </div>

                            {/* Email Input */}
                            <div className="space-y-2">
                                <Label htmlFor="waitlist-email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email Address
                                </Label>
                                <Input
                                    id="waitlist-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-background/50"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-6 text-lg font-semibold"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Joining...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Join the Waitlist
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-center text-muted-foreground">
                                We respect your privacy. Unsubscribe anytime.
                            </p>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
