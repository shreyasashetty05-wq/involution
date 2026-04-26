import Link from "next/link";
import { FileText, MessageSquare, TrendingUp, Eye, CheckCircle2, ShieldCheck, Activity, Users, Star, BarChart3, Clock, LineChart } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/database/mongodb";
import Startup from "@/database/models/Startup";
import StartupDashboardClient from "./StartupDashboardClient";

export default async function StartupDashboard() {
    const session = await getServerSession(authOptions);
    await dbConnect();

    // Fetch ALL Startup database documents using the session's email
    let myStartups: any[] = [];
    if (session?.user?.email) {
        const docs = await Startup.find({ ownerEmail: session.user.email }).lean();
        if (docs && docs.length > 0) {
            myStartups = JSON.parse(JSON.stringify(docs)); // Fix Lean Document serialization issues
        }
    }

    return <StartupDashboardClient myStartups={myStartups} />;
}

// Created a new file for the Client component logic to handle state properly within the `/app` router

