"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from "react";
import { X } from "lucide-react";

export interface ModalOptions {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
}

export interface PromptOptions extends ModalOptions {
    defaultValue?: string;
    placeholder?: string;
}

interface ModalContextType {
    confirm: (options: ModalOptions) => Promise<boolean>;
    prompt: (options: PromptOptions) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
}

type ModalState = 
    | { type: "none" }
    | { type: "confirm"; options: ModalOptions; resolve: (value: boolean) => void }
    | { type: "prompt"; options: PromptOptions; resolve: (value: string | null) => void };

export function ModalProvider({ children }: { children: ReactNode }) {
    const [modalState, setModalState] = useState<ModalState>({ type: "none" });
    const inputRef = useRef<HTMLInputElement>(null);

    const confirm = useCallback((options: ModalOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setModalState({ type: "confirm", options, resolve });
        });
    }, []);

    const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
        return new Promise((resolve) => {
            setModalState({ type: "prompt", options, resolve });
        });
    }, []);

    const handleClose = () => {
        if (modalState.type === "confirm") modalState.resolve(false);
        if (modalState.type === "prompt") modalState.resolve(null);
        setModalState({ type: "none" });
    };

    const handleConfirm = () => {
        if (modalState.type === "confirm") modalState.resolve(true);
        if (modalState.type === "prompt") modalState.resolve(inputRef.current?.value || "");
        setModalState({ type: "none" });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
            if (e.key === "Enter" && modalState.type !== "none") handleConfirm();
        };
        if (modalState.type !== "none") {
            window.addEventListener("keydown", handleKeyDown);
            // focus input if prompt
            if (modalState.type === "prompt") {
                setTimeout(() => inputRef.current?.focus(), 50);
            }
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [modalState]);

    return (
        <ModalContext.Provider value={{ confirm, prompt }}>
            {children}
            {modalState.type !== "none" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={modalState.options.destructive ? undefined : handleClose}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-900">
                                    {modalState.options.title}
                                </h3>
                                {!modalState.options.destructive && (
                                    <button 
                                        onClick={handleClose}
                                        className="text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1"
                                    >
                                        <X className="size-5" />
                                    </button>
                                )}
                            </div>
                            
                            {modalState.options.description && (
                                <p className="text-slate-500 mb-6 leading-relaxed">
                                    {modalState.options.description}
                                </p>
                            )}

                            {modalState.type === "prompt" && (
                                <div className="mb-6">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        defaultValue={modalState.options.defaultValue}
                                        placeholder={modalState.options.placeholder}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 mt-8">
                                <button
                                    onClick={handleClose}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    {modalState.options.cancelText || "Cancel"}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                                        modalState.options.destructive 
                                        ? "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-500/20" 
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20"
                                    }`}
                                >
                                    {modalState.options.confirmText || "Confirm"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
}
