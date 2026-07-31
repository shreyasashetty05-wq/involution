'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { KnowledgeVideo, KnowledgeAttachment, KnowledgeWatchHistory } from '@/lib/types/knowledge';
import VideoPlayer from '@/frontend/components/knowledge/VideoPlayer';
import { ArrowLeft, Download, Share2, Eye, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/utils/timeHelper';

export default function KnowledgeVideoPage() {
    const params = useParams();
    const router = useRouter();
    const videoId = params.id as string;
    
    const [video, setVideo] = useState<KnowledgeVideo | null>(null);
    const [attachments, setAttachments] = useState<KnowledgeAttachment[]>([]);
    const [watchHistory, setWatchHistory] = useState<KnowledgeWatchHistory | undefined>();
    const [userId, setUserId] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const fetchVideoDetails = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);

            // Fetch video
            const { data: videoData, error: videoError } = await supabase
                .from('knowledge_videos')
                .select('*, knowledge_categories(name)')
                .eq('id', videoId)
                .single();

            if (videoError || !videoData) {
                console.error('Error fetching video', videoError);
                setLoading(false);
                return;
            }

            setVideo(videoData as KnowledgeVideo);

            // Fetch attachments
            const { data: attachmentsData } = await supabase
                .from('knowledge_attachments')
                .select('*')
                .eq('video_id', videoId);
            
            if (attachmentsData) setAttachments(attachmentsData);

            // Fetch watch history
            if (user) {
                const { data: historyData } = await supabase
                    .from('knowledge_watch_history')
                    .select('*')
                    .eq('video_id', videoId)
                    .eq('user_id', user.id)
                    .single();
                
                if (historyData) setWatchHistory(historyData);
            }

            // Increment views
            try {
                const { error: rpcError } = await supabase.rpc('increment_knowledge_video_views', { p_video_id: videoId });
                if (rpcError) throw rpcError;
            } catch (e) {
                // Fallback if RPC doesn't exist
                supabase.from('knowledge_videos').update({ views: (videoData.views || 0) + 1 }).eq('id', videoId);
            }

            setLoading(false);
        };

        fetchVideoDetails();
    }, [videoId, supabase]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
                <Loader2 className="size-12 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!video) {
        return (
            <div className="min-h-screen bg-slate-50 pt-24 px-4 flex flex-col items-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Video not found</h2>
                <button onClick={() => router.push('/knowledge')} className="text-emerald-600 hover:underline">
                    Back to Knowledge Hub
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                <Link href="/knowledge" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6">
                    <ArrowLeft className="size-4" />
                    Back to Knowledge Hub
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <VideoPlayer video={video} initialWatchHistory={watchHistory} userId={userId} />
                        
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{video.title}</h1>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium mb-6 pb-6 border-b border-slate-100">
                                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                                    {video.knowledge_categories?.name || 'Uncategorized'}
                                </span>
                                <span className="flex items-center gap-1.5"><Eye className="size-4" /> {video.views.toLocaleString()} views</span>
                                <span className="flex items-center gap-1.5"><Calendar className="size-4" /> {formatRelativeTime(new Date(video.created_at))}</span>
                                
                                <button onClick={handleCopyLink} className="ml-auto flex items-center gap-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl transition-colors">
                                    <Share2 className="size-4" />
                                    {isCopied ? 'Copied!' : 'Share'}
                                </button>
                            </div>

                            <div className="prose prose-slate max-w-none">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Description</h3>
                                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{video.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        {attachments.length > 0 && (
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Resources</h3>
                                <div className="flex flex-col gap-3">
                                    {attachments.map(att => (
                                        <a 
                                            key={att.id} 
                                            href={att.url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors group"
                                        >
                                            <span className="font-semibold text-slate-700 group-hover:text-emerald-700 text-sm truncate pr-4">{att.title}</span>
                                            <Download className="size-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Placeholder for Related Videos */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {video.tags && video.tags.length > 0 ? (
                                    video.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                                            {tag}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-slate-400">No tags available</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
