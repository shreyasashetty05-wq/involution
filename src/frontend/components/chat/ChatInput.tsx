"use client";

import { ArrowUp } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { VoiceRecorder } from './VoiceRecorder';
import { FileUploader, FileChips, UploadedFile } from './FileUploader';
import { QuickPromptChips } from './QuickPromptChips';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface ChatInputProps {
    onSubmit: (message: string, files: UploadedFile[]) => void;
    isLoading?: boolean;
    quickPrompts?: string[];
}

export function ChatInput({ onSubmit, isLoading, quickPrompts }: ChatInputProps) {
    const [input, setInput] = useState("");
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-grow textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [input]);

    const handleFilesSelected = (newFiles: File[]) => {
        const uploaded = newFiles.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
            file: f
        }));
        setFiles(prev => [...prev, ...uploaded]);
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleTranscription = useCallback((text: string) => {
        setInput(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text);
    }, []);

    const { 
        isListening, 
        isSupported, 
        error, 
        interimResult,
        startListening, 
        stopListening, 
        clearError 
    } = useSpeechRecognition(handleTranscription);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        // If listening, stop it (user commits current text)
        if (isListening) stopListening();

        // Calculate final text combining input and any lingering interim text before submission
        const displayValue = input + (interimResult ? (input && !input.endsWith(' ') ? ' ' : '') + interimResult : '');
        const finalText = displayValue.trim();
        
        if ((!finalText && files.length === 0) || isLoading) return;
        
        onSubmit(finalText, files);
        setInput("");
        setFiles([]);
        
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Calculate display value combining committed input and live interim text
    const displayValue = input + (interimResult ? (input && !input.endsWith(' ') ? ' ' : '') + interimResult : '');

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        // If the user types manually, abort the current speech recognition to prevent duplicate appends
        if (isListening) {
            stopListening();
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-gradient-to-t from-[#0a0520] via-[#0a0520]/90 to-transparent shrink-0">
            {quickPrompts && quickPrompts.length > 0 && (
                <div className="mb-4 max-w-4xl mx-auto w-full">
                    <QuickPromptChips 
                        prompts={quickPrompts} 
                        onSelect={(p) => onSubmit(p, [])} 
                        disabled={isLoading}
                    />
                </div>
            )}
            
            <div className="max-w-4xl mx-auto w-full">
                <div className="bg-[#0f0a29] border border-[#38bdf8]/30 rounded-[24px] shadow-[0_0_15px_rgba(236,72,153,0.1)] transition-all focus-within:border-[#38bdf8]/70 focus-within:ring-1 focus-within:ring-[#38bdf8]/30 relative">
                    <FileChips files={files} onRemove={handleRemoveFile} />
                    
                    <form 
                        onSubmit={handleSubmit} 
                        className="relative flex items-end gap-2 p-2.5"
                    >
                        <div className="flex items-center gap-0.5 mb-0.5">
                            <FileUploader onFilesSelected={handleFilesSelected} />
                            <VoiceRecorder 
                                isListening={isListening}
                                isSupported={isSupported}
                                error={error}
                                startListening={startListening}
                                stopListening={stopListening}
                                clearError={clearError}
                            />
                        </div>
                        
                        <textarea
                            ref={textareaRef}
                            value={displayValue}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            placeholder={isListening ? "Listening..." : "Ask anything about this startup..."}
                            disabled={isLoading}
                            rows={1}
                            className={`flex-1 bg-transparent text-[#F8FAFC] resize-none overflow-y-auto max-h-[200px] py-2.5 px-2 focus:outline-none text-[15px] leading-relaxed scrollbar-hide ${
                                isListening ? "placeholder:text-[#ec4899] animate-pulse" : "placeholder:text-[#8b5cf6]"
                            }`}
                            style={{ minHeight: '44px' }}
                        />
                        
                        <button
                            type="submit"
                            disabled={(!displayValue.trim() && files.length === 0) || isLoading}
                            className="mb-1 p-2.5 ml-1 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] hover:from-[#7c3aed] hover:to-[#db2777] disabled:from-[#1E293B] disabled:to-[#1E293B] disabled:text-[#94A3B8] text-white rounded-full transition-all flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(236,72,153,0.4)] relative group"
                            title="Send Message"
                        >
                            <ArrowUp className="size-4" strokeWidth={3} />
                        </button>
                    </form>
                </div>
                <div className="text-center mt-3 text-xs text-[#94A3B8]">
                    InVolution AI can make mistakes. Verify important information.
                </div>
            </div>
        </div>
    );
}
