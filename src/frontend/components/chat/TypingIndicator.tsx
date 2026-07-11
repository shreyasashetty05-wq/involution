"use client";

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex gap-3 w-full justify-start group"
        >
            <div className="size-8 rounded-full bg-[#1E293B] border border-[#334155] flex items-center justify-center shrink-0 mt-1 shadow-sm relative overflow-hidden">
                <motion.div 
                    className="absolute inset-0 bg-[#10B981]/20"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <Bot className="size-4 text-[#10B981] relative z-10" />
            </div>
            
            <div className="flex flex-col gap-2 max-w-[85%] items-start">
                <div className="px-5 py-4 bg-transparent text-[#F8FAFC] w-full shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-[#10B981] font-medium tracking-wide">Analyzing startup</span>
                        <div className="flex gap-1.5">
                            <motion.div className="size-1.5 bg-[#10B981] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                            <motion.div className="size-1.5 bg-[#10B981] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                            <motion.div className="size-1.5 bg-[#10B981] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                        </div>
                    </div>

                    {/* Skeleton placeholders to simulate structured response incoming */}
                    <div className="flex flex-col gap-3 w-full mt-5 opacity-40">
                        <div className="h-4 bg-[#1E293B] rounded-md w-1/3 animate-pulse border border-[#334155]"></div>
                        <div className="space-y-2">
                            <div className="h-2.5 bg-[#1E293B] rounded w-full animate-pulse"></div>
                            <div className="h-2.5 bg-[#1E293B] rounded w-[90%] animate-pulse"></div>
                            <div className="h-2.5 bg-[#1E293B] rounded w-[75%] animate-pulse"></div>
                        </div>
                        <div className="h-24 bg-[#1E293B] rounded-xl w-full mt-2 animate-pulse border border-[#334155]"></div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
