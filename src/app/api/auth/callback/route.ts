import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    try {
        const { searchParams, origin } = new URL(request.url);
        const code = searchParams.get("code");
        const token_hash = searchParams.get("token_hash");
        const type = searchParams.get("type") as any;
        const queryRole = searchParams.get("role");

        console.log(`[Auth Callback] Processing callback. Code: ${!!code}, TokenHash: ${!!token_hash}, Type: ${type || 'N/A'}`);

        if (code || (token_hash && type)) {
            const cookieStore = await cookies();
            const supabase = createClient(cookieStore);
            
            let user = null;
            let error = null;

            if (code) {
                const res = await supabase.auth.exchangeCodeForSession(code);
                user = res.data?.user;
                error = res.error;
            } else if (token_hash && type) {
                const res = await supabase.auth.verifyOtp({ token_hash, type });
                user = res.data?.user;
                error = res.error;
            }

            if (!error && user) {
                console.log(`[Auth Callback] Session established successfully for user ID: ${user.id}, email: ${user.email}`);

                // Get role from URL query or cookie
                const roleCookie = cookieStore.get("involution_role");
                let role = queryRole || roleCookie?.value || "investor";

                // Update user metadata to save role if not already set
                let currentRole = user.user_metadata?.role;
                
                // Fetch dbRole explicitly to override cookie/metadata for admins
                const { data: roleData } = await supabase
                    .from("user_roles")
                    .select("role")
                    .eq("email", user.email || "")
                    .maybeSingle();

                // Check if they are a mentor
                const { data: mentorData } = await supabase
                    .from("mentor_emails")
                    .select("email")
                    .ilike("email", user.email || "")
                    .maybeSingle();

                if (roleData?.role === "admin") {
                    currentRole = "admin";
                    role = "admin";
                } else if (mentorData?.email) {
                    currentRole = "mentor";
                    role = "mentor";
                }

                // Check if they already have a KYC record
                const userEmail = user.email;
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

                const kycDone = Boolean(kycRecord && kycRecord.status === "Approved");
                const isNewUser = !kycRecord;
                const kycStatus = kycRecord?.status || "None";

                let finalRole = currentRole;
                if (roleData?.role === "admin") {
                    finalRole = "admin";
                } else if (mentorData?.email) {
                    finalRole = "mentor";
                } else if (isNewUser) {
                    // User hasn't finished onboarding. Always honor their latest selection.
                    finalRole = role;
                } else {
                    // Existing users must keep their established role
                    finalRole = currentRole || role;
                }

                // Update user metadata with role and KYC status
                await supabase.auth.updateUser({
                    data: {
                        role: finalRole,
                        kycDone,
                        isNewUser,
                        kycStatus
                    }
                });

                const redirectRole = finalRole;
                let redirectPath = redirectRole === "investor" ? "/investors/dashboard" : 
                                 redirectRole === "startup" ? "/startups/dashboard" :
                                 redirectRole === "incubation" ? "/incube/dashboard" :
                                 redirectRole === "mentor" ? "/mentors/dashboard" :
                                 "/investors/dashboard";
                
                
                if (redirectRole === "admin") {
                    redirectPath = "/admin/kyc";
                } else if (redirectRole === "mentor") {
                    redirectPath = "/mentors/dashboard";
                }

                console.log(`[Auth Callback] Redirecting user ${user.email} (Role: ${redirectRole}) to ${redirectPath}`);
                return NextResponse.redirect(`${origin}${redirectPath}`);
            } else {
                console.error(`[Auth Callback] Supabase verification error:`, error?.message || error);
            }
        }

        console.warn(`[Auth Callback] Authentication failed or missing code/token_hash. Redirecting to login with error.`);
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Could not authenticate. Verification link may have expired or is invalid.")}`);
    } catch (e: any) {
        console.error("[Auth Callback] Uncaught exception:", e);
        return NextResponse.redirect(new URL("/login?error=Server error", request.url));
    }
}
