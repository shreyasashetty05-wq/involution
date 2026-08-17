"use client";

import { Mic, Square } from 'lucide-react';
import { useEffect } from 'react';

interface VoiceRecorderProps {
    isListening: boolean;
    isSupported: boolean;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
    clearError: () => void;
}

export function VoiceRecorder({ 
    isListening, isSupported, error, startListening, stopListening, clearError 
}: VoiceRecorderProps) {
    
    // Display error toast/alert if there's an error
    useEffect(() => {
        if (error) {
            // Using standard alert as fallback for toast, to ensure it doesn't fail silently
            alert(`Voice Input Error: ${error}`);
            clearError();
        }
    }, [error, clearError]);

    if (!isSupported) {
        return (
            <button
                type="button"
                disabled
                className="p-2.5 min-w-[44px] min-h-[44px] rounded-full text-[#334155] cursor-not-allowed flex items-center justify-center relative group"
                title="Voice input is not supported in this browser."
            >
                <Mic className="size-4" />
                {/* Tooltip for unsupported browsers */}
                <span className="absolute bottom-full mb-2 hidden group-hover:block w-max px-2 py-1 bg-[#1E293B] text-xs text-[#F8FAFC] rounded shadow-lg border border-[#334155]">
                    Voice input is not supported in this browser.
                </span>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`p-2.5 min-w-[44px] min-h-[44px] rounded-full transition-all flex items-center justify-center relative group ${
                isListening 
                    ? 'bg-red-500 text-white' 
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155]'
            }`}
            title={isListening ? "Stop listening" : "Voice input"}
        >
            {isListening && (
                <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-75"></span>
            )}
            {isListening ? (
                <Square className="size-4 z-10 fill-current" />
            ) : (
                <Mic className="size-4 z-10" />
            )}

            {/* Custom Tooltip */}
            <span className="absolute bottom-full mb-2 hidden group-hover:block w-max px-2 py-1 bg-[#1E293B] text-xs text-[#F8FAFC] rounded shadow-lg border border-[#334155] z-50">
                {isListening ? "Listening... (Click to stop)" : "Voice input (Click to start)"}
            </span>
        </button>
    );
}
