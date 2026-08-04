import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Validate input
        const validationResult = resetPasswordSchema.safeParse(body);
        
        if (!validationResult.success) {
            // Generic error for validation failures
            return NextResponse.json(
                { error: "Invalid request data. Please check your inputs and try again." },
                { status: 400 }
            );
        }

        const { email } = validationResult.data;

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const origin = new URL(request.url).origin;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/api/auth/callback?next=/update-password`,
        });

        // We always return success regardless of whether the email exists or if there's an error,
        // to prevent email enumeration attacks. We just log the error on the server.
        if (error) {
            console.error("Password reset error:", error?.message || "Unknown error");
        }

        return NextResponse.json(
            { success: true, message: "If that email exists, a reset link has been sent." },
            { status: 200 }
        );

    } catch (error) {
        console.error("Password reset exception:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
