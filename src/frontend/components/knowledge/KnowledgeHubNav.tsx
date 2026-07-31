import { Search, SlidersHorizontal } from 'lucide-react';

interface KnowledgeHubNavProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
}

export default function KnowledgeHubNav({ searchQuery, onSearchChange, sortBy, onSortChange }: KnowledgeHubNavProps) {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search videos, topics, or keywords..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-slate-900 placeholder:text-slate-400"
                />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200">
                    <SlidersHorizontal className="size-4" />
                    <span>Sort by:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="bg-transparent border-none focus:outline-none text-slate-900 font-bold cursor-pointer"
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="most_viewed">Most Viewed</option>
                        <option value="alphabetical">Alphabetical</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
