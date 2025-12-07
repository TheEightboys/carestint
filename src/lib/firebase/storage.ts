'use client';

import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from './clientApp';

/**
 * Upload a base64 image to Firebase Storage and return the download URL
 */
export async function uploadDocument(
    base64Data: string,
    folder: string,
    fileName: string
): Promise<string> {
    if (!storage) {
        throw new Error('Firebase Storage is not initialized');
    }

    // Create a unique file name
    const timestamp = Date.now();
    const uniqueFileName = `${folder}/${timestamp}_${fileName}`;
    const storageRef = ref(storage, uniqueFileName);

    // Upload the base64 string
    // The base64Data should be like "data:image/jpeg;base64,..."
    await uploadString(storageRef, base64Data, 'data_url');

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}

/**
 * Upload a professional's documents to Storage
 */
export async function uploadProfessionalDocuments(
    professionalEmail: string,
    licenseDocument?: string,
    idDocument?: string
): Promise<{ licenseUrl?: string; idUrl?: string }> {
    const result: { licenseUrl?: string; idUrl?: string } = {};
    const sanitizedEmail = professionalEmail.replace(/[^a-zA-Z0-9]/g, '_');

    if (licenseDocument && licenseDocument.startsWith('data:')) {
        result.licenseUrl = await uploadDocument(
            licenseDocument,
            `professionals/${sanitizedEmail}`,
            'license.jpg'
        );
    }

    if (idDocument && idDocument.startsWith('data:')) {
        result.idUrl = await uploadDocument(
            idDocument,
            `professionals/${sanitizedEmail}`,
            'id.jpg'
        );
    }

    return result;
}

/**
 * Upload an employer's documents to Storage
 */
export async function uploadEmployerDocuments(
    employerEmail: string,
    licenseDocument?: string
): Promise<{ licenseUrl?: string }> {
    const result: { licenseUrl?: string } = {};
    const sanitizedEmail = employerEmail.replace(/[^a-zA-Z0-9]/g, '_');

    if (licenseDocument && licenseDocument.startsWith('data:')) {
        result.licenseUrl = await uploadDocument(
            licenseDocument,
            `employers/${sanitizedEmail}`,
            'license.jpg'
        );
    }

    return result;
}
