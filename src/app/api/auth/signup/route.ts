import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/validations/auth";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Validate input
        const validationResult = signupSchema.safeParse(body);
        
        if (!validationResult.success) {
            // Return generic 400 error to prevent enumeration/leaks
            return NextResponse.json(
                { error: "Invalid request data. Please check your inputs and try again." },
                { status: 400 }
            );
        }

        const { email, password, username, role } = validationResult.data;

        console.log(`[Auth Signup] Incoming registration request for email: ${email}, role: ${role}, username: ${username}`);

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const origin = new URL(request.url).origin;
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/api/auth/callback?role=${encodeURIComponent(role)}`,
                data: {
                    username,
                    role,
                    kycDone: false,
                    isNewUser: true,
                    kycStatus: "None"
                }
            }
        });

        if (error) {
            console.error(`[Auth Signup] Registration failed for ${email}. Reason: ${error.message} (Code: ${error.code || 'N/A'}, Status: ${error.status || 'N/A'})`);
            return NextResponse.json(
                { error: "Signup failed. Please check your credentials or try again later.", details: error.message },
                { status: 400 }
            );
        }

        const isEmailVerified = Boolean(data.user?.identities?.[0]?.identity_data?.email_verified || data.user?.confirmed_at);
        const requiresVerification = !data.session && !isEmailVerified;

        console.log(`[Auth Signup] User registered successfully in database. ID: ${data.user?.id}, Session: ${data.session ? 'Created' : 'Null'}, Requires Verification: ${requiresVerification}`);
        console.log(`[Auth Signup] Response sent back to frontend for ${email}.`);

        return NextResponse.json(
            { 
                success: true, 
                message: requiresVerification 
                    ? "Account created! Please check your email inbox to confirm your verification link before logging in." 
                    : "User registered successfully.",
                requiresVerification,
                user: { id: data.user?.id, email: data.user?.email, role }
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("[Auth Signup] Uncaught exception during signup:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
