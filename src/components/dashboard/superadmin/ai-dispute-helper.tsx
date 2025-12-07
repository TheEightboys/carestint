"use client";

import { useState } from 'react';
import { Brain, Sparkles, CheckCircle, XCircle, Loader2, AlertTriangle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface DisputeCase {
    id: string;
    issueType: string;
    employerName: string;
    professionalName: string;
    description: string;
    openedAt: Date;
    status: string;
}

interface AIResolution {
    recommendation: 'favor_employer' | 'favor_professional' | 'split_decision' | 'needs_investigation';
    confidence: number;
    reasoning: string;
    suggestedActions: string[];
    previousCases: {
        similarity: number;
        outcome: string;
        description: string;
    }[];
    payoutRecommendation: {
        employerRefund: number;
        professionalPayout: number;
    };
}

const mockAIResolution: AIResolution = {
    recommendation: 'favor_professional',
    confidence: 0.87,
    reasoning: "Based on analysis of 23 similar cases in the Nairobi region involving no-show disputes for RN roles, the evidence suggests the professional was present. Clock-in records show on-time arrival, and similar past cases with this employer pattern resulted in 78% rulings in favor of professionals.",
    suggestedActions: [
        "Request geo-location verification from clock-in data",
        "Contact facility security for entrance logs",
        "Review employer's dispute history (3 similar cases in 6 months)",
        "Process full payout to professional"
    ],
    previousCases: [
        { similarity: 0.94, outcome: "Professional favored", description: "Similar no-show claim resolved with clock-in evidence" },
        { similarity: 0.88, outcome: "Professional favored", description: "RN dispute at same facility, same outcome" },
        { similarity: 0.82, outcome: "Split decision", description: "Partial payment due to late arrival" }
    ],
    payoutRecommendation: {
        employerRefund: 0,
        professionalPayout: 100
    }
};

interface AiDisputeHelperProps {
    dispute?: DisputeCase;
    onApplyResolution?: (resolution: AIResolution) => void;
}

export function AiDisputeHelper({ dispute, onApplyResolution }: AiDisputeHelperProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [resolution, setResolution] = useState<AIResolution | null>(null);

    const analyzeDispute = async () => {
        setIsAnalyzing(true);
        // Simulate AI analysis
        await new Promise(resolve => setTimeout(resolve, 2000));
        setResolution(mockAIResolution);
        setIsAnalyzing(false);
    };

    const getRecommendationColor = (rec: AIResolution['recommendation']) => {
        switch (rec) {
            case 'favor_employer': return 'text-blue-500 bg-blue-500/10';
            case 'favor_professional': return 'text-green-500 bg-green-500/10';
            case 'split_decision': return 'text-yellow-500 bg-yellow-500/10';
            case 'needs_investigation': return 'text-orange-500 bg-orange-500/10';
        }
    };

    const getRecommendationLabel = (rec: AIResolution['recommendation']) => {
        switch (rec) {
            case 'favor_employer': return 'Favor Employer';
            case 'favor_professional': return 'Favor Professional';
            case 'split_decision': return 'Split Decision';
            case 'needs_investigation': return 'Needs Investigation';
        }
    };

    return (
        <Card className="border-accent/20">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="h-5 w-5 text-accent" />
                    AI Dispute Resolution Helper
                    <Badge variant="outline" className="ml-2 text-xs font-normal">Beta</Badge>
                </CardTitle>
                <CardDescription>
                    AI-powered analysis based on historical dispute patterns and case outcomes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!resolution && !isAnalyzing && (
                    <div className="text-center py-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
                            <Sparkles className="h-8 w-8 text-accent" />
                        </div>
                        <p className="text-muted-foreground mb-4">
                            Click below to analyze this dispute using AI-powered case matching.
                        </p>
                        <Button onClick={analyzeDispute} className="gap-2">
                            <Brain className="h-4 w-4" />
                            Analyze Dispute
                        </Button>
                    </div>
                )}

                {isAnalyzing && (
                    <div className="text-center py-8">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-accent mb-4" />
                        <p className="text-muted-foreground">Analyzing dispute patterns...</p>
                        <p className="text-xs text-muted-foreground mt-2">Comparing with 1,247 historical cases</p>
                    </div>
                )}

                {resolution && (
                    <div className="space-y-6">
                        {/* Recommendation Header */}
                        <div className={cn(
                            "flex items-center justify-between p-4 rounded-lg",
                            getRecommendationColor(resolution.recommendation)
                        )}>
                            <div className="flex items-center gap-3">
                                <Scale className="h-6 w-6" />
                                <div>
                                    <p className="font-semibold">{getRecommendationLabel(resolution.recommendation)}</p>
                                    <p className="text-sm opacity-80">AI Recommendation</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">{Math.round(resolution.confidence * 100)}%</p>
                                <p className="text-xs opacity-80">Confidence</p>
                            </div>
                        </div>

                        {/* Reasoning */}
                        <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Brain className="h-4 w-4" />
                                Analysis
                            </h4>
                            <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                                {resolution.reasoning}
                            </p>
                        </div>

                        {/* Suggested Actions */}
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Suggested Actions</h4>
                            <ul className="space-y-2">
                                {resolution.suggestedActions.map((action, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Similar Cases */}
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Similar Historical Cases</h4>
                            <div className="space-y-2">
                                {resolution.previousCases.map((case_, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm p-2 bg-secondary/30 rounded">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {Math.round(case_.similarity * 100)}% match
                                            </Badge>
                                            <span className="text-muted-foreground">{case_.description}</span>
                                        </div>
                                        <Badge
                                            variant={case_.outcome.includes('Professional') ? 'default' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {case_.outcome}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payout Recommendation */}
                        <div className="bg-secondary/50 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold mb-3">Recommended Payout Split</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-background rounded-lg">
                                    <p className="text-2xl font-bold text-blue-500">{resolution.payoutRecommendation.employerRefund}%</p>
                                    <p className="text-xs text-muted-foreground">Employer Refund</p>
                                </div>
                                <div className="text-center p-3 bg-background rounded-lg">
                                    <p className="text-2xl font-bold text-green-500">{resolution.payoutRecommendation.professionalPayout}%</p>
                                    <p className="text-xs text-muted-foreground">Professional Payout</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                className="flex-1 gap-2"
                                onClick={() => onApplyResolution?.(resolution)}
                            >
                                <CheckCircle className="h-4 w-4" />
                                Apply Resolution
                            </Button>
                            <Button variant="outline" className="gap-2" onClick={() => setResolution(null)}>
                                <XCircle className="h-4 w-4" />
                                Dismiss
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            AI suggestions are advisory only. Final decisions should consider all available evidence.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
