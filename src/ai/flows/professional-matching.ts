'use server';

/**
 * @fileOverview AI-powered professional matching for employers.
 *
 * - matchProfessionals - Matches professionals to stints based on requirements.
 * - MatchProfessionalsInput - The input type for the matchProfessionals function.
 * - MatchProfessionalsOutput - The return type for the matchProfessionals function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MatchProfessionalsInputSchema = z.object({
    stintDetails: z.object({
        role: z.string().describe('The role required for the stint (e.g., Registered Nurse, Lab Technician)'),
        shiftType: z.string().describe('Half-day or Full-day shift'),
        location: z.string().describe('City or town where the stint is located'),
        offeredRate: z.number().describe('The offered rate in local currency (e.g., KES)'),
        description: z.string().optional().describe('Additional details about the stint'),
        requiredExperience: z.number().optional().describe('Minimum years of experience required'),
    }).describe('Details of the stint to match professionals for'),
    availableProfessionals: z.string().describe('JSON string of available professional profiles with their details'),
    maxRecommendations: z.number().default(5).describe('Maximum number of professionals to recommend'),
});
export type MatchProfessionalsInput = z.infer<typeof MatchProfessionalsInputSchema>;

const MatchedProfessionalSchema = z.object({
    professionalId: z.string().describe('The ID of the matched professional'),
    name: z.string().describe('Name of the professional'),
    matchScore: z.number().min(0).max(100).describe('Match score from 0-100 based on fit'),
    matchReasons: z.array(z.string()).describe('Reasons why this professional is a good match'),
    potentialConcerns: z.array(z.string()).optional().describe('Any potential concerns or considerations'),
});

const MatchProfessionalsOutputSchema = z.object({
    recommendations: z.array(MatchedProfessionalSchema).describe('List of recommended professionals ordered by match score'),
    marketInsight: z.string().optional().describe('Optional insight about market conditions for this role/location'),
    suggestedRateAdjustment: z.object({
        suggestion: z.string().describe('Suggestion about rate adjustment if needed'),
        reason: z.string().describe('Reason for the suggestion'),
    }).optional().describe('Rate adjustment suggestion based on market conditions'),
});
export type MatchProfessionalsOutput = z.infer<typeof MatchProfessionalsOutputSchema>;

export async function matchProfessionals(
    input: MatchProfessionalsInput
): Promise<MatchProfessionalsOutput> {
    return matchProfessionalsFlow(input);
}

const prompt = ai.definePrompt({
    name: 'matchProfessionalsPrompt',
    input: { schema: MatchProfessionalsInputSchema },
    output: { schema: MatchProfessionalsOutputSchema },
    prompt: `You are an expert healthcare staffing coordinator for CareStint, a platform connecting healthcare facilities with professionals in East & Central Africa.

Your task is to analyze the available professionals and recommend the best matches for a specific stint based on multiple factors.

Stint Requirements:
- Role: {{{stintDetails.role}}}
- Shift Type: {{{stintDetails.shiftType}}}
- Location: {{{stintDetails.location}}}
- Offered Rate: {{{stintDetails.offeredRate}}} KES
{{#if stintDetails.description}}- Description: {{{stintDetails.description}}}{{/if}}
{{#if stintDetails.requiredExperience}}- Required Experience: {{{stintDetails.requiredExperience}}} years{{/if}}

Available Professionals (JSON):
{{{availableProfessionals}}}

Maximum Recommendations: {{{maxRecommendations}}}

Evaluation Criteria (in order of importance):
1. Role Match - Professional's role must match or be compatible with the required role
2. Location Proximity - Professionals closer to the location should score higher
3. Experience Level - More experienced professionals score higher
4. Availability - Consider typical availability patterns
5. Rating History - Higher-rated professionals should score higher
6. Rate Expectations - Consider if the offered rate aligns with professional's expectations

For each recommended professional, provide:
- A match score (0-100)
- Specific reasons why they're a good match
- Any potential concerns if applicable

Also provide:
- Market insight about this role/location combination
- Rate adjustment suggestion if the offered rate seems too low or high for the market

Return the recommendations in descending order of match score.`,
});

const matchProfessionalsFlow = ai.defineFlow(
    {
        name: 'matchProfessionalsFlow',
        inputSchema: MatchProfessionalsInputSchema,
        outputSchema: MatchProfessionalsOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
