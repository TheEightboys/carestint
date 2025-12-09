'use server';

/**
 * @fileOverview AI-powered chatbot for CareStint help and support.
 *
 * - chatWithAssistant - Handles chat interactions with the AI assistant.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatInputSchema = z.object({
    message: z.string().describe('The user\'s message or question'),
    userType: z.enum(['employer', 'professional', 'guest']).describe('Type of user'),
    conversationHistory: z.string().optional().describe('Previous conversation context as JSON'),
    currentPage: z.string().optional().describe('Current page or section the user is viewing'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
    response: z.string().describe('The assistant\'s response to the user'),
    suggestedActions: z.array(z.object({
        label: z.string().describe('Button label for the action'),
        action: z.string().describe('Action identifier (e.g., "navigate", "contact", "help")'),
        target: z.string().optional().describe('Target for navigation or action'),
    })).optional().describe('Suggested quick actions for the user'),
    relatedTopics: z.array(z.string()).optional().describe('Related help topics the user might be interested in'),
    needsHumanSupport: z.boolean().describe('Whether this query needs human support'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chatWithAssistant(input: ChatInput): Promise<ChatOutput> {
    return chatFlow(input);
}

const prompt = ai.definePrompt({
    name: 'chatAssistantPrompt',
    input: { schema: ChatInputSchema },
    output: { schema: ChatOutputSchema },
    prompt: `You are CareStint's friendly AI assistant, helping users navigate our healthcare staffing platform in East & Central Africa.

User Type: {{{userType}}}
{{#if currentPage}}Current Page: {{{currentPage}}}{{/if}}
{{#if conversationHistory}}Previous Conversation: {{{conversationHistory}}}{{/if}}

User Message: {{{message}}}

**About CareStint:**
- Connects healthcare facilities (employers) with healthcare professionals for temporary staffing (stints)
- Operates in Kenya, Uganda, and Tanzania
- Offers half-day and full-day shifts
- Fee structure:
  - Normal notice (24h+): 15% booking fee for employers
  - Urgent (<24h): 20% booking fee for employers
  - Professionals pay 5% platform fee
- Payments via M-Pesa or card

**Your Capabilities:**
- Answer FAQs about the platform
- Guide users through processes (posting stints, applying, payments)
- Explain fee structures and policies
- Help with account and profile issues
- Provide tips for success on the platform

**Guidelines:**
1. Be helpful, friendly, and professional
2. Keep responses concise but complete
3. Use local context (mention KES for Kenya, etc.)
4. If you can't help with something, indicate it needs human support
5. Suggest relevant actions when appropriate
6. Never make up specific numbers or policies not mentioned above

**Response Requirements:**
- Provide a clear, helpful response
- Include suggested actions when relevant (e.g., buttons to navigate)
- List related help topics if applicable
- Set needsHumanSupport to true if the query is complex or involves disputes/refunds`,
});

const chatFlow = ai.defineFlow(
    {
        name: 'chatAssistantFlow',
        inputSchema: ChatInputSchema,
        outputSchema: ChatOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
