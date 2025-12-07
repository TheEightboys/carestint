'use server';

/**
 * @fileOverview An AI agent to verify identity and license documents.
 *
 * - verifyDocument - A function that analyzes a document image for verification.
 * - VerifyDocumentInput - The input type for the verifyDocument function.
 * - VerifyDocumentOutput - The return type for the verifyDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const VerifyDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A photo of a license or ID document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentType: z.enum(['professional_license', 'national_id', 'facility_permit']).describe('The type of document being submitted.'),
  country: z.string().describe('The country where the document was issued (e.g., Kenya, Uganda).'),
});
export type VerifyDocumentInput = z.infer<typeof VerifyDocumentInputSchema>;

export const VerifyDocumentOutputSchema = z.object({
  verificationStatus: z
    .enum(['auto_approved', 'needs_manual_review', 'rejected'])
    .describe('The outcome of the verification process.'),
  reason: z
    .string()
    .describe('A brief explanation for the verification status, especially for "needs_manual_review" or "rejected".'),
  extractedData: z.object({
    fullName: z.string().optional().describe('The full name of the person or facility on the document.'),
    documentNumber: z.string().optional().describe('The license, permit, or ID number.'),
    expiryDate: z.string().optional().describe('The expiry date in YYYY-MM-DD format, if present.'),
    dateOfBirth: z.string().optional().describe('The date of birth in YYYY-MM-DD format, if present.'),
  }).describe('Data extracted from the document.'),
  documentQualityScore: z
    .number()
    .min(0)
    .max(1)
    .describe('A score (0-1) representing the quality of the document image (clarity, lighting, etc.). 0 is poor, 1 is excellent.'),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe('A score (0-1) indicating the AI\'s confidence in the verification result.'),
});
export type VerifyDocumentOutput = z.infer<typeof VerifyDocumentOutputSchema>;


export async function verifyDocument(input: VerifyDocumentInput): Promise<VerifyDocumentOutput> {
  return verifyDocumentFlow(input);
}


const prompt = ai.definePrompt({
    name: 'verifyDocumentPrompt',
    input: {schema: VerifyDocumentInputSchema},
    output: {schema: VerifyDocumentOutputSchema},
    prompt: `You are an expert KYC (Know Your Customer) and document verification agent for CareStint, a healthcare staffing platform in East & Central Africa. Your task is to analyze the provided document image and return a structured verification assessment.

    Document to Verify:
    - Type: {{{documentType}}}
    - Country: {{{country}}}
    - Image: {{media url=documentDataUri}}

    Your Process:
    1.  **Analyze the Image Quality:** Assess the submitted image for clarity, glare, blurriness, and completeness. Assign a documentQualityScore from 0 (unreadable) to 1 (perfectly clear). If the score is below 0.6, the status should be 'needs_manual_review'.
    2.  **Extract Key Information:** Carefully extract the full name, document number, and any relevant dates (expiry, date of birth). Format dates as YYYY-MM-DD. If a field is not present or unreadable, omit it.
    3.  **Determine Verification Status:**
        -   If the document is clear (quality score >= 0.6), appears authentic, and all key fields are legible, set verificationStatus to 'auto_approved'.
        -   If the document is blurry, cut off, has significant glare, or appears tampered with, set verificationStatus to 'needs_manual_review' and provide a clear reason (e.g., "Image is blurry", "Possible glare on expiry date").
        -   If the document is clearly fake, invalid for the specified country, or completely unreadable, set verificationStatus to 'rejected' and state the reason.
    4.  **Calculate Confidence Score:** Based on the image quality and the clarity of the extracted information, provide a confidenceScore for your overall assessment. High quality and clear text should result in a high confidence score.

    Return your complete analysis in the specified JSON format.
    `,
});


const verifyDocumentFlow = ai.defineFlow(
    {
        name: 'verifyDocumentFlow',
        inputSchema: VerifyDocumentInputSchema,
        outputSchema: VerifyDocumentOutputSchema,
    },
    async (input) => {
        const {output} = await prompt(input);
        return output!;
    }
);
