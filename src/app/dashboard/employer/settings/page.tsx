"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building, ArrowLeft, Lock, User, Camera, Loader2, Mail, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/user-context";
import { auth } from "@/lib/firebase/clientApp";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from "firebase/auth";
import { getEmployerByEmail } from "@/lib/firebase/firestore";
import Link from "next/link";

export default function EmployerSettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, isLoading: authLoading } = useUser();

    const [employer, setEmployer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    // Avatar state
    const [avatarUrl, setAvatarUrl] = useState("");
    const [savingAvatar, setSavingAvatar] = useState(false);

    useEffect(() => {
        const loadEmployerData = async () => {
            if (authLoading) return;

            if (!user || !user.email) {
                router.push('/');
                return;
            }

            try {
                const empData = await getEmployerByEmail(user.email) as any;
                if (!empData) {
                    router.push('/onboarding/employer');
                    return;
                }
                setEmployer(empData);
                setAvatarUrl(empData.avatarUrl || "");
            } catch (error) {
                console.error('Error loading employer data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadEmployerData();
    }, [user, authLoading, router]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Passwords don't match",
                description: "Please ensure both passwords are the same.",
            });
            return;
        }

        if (newPassword.length < 6) {
            toast({
                variant: "destructive",
                title: "Password too short",
                description: "Password must be at least 6 characters.",
            });
            return;
        }

        setChangingPassword(true);

        try {
            if (!auth.currentUser || !user?.email) {
                throw new Error("Not authenticated");
            }

            // Re-authenticate the user
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Update password
            await updatePassword(auth.currentUser, newPassword);

            toast({
                title: "Password updated",
                description: "Your password has been changed successfully.",
            });

            // Clear form
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Password change error:", error);
            let message = "Failed to change password. Please try again.";
            if (error.code === "auth/wrong-password") {
                message = "Current password is incorrect.";
            } else if (error.code === "auth/requires-recent-login") {
                message = "Please sign out and sign back in, then try again.";
            }
            toast({
                variant: "destructive",
                title: "Error",
                description: message,
            });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleAvatarSave = async () => {
        if (!employer?.id) return;

        setSavingAvatar(true);
        try {
            // Update avatar in Firebase auth
            if (auth.currentUser && avatarUrl) {
                await updateProfile(auth.currentUser, { photoURL: avatarUrl });
            }

            toast({
                title: "Avatar updated",
                description: "Your facility picture has been saved.",
            });
        } catch (error) {
            console.error("Avatar save error:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save avatar. Please try again.",
            });
        } finally {
            setSavingAvatar(false);
        }
    };

    const generateRandomAvatar = () => {
        const styles = ['shapes', 'identicon', 'initials', 'bottts', 'rings'];
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];
        const seed = `${employer?.facilityName || 'facility'}-${Date.now()}`;
        setAvatarUrl(`https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${encodeURIComponent(seed)}`);
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading settings...</p>
                </div>
            </div>
        );
    }

    const facilityName = employer?.facilityName || "Facility";
    const currentAvatarUrl = avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${facilityName}`;

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/employer">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <div className="flex items-center gap-3 ml-auto">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-headline text-lg font-semibold">Account Settings</h1>
                        <p className="text-xs text-muted-foreground">{employer?.email}</p>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 flex-col gap-6 p-4 sm:px-6 sm:py-6 max-w-4xl mx-auto w-full">
                {/* Avatar Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Camera className="h-5 w-5" />
                            Facility Picture
                        </CardTitle>
                        <CardDescription>
                            Customize your facility's avatar that appears across the platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-24 w-24 border-2 border-primary/20">
                                <AvatarImage src={currentAvatarUrl} alt={facilityName} />
                                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                                    {facilityName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">{facilityName}</p>
                                <p className="text-xs text-muted-foreground">{employer?.city}</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={generateRandomAvatar}>
                                        Generate New
                                    </Button>
                                    <Button size="sm" onClick={handleAvatarSave} disabled={savingAvatar}>
                                        {savingAvatar ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="mr-2 h-4 w-4" />
                                        )}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="avatarUrl">Custom Avatar URL</Label>
                            <Input
                                id="avatarUrl"
                                type="url"
                                placeholder="https://example.com/your-logo.jpg"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter a URL to your facility's logo, or use the "Generate New" button
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                {/* Password Change Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Change Password
                        </CardTitle>
                        <CardDescription>
                            Update your account password for security
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    placeholder="Enter your current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Enter new password (min 6 characters)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <Button type="submit" disabled={changingPassword}>
                                {changingPassword ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Changing Password...
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Update Password
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Account Info Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Account Information
                        </CardTitle>
                        <CardDescription>
                            Your facility account details (to update these, go to Profile tab)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">Facility Name</Label>
                                <p className="font-medium">{employer?.facilityName}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">Email</Label>
                                <p className="font-medium flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    {employer?.email}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">City</Label>
                                <p className="font-medium">{employer?.city}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">Account Status</Label>
                                <p className="font-medium capitalize">{employer?.status}</p>
                            </div>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/employer?tab=profile">
                                Edit Facility Profile
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
