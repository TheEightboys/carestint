"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, FileText, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
    label: string;
    description?: string;
    value?: string;
    onChange: (value: string) => void;
    required?: boolean;
    accept?: string;
    maxSizeMB?: number;
}

export function DocumentUpload({
    label,
    description,
    value,
    onChange,
    required = false,
    accept = "image/*,.pdf",
    maxSizeMB = 5,
}: DocumentUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        setError(null);

        // Validate file size
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            setError(`File size must be less than ${maxSizeMB}MB`);
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload an image (JPEG, PNG) or PDF file');
            return;
        }

        setIsUploading(true);

        try {
            // For now, we'll create a local URL for preview
            // In production, this would upload to Firebase Storage
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                onChange(base64);
                setIsUploading(false);
            };
            reader.onerror = () => {
                setError('Failed to read file');
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError('Failed to upload file');
            setIsUploading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleRemove = () => {
        onChange('');
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const isImage = value?.startsWith('data:image');

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </label>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleInputChange}
                className="hidden"
            />

            {value ? (
                <Card className="relative overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            {isImage ? (
                                <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted">
                                    <img
                                        src={value}
                                        alt="Document preview"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                                    <Check className="h-4 w-4" />
                                    Document uploaded
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Click to replace or remove
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleRemove}
                                className="shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card
                    className={cn(
                        "cursor-pointer transition-all duration-200 hover:border-accent/50",
                        isDragging && "border-accent bg-accent/5",
                        error && "border-destructive"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                        {isUploading ? (
                            <>
                                <div className="h-12 w-12 rounded-full border-4 border-accent border-t-transparent animate-spin mb-4" />
                                <p className="text-sm font-medium">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <div className="flex gap-2 mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                                        <Upload className="h-6 w-6 text-accent" />
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                        <Camera className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                </div>
                                <p className="text-sm font-medium mb-1">
                                    Drop file here or click to upload
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    JPEG, PNG or PDF (max {maxSizeMB}MB)
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}
        </div>
    );
}
