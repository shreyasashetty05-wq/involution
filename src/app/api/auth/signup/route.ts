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

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    role,
                }
            }
        });

        if (error) {
            console.error("Signup error:", error);
            return NextResponse.json(
                { error: "Signup failed. Please check your credentials or try again later." },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: true, message: "User registered successfully." },
            { status: 201 }
        );

    } catch (error) {
        console.error("Signup exception:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
