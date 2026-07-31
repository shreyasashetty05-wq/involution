import { KnowledgeCategory } from '@/lib/types/knowledge';

interface CategorySidebarProps {
    categories: KnowledgeCategory[];
    selectedCategoryId: string | null;
    onSelectCategory: (id: string | null) => void;
}

export default function CategorySidebar({ categories, selectedCategoryId, onSelectCategory }: CategorySidebarProps) {
    return (
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
            <h3 className="font-bold text-slate-900 mb-2 px-3">Categories</h3>
            
            <button
                onClick={() => onSelectCategory(null)}
                className={`text-left px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    selectedCategoryId === null 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
                All Videos
            </button>

            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`text-left px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        selectedCategoryId === cat.id 
                            ? 'bg-emerald-600 text-white shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    );
}
