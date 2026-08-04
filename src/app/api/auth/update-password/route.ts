import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { passwordSchema } from "@/lib/validations/auth";
import { z } from "zod";

const updatePasswordSchema = z.object({
    password: passwordSchema,
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Validate input
        const validationResult = updatePasswordSchema.safeParse(body);
        
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Invalid password format. Ensure it meets all requirements." },
                { status: 400 }
            );
        }

        const { password } = validationResult.data;

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Update the user's password
        // Note: The user must already be authenticated for this to work.
        // If they clicked a reset link, Supabase will have established a session.
        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            console.error("[Auth Update Password] Failed to update password:", error.message);
            return NextResponse.json(
                { error: error.message || "Failed to update password. Your session may have expired." },
                { status: 400 }
            );
        }

        console.log("[Auth Update Password] Password successfully updated.");

        return NextResponse.json(
            { success: true, message: "Password updated successfully." },
            { status: 200 }
        );

    } catch (error) {
        console.error("[Auth Update Password] Uncaught exception:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
