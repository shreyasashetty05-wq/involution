"use client";

import { Bot, Plus, Trash2, Download, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatHeaderProps {
    onNewChat?: () => void;
    onClearChat?: () => void;
    onExport?: () => void;
}

export function ChatHeader({ onNewChat, onClearChat, onExport }: ChatHeaderProps) {
    return (
        <div className="sticky top-0 z-10 bg-[#0F172A]/80 backdrop-blur-xl border-b border-[#334155] px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-[#10B981]/10 rounded-xl border border-[#10B981]/30">
                    <Bot className="size-6 text-[#10B981]" />
                </div>
                <div>
                    <h2 className="font-bold text-[#F8FAFC] flex items-center gap-2">
                        InVolution AI
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#111827] rounded-full border border-[#334155]">
                            <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                            <span className="text-[10px] font-medium text-[#94A3B8]">Online</span>
                        </span>
                    </h2>
                    <p className="text-xs text-[#94A3B8]">AI Startup Intelligence</p>
                </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onNewChat}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-medium transition-colors"
                >
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">New Chat</span>
                </motion.button>
                
                <div className="h-6 w-px bg-[#334155] mx-1"></div>
                
                <button onClick={onClearChat} className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-lg transition-colors" title="Clear Chat">
                    <Trash2 className="size-4" />
                </button>
                <button onClick={onExport} className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-lg transition-colors hidden sm:block" title="Export">
                    <Download className="size-4" />
                </button>
                
                <div className="h-6 w-px bg-[#334155] mx-1 hidden sm:block"></div>
                
                <button className="size-8 rounded-full bg-[#1E293B] border border-[#334155] flex items-center justify-center hover:ring-2 hover:ring-[#10B981]/50 transition-all shrink-0">
                    <User className="size-4 text-[#F8FAFC]" />
                </button>
            </div>
        </div>
    );
}
