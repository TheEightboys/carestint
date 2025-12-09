"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatWithAssistant, type ChatInput, type ChatOutput } from '@/ai/flows/chat-assistant';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    suggestedActions?: ChatOutput['suggestedActions'];
    timestamp: Date;
}

interface AIChatbotProps {
    userType?: 'employer' | 'professional' | 'guest';
    currentPage?: string;
}

export function AIChatbot({ userType = 'guest', currentPage }: AIChatbotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "👋 Hi! I'm your CareStint assistant. I can help you with:\n\n• Understanding how the platform works\n• Navigating stints and applications\n• Payment and fee questions\n• Account and profile issues\n\nWhat can I help you with today?",
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Build conversation history for context
            const history = messages.slice(-6).map(m => ({
                role: m.role,
                content: m.content.substring(0, 200)
            }));

            const chatInput: ChatInput = {
                message: userMessage.content,
                userType,
                currentPage,
                conversationHistory: JSON.stringify(history),
            };

            const response = await chatWithAssistant(chatInput);

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.response,
                suggestedActions: response.suggestedActions,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);

            if (response.needsHumanSupport) {
                const supportMessage: Message = {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    content: "📧 This query might need human support. You can reach our team at support@carestint.com or call +254 700 000 000.",
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, supportMessage]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or contact support@carestint.com for immediate help.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickQuestion = (question: string) => {
        setInput(question);
        setTimeout(() => handleSend(), 100);
    };

    const quickQuestions = [
        "How do fees work?",
        "How do I post a stint?",
        "When do I get paid?",
    ];

    return (
        <>
            {/* Chat Toggle Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
                    "bg-gradient-to-r from-accent to-primary hover:scale-110 hover:shadow-xl",
                    isOpen && "rotate-90"
                )}
                size="icon"
            >
                {isOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <MessageCircle className="h-6 w-6" />
                )}
            </Button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] rounded-2xl border bg-background shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="flex items-center gap-3 border-b px-4 py-3 bg-gradient-to-r from-accent/10 to-primary/10 rounded-t-2xl">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-accent to-primary">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold">CareStint Assistant</h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Sparkles className="h-3 w-3 text-accent" />
                                <span>Powered by AI</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex gap-2",
                                        message.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-accent/20 to-primary/20">
                                            <Bot className="h-4 w-4 text-accent" />
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                                            message.role === 'user'
                                                ? "bg-accent text-accent-foreground rounded-br-none"
                                                : "bg-muted rounded-bl-none"
                                        )}
                                    >
                                        <p className="whitespace-pre-wrap">{message.content}</p>

                                        {/* Suggested Actions */}
                                        {message.suggestedActions && message.suggestedActions.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {message.suggestedActions.map((action, idx) => (
                                                    <Button
                                                        key={idx}
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs"
                                                        onClick={() => {
                                                            if (action.action === 'navigate' && action.target) {
                                                                window.location.href = action.target;
                                                            }
                                                        }}
                                                    >
                                                        {action.label}
                                                        {action.action === 'navigate' && <ExternalLink className="ml-1 h-3 w-3" />}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {message.role === 'user' && (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                                            <User className="h-4 w-4 text-accent-foreground" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-2">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-accent/20 to-primary/20">
                                        <Bot className="h-4 w-4 text-accent" />
                                    </div>
                                    <div className="rounded-2xl rounded-bl-none bg-muted px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <div className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: '0ms' }} />
                                            <div className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: '150ms' }} />
                                            <div className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Quick Questions */}
                    {messages.length === 1 && (
                        <div className="border-t px-4 py-3">
                            <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                            <div className="flex flex-wrap gap-2">
                                {quickQuestions.map((q, idx) => (
                                    <Button
                                        key={idx}
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => handleQuickQuestion(q)}
                                    >
                                        {q}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="border-t p-4">
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                size="icon"
                                className="shrink-0"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
