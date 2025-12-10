"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    MessageCircle,
    Send,
    ArrowLeft,
    Loader2,
    User,
    Building
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getConversations,
    getMessages,
    sendMessage,
    markMessagesAsRead,
    subscribeToMessages,
    type ChatConversation,
    type ChatMessage,
} from "@/lib/firebase/chat";

interface ChatProps {
    userId: string;
    userName: string;
    userType: 'employer' | 'professional';
}

export function Chat({ userId, userName, userType }: ChatProps) {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load conversations
    useEffect(() => {
        const loadConversations = async () => {
            setIsLoading(true);
            const convs = await getConversations(userId, userType);
            setConversations(convs);
            setIsLoading(false);
        };
        loadConversations();
    }, [userId, userType]);

    // Subscribe to messages when conversation is selected
    useEffect(() => {
        if (!selectedConversation?.id) return;

        // Mark messages as read
        markMessagesAsRead(selectedConversation.id, userType);

        // Subscribe to real-time updates
        const unsubscribe = subscribeToMessages(selectedConversation.id, (msgs) => {
            setMessages(msgs);
            // Scroll to bottom on new messages
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }, 100);
        });

        return () => unsubscribe();
    }, [selectedConversation, userType]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation?.id) return;

        setIsSending(true);
        const success = await sendMessage(
            selectedConversation.id,
            userId,
            userName,
            userType,
            newMessage.trim()
        );

        if (success) {
            setNewMessage("");
        }
        setIsSending(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const getOtherPartyName = (conv: ChatConversation) => {
        return userType === 'employer' ? conv.professionalName : conv.employerName;
    };

    const getUnreadCount = (conv: ChatConversation) => {
        return userType === 'employer' ? conv.unreadByEmployer : conv.unreadByProfessional;
    };

    if (isLoading) {
        return (
            <Card className="h-[500px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    // Conversation list view
    if (!selectedConversation) {
        return (
            <Card className="h-[500px]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Messages
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[350px] text-center">
                            <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">No conversations yet</p>
                            <p className="text-sm text-muted-foreground/80">
                                {userType === 'employer'
                                    ? "Start a chat when you accept a professional for a stint"
                                    : "Start a chat when you're accepted for a stint"
                                }
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[350px]">
                            <div className="space-y-2">
                                {conversations.map((conv) => (
                                    <div
                                        key={conv.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                            "hover:bg-secondary/80 border"
                                        )}
                                        onClick={() => setSelectedConversation(conv)}
                                    >
                                        <Avatar>
                                            <AvatarFallback className="bg-primary/10">
                                                {userType === 'employer' ? (
                                                    <User className="h-4 w-4" />
                                                ) : (
                                                    <Building className="h-4 w-4" />
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium truncate">
                                                    {getOtherPartyName(conv)}
                                                </p>
                                                {getUnreadCount(conv) > 0 && (
                                                    <Badge variant="destructive" className="ml-2">
                                                        {getUnreadCount(conv)}
                                                    </Badge>
                                                )}
                                            </div>
                                            {conv.lastMessage && (
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {conv.lastMessage}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Chat view
    return (
        <Card className="h-[500px] flex flex-col">
            <CardHeader className="border-b py-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedConversation(null)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar>
                        <AvatarFallback className="bg-primary/10">
                            {userType === 'employer' ? (
                                <User className="h-4 w-4" />
                            ) : (
                                <Building className="h-4 w-4" />
                            )}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-base">
                            {getOtherPartyName(selectedConversation)}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Stint Chat
                        </p>
                    </div>
                </div>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            <p>No messages yet</p>
                            <p className="text-sm">Send a message to start the conversation</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isOwn = msg.senderId === userId;
                            return (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex",
                                        isOwn ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[75%] rounded-2xl px-4 py-2",
                                            isOwn
                                                ? "bg-primary text-primary-foreground rounded-br-md"
                                                : "bg-secondary rounded-bl-md"
                                        )}
                                    >
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {msg.message}
                                        </p>
                                        <p className={cn(
                                            "text-[10px] mt-1",
                                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                        )}>
                                            {msg.createdAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-3">
                <div className="flex gap-2">
                    <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isSending}
                        className="flex-1"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        size="icon"
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
