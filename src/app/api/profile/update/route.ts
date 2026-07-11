import { NextResponse } from "next/server";
import { profileUpdateSchema } from "@/lib/validations/auth";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Validate and sanitize input
        const validationResult = profileUpdateSchema.safeParse(body);
        
        if (!validationResult.success) {
            // Generic error for validation failures
            return NextResponse.json(
                { error: "Invalid profile data. Please check your inputs and try again." },
                { status: 400 }
            );
        }

        const { displayName, bio } = validationResult.data;

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized access." },
                { status: 401 }
            );
        }

        // Update user metadata in Supabase Auth
        // The data is already sanitized by DOMPurify in the Zod transform
        const { data, error } = await supabase.auth.updateUser({
            data: {
                displayName,
                bio,
            }
        });

        if (error) {
            console.error("Profile update error:", error);
            return NextResponse.json(
                { error: "Failed to update profile. Please try again later." },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: true, message: "Profile updated successfully.", user: data.user },
            { status: 200 }
        );

    } catch (error) {
        console.error("Profile update exception:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
