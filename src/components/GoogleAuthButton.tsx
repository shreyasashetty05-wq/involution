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
            className="group w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-white/50 backdrop-blur-sm border border-slate-200/80 text-slate-700 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-white hover:border-emerald-200 hover:shadow-[0_8px_16px_rgba(16,185,129,0.08)] hover:-translate-y-[1px] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none shadow-sm"
        >
            {isLoading ? (
                <div className="size-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <>
                    <div className="transition-transform duration-300 ease-out group-hover:rotate-[5deg]">
                        <GoogleIcon />
                    </div>
                    Continue with Google
                </>
            )}
        </button>
    );
}
