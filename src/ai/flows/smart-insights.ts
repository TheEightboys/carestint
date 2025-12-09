'use server';

/**
 * @fileOverview AI-powered smart insights and analytics for the platform.
 *
 * - generateSmartInsights - Analyzes data and provides actionable insights.
 * - SmartInsightsInput - The input type for the generateSmartInsights function.
 * - SmartInsightsOutput - The return type for the generateSmartInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SmartInsightsInputSchema = z.object({
    userType: z.enum(['employer', 'professional', 'superadmin']).describe('Type of user requesting insights'),
    dataContext: z.object({
        recentActivity: z.string().optional().describe('JSON string of recent platform activity'),
        financialData: z.string().optional().describe('JSON string of financial/earnings data'),
        stintData: z.string().optional().describe('JSON string of stint posting/application data'),
        marketData: z.string().optional().describe('JSON string of market trends and statistics'),
    }).describe('Data context for generating insights'),
    focusArea: z.enum([
        'earnings_optimization',
        'hiring_efficiency',
        'market_trends',
        'risk_assessment',
        'growth_opportunities',
        'performance_analysis'
    ]).describe('Primary area of focus for insights'),
    timeframe: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).default('weekly').describe('Timeframe for analysis'),
});
export type SmartInsightsInput = z.infer<typeof SmartInsightsInputSchema>;

const InsightSchema = z.object({
    title: z.string().describe('Brief title for the insight'),
    description: z.string().describe('Detailed explanation of the insight'),
    impact: z.enum(['high', 'medium', 'low']).describe('Potential impact level'),
    actionable: z.boolean().describe('Whether this insight has a clear action'),
    suggestedAction: z.string().optional().describe('Specific action to take'),
    metric: z.object({
        value: z.string().describe('Key metric value'),
        label: z.string().describe('Label for the metric'),
        trend: z.enum(['up', 'down', 'stable']).optional().describe('Trend direction'),
    }).optional().describe('Key metric associated with this insight'),
});

const SmartInsightsOutputSchema = z.object({
    summary: z.string().describe('Executive summary of the analysis'),
    insights: z.array(InsightSchema).describe('List of 3-5 key insights'),
    predictions: z.array(z.object({
        prediction: z.string().describe('What is predicted to happen'),
        confidence: z.number().min(0).max(1).describe('Confidence level 0-1'),
        timeframe: z.string().describe('When this is expected to occur'),
    })).optional().describe('Future predictions based on data analysis'),
    recommendations: z.array(z.object({
        recommendation: z.string().describe('Specific recommendation'),
        priority: z.enum(['high', 'medium', 'low']).describe('Priority level'),
        expectedOutcome: z.string().describe('Expected outcome if implemented'),
    })).describe('Prioritized recommendations'),
    alerts: z.array(z.object({
        type: z.enum(['warning', 'opportunity', 'info']).describe('Alert type'),
        message: z.string().describe('Alert message'),
    })).optional().describe('Important alerts or warnings'),
});
export type SmartInsightsOutput = z.infer<typeof SmartInsightsOutputSchema>;

export async function generateSmartInsights(
    input: SmartInsightsInput
): Promise<SmartInsightsOutput> {
    return smartInsightsFlow(input);
}

const prompt = ai.definePrompt({
    name: 'smartInsightsPrompt',
    input: { schema: SmartInsightsInputSchema },
    output: { schema: SmartInsightsOutputSchema },
    prompt: `You are an advanced analytics AI for CareStint, a healthcare staffing platform in East & Central Africa. Your role is to analyze platform data and provide actionable insights.

User Type: {{{userType}}}
Focus Area: {{{focusArea}}}
Timeframe: {{{timeframe}}}

Data Context:
{{#if dataContext.recentActivity}}- Recent Activity: {{{dataContext.recentActivity}}}{{/if}}
{{#if dataContext.financialData}}- Financial Data: {{{dataContext.financialData}}}{{/if}}
{{#if dataContext.stintData}}- Stint Data: {{{dataContext.stintData}}}{{/if}}
{{#if dataContext.marketData}}- Market Data: {{{dataContext.marketData}}}{{/if}}

Based on the user type and focus area, provide relevant insights:

**For Employers (focus on hiring efficiency, cost optimization):**
- Analyze posting effectiveness
- Suggest optimal posting times
- Identify fill rate improvements
- Cost per hire analysis

**For Professionals (focus on earnings optimization):**
- Earnings trends and predictions
- Best performing stint types
- Profile improvement suggestions
- Market demand for their skills

**For SuperAdmin (focus on platform health):**
- Platform-wide trends
- Risk indicators
- Growth opportunities
- Regulatory compliance concerns

Provide:
1. **Summary**: A brief executive summary
2. **Insights**: 3-5 data-driven insights with actionable recommendations
3. **Predictions**: Future trends based on current data
4. **Recommendations**: Prioritized action items
5. **Alerts**: Any warnings or opportunities to highlight

Be specific with numbers and percentages where data allows. Focus on actionable insights that can improve outcomes.`,
});

const smartInsightsFlow = ai.defineFlow(
    {
        name: 'smartInsightsFlow',
        inputSchema: SmartInsightsInputSchema,
        outputSchema: SmartInsightsOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
