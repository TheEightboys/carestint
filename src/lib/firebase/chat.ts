'use client';

import { db } from './clientApp';
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    onSnapshot,
    doc,
    updateDoc,
    limit,
    getDoc
} from 'firebase/firestore';

// =============================================
// MODULE REQUEST TRACKING
// =============================================

export interface ModuleRequest {
    id?: string;
    requestedBy: string; // admin email/id
    moduleName: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
    createdAt: Date;
    updatedAt?: Date;
}

export async function submitModuleRequest(request: Omit<ModuleRequest, 'id' | 'createdAt' | 'status'>): Promise<string | null> {
    if (!db) return null;

    try {
        const docRef = await addDoc(collection(db, 'moduleRequests'), {
            ...request,
            status: 'pending',
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error submitting module request:', error);
        return null;
    }
}

export async function getModuleRequests(): Promise<ModuleRequest[]> {
    if (!db) return [];

    try {
        const q = query(collection(db, 'moduleRequests'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
        })) as ModuleRequest[];
    } catch (error) {
        console.error('Error getting module requests:', error);
        return [];
    }
}

// =============================================
// CHAT SYSTEM
// =============================================

export interface ChatMessage {
    id?: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderType: 'employer' | 'professional';
    message: string;
    createdAt: Date;
    read: boolean;
}

export interface ChatConversation {
    id?: string;
    stintId: string;
    employerId: string;
    employerName: string;
    professionalId: string;
    professionalName: string;
    lastMessage?: string;
    lastMessageAt?: Date;
    unreadByEmployer: number;
    unreadByProfessional: number;
    createdAt: Date;
}

/**
 * Get or create a conversation for a stint
 */
export async function getOrCreateConversation(
    stintId: string,
    employerId: string,
    employerName: string,
    professionalId: string,
    professionalName: string
): Promise<string | null> {
    if (!db) return null;

    try {
        // Check if conversation exists
        const q = query(
            collection(db, 'conversations'),
            where('stintId', '==', stintId),
            where('employerId', '==', employerId),
            where('professionalId', '==', professionalId),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return snapshot.docs[0].id;
        }

        // Create new conversation
        const docRef = await addDoc(collection(db, 'conversations'), {
            stintId,
            employerId,
            employerName,
            professionalId,
            professionalName,
            unreadByEmployer: 0,
            unreadByProfessional: 0,
            createdAt: Timestamp.now(),
        });

        return docRef.id;
    } catch (error) {
        console.error('Error getting/creating conversation:', error);
        return null;
    }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderType: 'employer' | 'professional',
    message: string
): Promise<boolean> {
    if (!db) return false;

    try {
        // Add message
        await addDoc(collection(db, 'messages'), {
            conversationId,
            senderId,
            senderName,
            senderType,
            message,
            read: false,
            createdAt: Timestamp.now(),
        });

        // Update conversation with last message
        const convRef = doc(db, 'conversations', conversationId);
        const unreadField = senderType === 'employer' ? 'unreadByProfessional' : 'unreadByEmployer';

        // Get current unread count
        const convDoc = await getDoc(convRef);
        const currentUnread = convDoc.data()?.[unreadField] || 0;

        await updateDoc(convRef, {
            lastMessage: message.substring(0, 100),
            lastMessageAt: Timestamp.now(),
            [unreadField]: currentUnread + 1,
        });

        return true;
    } catch (error) {
        console.error('Error sending message:', error);
        return false;
    }
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
    if (!db) return [];

    try {
        const q = query(
            collection(db, 'messages'),
            where('conversationId', '==', conversationId),
            orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
        })) as ChatMessage[];
    } catch (error) {
        console.error('Error getting messages:', error);
        return [];
    }
}

/**
 * Subscribe to messages (real-time updates)
 */
export function subscribeToMessages(
    conversationId: string,
    callback: (messages: ChatMessage[]) => void
): () => void {
    if (!db) return () => { };

    const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
        })) as ChatMessage[];
        callback(messages);
    });
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
    conversationId: string,
    readerType: 'employer' | 'professional'
): Promise<void> {
    if (!db) return;

    try {
        const convRef = doc(db, 'conversations', conversationId);
        const unreadField = readerType === 'employer' ? 'unreadByEmployer' : 'unreadByProfessional';

        await updateDoc(convRef, {
            [unreadField]: 0,
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

/**
 * Get conversations for a user
 */
export async function getConversations(
    userId: string,
    userType: 'employer' | 'professional'
): Promise<ChatConversation[]> {
    if (!db) return [];

    try {
        const fieldName = userType === 'employer' ? 'employerId' : 'professionalId';
        const q = query(
            collection(db, 'conversations'),
            where(fieldName, '==', userId),
            orderBy('lastMessageAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            lastMessageAt: doc.data().lastMessageAt?.toDate(),
        })) as ChatConversation[];
    } catch (error) {
        console.error('Error getting conversations:', error);
        return [];
    }
}

/**
 * Get total unread count for a user
 */
export async function getUnreadCount(
    userId: string,
    userType: 'employer' | 'professional'
): Promise<number> {
    if (!db) return 0;

    try {
        const conversations = await getConversations(userId, userType);
        const unreadField = userType === 'employer' ? 'unreadByEmployer' : 'unreadByProfessional';
        return conversations.reduce((sum, conv) => sum + ((conv as any)[unreadField] || 0), 0);
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
}
