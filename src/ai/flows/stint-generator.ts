'use server';

/**
 * @fileOverview AI-powered stint description generator.
 *
 * - generateStintDescription - Generates professional stint descriptions from minimal input.
 * - GenerateStintInput - The input type for the generateStintDescription function.
 * - GenerateStintOutput - The return type for the generateStintDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateStintInputSchema = z.object({
    role: z.string().describe('The healthcare role needed (e.g., Registered Nurse, Clinical Officer)'),
    shiftType: z.enum(['half-day', 'full-day']).describe('Type of shift'),
    location: z.string().describe('City or town where the stint is located'),
    facilityType: z.string().optional().describe('Type of facility (e.g., hospital, clinic, nursing home)'),
    specialRequirements: z.string().optional().describe('Any special requirements or skills needed'),
    offeredRate: z.number().optional().describe('The offered rate in local currency'),
    region: z.enum(['Kenya', 'Uganda', 'Tanzania']).default('Kenya').describe('Country/region for context'),
});
export type GenerateStintInput = z.infer<typeof GenerateStintInputSchema>;

const GenerateStintOutputSchema = z.object({
    title: z.string().describe('A concise, professional title for the stint posting'),
    description: z.string().describe('A detailed, compelling description of the stint (2-3 paragraphs)'),
    keyResponsibilities: z.array(z.string()).describe('List of 3-5 key responsibilities'),
    requirements: z.array(z.string()).describe('List of minimum requirements'),
    suggestedTags: z.array(z.string()).describe('Suggested tags for better discoverability'),
    suggestedRate: z.object({
        min: z.number().describe('Suggested minimum rate in local currency'),
        max: z.number().describe('Suggested maximum rate in local currency'),
        rationale: z.string().describe('Explanation for the suggested rate range'),
    }).describe('Suggested rate range based on role and location'),
    tips: z.array(z.string()).optional().describe('Tips to attract better candidates'),
});
export type GenerateStintOutput = z.infer<typeof GenerateStintOutputSchema>;

export async function generateStintDescription(
    input: GenerateStintInput
): Promise<GenerateStintOutput> {
    return generateStintFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateStintPrompt',
    input: { schema: GenerateStintInputSchema },
    output: { schema: GenerateStintOutputSchema },
    prompt: `You are a healthcare staffing expert helping employers create compelling stint postings on CareStint, a platform operating in East & Central Africa.

Based on the provided information, generate a professional and attractive stint posting that will appeal to qualified healthcare professionals.

Input Information:
- Role: {{{role}}}
- Shift Type: {{{shiftType}}}
- Location: {{{location}}}
- Region: {{{region}}}
{{#if facilityType}}- Facility Type: {{{facilityType}}}{{/if}}
{{#if specialRequirements}}- Special Requirements: {{{specialRequirements}}}{{/if}}
{{#if offeredRate}}- Offered Rate: {{{offeredRate}}} {{#if (eq region "Kenya")}}KES{{else if (eq region "Uganda")}}UGX{{else}}TZS{{/if}}{{/if}}

Your output should include:

1. **Title**: A clear, professional title (e.g., "Registered Nurse - Full Day Shift at Nairobi Private Hospital")

2. **Description**: A compelling 2-3 paragraph description that:
   - Highlights the opportunity
   - Describes the work environment
   - Mentions any unique benefits
   - Uses professional but welcoming language

3. **Key Responsibilities**: 3-5 specific responsibilities for this role

4. **Requirements**: Minimum requirements including:
   - Valid professional license
   - Relevant experience
   - Any specific certifications needed

5. **Suggested Tags**: Tags for better searchability (e.g., "urgent", "pediatrics", "night-shift")

6. **Suggested Rate Range**: Based on market rates in {{{location}}}, {{{region}}} for {{{role}}} roles
   - Provide min and max rates in local currency
   - Explain the rationale

7. **Tips** (optional): 2-3 tips to make this posting more attractive

Remember to:
- Use appropriate currency for the region (KES for Kenya, UGX for Uganda, TZS for Tanzania)
- Consider local market conditions
- Be specific and professional
- Highlight what makes this opportunity attractive`,
});

const generateStintFlow = ai.defineFlow(
    {
        name: 'generateStintFlow',
        inputSchema: GenerateStintInputSchema,
        outputSchema: GenerateStintOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
