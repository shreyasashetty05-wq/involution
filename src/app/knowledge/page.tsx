'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { KnowledgeVideo, KnowledgeCategory, KnowledgeWatchHistory } from '@/lib/types/knowledge';
import VideoCard from '@/frontend/components/knowledge/VideoCard';
import CategorySidebar from '@/frontend/components/knowledge/CategorySidebar';
import KnowledgeHubNav from '@/frontend/components/knowledge/KnowledgeHubNav';
import { Loader2 } from 'lucide-react';

export default function KnowledgeHubPage() {
    const [videos, setVideos] = useState<KnowledgeVideo[]>([]);
    const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
    const [watchHistory, setWatchHistory] = useState<Record<string, KnowledgeWatchHistory>>({});
    const [loading, setLoading] = useState(true);
    
    // Filters and Search
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            // Fetch categories
            const { data: catData } = await supabase
                .from('knowledge_categories')
                .select('*')
                .order('name');
            if (catData) setCategories(catData);

            // Fetch videos (RLS ensures only public/featured are visible unless admin)
            const { data: videoData } = await supabase
                .from('knowledge_videos')
                .select('*, knowledge_categories(name)')
                .in('visibility', ['public', 'featured']); // fallback if RLS is bypassed or to be explicit
            
            if (videoData) setVideos(videoData as KnowledgeVideo[]);

            // Fetch watch history if logged in
            if (user) {
                const { data: historyData } = await supabase
                    .from('knowledge_watch_history')
                    .select('*')
                    .eq('user_id', user.id);
                
                if (historyData) {
                    const historyMap = historyData.reduce((acc, curr) => {
                        acc[curr.video_id] = curr;
                        return acc;
                    }, {} as Record<string, KnowledgeWatchHistory>);
                    setWatchHistory(historyMap);
                }
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    // Filter and Sort Logic
    const filteredVideos = videos
        .filter(video => {
            const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  video.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategoryId ? video.category_id === selectedCategoryId : true;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sortBy === 'most_viewed') return b.views - a.views;
            if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
            return 0;
        });

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Knowledge Hub</h1>
                    <p className="text-slate-500">Learn, grow, and master your skills with our curated educational content.</p>
                </div>

                <KnowledgeHubNav 
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                />

                <div className="flex flex-col md:flex-row gap-8">
                    <CategorySidebar 
                        categories={categories}
                        selectedCategoryId={selectedCategoryId}
                        onSelectCategory={setSelectedCategoryId}
                    />

                    <div className="flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="size-8 text-emerald-500 animate-spin" />
                            </div>
                        ) : filteredVideos.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                                <p className="text-slate-500 font-medium">No videos found matching your criteria.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredVideos.map(video => (
                                    <VideoCard 
                                        key={video.id} 
                                        video={video} 
                                        watchHistory={watchHistory[video.id]} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
