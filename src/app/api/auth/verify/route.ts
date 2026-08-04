import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { z } from "zod";

const verifySchema = z.object({
    email: z.string().email(),
    token: z.string().length(6, "OTP must be exactly 6 digits"),
    type: z.enum(["signup", "recovery", "magiclink"]).default("signup")
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validationResult = verifySchema.safeParse(body);
        
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Invalid OTP format." },
                { status: 400 }
            );
        }

        const { email, token, type } = validationResult.data;

        console.log(`[Auth Verify] Attempting OTP verification for ${email}, type: ${type}`);

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: type as any
        });

        if (error) {
            console.error(`[Auth Verify] OTP verification failed for ${email}:`, error.message);
            return NextResponse.json(
                { error: error.message || "Invalid or expired OTP code." },
                { status: 400 }
            );
        }

        console.log(`[Auth Verify] OTP successfully verified for ${email}. Session created.`);

        return NextResponse.json(
            { 
                success: true, 
                message: "Email verified successfully.",
                user: data.user
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("[Auth Verify] Uncaught exception:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
