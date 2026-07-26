import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Validate input
        const validationResult = loginSchema.safeParse(body);
        
        if (!validationResult.success) {
            // Generic error for validation failures
            return NextResponse.json(
                { error: "Invalid request data. Please check your inputs and try again." },
                { status: 400 }
            );
        }

        const { email, password } = validationResult.data;

        console.log(`[Auth Login] Incoming login request for user lookup: ${email}`);

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error(`[Auth Login] Authentication failure for ${email}. Reason: ${error.message} (Code: ${error.code || 'N/A'}, Status: ${error.status || 'N/A'})`);
            
            // If the account has not verified their email via Supabase confirmation link
            if (error.code === "email_not_confirmed" || error.message?.toLowerCase().includes("email not confirmed")) {
                return NextResponse.json(
                    { 
                        error: "Your account email address is not verified yet. Please check your email inbox for a confirmation link from Supabase to activate your account before logging in.",
                        code: "email_not_confirmed"
                    },
                    { status: 403 }
                );
            }

            // Generic error message for other authentication failures (prevents email enumeration)
            return NextResponse.json(
                { error: "Invalid email or password.", code: "invalid_credentials" },
                { status: 400 }
            );
        }

        console.log(`[Auth Login] Password comparison & user lookup successful for ID: ${data.user.id}. Session JWT generated.`);
        console.log(`[Auth Login] Response sent back to frontend for ${email} with role: ${data.user.user_metadata?.role || 'investor'}`);

        return NextResponse.json(
            { success: true, message: "Logged in successfully.", user: data.user },
            { status: 200 }
        );

    } catch (error) {
        console.error("[Auth Login] Uncaught exception during login:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
