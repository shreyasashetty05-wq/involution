import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    },
                },
            }
        );

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        const { data, error } = await supabase
            .from("investor_profiles")
            .upsert({
                email: user.email,
                full_name: body.full_name,
                phone_number: body.phone_number,
                country: body.country,
                city: body.city,
                occupation: body.occupation,
                linkedin_profile: body.linkedin_profile,
                investor_type: body.investor_type,
                years_of_experience: body.years_of_experience,
                startups_invested_in: body.startups_invested_in,
                portfolio_website: body.portfolio_website,
                investment_thesis: body.investment_thesis,
                investment_budget: body.investment_budget,
                source_of_funds: body.source_of_funds,
                company_name: body.company_name,
                designation: body.designation,
                official_website: body.official_website,
                business_email: body.business_email,
                x_twitter: body.x_twitter,
                personal_website: body.personal_website,
                supporting_documents: body.supporting_documents || [],
                photo_url: body.photo_url,
                payment_method: body.payment_method,
                upi_id: body.upi_id,
                account_holder_name: body.account_holder_name,
                bank_name: body.bank_name,
                account_number: body.account_number,
                ifsc_code: body.ifsc_code,
                status: 'Pending Verification',
                updated_at: new Date().toISOString()
            }, { onConflict: 'email' })
            .select()
            .single();

        if (error) {
            console.error("Error saving investor profile:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, profile: data });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    },
                },
            }
        );

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("investor_profiles")
            .select("*")
            .eq("email", user.email)
            .maybeSingle();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Also fetch KYC name directly to be 100% bulletproof against OAuth sync issues
        const { data: kycData } = await supabase
            .from("kyc_documents")
            .select("name, status")
            .eq("email", user.email)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        return NextResponse.json({ profile: data, kycName: kycData?.name || null });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
