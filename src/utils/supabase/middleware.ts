import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        supabaseUrl!,
        supabaseKey!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const path = request.nextUrl.pathname;
    const isAdminRoute = path.startsWith("/admin");
    const isAdminApi = path === "/api/kyc/pending" || path.includes("/review");
    
    // Skip middleware for assets, Next internals, or standard API calls
    if (
        path.startsWith("/_next") ||
        (path.startsWith("/api/") && !isAdminApi) ||
        path.includes(".")
    ) {
        return supabaseResponse;
    }

    // Retrieve user session and metadata
    const { data: { user } } = await supabase.auth.getUser();

    const isPublicRoute =
        path === "/" ||
        path === "/about" ||
        path === "/rules" ||
        path === "/login" ||
        path === "/register";

    if (!user) {
        // If not logged in and requesting private page, redirect to login
        if (!isPublicRoute) {
            // Unauthenticated API requests should get 401 instead of redirect
            if (isAdminApi) {
                return new NextResponse(JSON.stringify({ error: "Unauthorized", message: "Please log in" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" }
                });
            }
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }
        return supabaseResponse;
    }

    // Retrieve KYC status and strict DB Role concurrently for performance
    let kycDone = false;
    let kycStatus = "None";
    let dbRole = null;
    let investorProfileStatus = "None";

    if (user.email) {
        const [kycRes, roleRes, investorProfileRes] = await Promise.all([
            supabase
                .from("kyc_documents")
                .select("status")
                .eq("email", user.email)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
            supabase
                .from("user_roles")
                .select("role")
                .eq("email", user.email)
                .maybeSingle(),
            supabase
                .from("investor_profiles")
                .select("status")
                .eq("email", user.email)
                .maybeSingle()
        ]);

        if (kycRes.data) {
            kycStatus = kycRes.data.status;
            kycDone = kycRes.data.status === "Approved";
        }
        if (roleRes.data) {
            dbRole = roleRes.data.role;
        }
        if (investorProfileRes.data) {
            investorProfileStatus = investorProfileRes.data.status;
        }
    }

    // Strict role takes precedence, fallback to user_metadata if not defined in DB
    const role = dbRole || user.user_metadata?.role || "investor";

    // Enforce Admin RBAC
    if (isAdminRoute || isAdminApi) {
        if (role !== "admin") {
            if (isAdminApi) {
                return new NextResponse(JSON.stringify({ error: "Forbidden", message: "Admin access required" }), {
                    status: 403,
                    headers: { "Content-Type": "application/json" }
                });
            }
            const url = request.nextUrl.clone();
            url.pathname = "/";
            return NextResponse.redirect(url);
        }
    }

    // User is logged in
    if (path === "/login" || path === "/register") {
        if (role === "admin") {
            const url = request.nextUrl.clone();
            url.pathname = "/admin/kyc";
            return NextResponse.redirect(url);
        }
        const url = request.nextUrl.clone();
        url.pathname = role === "investor" ? "/investors/dashboard" : "/startups/dashboard";
        return NextResponse.redirect(url);
    }

    // Admin Dashboard Isolation
    if (role === "admin") {
        if (path.startsWith("/investors") || path.startsWith("/startups") || path.startsWith("/kyc")) {
            const url = request.nextUrl.clone();
            url.pathname = "/admin/kyc";
            return NextResponse.redirect(url);
        }
    }

    // KYC Check applies to investors and startups, but not admins
    if (role !== "admin") {
        if (!kycDone && (path.startsWith("/investors") || path.startsWith("/startups"))) {
            const url = request.nextUrl.clone();
            if (kycStatus === "Pending") {
                url.pathname = "/kyc/pending";
            } else {
                url.pathname = "/kyc";
            }
            return NextResponse.redirect(url);
        }

        if (path === "/kyc" && kycStatus === "Pending") {
            const url = request.nextUrl.clone();
            url.pathname = "/kyc/pending";
            return NextResponse.redirect(url);
        }

        if (path === "/kyc/pending" && kycStatus === "Approved") {
            const url = request.nextUrl.clone();
            url.pathname = role === "investor" ? "/investors/dashboard" : "/startups/dashboard";
            return NextResponse.redirect(url);
        }

        // Investor Profile Verification Check
        if (kycDone && role === "investor") {
            const isVerificationRoute = path === "/investors/verification";
            const isPendingVerificationRoute = path === "/investors/verification/pending";
            const isApiRoute = path.startsWith("/api/");
            
            if (!isApiRoute) {
                if (investorProfileStatus === "Pending Verification" && !isPendingVerificationRoute) {
                    const url = request.nextUrl.clone();
                    url.pathname = "/investors/verification/pending";
                    return NextResponse.redirect(url);
                }
                if ((investorProfileStatus === "None" || investorProfileStatus === "Rejected" || investorProfileStatus === "Request More Information") && !isVerificationRoute) {
                    const url = request.nextUrl.clone();
                    url.pathname = "/investors/verification";
                    return NextResponse.redirect(url);
                }
                if (investorProfileStatus === "Verified" && (isVerificationRoute || isPendingVerificationRoute)) {
                    const url = request.nextUrl.clone();
                    url.pathname = "/investors/dashboard";
                    return NextResponse.redirect(url);
                }
            }
        }

        // Role-based protection for regular users
        if (path.startsWith("/investors") && role !== "investor") {
            const url = request.nextUrl.clone();
            url.pathname = "/startups/dashboard";
            return NextResponse.redirect(url);
        }
        const isStartupMgmt = 
            path === "/startups" || 
            path === "/startups/" || 
            path.startsWith("/startups/dashboard") || 
            path.startsWith("/startups/publish");

        if (isStartupMgmt && role === "investor") {
            const url = request.nextUrl.clone();
            url.pathname = "/investors/dashboard";
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}

