"use client";

import { motion } from 'framer-motion';

interface QuickPromptChipsProps {
    prompts: string[];
    onSelect: (prompt: string) => void;
    disabled?: boolean;
}

export function QuickPromptChips({ prompts, onSelect, disabled }: QuickPromptChipsProps) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide px-1">
            {prompts.map((prompt, index) => (
                <motion.button
                    key={prompt}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    type="button"
                    onClick={() => onSelect(prompt)}
                    disabled={disabled}
                    className="whitespace-nowrap px-4 py-2 rounded-full border border-[#334155] bg-[#1E293B] text-xs font-medium text-[#F8FAFC] hover:bg-[#334155] hover:border-[#10B981]/50 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                >
                    {prompt}
                </motion.button>
            ))}
        </div>
    );
}
