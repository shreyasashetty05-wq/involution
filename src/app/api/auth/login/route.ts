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

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Login error:", error?.message || "Unknown error");
            // Generic error message for authentication failures (prevents email enumeration)
            return NextResponse.json(
                { error: "Invalid email or password." },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: true, message: "Logged in successfully.", user: data.user },
            { status: 200 }
        );

    } catch (error) {
        console.error("Login exception:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
