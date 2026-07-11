"use client";

import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { MessageActions } from './MessageActions';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageBubbleProps {
    role: 'user' | 'ai';
    content: string | React.ReactNode;
    time?: string;
    onCopy?: () => void;
    onRegenerate?: () => void;
    onLike?: () => void;
    onDislike?: () => void;
    onShare?: () => void;
    liked?: boolean;
    disliked?: boolean;
}

export function MessageBubble({
    role, content, time, onCopy, onRegenerate, onLike, onDislike, onShare, liked, disliked
}: MessageBubbleProps) {
    const isUser = role === 'user';

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`flex gap-3 w-full group ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            {!isUser && (
                <div className="size-8 rounded-full bg-[#1E293B] border border-[#334155] flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Bot className="size-4 text-[#10B981]" />
                </div>
            )}
            
            <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-4 text-sm leading-relaxed shadow-sm ${
                    isUser 
                        ? 'bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-[#F8FAFC] rounded-2xl rounded-tr-sm' 
                        : 'bg-transparent text-[#F8FAFC] w-full'
                }`}>
                    {typeof content === 'string' && !isUser ? (
                        <MarkdownRenderer content={content} />
                    ) : typeof content === 'string' && isUser ? (
                        <div className="whitespace-pre-wrap">{content}</div>
                    ) : (
                        content
                    )}
                </div>

                <div className={`flex items-center gap-2 mt-0.5 w-full ${isUser ? 'justify-end pr-1' : 'ml-1'}`}>
                    <span className="text-[10px] text-[#94A3B8] font-medium px-1">{time}</span>
                    
                    {!isUser && onCopy && onRegenerate && onLike && onDislike && onShare && (
                        <MessageActions 
                            onCopy={onCopy}
                            onRegenerate={onRegenerate}
                            onLike={onLike}
                            onDislike={onDislike}
                            onShare={onShare}
                            liked={liked}
                            disliked={disliked}
                        />
                    )}
                    {isUser && (
                        <span className="text-[10px] text-[#3B82F6]">✓</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
