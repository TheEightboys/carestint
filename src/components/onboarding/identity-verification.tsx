"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, Check, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface IdentityVerificationProps {
    onComplete: (imageData: string) => void;
    isLoading?: boolean;
}

export function IdentityVerification({ onComplete, isLoading = false }: IdentityVerificationProps) {
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        setError(null);

        // Compress and convert to base64
        try {
            const compressedImage = await compressImage(file);
            setCapturedImage(compressedImage);
        } catch (err) {
            setError('Failed to process image. Please try again.');
        }
    };

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxWidth = 1200;
                    const maxHeight = 1200;

                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Convert to base64 with compression
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(compressedBase64);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = () => {
        if (capturedImage) {
            onComplete(capturedImage);
        }
    };

    return (
        <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                    <Camera className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="font-headline text-2xl">Identity Verification</CardTitle>
                <CardDescription>
                    Take a selfie while holding your ID document next to your face for verification
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Instructions */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-sm">Instructions:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span>Hold your ID document (National ID, Passport, or Driver's License) next to your face</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span>Ensure good lighting so both your face and ID are clearly visible</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span>The ID photo should match your face in the selfie</span>
                        </li>
                    </ul>
                </div>

                {/* Image Preview or Upload Area */}
                {capturedImage ? (
                    <div className="space-y-4">
                        <div className="relative w-full aspect-[4/3] rounded-lg border overflow-hidden bg-secondary">
                            <Image
                                src={capturedImage}
                                alt="Verification selfie"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleRetake} className="flex-1" disabled={isLoading}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Retake Photo
                            </Button>
                            <Button onClick={handleSubmit} className="flex-1" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Submit for Verification
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            capture="user"
                            onChange={handleFileChange}
                            className="hidden"
                            id="verification-photo"
                        />
                        <label
                            htmlFor="verification-photo"
                            className="flex flex-col items-center justify-center w-full aspect-[4/3] rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-4 rounded-full bg-accent/10">
                                    <Upload className="h-8 w-8 text-accent" />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium">Take a Selfie with Your ID</p>
                                    <p className="text-sm text-muted-foreground">
                                        Tap here to open camera or select from gallery
                                    </p>
                                </div>
                            </div>
                        </label>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Security Note */}
                <p className="text-xs text-muted-foreground text-center">
                    🔒 Your photo is securely stored and used only for identity verification purposes.
                    It will be reviewed by our team as part of your account approval process.
                </p>
            </CardContent>
        </Card>
    );
}
