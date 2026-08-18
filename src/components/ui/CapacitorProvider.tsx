"use client";

import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";

export function CapacitorProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // Hide splash screen after Next.js app has loaded
        SplashScreen.hide().catch(console.error);

        // Listen for Google Auth Deep Link
        const urlListener = CapacitorApp.addListener('appUrlOpen', (data) => {
            console.log('App opened with URL:', data.url);
            // Example: com.involution.app://callback?code=...
            if (data.url.includes('com.involution.app://callback')) {
                try {
                    const url = new URL(data.url);
                    const searchParams = url.search; // Contains ?code=...&role=...
                    // Redirect to Next.js API route to complete server-side auth
                    window.location.href = `/api/auth/callback${searchParams}`;
                } catch (e) {
                    console.error('Failed to parse deep link URL:', e);
                }
            }
        });

        // Handle Android physical back button
        const backListener = CapacitorApp.addListener('backButton', () => {
            const rootPaths = [
                '/', 
                '/login', 
                '/register', 
                '/investors/dashboard', 
                '/startups/dashboard', 
                '/incube/dashboard', 
                '/mentors/dashboard',
                '/admin/kyc'
            ];

            // If the user is on a root page, exit the app
            if (rootPaths.includes(window.location.pathname)) {
                CapacitorApp.exitApp();
            } else {
                // Otherwise, use the standard browser history to navigate Next.js SPA
                window.history.back();
            }
        });

        return () => {
            urlListener.then(listener => listener.remove());
            backListener.then(listener => listener.remove());
        };
    }, [router]);

    return <>{children}</>;
}
