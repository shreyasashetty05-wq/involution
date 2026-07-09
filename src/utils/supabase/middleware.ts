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
    
    // Skip middleware for assets, Next internals, or API calls
    if (
        path.startsWith("/_next") ||
        path.startsWith("/api/") ||
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
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }
        return supabaseResponse;
    }

    // User is logged in
    if (path === "/login" || path === "/register") {
        const role = user.user_metadata?.role || "investor";
        const url = request.nextUrl.clone();
        url.pathname = role === "investor" ? "/investors/dashboard" : "/startups/dashboard";
        return NextResponse.redirect(url);
    }

    // Retrieve KYC status directly from database for real-time accuracy
    let kycDone = false;
    let kycStatus = "None";
    if (user.email) {
        const { data: kycRecord } = await supabase
            .from("kyc_documents")
            .select("status")
            .eq("email", user.email)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (kycRecord) {
            kycStatus = kycRecord.status;
            kycDone = kycRecord.status === "Approved";
        }
    }

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
        const role = user.user_metadata?.role || "investor";
        const url = request.nextUrl.clone();
        url.pathname = role === "investor" ? "/investors/dashboard" : "/startups/dashboard";
        return NextResponse.redirect(url);
    }

    // Role-based protection
    const role = user.user_metadata?.role || "investor";
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

    return supabaseResponse;
}
