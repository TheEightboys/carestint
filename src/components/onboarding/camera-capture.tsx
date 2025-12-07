"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCcw, Upload, FileImage, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  documentType: string;
}

/**
 * Compress an image to reduce file size while maintaining reasonable quality
 */
function compressImage(file: File, maxSizeKB: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions (max 1200px on longest side)
        let { width, height } = img;
        const maxDimension = 1200;

        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Start with quality 0.7 and reduce if needed
        let quality = 0.7;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Keep reducing quality until under max size
        while (dataUrl.length > maxSizeKB * 1024 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function CameraCapture({ onCapture, documentType }: CameraCaptureProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload an image file (JPG, PNG, etc.)',
      });
      return;
    }

    // Validate file size (max 10MB for input, will be compressed)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please upload an image smaller than 10MB.',
      });
      return;
    }

    setFileName(file.name);
    setIsCompressing(true);

    try {
      // Compress the image to ~200KB max
      const compressedDataUrl = await compressImage(file, 200);
      setCapturedImage(compressedDataUrl);
      onCapture(compressedDataUrl);

      toast({
        title: 'Image uploaded',
        description: 'Document compressed and ready for submission.',
      });
    } catch (error) {
      console.error('Compression error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to process the image. Please try again.',
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {isCompressing ? (
        <div className="relative w-full aspect-video rounded-md border bg-secondary/50 overflow-hidden">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Compressing image...</p>
          </div>
        </div>
      ) : capturedImage ? (
        <div className="space-y-4">
          <div className="relative w-full aspect-video rounded-md border bg-secondary overflow-hidden">
            <Image src={capturedImage} alt="Uploaded document" fill style={{ objectFit: 'contain' }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-500">
              <Check className="h-4 w-4" />
              <span className="truncate max-w-[200px]">{fileName || 'Document captured'}</span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleRetake}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Change
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="relative w-full aspect-video rounded-md border-2 border-dashed border-muted-foreground/25 bg-secondary/50 overflow-hidden cursor-pointer hover:border-accent/50 transition-colors"
          onClick={handleUploadClick}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
            <div className="p-4 rounded-full bg-accent/10">
              <FileImage className="h-8 w-8 text-accent" />
            </div>
            <div>
              <p className="font-medium">Click to upload {documentType}</p>
              <p className="text-sm text-muted-foreground">JPG, PNG (will be compressed)</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleUploadClick(); }}>
              <Upload className="mr-2 h-4 w-4" /> Choose File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}