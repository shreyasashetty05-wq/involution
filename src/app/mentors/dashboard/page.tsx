import Link from "next/link";
import { BookOpen, Settings } from "lucide-react";

export default function MentorDashboard() {
    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20">
            <div className="container mx-auto px-6">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mentor Dashboard</h1>
                    <p className="text-slate-500 mt-2">Welcome to your dashboard. From here, you can manage and view the Knowledge Hub.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                    {/* Knowledge Hub Access */}
                    <Link href="/mentors/knowledge-hub" className="group bg-white rounded-2xl p-8 border border-slate-200/60 shadow-sm hover:shadow-md transition-all hover:border-emerald-200 flex flex-col">
                        <div className="size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <BookOpen className="size-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Knowledge Hub</h2>
                        <p className="text-slate-500 flex-1">View the complete repository of knowledge articles, resources, and documentation.</p>
                        <div className="mt-6 text-sm font-semibold text-emerald-600 flex items-center gap-2 group-hover:gap-3 transition-all">
                            Access Hub &rarr;
                        </div>
                    </Link>

                    {/* Manage Knowledge Hub */}
                    <Link href="/mentors/manage-knowledge" className="group bg-white rounded-2xl p-8 border border-slate-200/60 shadow-sm hover:shadow-md transition-all hover:emerald-200 flex flex-col">
                        <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Settings className="size-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Manage Knowledge Hub</h2>
                        <p className="text-slate-500 flex-1">Create, edit, and organize knowledge base content, resources, and folders.</p>
                        <div className="mt-6 text-sm font-semibold text-blue-600 flex items-center gap-2 group-hover:gap-3 transition-all">
                            Manage Content &rarr;
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
