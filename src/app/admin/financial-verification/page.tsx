import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminFinancialVerificationClient from "./AdminFinancialVerificationClient";

/**
 * Server component that fetches all startups and their financial updates for admin verification.
 * @example
 * <AdminFinancialVerification />
 */
export default async function AdminFinancialVerification() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: roleData } = await supabase.from('user_roles').select('role').eq('email', user.email).maybeSingle();
    if (roleData?.role !== 'admin') redirect("/");

    // Fetch all startups with their financial updates
    const { data: startups, error } = await supabase
        .from('startups')
        .select('id, name, owner_email, financial_updates')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching startups for financial verification:", error);
    }

    return <AdminFinancialVerificationClient startups={startups || []} />;
}
