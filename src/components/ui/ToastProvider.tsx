"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 4000); // auto-dismiss after 4 seconds
    }, []);

    const success = useCallback((msg: string) => addToast(msg, "success"), [addToast]);
    const error = useCallback((msg: string) => addToast(msg, "error"), [addToast]);
    const warning = useCallback((msg: string) => addToast(msg, "warning"), [addToast]);
    const info = useCallback((msg: string) => addToast(msg, "info"), [addToast]);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ success, error, warning, info }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4 md:px-0">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="animate-in slide-in-from-right fade-in duration-300 pointer-events-auto bg-white rounded-xl shadow-lg border overflow-hidden flex items-stretch"
                        role="alert"
                    >
                        <div className={`w-1.5 shrink-0 ${
                            toast.type === "success" ? "bg-emerald-500" :
                            toast.type === "error" ? "bg-red-500" :
                            toast.type === "warning" ? "bg-orange-500" :
                            "bg-blue-500"
                        }`} />
                        <div className="p-4 flex items-start gap-3 w-full">
                            <div className="shrink-0 mt-0.5">
                                {toast.type === "success" && <CheckCircle2 className="size-5 text-emerald-500" />}
                                {toast.type === "error" && <AlertCircle className="size-5 text-red-500" />}
                                {toast.type === "warning" && <AlertTriangle className="size-5 text-orange-500" />}
                                {toast.type === "info" && <Info className="size-5 text-blue-500" />}
                            </div>
                            <p className="text-sm font-medium text-slate-700 flex-1">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-2 -mt-1 rounded-lg"
                                aria-label="Close toast"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
