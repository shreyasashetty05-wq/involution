import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import StartupDashboardClient from "./StartupDashboardClient";

/**
 * Fetches the current user's startups and renders the startup dashboard client component.
 * @example
 * StartupDashboard()
 * <StartupDashboardClient myStartups={[] } />
 * @returns {Promise<JSX.Element>} A React element containing the startup dashboard client with the user's startup data.
 */
export default async function StartupDashboard() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    // Fetch ALL Startup database documents using the session's email
    let myStartups: any[] = [];
    if (user?.email) {
        const { data: docs, error } = await supabase
            .from("startups")
            .select("*")
            .eq("owner_email", user.email);

        if (!error && docs && docs.length > 0) {
            // Map fields to camelCase for full frontend compatibility
            myStartups = docs.map((doc: any) => ({
                ...doc,
                _id: doc.id,
                ownerEmail: doc.owner_email,
                businessModel: doc.business_model,
                isStudent: doc.is_student,
                founderAge: doc.founder_age,
                financialUpdates: doc.financial_updates,
                basicInfo: doc.basic_info,
                businessInfo: doc.business_info,
                financialsMonthly: doc.financials_monthly,
                financialsYearly: doc.financials_yearly,
                investmentDetails: doc.investment_details,
                growthMetrics: doc.growth_metrics,
                operationalMetrics: doc.operational_metrics,
                credibility: doc.credibility,
                riskDisclosure: doc.risk_disclosure,
                aiReady: doc.ai_ready
            }));
        }
    }

    return <StartupDashboardClient myStartups={myStartups} />;
}
