"use client";

import { useState, useRef, useEffect } from 'react';
import { ChatHeader } from './chat/ChatHeader';
import { MessageBubble } from './chat/MessageBubble';
import { ChatInput } from './chat/ChatInput';
import { TypingIndicator } from './chat/TypingIndicator';
import { UploadedFile } from './chat/FileUploader';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

interface AIChatProps {
    startupId: string;
}

interface Message {
    role: 'user' | 'ai';
    content: string | React.ReactNode;
    feedback?: 'upvote' | 'downvote';
    time?: string;
}

const QUICK_PROMPTS = ["Market Size", "Funding", "SWOT", "Competitors", "Risks", "Business Model", "Growth Strategy"];

const INITIAL_MESSAGE = `### NexaFlow AI Setup Complete
I've analyzed the startup's profile. Here's what I can help you discover:

* **Market Opportunity:** Sizing and trends
* **Revenue Model:** Pricing strategy and unit economics
* **Risks:** Market, execution, and competitive threats
* **Competitors:** Direct and indirect alternatives
* **Growth Potential:** Scalability and GTM

Feel free to ask a specific question or use one of the quick prompts below!`;

export default function AIChat({ startupId }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        { 
            role: 'ai', 
            content: INITIAL_MESSAGE,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Auto-scroll logic
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 150);
    };

    const handleFeedback = async (index: number, type: 'upvote' | 'downvote') => {
        const msg = messages[index];
        if (msg.role !== 'ai' || msg.feedback) return;

        setMessages(prev => prev.map((m, i) => (i === index ? { ...m, feedback: type } : m)));

        try {
            await fetch('/api/ai-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startupId,
                    module: 'chat',
                    context: index > 0 && typeof messages[index - 1].content === 'string' ? messages[index - 1].content : '',
                    aiResponse: typeof msg.content === 'string' ? msg.content : 'Rich Content',
                    feedbackType: type
                })
            });
        } catch (error) {
            console.error("Failed to submit feedback", error);
        }
    };

    const handleCopy = (content: string | React.ReactNode) => {
        if (typeof content === 'string') {
            navigator.clipboard.writeText(content);
        }
    };

    const handleSubmit = async (userMessage: string, files: UploadedFile[]) => {
        if (!userMessage.trim() && files.length === 0) return;

        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let displayMessage = userMessage;
        if (files.length > 0) {
            const fileNames = files.map(f => f.name).join(', ');
            displayMessage += `\n\n*(Attached: ${fileNames})*`;
        }
        
        setMessages(prev => [...prev, { role: 'user', content: displayMessage, time: currentTime }]);
        setIsLoading(true);

        try {
            // Note: If backend supported files, we'd send FormData here.
            // For now, we preserve the existing API structure.
            const res = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startupId, question: userMessage })
            });

            const data = await res.json();
            const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (data.success) {
                setMessages(prev => [...prev, { role: 'ai', content: data.answer, time: aiTime }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error analyzing that request.", time: aiTime }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, there was a network error.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
        if (messages.length === 0) {
            alert("No messages to share.");
            return;
        }

        try {
            const res = await fetch('/api/chat/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to generate share link.");
            }

            const data = await res.json();
            const { shareUrl } = data;

            const title = 'NexaFlow AI Conversation';
            
            const copyToClipboard = async (text: string) => {
                try {
                    await navigator.clipboard.writeText(text);
                    alert("✓ Share link copied.");
                } catch (err) {
                    alert("Failed to copy link to clipboard.");
                }
            };

            if (navigator.share && window.isSecureContext) {
                try {
                    await navigator.share({
                        title: title,
                        text: "Check out this AI conversation!",
                        url: shareUrl,
                    });
                } catch (error: any) {
                    if (error.name !== 'AbortError') {
                        await copyToClipboard(shareUrl);
                    }
                }
            } else {
                await copyToClipboard(shareUrl);
            }
        } catch (err: any) {
            alert(`Share Failed: ${err.message}`);
        }
    };

    return (
        <div className="w-full flex flex-col bg-[#0F172A] border border-[#334155] rounded-[24px] overflow-hidden shadow-2xl h-[700px] max-h-[85vh] font-sans relative">
            <ChatHeader 
                onNewChat={() => setMessages([{ role: 'ai', content: INITIAL_MESSAGE, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])}
                onClearChat={() => setMessages([])}
                onExport={() => alert("Export chat function triggered.")}
            />

            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 scroll-smooth"
            >
                <AnimatePresence>
                    {messages.map((msg, i) => (
                        <MessageBubble 
                            key={i} 
                            role={msg.role} 
                            content={msg.content} 
                            time={msg.time}
                            onCopy={() => handleCopy(msg.content)}
                            onRegenerate={() => {
                                if (i > 0 && messages[i-1].role === 'user') {
                                    handleSubmit(messages[i-1].content as string, []);
                                }
                            }}
                            onLike={() => handleFeedback(i, 'upvote')}
                            onDislike={() => handleFeedback(i, 'downvote')}
                            onShare={handleShare}
                            liked={msg.feedback === 'upvote'}
                            disliked={msg.feedback === 'downvote'}
                        />
                    ))}
                </AnimatePresence>
                
                {isLoading && <TypingIndicator />}
                
                <div ref={messagesEndRef} className="h-4" />
            </div>

            <AnimatePresence>
                {showScrollButton && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={scrollToBottom}
                        className="absolute bottom-[180px] right-8 p-2.5 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-full shadow-lg hover:bg-[#334155] transition-colors z-20"
                    >
                        <ArrowDown className="size-4" />
                    </motion.button>
                )}
            </AnimatePresence>

            <ChatInput 
                onSubmit={handleSubmit} 
                isLoading={isLoading} 
                quickPrompts={QUICK_PROMPTS} 
            />
        </div>
    );
}
