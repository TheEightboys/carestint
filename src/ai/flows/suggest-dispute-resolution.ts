'use server';

/**
 * @fileOverview An AI agent to suggest dispute resolutions based on past cases.
 *
 * - suggestDisputeResolution - A function that suggests a resolution for a dispute.
 * - SuggestDisputeResolutionInput - The input type for the suggestDisputeResolution function.
 * - SuggestDisputeResolutionOutput - The return type for the suggestDisputeResolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDisputeResolutionInputSchema = z.object({
  region: z.string().describe('The region where the dispute occurred.'),
  role: z.string().describe('The role of the professional involved in the dispute.'),
  issueType: z.string().describe('The type of issue in the dispute.'),
  pastCases: z
    .string()
    .describe(
      'A list of past dispute cases with resolutions, formatted as a JSON string.'
    ),
});
export type SuggestDisputeResolutionInput = z.infer<typeof SuggestDisputeResolutionInputSchema>;

const SuggestDisputeResolutionOutputSchema = z.object({
  suggestedResolution: z
    .string()
    .describe('The suggested resolution for the dispute based on past cases.'),
  confidenceScore: z
    .number()
    .describe('A confidence score (0-1) indicating the reliability of the suggested resolution.'),
});
export type SuggestDisputeResolutionOutput = z.infer<typeof SuggestDisputeResolutionOutputSchema>;

export async function suggestDisputeResolution(
  input: SuggestDisputeResolutionInput
): Promise<SuggestDisputeResolutionOutput> {
  return suggestDisputeResolutionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDisputeResolutionPrompt',
  input: {schema: SuggestDisputeResolutionInputSchema},
  output: {schema: SuggestDisputeResolutionOutputSchema},
  prompt: `You are an expert in dispute resolution within the CareStint platform, specializing in healthcare staffing disputes in East and Central Africa.

  Based on the provided information about the current dispute and historical data from past cases, you will suggest the most appropriate resolution.
  You will also provide a confidence score (0-1) indicating the reliability of your suggested resolution. Consider the similarity of the current case to the past cases when determining the confidence score.

  Current Dispute Details:
  - Region: {{{region}}}
  - Role: {{{role}}}
  - Issue Type: {{{issueType}}}

  Past Cases:
  {{{pastCases}}}

  Provide the suggested resolution and confidence score in the following format:
  {
  "suggestedResolution": "<suggested resolution>",
  "confidenceScore": <confidence score>
  }`,
});

const suggestDisputeResolutionFlow = ai.defineFlow(
  {
    name: 'suggestDisputeResolutionFlow',
    inputSchema: SuggestDisputeResolutionInputSchema,
    outputSchema: SuggestDisputeResolutionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
