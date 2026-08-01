"use client";

import { Bot, Plus, Trash2, Download, User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatHeaderProps {
    onNewChat?: () => void;
    onClearChat?: () => void;
    onExport?: () => void;
}

export function ChatHeader({ onNewChat, onClearChat, onExport }: ChatHeaderProps) {
    return (
        <div className="sticky top-0 z-10 bg-[#0a0520]/90 backdrop-blur-xl border-b border-[#38bdf8]/30 px-4 sm:px-6 py-4 flex items-center justify-between shadow-[0_4px_20px_rgba(56,189,248,0.1)]">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-[#ec4899]/10 rounded-xl border border-[#ec4899]/40 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                    <Sparkles className="size-6 text-[#ec4899]" />
                </div>
                <div>
                    <h2 className="font-bold text-[#F8FAFC] flex items-center gap-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                        InVolution AI
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0f0a29] rounded-full border border-[#38bdf8]/40 shadow-[0_0_8px_rgba(56,189,248,0.2)]">
                            <span className="size-1.5 rounded-full bg-[#38bdf8] animate-[ping_2s_infinite]"></span>
                            <span className="text-[10px] font-medium text-[#38bdf8]">Online</span>
                        </span>
                    </h2>
                    <p className="text-xs text-[#8b5cf6]">AI Startup Intelligence</p>
                </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onNewChat}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] hover:from-[#7c3aed] hover:to-[#db2777] text-white text-sm font-bold transition-all shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                >
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">New Chat</span>
                </motion.button>
                
                <div className="h-6 w-px bg-[#38bdf8]/20 mx-1"></div>
                
                <button onClick={onClearChat} className="p-2 text-[#8b5cf6] hover:text-[#ec4899] hover:bg-[#ec4899]/10 rounded-lg transition-colors" title="Clear Chat">
                    <Trash2 className="size-4" />
                </button>
                <button onClick={onExport} className="p-2 text-[#8b5cf6] hover:text-[#38bdf8] hover:bg-[#38bdf8]/10 rounded-lg transition-colors hidden sm:block" title="Export">
                    <Download className="size-4" />
                </button>
                
                <div className="h-6 w-px bg-[#38bdf8]/20 mx-1 hidden sm:block"></div>
                
                <button className="size-8 rounded-full bg-[#0f0a29] border border-[#38bdf8]/40 flex items-center justify-center hover:shadow-[0_0_12px_rgba(56,189,248,0.5)] transition-all shrink-0">
                    <User className="size-4 text-[#38bdf8]" />
                </button>
            </div>
        </div>
    );
}
