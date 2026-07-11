"use client";

import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';

interface MessageActionsProps {
    onCopy: () => void;
    onRegenerate: () => void;
    onLike: () => void;
    onDislike: () => void;
    onShare: () => void;
    liked?: boolean;
    disliked?: boolean;
}

export function MessageActions({ onCopy, onRegenerate, onLike, onDislike, onShare, liked, disliked }: MessageActionsProps) {
    return (
        <div className="flex items-center gap-1 mt-2 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
            <button onClick={onCopy} className="p-1.5 rounded-md hover:bg-[#334155] hover:text-[#F8FAFC] transition-colors" title="Copy">
                <Copy className="size-3.5" />
            </button>
            <button onClick={onRegenerate} className="p-1.5 rounded-md hover:bg-[#334155] hover:text-[#F8FAFC] transition-colors" title="Regenerate">
                <RefreshCw className="size-3.5" />
            </button>
            <button 
                onClick={onLike} 
                disabled={liked || disliked}
                className={`p-1.5 rounded-md hover:bg-[#334155] transition-colors ${liked ? 'text-[#10B981] opacity-100' : 'hover:text-[#F8FAFC]'}`} 
                title="Like"
            >
                <ThumbsUp className="size-3.5" />
            </button>
            <button 
                onClick={onDislike} 
                disabled={liked || disliked}
                className={`p-1.5 rounded-md hover:bg-[#334155] transition-colors ${disliked ? 'text-red-500 opacity-100' : 'hover:text-[#F8FAFC]'}`} 
                title="Dislike"
            >
                <ThumbsDown className="size-3.5" />
            </button>
            <button onClick={onShare} className="p-1.5 rounded-md hover:bg-[#334155] hover:text-[#F8FAFC] transition-colors" title="Share">
                <Share2 className="size-3.5" />
            </button>
        </div>
    );
}
