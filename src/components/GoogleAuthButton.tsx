"use client";

import { GoogleIcon } from "@/components/icons/GoogleIcon";

interface GoogleAuthButtonProps {
    onClick: () => void;
    disabled: boolean;
    isLoading: boolean;
}

/**
 * Shared Google authentication button used on login and register pages.
 */
export function GoogleAuthButton({ onClick, disabled, isLoading }: GoogleAuthButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold text-sm transition-all hover:bg-slate-50 hover:border-slate-400 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none shadow-sm"
        >
            {isLoading ? (
                <div className="size-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <>
                    <GoogleIcon />
                    Continue with Google
                </>
            )}
        </button>
    );
}
