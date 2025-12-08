"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, ArrowLeft, Lock, User, Camera, Loader2, Mail, Save, Check } from "lucide-react";
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
import { getProfessionalByEmail } from "@/lib/firebase/firestore";
import Link from "next/link";

export default function ProfessionalSettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, isLoading: authLoading } = useUser();

    const [professional, setProfessional] = useState<any>(null);
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
        const loadProfessionalData = async () => {
            if (authLoading) return;

            if (!user || !user.email) {
                router.push('/');
                return;
            }

            try {
                const proData = await getProfessionalByEmail(user.email) as any;
                if (!proData) {
                    router.push('/onboarding/professional');
                    return;
                }
                setProfessional(proData);
                setAvatarUrl(proData.avatarUrl || "");
            } catch (error) {
                console.error('Error loading professional data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProfessionalData();
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
        if (!professional?.id) return;

        setSavingAvatar(true);
        try {
            // Update avatar in Firebase auth
            if (auth.currentUser && avatarUrl) {
                await updateProfile(auth.currentUser, { photoURL: avatarUrl });
            }

            toast({
                title: "Avatar updated",
                description: "Your profile picture has been saved.",
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
        const styles = ['adventurer', 'avataaars', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'miniavs', 'personas'];
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];
        const seed = `${professional?.fullName || 'user'}-${Date.now()}`;
        setAvatarUrl(`https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${encodeURIComponent(seed)}`);
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-accent" />
                    <p className="text-muted-foreground">Loading settings...</p>
                </div>
            </div>
        );
    }

    const professionalName = professional?.fullName || "Professional";
    const currentAvatarUrl = avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${professionalName}`;

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/professional">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <div className="flex items-center gap-3 ml-auto">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                        <Stethoscope className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                        <h1 className="font-headline text-lg font-semibold">Account Settings</h1>
                        <p className="text-xs text-muted-foreground">{professional?.email}</p>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 flex-col gap-6 p-4 sm:px-6 sm:py-6 max-w-4xl mx-auto w-full">
                {/* Avatar Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Camera className="h-5 w-5" />
                            Profile Picture
                        </CardTitle>
                        <CardDescription>
                            Customize your avatar that appears across the platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-24 w-24 border-2 border-accent/20">
                                <AvatarImage src={currentAvatarUrl} alt={professionalName} />
                                <AvatarFallback className="bg-accent/10 text-accent text-2xl">
                                    {professionalName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">{professionalName}</p>
                                <p className="text-xs text-muted-foreground">{professional?.primaryRole?.replace('-', ' ')}</p>
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
                                placeholder="https://example.com/your-avatar.jpg"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter a URL to your own image, or use the "Generate New" button for a random avatar
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
                            Your account details (to update these, go to Profile tab)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">Full Name</Label>
                                <p className="font-medium">{professional?.fullName}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">Email</Label>
                                <p className="font-medium flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    {professional?.email}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">Role</Label>
                                <p className="font-medium capitalize">{professional?.primaryRole?.replace('-', ' ')}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">Account Status</Label>
                                <p className="font-medium capitalize">{professional?.status}</p>
                            </div>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/professional?tab=profile">
                                Edit Profile
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
