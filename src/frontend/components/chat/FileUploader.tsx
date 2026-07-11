"use client";

import { Paperclip, X, FileText } from 'lucide-react';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface UploadedFile {
    name: string;
    size: number;
    type: string;
    file: File;
}

interface FileUploaderProps {
    onFilesSelected: (files: File[]) => void;
}

export function FileUploader({ onFilesSelected }: FileUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
        }
        // Reset so the same file can be uploaded again if removed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept=".pdf,.docx,.txt,.csv,.pptx"
            />
            <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-full text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155] transition-all flex items-center justify-center"
                title="Attach documents"
            >
                <Paperclip className="size-4" />
            </button>
        </>
    );
}

export function FileChips({ files, onRemove }: { files: UploadedFile[], onRemove: (index: number) => void }) {
    if (files.length === 0) return null;
    
    return (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
            <AnimatePresence>
                {files.map((file, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        key={`${file.name}-${idx}`} 
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#1E293B] border border-[#334155] rounded-lg text-xs shadow-sm"
                    >
                        <FileText className="size-3 text-[#3B82F6]" />
                        <span className="text-[#F8FAFC] max-w-[150px] truncate font-medium">{file.name}</span>
                        <span className="text-[#94A3B8]">{(file.size / 1024).toFixed(0)}KB</span>
                        <button 
                            type="button"
                            onClick={() => onRemove(idx)}
                            className="ml-1 p-0.5 rounded-full text-[#94A3B8] hover:text-red-400 hover:bg-[#334155] transition-colors"
                        >
                            <X className="size-3" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
