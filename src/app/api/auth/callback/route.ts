import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    try {
        const { searchParams, origin } = new URL(request.url);
        const code = searchParams.get("code");
        const queryRole = searchParams.get("role");

        if (code) {
            const cookieStore = await cookies();
            const supabase = createClient(cookieStore);
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

            if (!error && data?.user) {
                // Get role from URL query or cookie
                const roleCookie = cookieStore.get("involution_role");
                let role = queryRole || roleCookie?.value || "investor";

                // Update user metadata to save role if not already set
                let currentRole = data.user.user_metadata?.role;
                
                // Fetch dbRole explicitly to override cookie/metadata for admins
                const { data: roleData } = await supabase
                    .from("user_roles")
                    .select("role")
                    .eq("email", data.user.email)
                    .maybeSingle();

                if (roleData?.role === "admin") {
                    currentRole = "admin";
                    role = "admin";
                }

                // Check if they already have a KYC record
                const userEmail = data.user.email;
                let kycRecord = null;
                if (userEmail) {
                    const { data: kycData } = await supabase
                        .from("kyc_documents")
                        .select("*")
                        .eq("email", userEmail)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    kycRecord = kycData;
                }

                const kycDone = Boolean(kycRecord);
                const isNewUser = !kycRecord;
                const kycStatus = kycRecord?.status || "None";

                // Update user metadata with role and KYC status
                await supabase.auth.updateUser({
                    data: {
                        role: currentRole || role,
                        kycDone,
                        isNewUser,
                        kycStatus
                    }
                });

                const redirectRole = currentRole || role;
                let redirectPath = redirectRole === "investor" ? "/investors/dashboard" : "/startups/dashboard";
                
                if (redirectRole === "admin") {
                    redirectPath = "/admin/kyc";
                }

                return NextResponse.redirect(`${origin}${redirectPath}`);
            } else {
                console.error("Supabase exchangeCodeForSession error:", error);
            }
        }

        return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
    } catch (e: any) {
        console.error("Auth callback exception:", e);
        return NextResponse.redirect(new URL("/login?error=Server error", request.url));
    }
}
