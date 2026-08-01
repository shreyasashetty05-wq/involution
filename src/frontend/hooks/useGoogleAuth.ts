"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Shared hook for Google OAuth sign-in/sign-up flow.
 * Sets the role cookie and redirects to the auth callback.
 */
export function useGoogleAuth(role: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleAuth = async () => {
        setIsLoading(true);
        setError(null);
        // Set cookie with Secure and SameSite flags for better persistence across environments
        document.cookie = `involution_role=${role}; path=/; max-age=3600; Secure; SameSite=Lax`;
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                // Pass role in URL params to guarantee it survives cross-origin OAuth redirects in production
                redirectTo: `${window.location.origin}/api/auth/callback?role=${encodeURIComponent(role)}`,
                queryParams: {
                    prompt: 'select_account'
                }
            }
        });
        if (authError) {
            console.error("Google Auth Error:", authError);
            setError("Google authentication failed. Please try again.");
            setIsLoading(false);
        }
    };

    return { isLoading, error, handleGoogleAuth, setError };
}
